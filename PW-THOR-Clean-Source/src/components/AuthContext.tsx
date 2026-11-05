"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, AuthSession, LoginCredentials } from "@/types";

interface AuthContextType extends AuthSession {
  login: (credentials: string | LoginCredentials) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isDevBypassActive: boolean;
}

const DEV_TEST_USER: UserProfile = {
  _id: "dev_student_test",
  name: "Dev Student (Test Mode)",
  firstName: "Dev",
  lastName: "Student",
  mobile: "9876543210",
  email: "dev@testing.local",
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false, message: "" }),
  logout: async () => {},
  refreshSession: async () => {},
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  isDevBypassActive: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Check if development mode bypass is enabled
  const isDevMode =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "true" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost");

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Validate session against /api/AboutMe or fallback to Dev profile if in development
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("pws_auth_token") : null;

      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const res = await fetch("/api/AboutMe", {
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.authenticated && data.user) {
          setUser(data.user);
          setToken(storedToken);
          setIsLoading(false);
          return;
        }
      }

      // If in development mode and no valid remote session, activate dev bypass session
      if (isDevMode) {
        setUser(DEV_TEST_USER);
        setToken(storedToken || "dev_testing_bypass_token");
        setIsLoading(false);
        return;
      }

      // If in production and not authenticated
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined" && storedToken) {
        localStorage.removeItem("pws_auth_token");
      }
    } catch (err) {
      if (isDevMode) {
        setUser(DEV_TEST_USER);
        setToken("dev_testing_bypass_token");
      } else {
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: string | LoginCredentials) => {
    try {
      const payload =
        typeof credentials === "string" ? { token: credentials.trim() } : credentials;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const receivedToken = data.token || (typeof credentials === "string" ? credentials.trim() : credentials.token);
        if (typeof window !== "undefined" && receivedToken) {
          localStorage.setItem("pws_auth_token", receivedToken);
        }
        setUser(data.user);
        setToken(receivedToken || null);
        setIsLoginModalOpen(false);
        return { success: true, message: data.message || "Login successful!", user: data.user };
      }

      return {
        success: false,
        message: data.message || "Authentication failed. Invalid credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Network error during authentication.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("pws_auth_token");
    }
    if (isDevMode) {
      // In dev mode, logging out re-activates the test profile
      setUser(DEV_TEST_USER);
      setToken("dev_testing_bypass_token");
    } else {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        user,
        token,
        isLoading,
        login,
        logout,
        refreshSession,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isDevBypassActive: Boolean(isDevMode && user?._id === DEV_TEST_USER._id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

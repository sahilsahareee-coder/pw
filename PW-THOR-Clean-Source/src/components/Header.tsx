"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, ChevronLeft, Moon, Sun, LogIn, LogOut, User, CheckCircle2 } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./AuthContext";
import LoginModal from "./LoginModal";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, logout, openLoginModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Compute display initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("")
    : "G";

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b p-2 sm:p-4 flex items-center justify-between divshadow">
        {/* Left section: menu toggle & back button */}
        <div className="flex items-center gap-2 bg-background/50 rounded-lg sm:px-2 py-1 md:ml-0">
          <button
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 xl:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Right section: XP badge, theme toggle, and auth controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* XP Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 pl-1.5 pr-3 py-1 rounded-full border border-yellow-500/20 transition-all cursor-default">
            <Image
              src="https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/4185e7fe-a684-4d06-baa6-d39035c09de7.png"
              alt="Level 1"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              unoptimized
            />
            <span className="font-bold text-xs">-- XP</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Authentication controls */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pl-2.5 pr-1.5 rounded-full hover:bg-muted border border-border transition-colors text-left"
                    aria-expanded={showUserMenu}
                  >
                    <div className="hidden md:flex flex-col text-right">
                      <span className="text-xs font-bold leading-tight truncate max-w-36 text-foreground">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-end gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified Student
                      </span>
                    </div>

                    <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-purple-600 text-white font-bold text-xs items-center justify-center shadow-sm">
                      {initials}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                        {user.mobile && (
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{user.mobile}</p>
                        )}
                        {user.email && (
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Global Login Modal */}
      <LoginModal />
    </>
  );
}

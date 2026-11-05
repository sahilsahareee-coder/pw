"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  X,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Hash,
  Send,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"phone" | "token">("phone");
  const [authMode, setAuthMode] = useState<"otp" | "password">("otp");

  // Phone tab fields
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpChannel, setOtpChannel] = useState<"1" | "2">("1"); // 1 = WhatsApp, 2 = SMS
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Token tab fields
  const [tokenInput, setTokenInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  if (!isLoginModalOpen) return null;

  // Handler to request OTP via WhatsApp or SMS
  const handleSendOtp = async (channel: "1" | "2" = otpChannel) => {
    const cleanPhone = phoneInput.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSendingOtp(true);
    setOtpChannel(channel);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          smsType: channel,
          fallback: "false",
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setOtpSent(true);
        setOtpCountdown(45);
        setSuccessNotice(
          json.message ||
            `OTP successfully sent to +91 ${cleanPhone} via ${channel === "1" ? "WhatsApp" : "SMS"}!`
        );
      } else {
        setErrorMessage(
          json?.message || "Failed to send OTP. Please try WhatsApp mode or log in with password."
        );
      }
    } catch (err: any) {
      setErrorMessage("Network error while requesting OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (activeTab === "phone") {
      const cleanPhone = phoneInput.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        setErrorMessage("Please enter a valid 10-digit mobile number.");
        return;
      }

      if (authMode === "password") {
        if (!passwordInput.trim()) {
          setErrorMessage("Please enter your PW account password.");
          return;
        }
        setIsLoading(true);
        const result = await login({
          phone: cleanPhone,
          password: passwordInput.trim(),
        });
        setIsLoading(false);
        if (!result.success) {
          setErrorMessage(result.message);
        } else {
          resetAndClose();
        }
      } else {
        // OTP mode
        const cleanOtp = otpInput.replace(/\D/g, "");
        if (!cleanOtp || cleanOtp.length < 4) {
          setErrorMessage("Please enter the 6-digit verification code (OTP).");
          return;
        }
        setIsLoading(true);
        const result = await login({
          phone: cleanPhone,
          otp: cleanOtp,
        });
        setIsLoading(false);
        if (!result.success) {
          setErrorMessage(result.message);
        } else {
          resetAndClose();
        }
      }
    } else {
      // Token tab
      if (!tokenInput.trim()) {
        setErrorMessage("Please enter your student authorization token.");
        return;
      }

      setIsLoading(true);
      const result = await login(tokenInput.trim());
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        resetAndClose();
      }
    }
  };

  const resetAndClose = () => {
    setPhoneInput("");
    setPasswordInput("");
    setOtpInput("");
    setTokenInput("");
    setOtpSent(false);
    setOtpCountdown(0);
    setErrorMessage(null);
    setSuccessNotice(null);
    closeLoginModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-card-foreground"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-3 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Student Sign In</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Sign in with your mobile number to access enrolled batch lectures, notes, and DPP exercises.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-muted p-1 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("phone");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "phone"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile Number</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("token");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "token"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Session Token</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "phone" ? (
            <>
              {/* Phone Number Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-purple-500/50">
                  <div className="flex items-center px-3 border-r border-input bg-muted/40 text-muted-foreground text-xs font-bold rounded-l-lg select-none">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhoneInput(val);
                      if (errorMessage) setErrorMessage(null);
                      if (successNotice) setSuccessNotice(null);
                    }}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 bg-transparent text-sm font-medium focus:outline-none"
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="flex items-center pr-3 pointer-events-none">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Mode Toggle: OTP vs Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground font-medium">Sign in method:</span>
                <div className="flex items-center gap-1.5 bg-muted/60 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      authMode === "otp"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    OTP Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("password");
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      authMode === "password"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Password
                  </button>
                </div>
              </div>

              {/* OTP Mode Content */}
              {authMode === "otp" ? (
                <div className="space-y-3 pt-1">
                  {/* Send OTP button & Channel Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendOtp("1")}
                      disabled={isSendingOtp || otpCountdown > 0 || phoneInput.replace(/\D/g, "").length !== 10}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isSendingOtp && otpChannel === "1" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {otpCountdown > 0 && otpChannel === "1"
                          ? `Resend in ${otpCountdown}s`
                          : "Send OTP on WhatsApp"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendOtp("2")}
                      disabled={isSendingOtp || otpCountdown > 0 || phoneInput.replace(/\D/g, "").length !== 10}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all disabled:opacity-50"
                      title="Send OTP via SMS"
                    >
                      {isSendingOtp && otpChannel === "2" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>SMS</span>
                    </button>
                  </div>

                  {/* Success notification */}
                  {successNotice && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                      <span>{successNotice}</span>
                    </div>
                  )}

                  {/* 6-Digit OTP Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpInput(val);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="••••••"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-base font-mono tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        disabled={isLoading}
                      />
                      <Hash className="w-4 h-4 text-muted-foreground absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Password Mode Content */
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      PW Account Password
                    </label>
                    <a
                      href="https://www.pw.live"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Forgot Password? <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter your Physics Wallah account password"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ⚡ PW password se bina kisi OTP ke seedha login ho jata hai.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Token Tab */
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Authorized Session Token (Bearer JWT)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                    disabled={isLoading}
                  />
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute right-3 top-3" />
                </div>
              </div>

              {/* Help toggle for Token */}
              <div className="border border-border/70 rounded-lg p-3 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center justify-between w-full text-xs font-medium text-foreground"
                >
                  <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <HelpCircle className="w-4 h-4" />
                    How to get your session token?
                  </span>
                  <span className="text-muted-foreground text-[11px] underline">
                    {showHelp ? "Hide steps" : "View steps"}
                  </span>
                </button>

                {showHelp && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-2 text-muted-foreground">
                    <p className="font-semibold text-foreground">Follow these steps in your browser:</p>
                    <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                      <li>
                        Open{" "}
                        <a
                          href="https://www.pw.live"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                        >
                          pw.live <ExternalLink className="w-3 h-3 inline" />
                        </a>{" "}
                        and log into your student account.
                      </li>
                      <li>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px]">F12</kbd> to open Developer Tools.</li>
                      <li>Switch to the <strong>Network</strong> tab.</li>
                      <li>Click any batch or chapter to see requests to <code className="font-mono text-[11px] bg-muted px-1 rounded">api.penpencil.co</code>.</li>
                      <li>Copy the value from header <code className="font-mono text-[11px] bg-muted px-1 rounded">Authorization: Bearer ...</code>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security Note */}
          <p className="text-[11px] text-muted-foreground text-center">
            🔒 Authentication requests are verified securely via official provider OAuth TLS endpoints.
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                (activeTab === "phone" &&
                  (phoneInput.replace(/\D/g, "").length !== 10 ||
                    (authMode === "password" && !passwordInput.trim()) ||
                    (authMode === "otp" && otpInput.replace(/\D/g, "").length < 4))) ||
                (activeTab === "token" && !tokenInput.trim())
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{activeTab === "phone" ? "Verify & Sign In" : "Verify & Sign In"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

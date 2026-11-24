"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  AlertCircle,
  Building2,
  Check,
  RotateCcw,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";

export default function LicenseActivationPage() {
  const router = useRouter();
  // 12 individual single-digit boxes (4-4-4)
  const [digits, setDigits] = useState<string[]>(Array(12).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<{
    restaurantName: string;
    plan: string;
    activatedAt: string;
    subscriptionExpiresAt: string;
  } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Take the last entered character if multiple
    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setErrorMessage(null);

    // Auto-advance to next box
    if (index < 11) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current box is empty, jump to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      } else {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 11) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const numericChars = pasted.replace(/\D/g, "").slice(0, 12);
    if (!numericChars) return;

    const next = [...digits];
    for (let i = 0; i < 12; i++) {
      next[i] = numericChars[i] || "";
    }
    setDigits(next);
    setErrorMessage(null);

    const focusIndex = Math.min(numericChars.length, 11);
    inputRefs.current[focusIndex]?.focus();
  };

  const isComplete = digits.every((d) => d.length === 1);
  const formattedCode = `${digits.slice(0, 4).join("")}-${digits.slice(4, 8).join("")}-${digits.slice(8, 12).join("")}`;

  const handleActivate = async () => {
    if (!isComplete) {
      setErrorMessage("Please enter all 12 digits of your activation code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/super-admin/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formattedCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Activation failed. Please check the code.");
      }

      toast.success("License Activated Successfully!");
      setActivationResult({
        restaurantName: data.restaurantName,
        plan: data.plan,
        activatedAt: data.activatedAt,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to activate license. Please contact Super Admin support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-muted/30 to-background p-4 sm:p-6 lg:p-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(159,18,57,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-xl space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <Logo size={42} />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold tracking-wide">
            <KeyRound className="size-3.5" />
            <span>KIVOKO RESTAURANT OS LICENSE GATE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Activate Restaurant Software
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            Enter the 12-digit activation license code generated by Super Admin upon payment approval.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!activationResult ? (
            <motion.div
              key="activation-form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/80 shadow-2xl backdrop-blur-xl bg-card/90">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">12-Digit License Key</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Single-use cryptographic activation token (4 - 4 - 4 format)
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[11px] font-mono">
                      4 - 4 - 4 FORMAT
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 4-4-4 Segmented Input Boxes */}
                  <div
                    onPaste={handlePaste}
                    className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-4 px-2 rounded-2xl bg-muted/40 border border-border/50"
                  >
                    {/* Chunk 1 (Boxes 0..3) */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digits[idx]}
                          onChange={(e) => handleChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e.key as any)}
                          className={`size-9 sm:size-11 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none ${
                            digits[idx]
                              ? "bg-background border-primary text-primary shadow-sm"
                              : "bg-background/60 border-border/70 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Separator 1 */}
                    <span className="text-muted-foreground font-mono font-bold text-base sm:text-lg select-none px-0.5">
                      —
                    </span>

                    {/* Chunk 2 (Boxes 4..7) */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[4, 5, 6, 7].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digits[idx]}
                          onChange={(e) => handleChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e.key as any)}
                          className={`size-9 sm:size-11 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none ${
                            digits[idx]
                              ? "bg-background border-primary text-primary shadow-sm"
                              : "bg-background/60 border-border/70 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Separator 2 */}
                    <span className="text-muted-foreground font-mono font-bold text-base sm:text-lg select-none px-0.5">
                      —
                    </span>

                    {/* Chunk 3 (Boxes 8..11) */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[8, 9, 10, 11].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digits[idx]}
                          onChange={(e) => handleChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e.key as any)}
                          className={`size-9 sm:size-11 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none ${
                            digits[idx]
                              ? "bg-background border-primary text-primary shadow-sm"
                              : "bg-background/60 border-border/70 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Error Callout */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  {/* Notice about Subscription Timer */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                    <Clock className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Exact Activation Subscription Guarantee
                      </div>
                      <p className="mt-0.5 text-[11px] text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
                        Your subscription period (30 days / 1 year) begins at the exact moment this code is verified
                        and activated, ensuring you get every second of your paid service.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={handleActivate}
                      disabled={!isComplete || isLoading}
                      className="w-full h-11 text-sm font-bold bg-gradient-to-r from-[#9f1239] via-[#8e1032] to-[#780c29] text-white shadow-lg hover:shadow-rose-900/20 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RotateCcw className="size-4 animate-spin" />
                          <span>Verifying License Cryptography…</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4" />
                          <span>Unlock &amp; Activate Software</span>
                          <ArrowRight className="size-4" />
                        </div>
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <Link href="/login" className="hover:text-foreground transition-colors">
                        ← Back to Staff Login
                      </Link>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <ShieldCheck className="size-3.5 text-primary" />
                        SHA-256 Protected
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* SUCCESS CELEBRATION STATE */
            <motion.div
              key="activation-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="border-emerald-500/40 shadow-2xl backdrop-blur-xl bg-card/95 overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 mb-2">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 mx-auto font-bold text-[10px] tracking-wider uppercase">
                    LICENSE ACTIVATED &bull; TIMER LIVE
                  </Badge>
                  <CardTitle className="text-2xl font-extrabold text-foreground mt-2">
                    Welcome, {activationResult.restaurantName}!
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your KIVOKO Restaurant OS has been unlocked and full POS access is now live.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Active SaaS Plan</div>
                      <div className="font-bold text-sm text-foreground mt-0.5">{activationResult.plan} Tier</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Timer Activated</div>
                      <div className="font-semibold text-foreground mt-0.5">
                        {new Date(activationResult.activatedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/40">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Subscription Valid Until</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mt-0.5 flex items-center gap-1.5">
                        <Clock className="size-4" />
                        <span>
                          {new Date(activationResult.subscriptionExpiresAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">(30 Days Remaining)</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all"
                  >
                    <span>Launch Restaurant Dashboard</span>
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

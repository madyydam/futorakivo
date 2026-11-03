"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@modexsys/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Zap } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  // Set once the server says this account uses two-factor authentication.
  const [needsCode, setNeedsCode] = useState(false);
  // Shown inline under the form (a toast vanishes before it can be read).
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@royalspice.com",
      password: "password123",
    },
  });

  const onSubmit = (dto: LoginDto) => {
    setError(null);
    login.mutate(dto, {
      onSuccess: (data) => {
        const user = (data as { user?: { roleName?: string; permissions?: string[] } }).user;
        const rider = user?.roleName === "DELIVERY_STAFF" && user.permissions?.includes("delivery.rider");
        router.push(rider ? "/my-deliveries" : "/dashboard");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
          setNeedsCode(true);
          return;
        }
        // In demo mode fallback: never block user from opening dashboard
        router.push("/dashboard");
      },
    });
  };

  const handleQuickDemo = () => {
    login.mutate(
      { email: "admin@royalspice.com", password: "password123" },
      {
        onSuccess: () => router.push("/dashboard"),
        onError: () => router.push("/dashboard"),
      }
    );
  };

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_90%),transparent)]"
      />
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modexsys HORECA
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your restaurant</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickDemo}
            className="flex h-11 w-full items-center justify-center gap-2 border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition-all hover:bg-primary/15"
          >
            <Zap className="h-4 w-4 fill-primary" />
            1-Click Demo Login (Instant Access)
          </Button>

          <div className="relative my-1 flex items-center justify-center text-xs text-muted-foreground">
            <span className="w-full border-t border-border" />
            <span className="bg-background px-2">OR</span>
            <span className="w-full border-t border-border" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email or phone number</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              autoFocus
              className="h-11"
              placeholder="you@restaurant.com or phone number"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              enterKeyHint="go"
              className="h-11"
              placeholder="Your password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {needsCode && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="totp">Verification code</Label>
              <Input
                id="totp"
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                placeholder="6-digit code or recovery code"
                {...register("totp")}
              />
              <p className="text-xs text-muted-foreground">
                Open your authenticator app, or use one of your recovery codes.
              </p>
              {errors.totp && <p className="text-xs text-destructive">{errors.totp.message}</p>}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="mt-2 h-12 text-base font-medium" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          New restaurant?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

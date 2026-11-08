"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChefHat,
  Flame,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useRegister } from "@/hooks/use-auth";

const CUISINE_TYPES = [
  "North Indian & Mughlai",
  "South Indian Traditional",
  "Cafe, Bakery & Desserts",
  "Fast Casual & Burgers",
  "Chinese & Pan-Asian",
  "Pizzeria & Italian",
  "Fine Dining & Multi-Cuisine",
  "Cloud Kitchen & Delivery Only",
];

export default function OnboardingPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState(CUISINE_TYPES[0]);
  const [city, setCity] = useState("New Delhi");
  const [currency, setCurrency] = useState("INR (₹)");

  const [branchName, setBranchName] = useState("Main Flagship Branch");
  const [seatingCapacity, setSeatingCapacity] = useState("45");
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(true);

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    const finalRestaurantName = restaurantName.trim() || "Modexsys HORECA";
    const finalBranchName = branchName.trim() || "Main Branch";
    const finalOwnerName = ownerName.trim() || "Restaurant Owner";

    if (typeof window !== "undefined") {
      localStorage.setItem("modexsys_restaurant_name", finalRestaurantName);
      localStorage.setItem("modexsys_branch_name", finalBranchName);
    }

    try {
      await registerMutation.mutateAsync({
        restaurantName: finalRestaurantName,
        branchName: finalBranchName,
        ownerName: finalOwnerName,
        email: email || "owner@restaurant.com",
        password: password || "password123",
      });
    } catch (err) {
      console.warn("Onboarding fallback:", err);
    } finally {
      setIsSubmitting(false);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-bold tracking-tight text-base sm:text-lg">Modexsys HORECA</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Already registered?</span>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="mx-auto my-auto w-full max-w-2xl px-4 py-8">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span className={step >= 1 ? "text-primary" : ""}>1. Restaurant</span>
            <span className={step >= 2 ? "text-primary" : ""}>2. First Branch</span>
            <span className={step >= 3 ? "text-primary" : ""}>3. Owner Account</span>
            <span className={step >= 4 ? "text-primary" : ""}>4. Launch</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "25%" }}
              animate={{ width: `${step * 25}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card className="border-border/80 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Restaurant Details */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  onSubmit={handleNext}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                      <Store className="size-6 text-primary" />
                      Tell us about your restaurant
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set up your restaurant brand identity and primary cuisine
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="restaurantName" className="text-xs font-medium">
                        Restaurant Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="restaurantName"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="e.g. Royal Spice Bistro"
                        required
                        className="mt-1 h-11 text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="cuisine" className="text-xs font-medium">
                          Primary Cuisine / Concept
                        </Label>
                        <select
                          id="cuisine"
                          value={cuisine}
                          onChange={(e) => setCuisine(e.target.value)}
                          className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
                        >
                          {CUISINE_TYPES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-xs font-medium">
                          City / Metro Region
                        </Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. New Delhi, Mumbai, Bengaluru"
                          className="mt-1 h-11 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency" className="text-xs font-medium">
                        Billing Currency
                      </Label>
                      <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
                      >
                        <option value="INR (₹)">INR (₹) - Indian Rupee (GST Ready)</option>
                        <option value="USD ($)">USD ($) - US Dollar</option>
                        <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                        <option value="EUR (€)">EUR (€) - Euro</option>
                        <option value="GBP (£)">GBP (£) - British Pound</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button type="submit" className="h-11 px-6 font-semibold gap-2">
                      Continue to Branch Setup
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: Branch & Fulfillment Setup */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  onSubmit={handleNext}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                      <Building2 className="size-6 text-primary" />
                      Configure your first outlet
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set branch name, seating capacity, and order channels
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="branchName" className="text-xs font-medium">
                        Branch / Location Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="branchName"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="e.g. Connaught Place Flagship"
                        required
                        className="mt-1 h-11 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="capacity" className="text-xs font-medium">
                        Floor Seating Capacity (Approx. Guests)
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={seatingCapacity}
                        onChange={(e) => setSeatingCapacity(e.target.value)}
                        placeholder="45"
                        className="mt-1 h-11 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Active Order Channels</Label>
                      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
                        <label className="flex items-center gap-2.5 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
                          <input
                            type="checkbox"
                            checked={dineInEnabled}
                            onChange={(e) => setDineInEnabled(e.target.checked)}
                            className="size-4 accent-primary"
                          />
                          <span className="font-medium">Dine-In Tables</span>
                        </label>
                        <label className="flex items-center gap-2.5 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
                          <input
                            type="checkbox"
                            checked={takeawayEnabled}
                            onChange={(e) => setTakeawayEnabled(e.target.checked)}
                            className="size-4 accent-primary"
                          />
                          <span className="font-medium">Takeaway Counter</span>
                        </label>
                        <label className="flex items-center gap-2.5 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
                          <input
                            type="checkbox"
                            checked={qrOrderingEnabled}
                            onChange={(e) => setQrOrderingEnabled(e.target.checked)}
                            className="size-4 accent-primary"
                          />
                          <span className="font-medium">QR Dine-in Self Order</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-11 px-4 gap-1.5"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button type="submit" className="h-11 px-6 font-semibold gap-2">
                      Continue to Owner Account
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: Owner Account Setup */}
              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  onSubmit={handleNext}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                      <User className="size-6 text-primary" />
                      Create Restaurant Admin Account
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your master admin login with full permissions over staff, POS, and financial reports
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ownerName" className="text-xs font-medium">
                        Your Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Vikram Malhotra"
                        required
                        className="mt-1 h-11 text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium">
                          Business Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vikram@restaurant.com"
                          required
                          className="mt-1 h-11 text-xs"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-xs font-medium">
                          Mobile Number
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="mt-1 h-11 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-xs font-medium">
                        Password (Min 8 characters) <span className="text-destructive">*</span>
                      </Label>
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure password"
                        required
                        className="mt-1 h-11 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="h-11 px-4 gap-1.5"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button type="submit" className="h-11 px-6 font-semibold gap-2">
                      Review &amp; Launch
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* STEP 4: Ready & Confirmation */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                      <Sparkles className="size-7" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Your Restaurant is Ready to Launch!</h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      We&apos;ve prepared your isolated tenant workspace with POS, KDS, inventory, and GST invoicing.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-left text-xs space-y-2.5 max-w-md mx-auto">
                    <div className="flex justify-between pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">Restaurant:</span>
                      <span className="font-bold text-foreground">{restaurantName || "Modexsys HORECA"}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">Primary Branch:</span>
                      <span className="font-semibold text-foreground">{branchName || "Main Branch"}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">Cuisine &amp; City:</span>
                      <span className="font-medium text-foreground">{cuisine} · {city}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">Admin Owner:</span>
                      <span className="font-medium text-foreground">{ownerName || "Restaurant Owner"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Access:</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        OWNER (Full Admin Access)
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center max-w-md mx-auto pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(3)}
                      className="h-10 text-xs"
                    >
                      <ArrowLeft className="mr-1.5 size-3.5" />
                      Edit Details
                    </Button>

                    <Button
                      onClick={handleFinish}
                      disabled={isSubmitting}
                      className="h-11 px-8 font-bold gap-2 text-sm bg-primary shadow-lg hover:shadow-primary/25"
                    >
                      <Rocket className="size-4" />
                      {isSubmitting ? "Launching OS…" : "Enter Real OS Dashboard"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Modexsys HORECA Platform · Multi-tenant Cloud OS for Restaurants &amp; Cafes
      </footer>
    </div>
  );
}


"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ChefHat,
  Flame,
  LayoutGrid,
  Pause,
  Play,
  ShoppingCart,
  UtensilsCrossed,
  Receipt,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type DemoPhase = 0 | 1 | 2 | 3 | 4;

const PHASES = [
  { id: 0, title: "1. Monitor Dashboard", desc: "Live floor & revenue metrics" },
  { id: 1, title: "2. Click + New Order", desc: "Trigger order modal" },
  { id: 2, title: "3. Select Dishes", desc: "Table 4 items & pricing" },
  { id: 3, title: "4. Fire KOT to Kitchen", desc: "Instant KDS dispatch" },
  { id: 4, title: "5. Real-Time Sync", desc: "Revenue & table update" },
];

export function LiveSystemDemo() {
  const [phase, setPhase] = useState<DemoPhase>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Precise DOM targets
  const containerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const newOrderBtnRef = useRef<HTMLDivElement>(null);
  const dishItemRef = useRef<HTMLDivElement>(null);
  const fireKotBtnRef = useRef<HTMLDivElement>(null);
  const table4Ref = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ x: 220, y: 40 });

  // Compute exact coordinates where the tip of the arrow (0, 0) should touch
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    let targetEl: HTMLElement | null = null;
    let offsetX = 16;
    let offsetYRatio = 0.5;

    if (phase === 0) {
      targetEl = overviewRef.current;
      offsetX = 20;
      offsetYRatio = 0.4;
    } else if (phase === 1) {
      targetEl = newOrderBtnRef.current;
      offsetX = 28; // tip directly on the button text / icon
      offsetYRatio = 0.5;
    } else if (phase === 2) {
      targetEl = dishItemRef.current;
      offsetX = 45; // tip on the dish name
      offsetYRatio = 0.5;
    } else if (phase === 3) {
      targetEl = fireKotBtnRef.current;
      if (targetEl) {
        offsetX = targetEl.offsetWidth / 2;
      }
      offsetYRatio = 0.5;
    } else if (phase === 4) {
      targetEl = table4Ref.current;
      if (targetEl) {
        offsetX = targetEl.offsetWidth / 2;
      }
      offsetYRatio = 0.5;
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const x = rect.left - containerRect.left + offsetX;
      const y = rect.top - containerRect.top + rect.height * offsetYRatio;
      setCursorPos({ x, y });
    }
  }, [phase]);

  // Multi-interval tracking to guarantee precision across all layout updates
  useEffect(() => {
    updatePosition();
    const t1 = setTimeout(updatePosition, 50);
    const t2 = setTimeout(updatePosition, 150);
    const t3 = setTimeout(updatePosition, 280);
    const t4 = setTimeout(updatePosition, 450);

    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [phase, updatePosition]);

  // Continuous auto-playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const durations: Record<DemoPhase, number> = {
      0: 2600,
      1: 2300,
      2: 2700,
      3: 2200,
      4: 3200,
    };

    const timer = setTimeout(() => {
      setPhase((prev) => ((prev + 1) % 5) as DemoPhase);
    }, durations[phase]);

    return () => clearTimeout(timer);
  }, [phase, isPlaying]);

  // Toast feedback on dispatch
  useEffect(() => {
    if (phase === 4) {
      setShowToast(true);
    } else if (phase === 0) {
      setShowToast(false);
    }
  }, [phase]);

  return (
    <section id="live-demo" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Interactive System Walkthrough · Cloud SaaS &amp; Offline Sync
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Watch KIVO in Live Action
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Simulating real operations: watch the operator cursor place an order on Table 4, fire KOT to the kitchen, and update billing in real time.
        </p>

        {/* Phase timeline control buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPhase(p.id as DemoPhase);
                setIsPlaying(false);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                phase === p.id
                  ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20 font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors sm:text-sm"
            title={isPlaying ? "Pause simulation" : "Play simulation"}
          >
            {isPlaying ? (
              <>
                <Pause className="size-3 text-muted-foreground" /> Pause
              </>
            ) : (
              <>
                <Play className="size-3 text-primary fill-current" /> Auto-Play
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Demo Window */}
      <div className="relative mt-10 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_20px_70px_-15px_rgba(0,0,0,0.4)]">
        {/* Window title bar */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
            <span className="ml-2 font-mono text-xs text-muted-foreground hidden sm:inline-block">
              https://www.kivo.futoragroup.in/dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Sync Active
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              v1.0-horeca
            </span>
          </div>
        </div>

        {/* Realistic Dashboard Frame */}
        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] bg-background">
          {/* Mock Sidebar */}
          <div className="hidden border-r border-border/60 bg-muted/20 p-3.5 md:flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 py-0.5">
                <Logo size={22} />
                <span className="text-xs font-bold tracking-tight text-foreground">
                  KIVO
                </span>
              </div>

              <div className="rounded-lg bg-card border border-border/60 px-2.5 py-1.5 text-xs font-medium text-foreground">
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Branch</span>
                Main Dine-in Branch
              </div>

              <nav className="space-y-1">
                <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
                  <LayoutGrid className="size-3.5" />
                  Dashboard
                </div>
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                  <ShoppingCart className="size-3.5" />
                  Point of Sale
                </div>
                <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-3.5" />
                    Tables
                  </div>
                  <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[10px] text-primary font-semibold">
                    {phase >= 4 ? "7" : "6"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ChefHat className="size-3.5" />
                    Kitchen (KDS)
                  </div>
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] text-amber-500 font-semibold">
                    {phase >= 4 ? "4" : "3"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                  <UtensilsCrossed className="size-3.5" />
                  Menu Manager
                </div>
              </nav>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-2 text-[10px] text-muted-foreground">
              <span className="block font-semibold text-foreground">Offline Auto-Sync</span>
              Local cache &amp; cloud connected
            </div>
          </div>

          {/* Main Dashboard Display with Relative Container for Cursor Tracking */}
          <div ref={containerRef} className="relative p-4 sm:p-6 min-h-[420px] flex flex-col justify-between">
            {/* Topbar inside dashboard */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div ref={overviewRef}>
                  <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                    Good afternoon, Manager
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Live Service • Tuesday Floor Rotation</span>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* TARGET BUTTON FOR CURSOR: NEW ORDER */}
                  <div
                    ref={newOrderBtnRef}
                    id="demo-new-order-btn"
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                      phase === 1
                        ? "border-primary bg-primary text-primary-foreground shadow-sm scale-95 ring-2 ring-primary/30"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    <ShoppingCart className="size-3.5" />
                    <span>+ New order</span>

                    {/* Click wave indicator */}
                    {phase === 1 && (
                      <span className="absolute -inset-1 rounded-xl border-2 border-primary animate-ping pointer-events-none" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                    <LayoutGrid className="size-3.5" />
                    <span>Tables</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                    <ChefHat className="size-3.5" />
                    <span>Kitchen display</span>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Revenue card */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Today's Revenue</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 text-xs text-emerald-500 font-bold">₹</span>
                  </div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {phase >= 4 ? (
                      <motion.span
                        key="rev-high"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-emerald-500"
                      >
                        ₹15,082.00
                      </motion.span>
                    ) : (
                      <span>₹14,200.00</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {phase >= 4 ? "+₹882.00 from Table 4" : "14 settled bills"}
                  </p>
                </div>

                {/* Orders card */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Today's Orders</span>
                    <ShoppingCart className="size-4 text-primary" />
                  </div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {phase >= 4 ? "29" : "28"}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {phase >= 4 ? "1 active on Table 4" : "Dine-in & takeaways"}
                  </p>
                </div>

                {/* Occupied tables */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Occupied Tables</span>
                    <Users className="size-4 text-amber-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {phase >= 4 ? "7 / 12" : "6 / 12"}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {phase >= 4 ? "58% floor occupancy" : "50% floor occupancy"}
                  </p>
                </div>

                {/* Kitchen Queue */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Kitchen Queue</span>
                    <Flame className="size-4 text-rose-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {phase >= 4 ? (
                      <span className="text-rose-500 font-bold">4 active</span>
                    ) : (
                      <span>3 active</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Avg prep 11 min</p>
                </div>
              </div>

              {/* Floor tables live status preview */}
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Live Floor Status — Main Dining Hall
                  </span>
                  <span className="text-xs text-muted-foreground">Target: Table 4</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-lg border border-border/60 bg-card p-2.5 text-xs">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Table 1</span>
                      <span className="text-emerald-500 text-[10px]">Occupied</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">₹1,450 • 28 min</span>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card p-2.5 text-xs">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Table 2</span>
                      <span className="text-muted-foreground text-[10px]">Available</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Ready for seating</span>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card p-2.5 text-xs">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Table 3</span>
                      <span className="text-amber-500 text-[10px]">Reserved</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Party of 4 @ 8:00</span>
                  </div>

                  {/* TABLE 4 TARGET REF */}
                  <div
                    ref={table4Ref}
                    className={cn(
                      "rounded-lg border p-2.5 text-xs transition-all duration-300",
                      phase >= 4
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-card"
                    )}
                  >
                    <div className="flex justify-between items-center font-semibold">
                      <span>Table 4</span>
                      {phase >= 4 ? (
                        <span className="text-primary font-bold text-[10px] animate-pulse">
                          ● KOT #108
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Available</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {phase >= 4 ? "₹882.00 • In Prep" : "Vacant • 4 Seats"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME SIMULATED ORDER MODAL OVERLAY (Phases 2 & 3) */}
            <AnimatePresence>
              {(phase === 2 || phase === 3) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onAnimationComplete={() => updatePosition()}
                  className="absolute inset-x-4 top-10 z-20 mx-auto max-w-md rounded-2xl border border-border/90 bg-card p-4 sm:p-5 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-primary/15 p-1.5 text-primary">
                        <ShoppingCart className="size-4" />
                      </span>
                      <span className="text-sm font-bold text-foreground">New Dine-In Order</span>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      Table 4 (4 Guests)
                    </span>
                  </div>

                  {/* Selected items with dishItemRef */}
                  <div className="mt-3 space-y-2">
                    <div
                      ref={dishItemRef}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-2 text-xs transition-colors",
                        phase === 2 ? "bg-primary/10 border border-primary/30" : "bg-muted/40"
                      )}
                    >
                      <div>
                        <p className="font-semibold text-foreground">1x Woodfired Truffle Pizza</p>
                        <p className="text-[10px] text-muted-foreground">Thin crust, fresh mozzarella</p>
                      </div>
                      <span className="font-semibold text-foreground">₹540.00</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">2x Iced Berry Hibiscus Mocktail</p>
                        <p className="text-[10px] text-muted-foreground">Low sugar, mint garnish</p>
                      </div>
                      <span className="font-semibold text-foreground">₹300.00</span>
                    </div>
                  </div>

                  {/* Totals & Tax */}
                  <div className="mt-3 border-t border-border/50 pt-2 text-xs flex justify-between items-center text-muted-foreground">
                    <span>GST (5% tax inclusive)</span>
                    <span>₹42.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-foreground mt-1">
                    <span>Total Amount</span>
                    <span className="text-primary text-base">₹882.00</span>
                  </div>

                  {/* Action button clicked in Phase 3 */}
                  <div className="mt-3.5">
                    <div
                      ref={fireKotBtnRef}
                      id="demo-fire-kot-btn"
                      className={cn(
                        "relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-all cursor-pointer",
                        phase === 3
                          ? "bg-emerald-600 scale-95 shadow-md ring-2 ring-emerald-400"
                          : "bg-primary hover:bg-primary/90"
                      )}
                    >
                      <ChefHat className="size-4" />
                      <span>Fire KOT & Send to Kitchen</span>

                      {/* Click animation ring */}
                      {phase === 3 && (
                        <span className="absolute -inset-1 rounded-xl border-2 border-emerald-400 animate-ping pointer-events-none" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REAL-TIME SUCCESS NOTIFICATION TOAST */}
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: -12, x: 12 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/95 p-2.5 text-xs text-white shadow-xl backdrop-blur-md"
                >
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">KOT #108 Dispatched Successfully</p>
                    <p className="text-[10px] text-emerald-200">
                      Table 4 routed to Hot Kitchen &amp; Beverage Bar • Instant Local Response
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DYNAMIC PIXEL-PERFECT OPERATOR CURSOR */}
            <motion.div
              animate={{
                x: cursorPos.x,
                y: cursorPos.y,
                scale: phase === 1 || phase === 3 ? 0.9 : 1,
              }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-none absolute top-0 left-0 z-40 block"
            >
              <div className="relative">
                {/* Precision Custom Pointer Arrow: Very tip of arrowhead is exactly at coordinate (0, 0) */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                >
                  <path
                    d="M0 0 L6.5 21.5 L10.8 12.8 L19.5 9.2 L0 0 Z"
                    fill="#e11d48"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Operator status pill following cursor */}
                <span className="absolute -top-6 left-4 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                  {phase === 0 && "1. Reviewing floor"}
                  {phase === 1 && "2. Clicking + New order"}
                  {phase === 2 && "3. Selecting dishes"}
                  {phase === 3 && "4. Firing to KDS"}
                  {phase === 4 && "5. Synced in real time"}
                </span>

                {/* Click wave indicator right under arrowhead tip */}
                {(phase === 1 || phase === 3) && (
                  <span className="absolute -top-1 -left-1 size-6 rounded-full border-2 border-primary animate-ping" />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
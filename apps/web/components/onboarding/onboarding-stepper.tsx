"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Language } from "./onboarding-translations";
import { ONBOARDING_I18N } from "./onboarding-translations";

interface OnboardingStepperProps {
  currentStep: number;
  completedSteps: number[];
  onSelectStep: (step: number) => void;
  lang: Language;
}

export function OnboardingStepper({
  currentStep,
  completedSteps,
  onSelectStep,
  lang,
}: OnboardingStepperProps) {
  const steps = ONBOARDING_I18N[lang].steps;
  const progressPercent = Math.min(
    100,
    Math.round((completedSteps.length / steps.length) * 100),
  );

  return (
    <div className="w-full space-y-3">
      {/* Top Meta: Step count & Percentage */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">
          {lang === "en" ? "Step" : "चरण"}{" "}
          <strong className="text-foreground">{currentStep}</strong> /{" "}
          {steps.length}:{" "}
          <span className="font-semibold text-primary">
            {steps[currentStep - 1]?.title}
          </span>
        </span>
        <span className="font-semibold text-foreground">
          {progressPercent}% {lang === "en" ? "Completed" : "पूर्ण"}
        </span>
      </div>

      {/* Primary Linear Progress Bar */}
      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-primary/80 to-primary rounded-full"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </div>

      {/* Horizontal Steps Carousel / Pill List */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
        {steps.map((st) => {
          const isCurrent = st.id === currentStep;
          const isDone = completedSteps.includes(st.id);
          const isClickable = isDone || st.id <= currentStep;

          return (
            <button
              key={st.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(st.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 text-left cursor-pointer ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                  : isDone
                    ? "border-emerald-500/30 bg-emerald-500/5 text-foreground hover:bg-emerald-500/10"
                    : "border-border/50 bg-background/50 text-muted-foreground opacity-60 cursor-not-allowed"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="size-3 stroke-[3]" /> : st.id}
              </span>
              <span className="whitespace-nowrap font-medium text-[11px]">
                {st.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

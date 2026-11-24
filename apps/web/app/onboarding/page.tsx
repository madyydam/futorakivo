"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCompleteOnboarding,
  useOnboarding,
  useUpdateOnboardingProgress,
} from "@/hooks/use-onboarding";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import type { Language } from "@/components/onboarding/onboarding-translations";
import { Step1Profile } from "@/components/onboarding/steps/step1-profile";
import { Step2Outlets } from "@/components/onboarding/steps/step2-outlets";
import { Step3Taxes } from "@/components/onboarding/steps/step3-taxes";
import { Step4Menu } from "@/components/onboarding/steps/step4-menu";
import { Step5Tables } from "@/components/onboarding/steps/step5-tables";
import { Step6Kitchen } from "@/components/onboarding/steps/step6-kitchen";
import { Step7Payments } from "@/components/onboarding/steps/step7-payments";
import { Step8Staff } from "@/components/onboarding/steps/step8-staff";
import { Step9Device } from "@/components/onboarding/steps/step9-device";
import { Step10TestOrder } from "@/components/onboarding/steps/step10-test-order";
import { Step11GoLive } from "@/components/onboarding/steps/step11-go-live";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: onboardingData, isLoading } = useOnboarding();
  const updateMutation = useUpdateOnboardingProgress();
  const completeMutation = useCompleteOnboarding();

  const [lang, setLang] = useState<Language>("en");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);

  // Sync state once fetched from backend
  useEffect(() => {
    if (onboardingData && !initialized) {
      if (onboardingData.currentStep) {
        setCurrentStep(onboardingData.currentStep);
      }
      if (onboardingData.completedSteps) {
        setCompletedSteps(onboardingData.completedSteps);
      }
      if (onboardingData.draftJson) {
        setDraft(onboardingData.draftJson);
      }
      setInitialized(true);
    }
  }, [onboardingData, initialized]);

  // Patch draft and optionally persist immediately
  const handleUpdateDraft = (patch: Record<string, any>) => {
    setDraft((prev) => {
      const updated = { ...prev, ...patch };
      return updated;
    });
  };

  const handleNextStep = (stepNumber: number) => {
    const nextStep = Math.min(11, stepNumber + 1);
    const newCompleted = Array.from(new Set([...completedSteps, stepNumber])).sort(
      (a, b) => a - b,
    );
    setCompletedSteps(newCompleted);
    setCurrentStep(nextStep);

    // Autosave progress to server
    updateMutation.mutate({
      currentStep: nextStep,
      completedStep: stepNumber,
      draftJson: draft,
    });
  };

  const handleSelectStep = (step: number) => {
    setCurrentStep(step);
    updateMutation.mutate({
      currentStep: step,
      draftJson: draft,
    });
  };

  const handleFinish = async () => {
    try {
      if (typeof window !== "undefined") {
        const restName = draft.name || "KIVO Bistro & Lounge";
        const branchName = draft.outletName || "Main Flagship Branch";
        localStorage.setItem("FUTORA group_restaurant_name", restName);
        localStorage.setItem("FUTORA group_branch_name", branchName);
      }
      await completeMutation.mutateAsync();
    } catch (err) {
      console.warn("Onboarding finalization fallback:", err);
    } finally {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Persistent Global Header */}
      <OnboardingHeader
        lang={lang}
        onLanguageChange={setLang}
        isSaving={updateMutation.isPending}
      />

      {/* Main Wizard Workspace */}
      <main className="mx-auto my-auto w-full max-w-4xl px-4 py-8 space-y-6">
        {isLoading && !initialized ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3 mx-auto" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* 11-Step Stepper Progress Bar */}
            <OnboardingStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              onSelectStep={handleSelectStep}
              lang={lang}
            />

            {/* Step Card Frame */}
            <Card className="border-border/80 shadow-md">
              <CardContent className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`step-${currentStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* STEP 1: Profile */}
                    {currentStep === 1 && (
                      <Step1Profile
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(1)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 2: Outlets */}
                    {currentStep === 2 && (
                      <Step2Outlets
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(2)}
                        onBack={() => setCurrentStep(1)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 3: Taxes */}
                    {currentStep === 3 && (
                      <Step3Taxes
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(3)}
                        onBack={() => setCurrentStep(2)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 4: Menu Bulk Import */}
                    {currentStep === 4 && (
                      <Step4Menu
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(4)}
                        onBack={() => setCurrentStep(3)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 5: Tables & Floor */}
                    {currentStep === 5 && (
                      <Step5Tables
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(5)}
                        onBack={() => setCurrentStep(4)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 6: Kitchen & Printers */}
                    {currentStep === 6 && (
                      <Step6Kitchen
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(6)}
                        onBack={() => setCurrentStep(5)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 7: Payments & UPI */}
                    {currentStep === 7 && (
                      <Step7Payments
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(7)}
                        onBack={() => setCurrentStep(6)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 8: Staff & PINs */}
                    {currentStep === 8 && (
                      <Step8Staff
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(8)}
                        onBack={() => setCurrentStep(7)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 9: Device Pairing */}
                    {currentStep === 9 && (
                      <Step9Device
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(9)}
                        onBack={() => setCurrentStep(8)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 10: Sandbox Test Order */}
                    {currentStep === 10 && (
                      <Step10TestOrder
                        data={draft}
                        onChange={handleUpdateDraft}
                        onNext={() => handleNextStep(10)}
                        onBack={() => setCurrentStep(9)}
                        lang={lang}
                      />
                    )}

                    {/* STEP 11: Go-Live */}
                    {currentStep === 11 && (
                      <Step11GoLive
                        data={draft}
                        onFinish={handleFinish}
                        onBack={() => setCurrentStep(10)}
                        isSubmitting={completeMutation.isPending}
                        lang={lang}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        KIVO Platform · Cloud Restaurant Operating System · 11-Step Onboarding Architecture
      </footer>
    </div>
  );
}

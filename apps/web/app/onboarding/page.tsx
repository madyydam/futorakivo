"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
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

const LOCAL_BACKUP_KEY = "kivo_onboarding_local_backup";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: onboardingData, isLoading, isError, error } = useOnboarding();
  const updateMutation = useUpdateOnboardingProgress();
  const completeMutation = useCompleteOnboarding();

  const [lang, setLang] = useState<Language>("en");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { note, clear, toast } = useNoteToast();

  const draftRef = useRef<Record<string, any>>(draft);
  const currentStepRef = useRef<number>(currentStep);
  const updateMutateRef = useRef(updateMutation.mutate);

  useEffect(() => {
    draftRef.current = draft;
    currentStepRef.current = currentStep;
    updateMutateRef.current = updateMutation.mutate;
  }, [draft, currentStep, updateMutation.mutate]);

  // Sync state once fetched from backend, or handle 401 unauthorized & local recovery
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    if (onboardingData && !initialized) {
      if (onboardingData.currentStep) {
        currentStepRef.current = onboardingData.currentStep;
        setCurrentStep(onboardingData.currentStep);
      }
      if (onboardingData.completedSteps) {
        setCompletedSteps(onboardingData.completedSteps);
      }
      if (onboardingData.draftJson && Object.keys(onboardingData.draftJson).length > 0) {
        draftRef.current = onboardingData.draftJson;
        setDraft(onboardingData.draftJson);
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.draft) {
              draftRef.current = parsed.draft;
              setDraft(parsed.draft);
            }
          } catch {}
        }
      }
      setInitialized(true);
    } else if (isError) {
      const status = (error as any)?.status;
      if (status === 401) {
        router.push("/login?redirect=/onboarding");
      } else {
        // Fallback for offline demo preview / local storage recovery
        if (typeof window !== "undefined") {
          const local = localStorage.getItem(LOCAL_BACKUP_KEY);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (parsed.draft) {
                draftRef.current = parsed.draft;
                setDraft(parsed.draft);
              }
              if (parsed.currentStep) {
                currentStepRef.current = parsed.currentStep;
                setCurrentStep(parsed.currentStep);
              }
              if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
            } catch {}
          }
        }
        setInitialized(true);
      }
    }
  }, [onboardingData, initialized, isError, error, router]);

  // Online / Offline recovery event listeners (bound once using refs)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.draft) {
              updateMutateRef.current({
                currentStep: parsed.currentStep || currentStepRef.current,
                draftJson: parsed.draft,
              });
            }
          } catch {}
        }
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Synchronize local storage backup outside render cycle
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        LOCAL_BACKUP_KEY,
        JSON.stringify({ draft, currentStep, completedSteps }),
      );
    } catch {}
  }, [draft, currentStep, completedSteps, initialized]);

  // Patch draft synchronously on draftRef so immediate onNext calls never drop fields
  const handleUpdateDraft = useCallback((patch: Record<string, any>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      draftRef.current = next;
      return next;
    });
  }, []);

  const handleNextStep = useCallback((stepNumber: number) => {
    const nextStep = Math.min(11, stepNumber + 1);
    setCompletedSteps((prevCompleted) => {
      const newCompleted = Array.from(new Set([...prevCompleted, stepNumber])).sort(
        (a, b) => a - b,
      );
      return newCompleted;
    });
    currentStepRef.current = nextStep;
    setCurrentStep(nextStep);

    updateMutateRef.current({
      currentStep: nextStep,
      completedStep: stepNumber,
      draftJson: draftRef.current,
    });
  }, []);

  const handleSelectStep = useCallback((step: number) => {
    currentStepRef.current = step;
    setCurrentStep(step);
    updateMutateRef.current({
      currentStep: step,
      draftJson: draftRef.current,
    });
  }, []);

  const handleFinish = async () => {
    clear();
    try {
      await completeMutation.mutateAsync();
      if (typeof window !== "undefined") {
        const restName = draftRef.current.name || "KIVO Bistro & Lounge";
        const branchName = draftRef.current.outletName || "Main Flagship Branch";
        localStorage.setItem("FUTORA group_restaurant_name", restName);
        localStorage.setItem("FUTORA group_branch_name", branchName);
        localStorage.removeItem(LOCAL_BACKUP_KEY);
      }
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not complete onboarding setup. Please review your details and retry.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Persistent Global Header */}
      <OnboardingHeader
        lang={lang}
        onLanguageChange={setLang}
        isSaving={updateMutation.isPending}
        isOnline={isOnline}
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
            <StatusNote note={note} onClear={clear} />
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

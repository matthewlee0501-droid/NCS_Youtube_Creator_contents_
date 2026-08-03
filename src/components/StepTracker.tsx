import React from "react";
import { Check, Edit3, List, FileText, Camera, Video } from "lucide-react";

export type WorkflowStep = "INPUT" | "SELECT_TITLE" | "GENERATING" | "RESULT";

interface StepTrackerProps {
  currentStep: WorkflowStep;
  activeTab: "BLOG" | "IMAGES" | "YOUTUBE";
  setActiveTab: (tab: "BLOG" | "IMAGES" | "YOUTUBE") => void;
  hasResult: boolean;
}

export const StepTracker: React.FC<StepTrackerProps> = ({
  currentStep,
  activeTab,
  setActiveTab,
  hasResult,
}) => {
  const steps = [
    {
      id: "INPUT",
      label: "주제 입력",
      icon: Edit3,
      isDone: currentStep !== "INPUT",
      isActive: currentStep === "INPUT",
    },
    {
      id: "SELECT_TITLE",
      label: "제목 4가지 선택",
      icon: List,
      isDone: currentStep === "RESULT" || currentStep === "GENERATING",
      isActive: currentStep === "SELECT_TITLE",
    },
    {
      id: "BLOG",
      label: "1. 상위노출 블로그",
      icon: FileText,
      isDone: hasResult,
      isActive: currentStep === "RESULT",
      isTab: hasResult,
      targetId: "section-blog",
    },
    {
      id: "IMAGES",
      label: "2. 사진 프롬프트 (8장)",
      icon: Camera,
      isDone: hasResult,
      isActive: currentStep === "RESULT",
      isTab: hasResult,
      targetId: "section-images",
    },
    {
      id: "YOUTUBE",
      label: "3. 유튜브 대본/스토리보드",
      icon: Video,
      isDone: hasResult,
      isActive: currentStep === "RESULT",
      isTab: hasResult,
      targetId: "section-youtube",
    },
  ];

  return (
    <div id="step-tracker-wrapper" className="w-full bg-slate-900 text-slate-100 py-3.5 px-4 shadow-sm border-b border-slate-800">
      <div id="step-tracker-container" className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div id="step-tracker-steps" className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto py-1 scrollbar-none w-full md:w-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const canClickTab = step.isTab && hasResult;

            return (
              <React.Fragment key={step.id}>
                <button
                  id={`step-item-${step.id}`}
                  disabled={!canClickTab && step.id !== "INPUT"}
                  onClick={() => {
                    if (canClickTab && (step as any).targetId) {
                      document.getElementById((step as any).targetId)?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
                    step.isActive
                      ? "bg-emerald-500 text-white shadow-xs font-semibold ring-2 ring-emerald-400/40"
                      : canClickTab
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                      : step.isDone
                      ? "bg-slate-800/80 text-emerald-400"
                      : "bg-slate-800/40 text-slate-400"
                  }`}
                >
                  <span
                    id={`step-badge-${step.id}`}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.isActive
                        ? "bg-white text-emerald-700"
                        : step.isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {step.isDone ? <Check className="w-3 h-3" /> : idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.label}</span>
                </button>

                {idx < steps.length - 1 && (
                  <span id={`step-divider-${idx}`} className="text-slate-600 hidden sm:inline">
                    ➔
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {currentStep === "GENERATING" && (
          <div id="status-generating" className="flex items-center gap-2 text-emerald-400 font-medium text-xs bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI 가 블로그, 미드저니 프롬프트, 유튜브 대본을 통합 작성 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};

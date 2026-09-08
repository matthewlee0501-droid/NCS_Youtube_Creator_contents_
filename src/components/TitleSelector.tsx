import React from "react";
import { TitleOption } from "../types";
import { Sparkles, ArrowRight, Tag, Users, Compass, RefreshCw, Clock, HandMetal } from "lucide-react";

interface TitleSelectorProps {
  topic: string;
  titles: TitleOption[];
  onSelectTitle: (titleOption: TitleOption) => void;
  onReGenerateTitles: () => void;
  isLoading: boolean;
  generationMode: "auto_delay" | "manual";
  onToggleGenerationMode: (mode: "auto_delay" | "manual") => void;
}

export const TitleSelector: React.FC<TitleSelectorProps> = ({
  topic,
  titles,
  onSelectTitle,
  onReGenerateTitles,
  isLoading,
  generationMode,
  onToggleGenerationMode,
}) => {
  return (
    <div id="title-selector-wrapper" className="w-full max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div id="title-selector-header" className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SEO 최적화 모델 가동</span>
          </div>
          <h2 id="title-selector-heading" className="text-xl sm:text-2xl font-bold text-slate-900">
            마음에 드는 제목을 선택해 주세요 (4가지 기획)
          </h2>
          <p id="title-selector-topic-hint" className="text-xs sm:text-sm text-slate-600 mt-1">
            입력된 주제: <span className="font-semibold text-slate-900">"{topic}"</span>
          </p>
        </div>

        <button
          id="regenerate-titles-btn"
          onClick={onReGenerateTitles}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>제목 다시 추천받기</span>
        </button>
      </div>

      {/* Sequential Delay Mode Toggle Banner (Addresses User's API Quota / Rate-limit Theory) */}
      <div id="sequential-mode-panel" className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
              API 한도(429) 보호 장치
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">
              생성 파이프라인 처리 방식
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {generationMode === "auto_delay"
              ? "⚡ 블로그 작성 완료 후 3초 간격을 두고 사진 프롬프트 및 유튜브 대본을 순차 생성합니다 (동시 요청 스파이크 방지)."
              : "✋ 블로그 글을 먼저 작성하여 화면에 표시하며, 사진 프롬프트와 유튜브 대본은 버튼을 눌러 개별 생성합니다."}
          </p>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onToggleGenerationMode("auto_delay")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              generationMode === "auto_delay"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3초 쿨다운 순차 (권장)</span>
          </button>
          <button
            onClick={() => onToggleGenerationMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              generationMode === "manual"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>단계별 수동 확인</span>
          </button>
        </div>
      </div>

      {/* 4 Title Option Cards */}
      <div id="title-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {titles.map((option, index) => (
          <div
            key={option.id || index}
            id={`title-card-${index}`}
            className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden relative"
          >
            {/* Badge Banner */}
            <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50 group-hover:bg-emerald-50/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  0{index + 1}
                </span>
                <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 rounded-full border border-emerald-200">
                  {option.angle}
                </span>
              </div>
              <h3 id={`title-text-${index}`} className="text-base font-bold text-slate-900 group-hover:text-emerald-700 leading-snug transition-colors">
                {option.title}
              </h3>
              {option.subTitle && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {option.subTitle}
                </p>
              )}
            </div>

            {/* Keyword Details */}
            <div className="p-5 space-y-3.5 text-xs text-slate-600 flex-1">
              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>메인 타겟 키워드</span>
                </div>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-md border border-emerald-200/80">
                  {option.mainKeyword}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                  <Compass className="w-3.5 h-3.5 text-slate-500" />
                  <span>서브 키워드</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {option.subKeywords.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] border border-slate-200"
                    >
                      #{sub}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>타겟 독자층</span>
                </div>
                <p className="text-slate-600 leading-tight">{option.targetAudience}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 pt-0">
              <button
                id={`select-title-btn-${index}`}
                disabled={isLoading}
                onClick={() => onSelectTitle(option)}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group-hover:shadow-emerald-500/20 cursor-pointer"
              >
                <span>이 제목으로 작업 시작</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

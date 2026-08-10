import React, { useState } from "react";
import { Sparkles, ArrowRight, Lightbulb, CheckCircle2, Globe, Search } from "lucide-react";

interface TopicInputProps {
  onSubmitTopic: (topic: string) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  "2026년 봄 최신 건강한 단기 다이어트 식단과 운동 가이드",
  "직장인 업무 시간을 3배 단축해주는 챗GPT 및 AI 툴 활용 노하우",
  "2026년 제주도 서귀포 오션뷰 감성 숙소 직접 가본 후기 및 추천",
  "사회초년생을 위한 2026년 청년 도약계획 소액 재테크 예적금 비교",
  "직장인 주말 자격증 취득 및 자기계발 습관 만드는 법",
];

export const TopicInput: React.FC<TopicInputProps> = ({
  onSubmitTopic,
  isLoading,
}) => {
  const [inputTopic, setInputTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTopic.trim() || isLoading) return;
    onSubmitTopic(inputTopic.trim());
  };

  return (
    <div id="topic-input-card" className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 transition-all">
      {/* Header Banner */}
      <div id="topic-input-header" className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>네이버 블로그 상위노출 & 콘텐츠 통합 자동화</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
            <Globe className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>실시간 구글 웹 검색 (Google Search Grounding) 적용</span>
          </div>
        </div>
        <h2 id="topic-input-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          작성하고 싶은 주제나 아이디어를 입력해 주세요
        </h2>
        <p id="topic-input-subtitle" className="mt-2 text-sm text-slate-600 leading-relaxed">
          주제를 입력하시면 AI가 구글 실시간 웹 검색으로 최신 정보/뉴스/트렌드를 수집하여 네이버 상위노출용 <strong className="text-emerald-700 font-semibold">4가지 제목 옵션</strong>을 제안합니다. 제목을 선택하면 블로그 글, 미드저니 실사 프롬프트, 유튜브 스크립트가 완성됩니다.
        </p>
      </div>

      {/* Input Form */}
      <form id="topic-input-form" onSubmit={handleSubmit} className="space-y-5">
        <div id="topic-textarea-wrapper" className="relative">
          <textarea
            id="topic-input-textarea"
            value={inputTopic}
            onChange={(e) => setInputTopic(e.target.value)}
            placeholder="예: 2026년 직장인을 위한 주말 건강 다이어트 식단 가이드, 스마트스토어 시작하는 방법 등..."
            rows={4}
            disabled={isLoading}
            className="w-full p-4 text-sm text-slate-900 bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          <div id="topic-char-count" className="absolute bottom-3 right-3 text-xs text-slate-400">
            {inputTopic.length} 자
          </div>
        </div>

        {/* Example Presets */}
        <div id="presets-container" className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>추천 주제 예시 (클릭하여 입력)</span>
          </div>
          <div id="presets-list" className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((preset, index) => (
              <button
                key={index}
                type="button"
                id={`preset-btn-${index}`}
                onClick={() => setInputTopic(preset)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div id="topic-submit-container" className="pt-2">
          <button
            type="submit"
            id="generate-titles-btn"
            disabled={!inputTopic.trim() || isLoading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
              !inputTopic.trim() || isLoading
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-500/20 cursor-pointer"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>네이버 상위노출 제목 3가지 분석 및 생성 중...</span>
              </>
            ) : (
              <>
                <span>블로그 주제 및 제목 3가지 옵션 보기</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feature Highlights Footer */}
      <div id="topic-features-grid" className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold block">1. 네이버 SEO 알고리즘</strong>
            메인/서브 키워드 5~6회 자동 분배 &amp; 2026 수치 데이터 반영
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold block">2. 미드저니 실사 프롬프트</strong>
            글 장면에 꼭 맞는 고화질 한국어 장면 묘사 및 영문 AI 프롬프트
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold block">3. 유튜브 대본 및 B-roll</strong>
            유튜브 영상 대본, 타임스탬프, B-roll 장면 묘사 및 설명글
          </div>
        </div>
      </div>
    </div>
  );
};

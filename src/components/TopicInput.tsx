import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Globe,
  BookOpen,
  HeartHandshake,
  Scale,
  HelpCircle,
  Clock,
  HandMetal,
  Edit3,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { TitleOption } from "../types";

export interface StyleOptionDef {
  id: string;
  name: string;
  badge: string;
  angle: string;
  description: string;
  targetAudience: string;
  titleFormat: (t: string) => string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const CONTENT_STYLES: StyleOptionDef[] = [
  {
    id: "guide",
    name: "정보제공 & 종합 가이드형",
    badge: "추천 가이드",
    angle: "정보제공 종합가이드",
    description: "2026 최신 법규/통계 데이터 반영, 체계적인 정보와 실전 꿀팁 정리",
    targetAudience: "신뢰할 수 있는 최신 정보와 가이드라인을 찾는 독자",
    titleFormat: (t) => `2026 ${t} 완벽 정리 및 핵심 가이드`,
    icon: BookOpen,
    accentColor: "emerald",
  },
  {
    id: "review",
    name: "실전 경험 & 솔직 후기형",
    badge: "내돈내산 느낌",
    angle: "실전경험 솔직후기",
    description: "직접 겪어본 생생한 체험담, 숨겨진 꿀팁과 솔직한 장단점 분석",
    targetAudience: "실제 사용자 후기와 체감 효과를 알고 싶은 독자",
    titleFormat: (t) => `${t} 직접 경험해본 솔직 후기와 꿀팁 총정리`,
    icon: HeartHandshake,
    accentColor: "indigo",
  },
  {
    id: "compare",
    name: "문제 해결 & 비교 분석형",
    badge: "비교 분석",
    angle: "문제해결 비교분석",
    description: "장단점 비교, 비용 대비 효용 분석 및 실패 없는 합리적 선택 기준",
    targetAudience: "어떤 선택이 가장 합리적인지 꼼꼼히 비교 중인 독자",
    titleFormat: (t) => `${t} 장단점 비교 분석 및 후회 없는 선택 기준`,
    icon: Scale,
    accentColor: "amber",
  },
  {
    id: "qna",
    name: "Q&A & 팩트체크 요약형",
    badge: "팩트체크",
    angle: "Q&A 핵심요약",
    description: "가장 자주 묻는 핵심 질문 팩트체크, 오해와 진실 및 3분 핵심 요약",
    targetAudience: "핵심만 빠르고 명쾌하게 확인하고 싶은 독자",
    titleFormat: (t) => `${t} 궁금증 해결! 자주 묻는 질문과 팩트체크`,
    icon: HelpCircle,
    accentColor: "sky",
  },
];

const PRESET_TOPICS = [
  "2026년 봄 최신 건강한 단기 다이어트 식단과 운동 가이드",
  "직장인 업무 시간을 3배 단축해주는 챗GPT 및 AI 툴 활용 노하우",
  "2026년 제주도 서귀포 오션뷰 감성 숙소 직접 가본 후기 및 추천",
  "사회초년생을 위한 2026년 청년 도약계획 소액 재테크 예적금 비교",
  "직장인 주말 자격증 취득 및 자기계발 습관 만드는 법",
];

interface TopicInputProps {
  onStartCreation: (params: {
    topic: string;
    titleOption: TitleOption;
    generationMode: "auto_delay" | "manual";
  }) => void;
  isLoading: boolean;
  initialTopic?: string;
  generationMode: "auto_delay" | "manual";
  onToggleGenerationMode: (mode: "auto_delay" | "manual") => void;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  onStartCreation,
  isLoading,
  initialTopic = "",
  generationMode,
  onToggleGenerationMode,
}) => {
  const [inputTopic, setInputTopic] = useState(initialTopic);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("guide");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  const activeStyle = useMemo(
    () => CONTENT_STYLES.find((s) => s.id === selectedStyleId) || CONTENT_STYLES[0],
    [selectedStyleId]
  );

  // Extract primary and sub-keywords client-side
  const extractedKeywords = useMemo(() => {
    const raw = inputTopic.trim();
    if (!raw) {
      return {
        main: "핵심키워드",
        subs: ["최신트렌드", "2026정보", "추천가이드"],
      };
    }
    // Clean and pick significant words
    const words = raw
      .replace(/[^\w\s가-힣]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !["위한", "있는", "하는", "대한", "관한", "에서"].includes(w));

    const main = words[0] || raw.slice(0, 10);
    const subs = words.slice(1, 4);
    if (subs.length < 2) {
      subs.push("2026트렌드", "핵심정리");
    }
    return { main, subs: subs.slice(0, 3) };
  }, [inputTopic]);

  // Update proposed title whenever topic or style changes (if not custom edited)
  useEffect(() => {
    if (!isEditingTitle) {
      const topicText = inputTopic.trim() || "입력한 주제";
      setCustomTitle(activeStyle.titleFormat(topicText));
    }
  }, [inputTopic, activeStyle, isEditingTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopic = inputTopic.trim();
    if (!finalTopic || isLoading) return;

    const finalTitle = customTitle.trim() || activeStyle.titleFormat(finalTopic);

    const titleOption: TitleOption = {
      id: Date.now(),
      title: finalTitle,
      subTitle: `${activeStyle.name} 스타일로 작성되는 네이버 상위노출 최적화 포스팅`,
      mainKeyword: extractedKeywords.main,
      subKeywords: extractedKeywords.subs,
      targetAudience: activeStyle.targetAudience,
      angle: activeStyle.angle,
    };

    onStartCreation({
      topic: finalTopic,
      titleOption,
      generationMode,
    });
  };

  return (
    <div id="topic-input-card" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>원스톱 고품질 블로그 &amp; 멀티미디어 생성기</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
            <Globe className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>본문 작성 시 2026 구글 실시간 검색 1회 집중 수행</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>사전 API 호출 0회 (429 할당량 100% 보호)</span>
          </div>
        </div>

        <h2 id="topic-input-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          주제를 입력하고 원하는 글 스타일을 선택하세요
        </h2>
        <p id="topic-input-subtitle" className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
          주제와 스타일을 선택하면 중복 API 호출 없이 바로 <strong className="text-emerald-700 font-semibold">1) 네이버 상위노출 블로그 본문 (실시간 웹검색 반영)</strong> ➡️ <strong className="text-emerald-700 font-semibold">2) 미드저니 프롬프트 8장</strong> ➡️ <strong className="text-emerald-700 font-semibold">3) 유튜브 대본 &amp; 스토리보드</strong>를 안정적으로 제작합니다.
        </p>

        {/* Input Form */}
        <form id="topic-input-form" onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Topic Input Textarea */}
          <div className="space-y-2">
            <label htmlFor="topic-input-textarea" className="block text-xs font-bold text-slate-700">
              1. 글 주제 또는 핵심 메모 입력
            </label>
            <div id="topic-textarea-wrapper" className="relative">
              <textarea
                id="topic-input-textarea"
                value={inputTopic}
                onChange={(e) => {
                  setInputTopic(e.target.value);
                  setIsEditingTitle(false);
                }}
                placeholder="예: 2026년 직장인을 위한 주말 건강 다이어트 식단 가이드, 스마트스토어 시작하는 방법 등..."
                rows={3}
                disabled={isLoading}
                className="w-full p-4 text-sm text-slate-900 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium leading-relaxed"
              />
              <div id="topic-char-count" className="absolute bottom-3 right-3 text-xs text-slate-400">
                {inputTopic.length} 자
              </div>
            </div>

            {/* Presets */}
            <div id="presets-container" className="pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>추천 주제 예시 (클릭 시 자동 입력)</span>
              </div>
              <div id="presets-list" className="flex flex-wrap gap-2">
                {PRESET_TOPICS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    id={`preset-btn-${index}`}
                    onClick={() => {
                      setInputTopic(preset);
                      setIsEditingTitle(false);
                    }}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Style Selector Cards */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              2. 작성할 글의 스타일(기획 앵글) 선택
            </label>
            <div id="style-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {CONTENT_STYLES.map((style, idx) => {
                const isSelected = selectedStyleId === style.id;
                const IconComponent = style.icon;

                return (
                  <button
                    key={style.id}
                    type="button"
                    id={`style-card-${style.id}`}
                    onClick={() => {
                      setSelectedStyleId(style.id);
                      setIsEditingTitle(false);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-emerald-200/80 text-emerald-900" : "bg-slate-100 text-slate-600"
                        }`}>
                          0{idx + 1}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {style.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {style.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">타겟 독자</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                        {style.targetAudience.split(" ")[0]} 독자
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Keyword Preview Box */}
          <div id="title-preview-box" className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                  SEO 제목 프리뷰
                </span>
                <span className="text-xs text-slate-400">선택한 스타일에 맞춰 자동 조합되었습니다</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTitle(!isEditingTitle)}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingTitle ? "자동 추천 제목으로 복원" : "직접 제목 수정하기"}</span>
              </button>
            </div>

            <div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-emerald-500 text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="원하시는 블로그 제목을 직접 입력해 주세요"
                />
              ) : (
                <h3 className="text-base sm:text-lg font-extrabold text-slate-100 leading-snug">
                  {customTitle || "주제를 입력하시면 최적화된 제목이 표시됩니다."}
                </h3>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>자동 추출 키워드:</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                메인: #{extractedKeywords.main}
              </span>
              {extractedKeywords.subs.map((sub, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                  #{sub}
                </span>
              ))}
            </div>
          </div>

          {/* Sequential Delay Mode Toggle Banner */}
          <div id="generation-mode-selector" className="bg-slate-100/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  생성 파이프라인 처리 방식
                </span>
                <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                  API 보호
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {generationMode === "auto_delay"
                  ? "블로그 본문 작성 완료 후 3초 간격을 두고 사진 프롬프트 및 유튜브 대본을 순차 생성합니다."
                  : "블로그 본문만 먼저 작성하며, 사진 프롬프트와 유튜브 대본은 확인 후 버튼을 눌러 개별 생성합니다."}
              </p>
            </div>

            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => onToggleGenerationMode("auto_delay")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  generationMode === "auto_delay"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>3초 쿨다운 순차 (권장)</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleGenerationMode("manual")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  generationMode === "manual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HandMetal className="w-3.5 h-3.5" />
                <span>단계별 수동 확인</span>
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <div id="topic-submit-container" className="pt-2">
            <button
              type="submit"
              id="start-creation-btn"
              disabled={!inputTopic.trim() || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base text-white flex items-center justify-center gap-2.5 transition-all shadow-md ${
                !inputTopic.trim() || isLoading
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-500/25 cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>실시간 구글 웹 검색 및 블로그 본문 작성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>선택한 스타일로 콘텐츠 생성 시작하기</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Highlights */}
        <div id="topic-features-grid" className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-semibold block">1. 상위노출 블로그 본문</strong>
              2026 실시간 웹 검색 기반 통계 &amp; 키워드 5~6회 자동 배치
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-semibold block">2. 미드저니 프롬프트 8장</strong>
              1:1 모던 한국 감성 실사 사진 묘사 및 미드저니 영문 프롬프트
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-semibold block">3. 유튜브 대본 &amp; 스토리보드</strong>
              16~20자 나레이션 대사(마침표/쉼표 제거)와 1:1 B-roll 장면 매칭
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

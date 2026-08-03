import React, { useState, useEffect } from "react";
import {
  TitleOption,
  GeneratedContentResponse,
  ProjectHistoryItem,
} from "./types";
import { Header } from "./components/Header";
import { StepTracker, WorkflowStep } from "./components/StepTracker";
import { TopicInput } from "./components/TopicInput";
import { TitleSelector } from "./components/TitleSelector";
import { BlogPostDisplay } from "./components/BlogPostDisplay";
import { ImagePromptsDisplay } from "./components/ImagePromptsDisplay";
import { YoutubeDisplay } from "./components/YoutubeDisplay";
import { HistoryDrawer } from "./components/HistoryDrawer";
import {
  FileText,
  Camera,
  Video,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function App() {
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("INPUT");
  const [activeResultTab, setActiveResultTab] = useState<
    "BLOG" | "IMAGES" | "YOUTUBE"
  >("BLOG");

  const [topic, setTopic] = useState("");
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [selectedTitleOption, setSelectedTitleOption] =
    useState<TitleOption | null>(null);

  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [historyList, setHistoryList] = useState<ProjectHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("naver_seo_history");
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (
    topicText: string,
    titleText: string,
    content: GeneratedContentResponse
  ) => {
    const newItem: ProjectHistoryItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      topic: topicText,
      selectedTitle: titleText,
      content,
    };
    const updated = [newItem, ...historyList].slice(0, 20); // Keep last 20
    setHistoryList(updated);
    try {
      localStorage.setItem("naver_seo_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  const handleClearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem("naver_seo_history");
  };

  // Step 1: Submit Topic to get 3 Title Options
  const handleFetchTitles = async (inputTopic: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTopic(inputTopic);

    try {
      const res = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: inputTopic }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "제목 옵션 생성에 실패했습니다.");
      }

      const data = await res.json();
      if (!data.titles || !Array.isArray(data.titles) || data.titles.length === 0) {
        throw new Error("제목 추천 결과를 불러오지 못했습니다.");
      }

      setTitleOptions(data.titles);
      setWorkflowStep("SELECT_TITLE");
    } catch (err: any) {
      setErrorMessage(err.message || "제목 추천 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: User selects 1 Title -> Generate sequential package (Blog -> Image Prompts -> Youtube)
  const handleSelectTitle = async (chosenOption: TitleOption) => {
    setSelectedTitleOption(chosenOption);
    setWorkflowStep("GENERATING");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption: chosenOption,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "콘텐츠 생성에 실패했습니다.");
      }

      const contentData: GeneratedContentResponse = await res.json();
      setGeneratedContent(contentData);
      setWorkflowStep("RESULT");
      setActiveResultTab("BLOG");

      // Save to history
      saveToHistory(topic, chosenOption.title, contentData);
    } catch (err: any) {
      setErrorMessage(
        err.message || "블로그 및 멀티미디어 콘텐츠 생성 중 오류가 발생했습니다."
      );
      setWorkflowStep("SELECT_TITLE"); // Revert to selection step on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWorkflowStep("INPUT");
    setTopic("");
    setTitleOptions([]);
    setSelectedTitleOption(null);
    setGeneratedContent(null);
    setErrorMessage(null);
    setActiveResultTab("BLOG");
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
        historyCount={historyList.length}
      />

      {/* Progress Workflow Tracker */}
      <StepTracker
        currentStep={workflowStep}
        activeTab={activeResultTab}
        setActiveTab={setActiveResultTab}
        hasResult={!!generatedContent}
      />

      {/* Error Alert Message */}
      {errorMessage && (
        <div id="error-alert" className="max-w-5xl mx-auto my-4 px-4 w-full">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block">오류가 발생했습니다</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Topic Input */}
        {workflowStep === "INPUT" && (
          <TopicInput
            onSubmitTopic={handleFetchTitles}
            isLoading={isLoading}
          />
        )}

        {/* Step 2: Select 1 of 3 Titles */}
        {workflowStep === "SELECT_TITLE" && (
          <div className="space-y-4">
            <button
              onClick={() => setWorkflowStep("INPUT")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>주제 수정하러 돌아가기</span>
            </button>

            <TitleSelector
              topic={topic}
              titles={titleOptions}
              onSelectTitle={handleSelectTitle}
              onReGenerateTitles={() => handleFetchTitles(topic)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 3: Loading / Generating Phase */}
        {workflowStep === "GENERATING" && (
          <div id="loading-state-card" className="w-full max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce shadow-md shadow-emerald-500/10">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                선택하신 제목으로 콘텐츠를 작성하고 있습니다
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                선택된 제목: <span className="text-emerald-700 font-bold">"{selectedTitleOption?.title}"</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                <span>순차적 자동 작업 수행 중...</span>
              </div>
              <ul className="space-y-2 pl-2 text-slate-600 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. 네이버 상위노출 SEO 블로그 글 작성 (키워드 5~6회배치 &amp; 수치)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. 블로그에 들어갈 장면 묘사 및 미드저니 실사 프롬프트 작성</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. 유튜브 스크립트, 설명글, B-roll 시각 장면 묘사 완성</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Full Single-Page Results View */}
        {workflowStep === "RESULT" && generatedContent && (
          <div id="results-container" className="space-y-12">
            {/* Sticky Navigation Quick Jump Bar */}
            <div id="result-sticky-nav" className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline px-2">한눈에보기:</span>
                <button
                  id="jump-to-blog"
                  onClick={() => {
                    document.getElementById("section-blog")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. 블로그 글</span>
                </button>

                <button
                  id="jump-to-images"
                  onClick={() => {
                    document.getElementById("section-images")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>2. 사진 프롬프트 (8장)</span>
                </button>

                <button
                  id="jump-to-youtube"
                  onClick={() => {
                    document.getElementById("section-youtube")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>3. 유튜브 대본 &amp; 스토리보드</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkflowStep("SELECT_TITLE")}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
                >
                  제목 다시 선택
                </button>
              </div>
            </div>

            {/* Section 1: Blog Post */}
            <section id="section-blog" className="scroll-mt-24 space-y-4">
              <div className="border-b-2 border-emerald-500/30 pb-2 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <span>네이버 상위노출 최적화 블로그 원고</span>
                </h2>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  SEO 키워드 자동 가공 완료
                </span>
              </div>
              <BlogPostDisplay data={generatedContent.blogPost} />
            </section>

            {/* Section 2: Midjourney Image Prompts (8 Prompts) */}
            <section id="section-images" className="scroll-mt-24 space-y-4 pt-4 border-t border-slate-200">
              <div className="border-b-2 border-purple-500/30 pb-2 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  <span>블로그 실사 사진 장면 묘사 &amp; 미드저니 프롬프트 (8장 세트)</span>
                </h2>
                <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  총 8개 프롬프트
                </span>
              </div>
              <ImagePromptsDisplay prompts={generatedContent.imagePrompts} />
            </section>

            {/* Section 3: YouTube Script & Storyboard */}
            <section id="section-youtube" className="scroll-mt-24 space-y-4 pt-4 border-t border-slate-200">
              <div className="border-b-2 border-red-500/30 pb-2 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-red-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <span>유튜브 대본 &amp; 16~20자 1:1 장면 스토리보드 패키지</span>
                </h2>
                <span className="text-xs text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  대사/장면 분리 지원
                </span>
              </div>
              <YoutubeDisplay data={generatedContent.youtubePackage} />
            </section>
          </div>
        )}
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onSelectHistoryItem={(item) => {
          setTopic(item.topic);
          setGeneratedContent(item.content);
          setWorkflowStep("RESULT");
          setActiveResultTab("BLOG");
        }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

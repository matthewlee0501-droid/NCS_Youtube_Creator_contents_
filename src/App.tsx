import React, { useState, useEffect, useRef } from "react";
import {
  TitleOption,
  GeneratedContentResponse,
  ProjectHistoryItem,
  BlogPostData,
  ImagePromptItem,
  YoutubePackageData,
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
  RefreshCw,
  Loader2,
  Bot,
  Clock,
  ArrowRight,
  Play,
} from "lucide-react";

interface SectionStatus {
  blog: "idle" | "loading" | "done" | "error";
  images: "idle" | "loading" | "done" | "error";
  youtube: "idle" | "loading" | "done" | "error";
}

export default function App() {
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("INPUT");
  const [activeResultTab, setActiveResultTab] = useState<
    "BLOG" | "IMAGES" | "YOUTUBE"
  >("BLOG");

  // Selected AI Engine Model (3.8 Flash, 3.7 Flash, 3.1 Flash Lite)
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");

  const [topic, setTopic] = useState("");
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [selectedTitleOption, setSelectedTitleOption] =
    useState<TitleOption | null>(null);

  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modular Generation Section Status & Error Trackers
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>({
    blog: "idle",
    images: "idle",
    youtube: "idle",
  });
  const [sectionErrors, setSectionErrors] = useState<{
    blog: string | null;
    images: string | null;
    youtube: string | null;
  }>({
    blog: null,
    images: null,
    youtube: null,
  });

  // Sequential Processing & 3s Cooldown Mode (Protects against 429 Rate Limits)
  const [generationMode, setGenerationMode] = useState<"auto_delay" | "manual">("auto_delay");
  const [cooldown, setCooldown] = useState<{
    active: boolean;
    nextTask: "images" | "youtube" | null;
    secondsLeft: number;
  }>({
    active: false,
    nextTask: null,
    secondsLeft: 0,
  });
  const skipCooldownRef = useRef<(() => void) | null>(null);

  // Helper to wait with countdown and user skip option
  const waitCooldown = (seconds: number, nextTask: "images" | "youtube"): Promise<boolean> => {
    return new Promise((resolve) => {
      setCooldown({ active: true, nextTask, secondsLeft: seconds });
      let current = seconds;

      const interval = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(interval);
          setCooldown({ active: false, nextTask: null, secondsLeft: 0 });
          skipCooldownRef.current = null;
          resolve(true);
        } else {
          setCooldown((prev) => ({ ...prev, secondsLeft: current }));
        }
      }, 1000);

      skipCooldownRef.current = () => {
        clearInterval(interval);
        setCooldown({ active: false, nextTask: null, secondsLeft: 0 });
        skipCooldownRef.current = null;
        resolve(true);
      };
    });
  };

  const handleSkipCooldown = () => {
    if (skipCooldownRef.current) {
      skipCooldownRef.current();
    }
  };

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

  // Step 1: Submit Topic to get 4 Title Options
  const handleFetchTitles = async (inputTopic: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTopic(inputTopic);

    try {
      const res = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: inputTopic, model: selectedModel }),
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

  // Modular Pipeline: Generate 1) Blog -> 2) Images -> 3) YouTube sequentially
  const runModularGeneration = async (
    targetTopic: string,
    targetTitleOption: TitleOption,
    targetModel: string
  ) => {
    setWorkflowStep("RESULT");
    setErrorMessage(null);

    // Reset status
    setSectionStatus({
      blog: "loading",
      images: "idle",
      youtube: "idle",
    });
    setSectionErrors({
      blog: null,
      images: null,
      youtube: null,
    });

    let currentBlogPost: BlogPostData | null = null;
    let currentImagePrompts: ImagePromptItem[] | null = null;
    let currentYoutubePackage: YoutubePackageData | null = null;

    setGeneratedContent({
      selectedTitle: targetTitleOption.title,
      blogPost: null,
      imagePrompts: null,
      youtubePackage: null,
    });

    // --- Step 1: Blog Post Generation ---
    try {
      setSectionStatus((prev) => ({ ...prev, blog: "loading" }));
      const blogRes = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          selectedTitleOption: targetTitleOption,
          model: targetModel,
        }),
      });

      if (!blogRes.ok) {
        const err = await blogRes.json();
        throw new Error(err.error || "블로그 글 작성 실패");
      }

      const blogData = await blogRes.json();
      currentBlogPost = blogData.blogPost;
      setGeneratedContent((prev) =>
        prev
          ? { ...prev, blogPost: currentBlogPost }
          : {
              selectedTitle: targetTitleOption.title,
              blogPost: currentBlogPost,
              imagePrompts: null,
              youtubePackage: null,
            }
      );
      setSectionStatus((prev) => ({ ...prev, blog: "done" }));
    } catch (err: any) {
      console.error("Blog generation error:", err);
      setSectionStatus((prev) => ({ ...prev, blog: "error" }));
      setSectionErrors((prev) => ({ ...prev, blog: err.message }));
      // Do not continue automatically if blog post failed
      return;
    }

    // If manual mode, user will review blog post and trigger images/youtube when ready
    if (generationMode === "manual") {
      return;
    }

    // --- Cooldown 1: 3 seconds delay before Images to prevent rate limit (429) ---
    await waitCooldown(3, "images");

    // --- Step 2: Image Prompts (8장) Generation ---
    try {
      setSectionStatus((prev) => ({ ...prev, images: "loading" }));
      const imgRes = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          selectedTitleOption: targetTitleOption,
          blogPost: currentBlogPost,
          model: targetModel,
        }),
      });

      if (!imgRes.ok) {
        const err = await imgRes.json();
        throw new Error(err.error || "사진 프롬프트 생성 실패");
      }

      const imgData = await imgRes.json();
      currentImagePrompts = imgData.imagePrompts;
      setGeneratedContent((prev) =>
        prev
          ? { ...prev, imagePrompts: currentImagePrompts }
          : {
              selectedTitle: targetTitleOption.title,
              blogPost: currentBlogPost,
              imagePrompts: currentImagePrompts,
              youtubePackage: null,
            }
      );
      setSectionStatus((prev) => ({ ...prev, images: "done" }));
    } catch (err: any) {
      console.error("Image generation error:", err);
      setSectionStatus((prev) => ({ ...prev, images: "error" }));
      setSectionErrors((prev) => ({ ...prev, images: err.message }));
      return;
    }

    // --- Cooldown 2: 3 seconds delay before YouTube to prevent rate limit (429) ---
    await waitCooldown(3, "youtube");

    // --- Step 3: YouTube Script & Storyboard Generation ---
    try {
      setSectionStatus((prev) => ({ ...prev, youtube: "loading" }));
      const ytRes = await fetch("/api/generate-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          selectedTitleOption: targetTitleOption,
          blogPost: currentBlogPost,
          model: targetModel,
        }),
      });

      if (!ytRes.ok) {
        const err = await ytRes.json();
        throw new Error(err.error || "유튜브 대본 생성 실패");
      }

      const ytData = await ytRes.json();
      currentYoutubePackage = ytData.youtubePackage;
      setGeneratedContent((prev) => {
        const fullContent: GeneratedContentResponse = prev
          ? { ...prev, youtubePackage: currentYoutubePackage }
          : {
              selectedTitle: targetTitleOption.title,
              blogPost: currentBlogPost,
              imagePrompts: currentImagePrompts,
              youtubePackage: currentYoutubePackage,
            };

        // Save complete package to history
        saveToHistory(targetTopic, targetTitleOption.title, fullContent);
        return fullContent;
      });
      setSectionStatus((prev) => ({ ...prev, youtube: "done" }));
    } catch (err: any) {
      console.error("YouTube generation error:", err);
      setSectionStatus((prev) => ({ ...prev, youtube: "error" }));
      setSectionErrors((prev) => ({ ...prev, youtube: err.message }));
    }
  };

  // Step 2: User selects 1 Title -> Launch modular individual generation
  const handleSelectTitle = (chosenOption: TitleOption) => {
    setSelectedTitleOption(chosenOption);
    runModularGeneration(topic, chosenOption, selectedModel);
  };

  // Standalone Single Section Generation (for Manual mode or individual triggering)
  const handleGenerateImagesOnly = async () => {
    if (!selectedTitleOption || !generatedContent?.blogPost) return;
    setSectionStatus((prev) => ({ ...prev, images: "loading" }));
    setSectionErrors((prev) => ({ ...prev, images: null }));

    try {
      const imgRes = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption,
          blogPost: generatedContent.blogPost,
          model: selectedModel,
        }),
      });

      if (!imgRes.ok) {
        const err = await imgRes.json();
        throw new Error(err.error || "사진 프롬프트 생성 실패");
      }

      const imgData = await imgRes.json();
      setGeneratedContent((prev) =>
        prev ? { ...prev, imagePrompts: imgData.imagePrompts } : null
      );
      setSectionStatus((prev) => ({ ...prev, images: "done" }));
    } catch (err: any) {
      setSectionStatus((prev) => ({ ...prev, images: "error" }));
      setSectionErrors((prev) => ({ ...prev, images: err.message }));
    }
  };

  const handleGenerateYoutubeOnly = async () => {
    if (!selectedTitleOption || !generatedContent?.blogPost) return;
    setSectionStatus((prev) => ({ ...prev, youtube: "loading" }));
    setSectionErrors((prev) => ({ ...prev, youtube: null }));

    try {
      const ytRes = await fetch("/api/generate-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption,
          blogPost: generatedContent.blogPost,
          model: selectedModel,
        }),
      });

      if (!ytRes.ok) {
        const err = await ytRes.json();
        throw new Error(err.error || "유튜브 대본 생성 실패");
      }

      const ytData = await ytRes.json();
      setGeneratedContent((prev) => {
        const updated = prev ? { ...prev, youtubePackage: ytData.youtubePackage } : null;
        if (updated) {
          saveToHistory(topic, selectedTitleOption.title, updated);
        }
        return updated;
      });
      setSectionStatus((prev) => ({ ...prev, youtube: "done" }));
    } catch (err: any) {
      setSectionStatus((prev) => ({ ...prev, youtube: "error" }));
      setSectionErrors((prev) => ({ ...prev, youtube: err.message }));
    }
  };

  // Individual Section Regenerations
  const handleRegenerateBlog = async () => {
    if (!selectedTitleOption) return;
    setSectionStatus((prev) => ({ ...prev, blog: "loading" }));
    setSectionErrors((prev) => ({ ...prev, blog: null }));

    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "블로그 글 재생성 실패");
      }

      const data = await res.json();
      setGeneratedContent((prev) =>
        prev ? { ...prev, blogPost: data.blogPost } : null
      );
      setSectionStatus((prev) => ({ ...prev, blog: "done" }));
    } catch (err: any) {
      setSectionStatus((prev) => ({ ...prev, blog: "error" }));
      setSectionErrors((prev) => ({ ...prev, blog: err.message }));
    }
  };

  const handleRegenerateImages = async () => {
    if (!selectedTitleOption) return;
    setSectionStatus((prev) => ({ ...prev, images: "loading" }));
    setSectionErrors((prev) => ({ ...prev, images: null }));

    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption,
          blogPost: generatedContent?.blogPost,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "사진 프롬프트 재생성 실패");
      }

      const data = await res.json();
      setGeneratedContent((prev) =>
        prev ? { ...prev, imagePrompts: data.imagePrompts } : null
      );
      setSectionStatus((prev) => ({ ...prev, images: "done" }));
    } catch (err: any) {
      setSectionStatus((prev) => ({ ...prev, images: "error" }));
      setSectionErrors((prev) => ({ ...prev, images: err.message }));
    }
  };

  const handleRegenerateYoutube = async () => {
    if (!selectedTitleOption) return;
    setSectionStatus((prev) => ({ ...prev, youtube: "loading" }));
    setSectionErrors((prev) => ({ ...prev, youtube: null }));

    try {
      const res = await fetch("/api/generate-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          selectedTitleOption,
          blogPost: generatedContent?.blogPost,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "유튜브 대본 재생성 실패");
      }

      const data = await res.json();
      setGeneratedContent((prev) =>
        prev ? { ...prev, youtubePackage: data.youtubePackage } : null
      );
      setSectionStatus((prev) => ({ ...prev, youtube: "done" }));
    } catch (err: any) {
      setSectionStatus((prev) => ({ ...prev, youtube: "error" }));
      setSectionErrors((prev) => ({ ...prev, youtube: err.message }));
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
    setSectionStatus({ blog: "idle", images: "idle", youtube: "idle" });
    setSectionErrors({ blog: null, images: null, youtube: null });
    setCooldown({ active: false, nextTask: null, secondsLeft: 0 });
    if (skipCooldownRef.current) {
      skipCooldownRef.current();
    }
  };

  // Helper label for current model
  const getModelLabel = (modelId: string) => {
    switch (modelId) {
      case "gemini-3.8-flash":
        return "Gemini 3.8 Flash (최신 권장)";
      case "gemini-3.7-flash":
        return "Gemini 3.7 Flash";
      case "gemini-3.1-flash-lite":
        return "Gemini 3.1 Flash Lite (경량/고속)";
      default:
        return modelId;
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar with Model Selector directly left of 새로 쓰기 */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
        historyCount={historyList.length}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Progress Workflow Tracker */}
      <StepTracker
        currentStep={workflowStep}
        activeTab={activeResultTab}
        setActiveTab={setActiveResultTab}
        hasResult={!!generatedContent}
      />

      {/* Top Error Alert Message */}
      {errorMessage && (
        <div id="error-alert" className="max-w-5xl mx-auto my-4 px-4 w-full">
          <div className="bg-amber-50/90 border border-amber-300 text-amber-950 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm shadow-xs flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <strong className="font-bold text-sm text-amber-900 block">
                {errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("사용량 한도")
                  ? "Gemini API 사용량 한도 (429 RESOURCE_EXHAUSTED) 안내"
                  : "요청 처리 중 오류가 발생했습니다"}
              </strong>
              <p className="whitespace-pre-line leading-relaxed text-amber-900/90">
                {errorMessage}
              </p>
              {topic && selectedTitleOption && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => runModularGeneration(topic, selectedTitleOption, selectedModel)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>콘텐츠 생성 다시 시도</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-bold shrink-0 px-2 py-1 rounded-md hover:bg-amber-100/60 transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Topic Input & Style Selection (Zero Preliminary API Calls!) */}
        {workflowStep === "INPUT" && (
          <TopicInput
            onStartCreation={({ topic: newTopic, titleOption, generationMode: newMode }) => {
              setTopic(newTopic);
              setSelectedTitleOption(titleOption);
              setGenerationMode(newMode);
              runModularGeneration(newTopic, titleOption, selectedModel);
            }}
            isLoading={isLoading || sectionStatus.blog === "loading"}
            initialTopic={topic}
            generationMode={generationMode}
            onToggleGenerationMode={setGenerationMode}
          />
        )}

        {/* Step 2: Select 1 of 4 Titles */}
        {workflowStep === "SELECT_TITLE" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWorkflowStep("INPUT")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>주제 수정하러 돌아가기</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                <span>적용 모델: <strong className="text-slate-700">{getModelLabel(selectedModel)}</strong></span>
              </div>
            </div>

            <TitleSelector
              topic={topic}
              titles={titleOptions}
              onSelectTitle={handleSelectTitle}
              onReGenerateTitles={() => handleFetchTitles(topic)}
              isLoading={isLoading}
              generationMode={generationMode}
              onToggleGenerationMode={setGenerationMode}
            />
          </div>
        )}

        {/* Step 3: Modular Single-Page Results View with Progressive Section Loading */}
        {workflowStep === "RESULT" && generatedContent && (
          <div id="results-container" className="space-y-12">
            {/* Sticky Navigation Quick Jump Bar */}
            <div id="result-sticky-nav" className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline px-2">개별 생성 섹션:</span>
                
                {/* Blog Button */}
                <button
                  id="jump-to-blog"
                  onClick={() => {
                    document.getElementById("section-blog")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. 블로그 글</span>
                  {sectionStatus.blog === "loading" && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  {sectionStatus.blog === "done" && <CheckCircle className="w-3 h-3 text-emerald-200 ml-1" />}
                </button>

                {/* Images Button */}
                <button
                  id="jump-to-images"
                  onClick={() => {
                    document.getElementById("section-images")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>2. 사진 프롬프트</span>
                  {sectionStatus.images === "loading" && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  {sectionStatus.images === "done" && <CheckCircle className="w-3 h-3 text-purple-200 ml-1" />}
                </button>

                {/* YouTube Button */}
                <button
                  id="jump-to-youtube"
                  onClick={() => {
                    document.getElementById("section-youtube")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>3. 유튜브 대본</span>
                  {sectionStatus.youtube === "loading" && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  {sectionStatus.youtube === "done" && <CheckCircle className="w-3 h-3 text-red-200 ml-1" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-300 border border-slate-700">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span>{getModelLabel(selectedModel)}</span>
                </div>

                <button
                  onClick={() => setWorkflowStep("INPUT")}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
                >
                  주제 / 스타일 변경
                </button>
              </div>
            </div>

            {/* Selected Topic Title Banner */}
            {selectedTitleOption && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>선택된 프로젝트 기획</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {selectedTitleOption.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    메인키워드: <strong className="text-emerald-700">{selectedTitleOption.mainKeyword}</strong> | 서브키워드: {selectedTitleOption.subKeywords.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 shadow-2xs">
                    타겟: {selectedTitleOption.targetAudience}
                  </span>
                </div>
              </div>
            )}

            {/* API Rate Limit Cooldown Active Alert Banner */}
            {cooldown.active && (
              <div id="cooldown-banner" className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                    {cooldown.secondsLeft}초
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Gemini API 요청 한도(429) 보호를 위해 3초 쿨다운 대기 중</span>
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      {cooldown.nextTask === "images"
                        ? "블로그 작성이 완료되었습니다! 안전한 토큰 할당량 확보 후 [2. 사진 프롬프트 8장] 생성을 자동 시작합니다."
                        : "사진 프롬프트가 완료되었습니다! 안전한 토큰 할당량 확보 후 [3. 유튜브 대본 & 스토리보드] 생성을 자동 시작합니다."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={handleSkipCooldown}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>대기 건너뛰고 지금 바로 진행</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Blog Post (Individual Generation) */}
            <section id="section-blog" className="scroll-mt-24 space-y-4">
              <div className="border-b-2 border-emerald-500/30 pb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <span>네이버 상위노출 최적화 블로그 원고</span>
                </h2>
                <div className="flex items-center gap-2">
                  {sectionStatus.blog === "done" && (
                    <button
                      onClick={handleRegenerateBlog}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="선택된 모델로 블로그 글만 다시 작성합니다"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>블로그 글 개별 다시 생성</span>
                    </button>
                  )}
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    SEO 5~6회 키워드 자동 가공
                  </span>
                </div>
              </div>

              {/* Loading State for Blog */}
              {sectionStatus.blog === "loading" && (
                <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-12 text-center shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      실시간 구글 웹 검색을 반영하여 블로그 글을 작성하고 있습니다...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      2026년 최신 팩트 데이터, 스마트블록 키워드 5~6회 배치 및 Markdown 표 구성을 생성 중입니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Error State for Blog */}
              {sectionStatus.blog === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>블로그 원고 작성 중 오류가 발생했습니다.</span>
                  </div>
                  <p className="text-xs text-red-700">{sectionErrors.blog}</p>
                  <button
                    onClick={handleRegenerateBlog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>블로그 글 다시 시도</span>
                  </button>
                </div>
              )}

              {/* Done State */}
              {generatedContent.blogPost && sectionStatus.blog !== "loading" && (
                <BlogPostDisplay data={generatedContent.blogPost} />
              )}
            </section>

            {/* Section 2: Midjourney Image Prompts (8장 세트, Individual Generation) */}
            <section id="section-images" className="scroll-mt-24 space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b-2 border-purple-500/30 pb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  <span>블로그 실사 사진 장면 묘사 &amp; 미드저니 프롬프트 (8장 세트)</span>
                </h2>
                <div className="flex items-center gap-2">
                  {sectionStatus.images === "done" && (
                    <button
                      onClick={handleRegenerateImages}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="선택된 모델로 사진 프롬프트 8장만 다시 생성합니다"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>사진 프롬프트 개별 다시 생성</span>
                    </button>
                  )}
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    1:1 정방향 고정 · 모던 한국 감성
                  </span>
                </div>
              </div>

              {/* Loading State for Images */}
              {sectionStatus.images === "loading" && (
                <div className="bg-white rounded-2xl border border-purple-200 p-8 sm:p-12 text-center shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      블로그 문맥 맞춤 트렌디 1:1 실사 사진 프롬프트 8장을 생성하고 있습니다...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      세련된 2026 한국인 라이프스타일 구도 및 미드저니 프롬프트를 구성 중입니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting State for Images */}
              {sectionStatus.images === "idle" && !generatedContent.imagePrompts && (
                cooldown.active && cooldown.nextTask === "images" ? (
                  <div className="bg-purple-50/70 border-2 border-dashed border-purple-300 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-purple-900 font-bold text-sm">
                      <Clock className="w-4 h-4 animate-spin text-purple-600" />
                      <span>API 할당량 보호 대기 중: {cooldown.secondsLeft}초 후 자동 생성 시작</span>
                    </div>
                    <p className="text-xs text-purple-700 max-w-md mx-auto">
                      블로그 본문 작성 완료 후 안정적인 API 호출 간격을 확보하고 있습니다. 잠시 후 1:1 정방향 실사 사진 프롬프트 8장이 생성됩니다.
                    </p>
                    <button
                      onClick={handleSkipCooldown}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>대기 건너뛰고 지금 바로 생성</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-purple-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-2xs">
                    <p className="text-slate-600 text-xs font-medium max-w-md mx-auto">
                      {generatedContent.blogPost
                        ? "블로그 본문 문맥과 조화로운 1:1 정방향 실사 사진 프롬프트(8장 세트)를 생성할 수 있습니다."
                        : "1단계 블로그 글이 작성된 후 사진 프롬프트를 생성할 수 있습니다."}
                    </p>
                    <button
                      onClick={handleGenerateImagesOnly}
                      disabled={!generatedContent.blogPost}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>2단계: 실사 사진 프롬프트 8장 지금 생성하기</span>
                    </button>
                  </div>
                )
              )}

              {/* Error State for Images */}
              {sectionStatus.images === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>사진 프롬프트 생성 중 오류가 발생했습니다.</span>
                  </div>
                  <p className="text-xs text-red-700">{sectionErrors.images}</p>
                  <button
                    onClick={handleRegenerateImages}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>사진 프롬프트 다시 시도</span>
                  </button>
                </div>
              )}

              {/* Done State */}
              {generatedContent.imagePrompts && sectionStatus.images !== "loading" && (
                <ImagePromptsDisplay prompts={generatedContent.imagePrompts} />
              )}
            </section>

            {/* Section 3: YouTube Script & Storyboard (Individual Generation) */}
            <section id="section-youtube" className="scroll-mt-24 space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b-2 border-red-500/30 pb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-red-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <span>유튜브 대본 &amp; 16~20자 1:1 장면 스토리보드 패키지</span>
                </h2>
                <div className="flex items-center gap-2">
                  {sectionStatus.youtube === "done" && (
                    <button
                      onClick={handleRegenerateYoutube}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="선택된 모델로 유튜브 대본과 스토리보드만 다시 작성합니다"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>유튜브 대본 개별 다시 생성</span>
                    </button>
                  )}
                  <span className="text-xs text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    16~20자 대사 · 마침표/쉼표 금지 · B-roll 분리
                  </span>
                </div>
              </div>

              {/* Loading State for YouTube */}
              {sectionStatus.youtube === "loading" && (
                <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      16~20자 대사 및 1:1 B-roll 시각 장면 스토리보드를 생성하고 있습니다...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      TTS 음성 합성용 대본(마침표/쉼표 제거)과 씬별 상세 연출 지시문을 구성 중입니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting State for YouTube */}
              {sectionStatus.youtube === "idle" && !generatedContent.youtubePackage && (
                cooldown.active && cooldown.nextTask === "youtube" ? (
                  <div className="bg-red-50/70 border-2 border-dashed border-red-300 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-red-900 font-bold text-sm">
                      <Clock className="w-4 h-4 animate-spin text-red-600" />
                      <span>API 할당량 보호 대기 중: {cooldown.secondsLeft}초 후 자동 생성 시작</span>
                    </div>
                    <p className="text-xs text-red-700 max-w-md mx-auto">
                      연속 API 호출로 인한 429 한도 초과를 방지하기 위해 3초 인터벌 대기 중입니다. 잠시 후 16~20자 나레이션 및 1:1 스토리보드가 생성됩니다.
                    </p>
                    <button
                      onClick={handleSkipCooldown}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>대기 건너뛰고 지금 바로 생성</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-red-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-2xs">
                    <p className="text-slate-600 text-xs font-medium max-w-md mx-auto">
                      {generatedContent.blogPost
                        ? "16~20자 음성 합성용 나레이션(마침표/쉼표 제거)과 1:1 B-roll 장면 스토리보드를 생성할 수 있습니다."
                        : "1단계 블로그 글이 작성된 후 유튜브 대본을 생성할 수 있습니다."}
                    </p>
                    <button
                      onClick={handleGenerateYoutubeOnly}
                      disabled={!generatedContent.blogPost}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>3단계: 유튜브 대본 &amp; 스토리보드 지금 생성하기</span>
                    </button>
                  </div>
                )
              )}

              {/* Error State for YouTube */}
              {sectionStatus.youtube === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>유튜브 대본 생성 중 오류가 발생했습니다.</span>
                  </div>
                  <p className="text-xs text-red-700">{sectionErrors.youtube}</p>
                  <button
                    onClick={handleRegenerateYoutube}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>유튜브 대본 다시 시도</span>
                  </button>
                </div>
              )}

              {/* Done State */}
              {generatedContent.youtubePackage && sectionStatus.youtube !== "loading" && (
                <YoutubeDisplay data={generatedContent.youtubePackage} />
              )}
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
          setSectionStatus({ blog: "done", images: "done", youtube: "done" });
          setSectionErrors({ blog: null, images: null, youtube: null });
          setWorkflowStep("RESULT");
          setActiveResultTab("BLOG");
        }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

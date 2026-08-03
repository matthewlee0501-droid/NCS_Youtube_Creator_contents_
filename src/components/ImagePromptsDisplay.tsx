import React, { useState } from "react";
import { ImagePromptItem } from "../types";
import { Camera, Copy, Check, Sparkles, Image as ImageIcon, Sliders } from "lucide-react";

interface ImagePromptsDisplayProps {
  prompts: ImagePromptItem[];
}

export const ImagePromptsDisplay: React.FC<ImagePromptsDisplayProps> = ({ prompts }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAllEn, setCopiedAllEn] = useState(false);
  const [copiedAllFull, setCopiedAllFull] = useState(false);

  const handleCopyPrompt = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy All En Prompts with Prefix
  const getBatchEnPromptsText = () => {
    let text = `총 ${prompts.length}개의 장면을 각각 한장씩 만들어줘. 한국인, 한국어 배경 환경 위주, 고화질 1:1 정방향 실사 스타일.\n\n`;
    prompts.forEach((item, idx) => {
      text += `[장면 #${idx + 1} - ${item.sectionName}]\n`;
      text += `${item.midjourneyPromptEn}\n\n`;
    });
    return text;
  };

  // Copy All Full Prompts (Ko Scene + En Prompt) with Prefix
  const getBatchFullPromptsText = () => {
    let text = `총 ${prompts.length}개의 장면을 각각 한장씩 만들어줘. 한국인, 한국어 배경 환경 위주, 고화질 1:1 정방향 실사 스타일.\n\n`;
    prompts.forEach((item, idx) => {
      text += `[장면 #${idx + 1} - ${item.sectionName}]\n`;
      text += `• 한글 장면: ${item.sceneDescriptionKo}\n`;
      text += `• 미드저니 프롬프트: ${item.midjourneyPromptEn}\n\n`;
    });
    return text;
  };

  const handleCopyAllEn = () => {
    navigator.clipboard.writeText(getBatchEnPromptsText());
    setCopiedAllEn(true);
    setTimeout(() => setCopiedAllEn(false), 2000);
  };

  const handleCopyAllFull = () => {
    navigator.clipboard.writeText(getBatchFullPromptsText());
    setCopiedAllFull(true);
    setTimeout(() => setCopiedAllFull(false), 2000);
  };

  return (
    <div id="image-prompts-wrapper" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div id="image-prompts-header" className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2 border border-purple-200">
            <Camera className="w-3.5 h-3.5" />
            <span>2단계: 블로그 실사 사진 장면 묘사 &amp; 프롬프트 (총 {prompts.length}장 세트)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            블로그 실사 사진 장면 묘사 &amp; 미드저니 프롬프트
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            2026 트렌디 한국 감성 1:1 정방향 규격. 복사 시 이미지 생성 AI(Flow 등) 입력용 맞춤 문구가 자동으로 붙어 일괄 생성에 편리합니다.
          </p>
        </div>

        {/* Batch Copy Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="copy-all-full-prompts-btn"
            onClick={handleCopyAllFull}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {copiedAllFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAllFull ? "전체 복사 완료!" : "8장 장면+프롬프트 일괄 복사"}</span>
          </button>

          <button
            id="copy-all-en-prompts-btn"
            onClick={handleCopyAllEn}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {copiedAllEn ? <Check className="w-3.5 h-3.5 text-purple-300" /> : <Sparkles className="w-3.5 h-3.5 text-purple-300" />}
            <span>{copiedAllEn ? "영문 일괄 복사 완료!" : "영문 프롬프트만 일괄 복사"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Prompt Cards */}
      <div id="image-prompts-grid" className="space-y-5">
        {prompts.map((item, index) => (
          <div
            key={item.id || index}
            id={`image-prompt-card-${index}`}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:border-purple-300 transition-colors"
          >
            {/* Section Badge & Camera style */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  섹션: {item.sectionName}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-md font-semibold border border-purple-200">
                  비율: 1:1 정방향 (고정)
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200">
                  카메라: {item.cameraStyle}
                </span>
              </div>
            </div>

            {/* Korean Scene Description */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
              <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>장면 감성 글 묘사 (한국어)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {item.sceneDescriptionKo}
              </p>
            </div>

            {/* Midjourney Prompt Box */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 relative group">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>미드저니 실사 프롬프트 (Midjourney Prompt)</span>
                </span>
                <button
                  id={`copy-prompt-btn-${index}`}
                  onClick={() => handleCopyPrompt(item.id || index, item.midjourneyPromptEn)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedId === (item.id || index) ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>프롬프트 복사</span>
                    </>
                  )}
                </button>
              </div>

              <p className="font-mono text-xs text-purple-200 leading-relaxed selection:bg-purple-800 selection:text-white break-words pr-2">
                {item.midjourneyPromptEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

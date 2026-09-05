import React, { useState } from "react";
import { YoutubePackageData } from "../types";
import { Video, Copy, Check, FileText, Film, Tag, Sparkles, Clock, Volume2, Mic, Eye, Layers } from "lucide-react";

interface YoutubeDisplayProps {
  data: YoutubePackageData;
}

export const YoutubeDisplay: React.FC<YoutubeDisplayProps> = ({ data }) => {
  const [activeViewMode, setActiveViewMode] = useState<"SPLIT_BOARD" | "NARRATION_ONLY" | "SCENES_ONLY" | "DESCRIPTION">("SPLIT_BOARD");
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedNarrationOnly, setCopiedNarrationOnly] = useState(false);
  const [copiedScenesOnly, setCopiedScenesOnly] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  // Full formatted script
  const getFullScriptText = () => {
    let text = `[유튜브 대본 및 1:1 스토리보드: ${data.videoTitle}]\n\n`;
    data.scriptScenes.forEach((scene, idx) => {
      text += `[장면 #${idx + 1} | ${scene.timestamp}] (어조: ${scene.toneInstruction})\n`;
      text += `🎙️ 나레이션 대사: ${scene.narrationScript}\n`;
      text += `🎥 매칭 시각 장면(B-roll): ${scene.visualBrollDescription}\n\n`;
    });
    return text;
  };

  // Only Narration Text (for TTS / Voice Over) + Header instruction + Production Spec Template
  const getNarrationOnlyText = () => {
    const headerPrefix = `내가 공유해주는 스크립트와 아래의 작성포맷을 기반으로 만들어줘.\n---\n\n`;
    const narrationList = data.scriptScenes.map((s) => s.narrationScript).join("\n");
    const videoSpecFooter = `\n\n---
화면비율: 9:16
TTS모델: 애덤 속도최대
BGM: 산듯하고 경쾌한
자막길이: 문장으로 만든다음에 8~11자 이내로 자막길이 조정해줘.
Format text : animate -> in & Out -> Typing -> duration 0.3s
효과음: 자막 2~3개마다 또잉! 등장음, 마우스 클릭음, 핑거스냅1, 문자 전송용(또로롱), 짜잔 (금관악기), 집중용 띵 2, 북소리 (두둥) 이렇게 효과음을 랜덤으로 선택해서 작성해줘. 
자막위치: 중하단
사진배치 부분은 아래와 같이 처리해줘.
- Resize: "Fit"
- 사진 애니메이션: zoom-in, zoom-out 섞어서.`;

    return headerPrefix + narrationList + videoSpecFooter;
  };

  // Only B-roll Visual Scenes with Prefix Requested by User
  const getScenesOnlyText = () => {
    let text = `총 ${data.scriptScenes.length}개의 장면을 각각 한장씩 만들어줘. 한국인, 한국어 배경 환경 위주, 9:16 세로형 영상용 고화질 B-roll 장면.\n\n`;
    data.scriptScenes.forEach((s, idx) => {
      text += `[장면 #${idx + 1}] (${s.timestamp}): ${s.visualBrollDescription}\n`;
    });
    return text;
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getFullScriptText());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyNarrationOnly = () => {
    navigator.clipboard.writeText(getNarrationOnlyText());
    setCopiedNarrationOnly(true);
    setTimeout(() => setCopiedNarrationOnly(false), 2000);
  };

  const handleCopyScenesOnly = () => {
    navigator.clipboard.writeText(getScenesOnlyText());
    setCopiedScenesOnly(true);
    setTimeout(() => setCopiedScenesOnly(false), 2000);
  };

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(data.descriptionText);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  return (
    <div id="youtube-package-wrapper" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div id="youtube-header-card" className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-2 border border-red-200">
              <Video className="w-3.5 h-3.5" />
              <span>3단계: 유튜브 대본 &amp; 16~20자 1:1 장면 스토리보드 ({data.scriptScenes.length}개 장면)</span>
            </div>
            <h2 id="youtube-video-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {data.videoTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              매 16~20자 내외 대사마다 구체적인 시각 연출 장면을 1:1로 매칭했습니다. 나레이션과 장면을 따로 분리해서 손쉽게 활용하실 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-script-btn"
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? "통합 대본 복사완료!" : "대본+장면 전체 복사"}</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div id="youtube-view-mode-tabs" className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveViewMode("SPLIT_BOARD")}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === "SPLIT_BOARD"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1:1 분리 스토리보드 (권장)</span>
          </button>

          <button
            onClick={() => setActiveViewMode("NARRATION_ONLY")}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === "NARRATION_ONLY"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            <span>나레이션 대사만 모아보기</span>
          </button>

          <button
            onClick={() => setActiveViewMode("SCENES_ONLY")}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === "SCENES_ONLY"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-300" />
            <span>장면 시각묘사만 모아보기</span>
          </button>

          <button
            onClick={() => setActiveViewMode("DESCRIPTION")}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === "DESCRIPTION"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>설명글 &amp; 태그</span>
          </button>
        </div>
      </div>

      {/* Mode 1: 1:1 Split Board View */}
      {activeViewMode === "SPLIT_BOARD" && (
        <div id="youtube-split-board-list" className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600">
            <span>총 {data.scriptScenes.length}개 장면 세그먼트 (대사 16~20자 단위 1:1 대응)</span>
            <span className="text-red-700 font-semibold">* 대사와 어울리는 장면 묘사가 각각 분리 구성되어 있습니다.</span>
          </div>

          {data.scriptScenes.map((scene, idx) => (
            <div
              key={scene.sceneNumber || idx}
              id={`youtube-scene-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-red-300 transition-all"
            >
              {/* Scene Card Top Header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-red-600 text-white text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {scene.timestamp}
                  </span>
                </div>

                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-amber-600" />
                  어조: {scene.toneInstruction}
                </span>
              </div>

              {/* 2-Column or Stacked Split Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Left/Top: Narration Script (16~20 chars) */}
                <div className="p-5 bg-red-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-red-600" />
                      <span>나레이션 대사 ({scene.narrationScript.length}자)</span>
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-semibold">
                    "{scene.narrationScript}"
                  </p>
                </div>

                {/* Right/Bottom: Visual B-roll Scene Description */}
                <div className="p-5 bg-slate-900 text-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>매칭 시각 장면 묘사 (Visual / B-Roll)</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {scene.visualBrollDescription}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 2: Narration Only View */}
      {activeViewMode === "NARRATION_ONLY" && (
        <div id="narration-only-box" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-red-600" />
                <span>나레이션 대사 전체 모아보기</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                성우 녹음, TTS 및 vrew/capcut 입력용 대사 텍스트입니다. 복사 시 하단 영상 편집 템플릿 정보도 함께 붙습니다.
              </p>
            </div>

            <button
              onClick={handleCopyNarrationOnly}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              {copiedNarrationOnly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNarrationOnly ? "대사 + 옵션 복사완료!" : "대사만 전체 복사 (+편집옵션)"}</span>
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 font-sans text-sm text-slate-800 leading-relaxed">
            <div className="p-3 bg-red-50/80 rounded-lg text-xs font-bold text-red-900 border border-red-200 mb-3">
              * 전체 복사 시 맨 상단에 <span className="text-red-700 font-extrabold">"내가 공유해주는 스크립트와 아래의 작성포맷을 기반으로 만들어줘. ---"</span> 가이드 문구가 자동으로 추가됩니다.
            </div>

            {data.scriptScenes.map((s, idx) => (
              <div key={idx} className="flex gap-3 items-start border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                <span className="text-xs font-bold text-slate-400 w-8 shrink-0 pt-0.5">#{idx + 1}</span>
                <p className="text-slate-900 font-medium">{s.narrationScript}</p>
              </div>
            ))}
          </div>

          {/* Appended Production Preset Box */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-2 border border-slate-800">
            <div className="text-amber-400 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>함께 자동 복사되는 숏폼 영상 제작 프리셋 옵션</span>
            </div>
            <pre className="font-mono text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
{`---
화면비율: 9:16
TTS모델: 애덤 속도최대
BGM: 산듯하고 경쾌한
자막길이: 문장으로 만든다음에 8~11자 이내로 자막길이 조정해줘.
Format text : animate -> in & Out -> Typing -> duration 0.3s
효과음: 자막 2~3개마다 또잉! 등장음, 마우스 클릭음, 핑거스냅1, 문자 전송용(또로롱), 짜잔 (금관악기), 집중용 띵 2, 북소리 (두둥) 이렇게 효과음을 랜덤으로 선택해서 작성해줘. 
자막위치: 중하단
사진배치 부분은 아래와 같이 처리해줘.
- Resize: "Fit"
- 사진 애니메이션: zoom-in, zoom-out 섞어서.`}
            </pre>
          </div>
        </div>
      )}

      {/* Mode 3: Scenes Only View */}
      {activeViewMode === "SCENES_ONLY" && (
        <div id="scenes-only-box" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-600" />
                <span>시각 장면 묘사(Visual/B-roll) 모아보기</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                영상 편집 및 AI 이미지/비디오 소스 수집용 묘사입니다. 복사 시 일괄 프롬프트 요청용 지시문이 자동으로 추가됩니다.
              </p>
            </div>

            <button
              onClick={handleCopyScenesOnly}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              {copiedScenesOnly ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScenesOnly ? "장면묘사 복사완료!" : "장면묘사만 전체 복사"}</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl space-y-3 font-sans text-xs sm:text-sm leading-relaxed">
            <div className="p-3 bg-slate-800/90 rounded-lg text-xs font-semibold text-sky-300 border border-slate-700/80">
              * 전체 복사 시 맨 위에 <span className="text-amber-300">"총 {data.scriptScenes.length}개의 장면을 각각 한장씩 만들어줘. 한국인, 한국어 배경 환경 위주..."</span> 지시어가 붙어 이미지/비디오 AI 생성시 매우 편리합니다.
            </div>

            {data.scriptScenes.map((s, idx) => (
              <div key={idx} className="border-b border-slate-800 pb-2.5 last:border-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                  <span>장면 #{idx + 1} ({s.timestamp})</span>
                </div>
                <p className="text-slate-200">{s.visualBrollDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 4: Video Description & Tags */}
      {activeViewMode === "DESCRIPTION" && (
        <div id="youtube-description-box" className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              <span>유튜브 영상 업로드용 설명글</span>
            </h3>

            <button
              onClick={handleCopyDesc}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDesc ? "복사됨!" : "설명글 복사"}</span>
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {data.descriptionText}
          </div>

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Tag className="w-3.5 h-3.5 text-red-600" />
              <span>유튜브 검색 알고리즘 추천 태그</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-red-50 text-red-800 font-semibold rounded-md text-xs border border-red-200/80">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


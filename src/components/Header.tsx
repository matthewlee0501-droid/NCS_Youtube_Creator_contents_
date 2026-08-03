import React from "react";
import { FileText, Sparkles, History, RefreshCw, Layers } from "lucide-react";

interface HeaderProps {
  onOpenHistory: () => void;
  onReset: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onReset,
  historyCount,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Title */}
        <div id="header-brand" className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div id="brand-logo" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div id="brand-title-row" className="flex items-center gap-2">
              <h1 id="brand-title" className="text-lg font-bold text-slate-900 tracking-tight">
                네이버 SEO & 콘텐츠 스튜디오
              </h1>
              <span id="brand-badge" className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                2026 최신 SEO
              </span>
            </div>
            <p id="brand-subtitle" className="text-xs text-slate-500 hidden sm:block">
              블로그 상위노출 글 ➔ 미드저니 프롬프트 ➔ 유튜브 대본 원스톱 생성기
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div id="header-actions" className="flex items-center gap-2">
          <button
            id="reset-btn"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="새 작업 시작하기"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새로 쓰기</span>
          </button>

          <button
            id="history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/80"
          >
            <History className="w-3.5 h-3.5" />
            <span>히스토리</span>
            {historyCount > 0 && (
              <span id="history-badge" className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

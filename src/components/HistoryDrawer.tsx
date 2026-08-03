import React from "react";
import { ProjectHistoryItem } from "../types";
import { History, X, Trash2, ArrowRight, FileText, Calendar } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: ProjectHistoryItem[];
  onSelectHistoryItem: (item: ProjectHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyList,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div id="history-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div id="history-drawer-panel" className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">저장된 콘텐츠 히스토리</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {historyList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs">아직 생성된 콘텐츠 히스토리가 없습니다.</p>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="group p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-xl transition-all cursor-pointer space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    완료됨
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                  {item.selectedTitle}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-1">
                  주제: {item.topic}
                </p>

                <div className="pt-2 flex items-center justify-end text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                  <span>불러오기</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {historyList.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClearHistory}
              className="w-full py-2.5 px-4 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 히스토리 삭제</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

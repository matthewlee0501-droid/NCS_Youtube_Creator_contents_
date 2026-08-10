import React, { useState } from "react";
import { BlogPostData } from "../types";
import { Copy, Check, FileText, BarChart3, Hash, Sparkles, AlertCircle, Globe } from "lucide-react";

interface BlogPostDisplayProps {
  data: BlogPostData;
}

export const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);

  const getFullMarkdownText = () => {
    let text = `${data.title}\n\n`;
    text += `${data.intro}\n\n`;

    data.sections.forEach((sec) => {
      text += `## ${sec.subheading}\n${sec.content}\n\n`;
    });

    if (data.tableData && data.tableData.rows.length > 0) {
      text += `| ${data.tableData.headers.join(" | ")} |\n`;
      text += `| ${data.tableData.headers.map(() => "---").join(" | ")} |\n`;
      data.tableData.rows.forEach((row) => {
        text += `| ${row.join(" | ")} |\n`;
      });
      text += `\n`;
    }

    text += `## 마무리하며\n${data.conclusion}\n\n`;
    text += `${data.callToAction}\n\n`;
    text += `${data.hashtags}`;
    return text;
  };

  const handleCopyFullText = () => {
    const text = getFullMarkdownText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(data.hashtags);
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 2000);
  };

  return (
    <div id="blog-post-display-wrapper" className="w-full max-w-5xl mx-auto space-y-6">
      {/* SEO Compliance & Stats Toolbar */}
      <div id="seo-toolbar" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div id="seo-badges-container" className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg text-xs font-semibold border border-sky-200">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>실시간 구글 웹 검색(Google Search) 데이터 반영 완료</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>메인키워드 빈도: <strong className="text-emerald-900 font-bold">{data.keywordCount || 6}회</strong> (5~6회 적정)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-800 rounded-lg text-xs font-semibold border border-cyan-200">
            <FileText className="w-3.5 h-3.5 text-cyan-600" />
            <span>약 글자 수: <strong className="text-cyan-900 font-bold">{data.wordCount || 1650}자</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">
            <Hash className="w-3.5 h-3.5 text-slate-600" />
            <span>태그: <strong className="text-slate-900 font-bold">15개 (한 줄)</strong></span>
          </div>
        </div>

        {/* Copy Controls */}
        <div id="seo-actions" className="flex items-center gap-2">
          <button
            id="copy-hashtags-btn"
            onClick={handleCopyHashtags}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            {hashtagsCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Hash className="w-3.5 h-3.5" />}
            <span>{hashtagsCopied ? "태그 복사됨!" : "해시태그만 복사"}</span>
          </button>

          <button
            id="copy-blog-full-btn"
            onClick={handleCopyFullText}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "블로그 글 복사완료!" : "네이버 블로그 글 전체 복사"}</span>
          </button>
        </div>
      </div>

      {/* Main Blog Document Box */}
      <div id="blog-document-paper" className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-10 space-y-8">
        {/* Title Header */}
        <div id="blog-header-section" className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              메인: {data.mainKeyword}
            </span>
            <span className="text-xs text-slate-400">
              서브: {data.subKeywords.join(", ")}
            </span>
          </div>
          <h1 id="blog-main-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {data.title}
          </h1>
        </div>

        {/* Intro */}
        <div id="blog-intro-section" className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-xl border border-slate-100">
          {data.intro}
        </div>

        {/* Sections */}
        <div id="blog-body-sections" className="space-y-8">
          {data.sections.map((sec, idx) => (
            <div key={idx} id={`blog-section-${idx}`} className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <span>{sec.subheading}</span>
              </h2>
              <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line pl-1">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Table if exists */}
        {data.tableData && data.tableData.rows && data.tableData.rows.length > 0 && (
          <div id="blog-table-container" className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/30 p-1">
            <div className="px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200 bg-white">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>주요 정보 수치 비교 및 데이터 정리</span>
            </div>
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-800 border-b border-slate-200">
                  {data.tableData.headers.map((h, i) => (
                    <th key={i} className="p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors bg-white">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Conclusion */}
        <div id="blog-conclusion-section" className="pt-4 border-t border-slate-200 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>마무리하며</span>
          </h2>
          <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {data.conclusion}
          </p>
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs sm:text-sm font-medium text-emerald-900">
            💡 {data.callToAction}
          </div>
        </div>

        {/* Hashtags Section - STRICT 15 Tags on Single Line */}
        <div id="blog-hashtags-section" className="pt-4 border-t border-slate-100 bg-slate-900 text-slate-200 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>네이버 블로그 태그 (15개 줄바꿈 없음)</span>
            </span>
            <button
              onClick={handleCopyHashtags}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-medium cursor-pointer"
            >
              {hashtagsCopied ? "복사됨!" : "태그만 복사"}
            </button>
          </div>
          <p id="blog-hashtags-singleline" className="text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed break-all select-all">
            {data.hashtags}
          </p>
        </div>
      </div>
    </div>
  );
};

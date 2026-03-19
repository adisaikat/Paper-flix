import React from "react";

export interface Paper {
  id: string;
  title: string;
  abstract: string;
}

interface Props {
  paper: Paper;
  onClick?: (paper: Paper) => void;
}

export default function PaperCard({ paper, onClick }: Props) {
  return (
    <div className="flex-none w-80 h-72 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg hover:border-blue-500 transition-colors flex flex-col">
      <h3 className="text-lg font-bold text-white line-clamp-2 mb-2">
        {paper.title}
      </h3>
      <p className="text-sm text-slate-400 line-clamp-5 flex-grow">
        {paper.abstract}
      </p>
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
        <span className="text-xs font-mono text-slate-500 truncate w-24">
          ID: {paper.id}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (onClick) onClick(paper);
              window.open(`https://arxiv.org/pdf/${paper.id}.pdf`, "_blank");
            }}
            className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded-full font-semibold hover:bg-slate-600 transition-colors"
          >
            Read PDF
          </button>

          <button
            onClick={() => onClick && onClick(paper)}
            className="text-xs px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full font-semibold hover:bg-blue-600/40 transition-colors"
          >
            Add to History +
          </button>
        </div>
      </div>
    </div>
  );
}

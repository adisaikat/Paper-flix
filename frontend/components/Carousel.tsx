"use client";

import { useEffect, useState } from "react";
import PaperCard, { Paper } from "./PaperCard";

interface CarouselProps {
  sourcePaperTitle: string;
  sourcePaperId: string;
  onPaperClick?: (paper: Paper) => void;
}

export default function Carousel({
  sourcePaperTitle,
  sourcePaperId,
  onPaperClick,
}: CarouselProps) {
  const [recommendations, setRecommendations] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/recommend/${sourcePaperId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecommendations(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch recommendations:", err);
        setLoading(false);
      });
  }, [sourcePaperId]);

  if (loading) {
    return (
      <div className="my-8 animate-pulse">
        <div className="h-6 w-64 bg-slate-700 rounded mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex-none w-80 h-64 bg-slate-800 rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="my-10">
      <h2 className="text-2xl font-bold text-white mb-4">
        Because you read:{" "}
        <span className="text-blue-400">"{sourcePaperTitle}"</span>
      </h2>

      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar">
        {recommendations.map((paper) => (
          <div key={paper.id} className="snap-start">
            <PaperCard paper={paper} onClick={onPaperClick} />
          </div>
        ))}
      </div>
    </div>
  );
}

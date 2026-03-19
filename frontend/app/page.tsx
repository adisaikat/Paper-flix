"use client";

import { useEffect, useState } from "react";
import PaperCard, { Paper } from "@/components/PaperCard";
import Carousel from "@/components/Carousel";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  // State for the Feed
  const [readingHistory, setReadingHistory] = useState<Paper[]>([]);
  const [forYouFeed, setForYouFeed] = useState<Paper[]>([]);

  // State for Onboarding/Login
  const [existingUsers, setExistingUsers] = useState<
    { id: string; username: string }[]
  >([]);
  const [onboardingPapers, setOnboardingPapers] = useState<Paper[]>([]);
  const [selectedStarters, setSelectedStarters] = useState<Paper[]>([]);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // 1. Initial Load: Check auth and load required data
  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("paperflix_user");

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserId(user.id);
      setUsername(user.username);

      fetch(`http://localhost:8080/api/users/${user.id}/history`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) setReadingHistory(data);
        })
        .catch((err) => console.error("History Fetch Error:", err));
    } else {
      fetch("http://localhost:8080/api/onboarding")
        .then((res) => res.json())
        .then((data) => setOnboardingPapers(data))
        .catch((err) => console.error("Onboarding Fetch Error:", err));

      fetch("http://localhost:8080/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setExistingUsers(data);
            setIsLoginMode(true);
          }
        })
        .catch((err) => console.error("Users Fetch Error:", err));
    }
  }, []);

  // 2. Fetch ML Recommendations whenever history changes
  useEffect(() => {
    if (readingHistory.length === 0) return;
    const historyIds = readingHistory.map((p) => p.id);

    fetch(`http://localhost:8080/api/recommend/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: historyIds }),
    })
      .then((res) => res.json())
      .then((data) => setForYouFeed(data))
      .catch(console.error);
  }, [readingHistory]);

  // 3. Auth Handlers
  const handleRegister = async () => {
    if (!username || selectedStarters.length === 0)
      return alert("Enter a name and pick at least 1 paper!");

    try {
      const res = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const user = await res.json();

      localStorage.setItem("paperflix_user", JSON.stringify(user));
      setUserId(user.id);
      setReadingHistory(selectedStarters);

      selectedStarters.forEach((paper) => {
        fetch(`http://localhost:8080/api/users/${user.id}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paper_id: paper.id }),
        });
      });
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleLogin = (user: { id: string; username: string }) => {
    localStorage.setItem("paperflix_user", JSON.stringify(user));
    setUserId(user.id);
    setUsername(user.username);

    fetch(`http://localhost:8080/api/users/${user.id}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) setReadingHistory(data);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("paperflix_user");
    window.location.reload();
  };

  // 4. Feed Handler
  const handleReadPaper = (paper: Paper) => {
    if (!readingHistory.find((p) => p.id === paper.id)) {
      setReadingHistory([...readingHistory, paper]);
      fetch(`http://localhost:8080/api/users/${userId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: paper.id }),
      });
    }
  };

  if (!isMounted) return null;

  // --- UI: THE AUTHENTICATION SCREEN ---
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-24 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">
          PaperFlix
        </h1>

        <div className="flex gap-4 mb-8">
          {existingUsers.length > 0 && (
            <button
              onClick={() => setIsLoginMode(true)}
              className={`px-4 py-2 font-bold ${isLoginMode ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500"}`}
            >
              Login
            </button>
          )}
          <button
            onClick={() => setIsLoginMode(false)}
            className={`px-4 py-2 font-bold ${!isLoginMode ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-500"}`}
          >
            Register
          </button>
        </div>

        {isLoginMode ? (
          <div className="w-full max-w-md flex flex-col gap-4">
            <h2 className="text-xl mb-4 text-center">Select your profile</h2>
            {existingUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleLogin(u)}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-lg text-left transition-colors flex justify-between items-center"
              >
                <span>{u.username}</span>
                <span className="text-sm font-normal text-slate-500">
                  Log in →
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-8">
              <input
                type="text"
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <h2 className="text-xl font-bold mb-6 text-center">
              Select 1 or more topics to build your brain vector.
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-12 max-w-6xl">
              {onboardingPapers.map((paper) => {
                const isSelected = selectedStarters.find(
                  (p) => p.id === paper.id,
                );
                return (
                  <div
                    key={paper.id}
                    onClick={() => {
                      if (isSelected)
                        setSelectedStarters(
                          selectedStarters.filter((p) => p.id !== paper.id),
                        );
                      else setSelectedStarters([...selectedStarters, paper]);
                    }}
                    className={`w-64 p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? "border-blue-500 bg-blue-900/20" : "border-slate-800 bg-slate-900 hover:border-slate-600"}`}
                  >
                    <h3 className="font-bold text-sm line-clamp-3">
                      {paper.title}
                    </h3>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleRegister}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${selectedStarters.length > 0 && username ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
            >
              Start Discovering →
            </button>
          </>
        )}
      </main>
    );
  }

  // --- UI: THE MAIN FEED ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-24">
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            PaperFlix
          </h1>
          <p className="text-slate-400 mt-1">
            Profile: <span className="text-white font-bold">{username}</span>
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete ALL users and histories?",
                )
              ) {
                fetch("http://localhost:8080/api/users/reset", {
                  method: "DELETE",
                }).then(() => {
                  localStorage.removeItem("paperflix_user");
                  window.location.reload();
                });
              }
            }}
            className="px-4 py-2 text-sm bg-red-900/30 text-red-400 hover:bg-red-900/60 rounded-lg transition-colors border border-red-900/50"
          >
            Reset Database
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            Switch Profile
          </button>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">
          Recommended For You
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
          {forYouFeed.map((paper) => (
            <div key={paper.id} className="snap-start">
              <PaperCard paper={paper} onClick={handleReadPaper} />
            </div>
          ))}
          {forYouFeed.length === 0 && (
            <p className="text-slate-500 italic">
              Calculating your profile vector...
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-8 mt-12">
        {readingHistory
          .slice()
          .reverse()
          .map((paper, index) => (
            <Carousel
              key={`${paper.id}-${index}`}
              sourcePaperTitle={paper.title}
              sourcePaperId={paper.id}
              onPaperClick={handleReadPaper}
            />
          ))}
      </section>
    </main>
  );
}

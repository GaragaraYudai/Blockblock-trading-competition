"use client";

import { useEffect, useState } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import AdvancedChart from "@/components/AdvancedChart";
import RegisterForm from "@/components/RegisterForm";
import { RefreshCw, UserPlus } from "lucide-react";
import Image from "next/image";

import { LeaderboardItem } from "@/types";

const DEFAULT_AVATARS = [
  "wonyoung1.jpg", "wonyoung2.jpg", "wonyoung3.jpg", "wonyoung4.jpg", "wonyoung5.jpg"
];

const API_URL = "https://blockblock-trading-competition-production.up.railway.app";

export default function Home() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await res.json();

      const enhancedData = jsonData.map((item: any, index: number) => {
        let name = item.name || item.address;
        let avatar = item.avatar;

        if (!avatar || avatar === "/images/avatars/default.jpg") {
          const avatarIndex = index % DEFAULT_AVATARS.length;
          avatar = `/images/avatars/${DEFAULT_AVATARS[avatarIndex]}`;
        }

        const roi = item.roi24h ?? item.profit_rate ?? 0;

        return {
          ...item,
          name: name,
          avatar: avatar,
          roi24h: roi
        };
      });

      setData(enhancedData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1015] text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[150px]" />
      </div>

      <nav className="border-b border-white/5 bg-[#151921]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between relative">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRegisterForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">참가 신청</span>
            </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 drop-shadow-2xl">
              <Image
                src="/logo.png"
                alt="Blockblock Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Blockblock
              </h1>
              <span className="text-xs md:text-base font-bold text-blue-500 tracking-widest uppercase">
                Crypto Trading Competition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-95 group shadow-lg shadow-black/20"
              title="Refresh Data"
            >
              <RefreshCw size={22} className={`text-gray-400 group-hover:text-white transition-all ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
              Market Overview
            </h2>
          </div>
          <div className="bg-[#151921] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 h-[600px] ring-1 ring-white/5">
            <AdvancedChart />
          </div>
        </section>

        <section className="w-full space-y-4">
          <div className="flex justify-between items-end px-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <span className="w-1.5 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>
                Top Traders
              </h2>
              <p className="text-gray-500 text-sm pl-4">Real-time performance ranking</p>
            </div>
            <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
              Last Update: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Syncing..."}
            </span>
          </div>

          {loading && data.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 w-full bg-[#1A1D26] animate-pulse rounded-xl border border-white/5"></div>
              ))}
            </div>
          ) : (
            <LeaderboardTable data={data} />
          )}
        </section>
      </div>

      <RegisterForm
        isOpen={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
        apiUrl={API_URL}
      />
    </main>
  );
}

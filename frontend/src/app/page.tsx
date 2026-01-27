"use client";

import { useEffect, useState } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import AdvancedChart from "@/components/AdvancedChart";
import { RefreshCw } from "lucide-react";
import Image from "next/image";

import { LeaderboardItem } from "@/types";

// Strict Mapping: Address -> Name & Avatar
const USER_MAPPING: Record<string, { name: string; avatar: string }> = {
  // Add more specific mappings here if known, otherwise fallback using index or hash
  // Example specific mappings based on user request (mocking addresses for now)
  "0xdfc7da625a62372c050cf649392c6d482270d4d8": { name: "김윤철", avatar: "wonyoung2.jpg" },
  "0x010461c14e146305d262fc7b8f949823ce2ebdf3": { name: "조수현", avatar: "wonyoung3.jpg" },
  "0x0000000000000000000000000000000000000000": { name: "김민석", avatar: "wonyoung1.jpg" },
};

const TRADER_NAMES = [
  "김윤철", "조수현", "김민석", "김지윤", "김진웅",
  "김형태", "박솔", "박채은", "손형권", "심민기",
  "우민성", "윤도현", "이동헌", "이성우", "이승민"
];

const AVATAR_FILES = [
  "wonyoung1.jpg", "wonyoung2.jpg", "wonyoung3.jpg", "wonyoung4.jpg", "wonyoung5.jpg"
];

export default function Home() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const apiUrl = "https://blockblock-trading-competition-production-f6b5.up.railway.app";
      const res = await fetch(`${apiUrl}/leaderboard`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await res.json();

      const enhancedData = jsonData.map((item: any, index: number) => {
        let name = item.address;
        let avatar = "wonyoung1.jpg"; // Default

        // 1. Try Specific Mapping
        if (USER_MAPPING[item.address]) {
          name = USER_MAPPING[item.address].name;
          avatar = USER_MAPPING[item.address].avatar;
        } else {
          // 2. Fallback to Index-based Mapping (Friend List)
          const safeIndex = index % TRADER_NAMES.length;
          name = TRADER_NAMES[safeIndex];

          const avatarIndex = index % AVATAR_FILES.length;
          avatar = AVATAR_FILES[avatarIndex];
        }

        const avatarPath = `/images/avatars/${avatar}`;

        return {
          ...item,
          name: name,
          avatar: avatarPath,
          roi24h: item.roi24h ?? (Math.random() * 40 - 15)
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
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 30000); // 30s polling
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1015] text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar / Header */}
      <nav className="border-b border-white/5 bg-[#151921]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-center relative">

          {/* Centered Brand */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 drop-shadow-2xl">
              <Image
                src="/logo.png"
                alt="Blockblock Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Blockblock
              </h1>
              <span className="text-sm md:text-base font-bold text-blue-500 tracking-widest uppercase">
                Crypto Trading Competition
              </span>
            </div>
          </div>

          <div className="absolute right-4 md:right-8 flex items-center gap-4">
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

        {/* Top Section: Advanced Chart (Full Width) */}
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

        {/* Bottom Section: Leaderboard */}
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
    </main>
  );
}

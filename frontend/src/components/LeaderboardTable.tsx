import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';

import { LeaderboardItem } from '../types';

interface Props {
    data: LeaderboardItem[];
}

const LeaderboardTable: React.FC<Props> = ({ data }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(val);
    };

    const formatPercent = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            signDisplay: "always"
        }).format(val / 100);
    }

    return (
        <div className="w-full">
            {/* Table Header (Desktop Only) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-1"></div>
                <div className="col-span-4">Trader</div> {/* Renamed from Address/Trader to just Trader, content is Name */}
                <div className="col-span-3 text-right">24h ROI</div>
                <div className="col-span-3 text-right">Account Value</div>
            </div>

            <div className="space-y-3 relative">
                <AnimatePresence>
                    {data.map((item, index) => {
                        const roi = item.roi24h ?? 0;
                        const displayName = item.name || item.address;

                        return (
                            <motion.div
                                key={item.address}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-blue-500/30 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
                            >
                                {/* Desktop Row */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                    <div className="col-span-1 flex justify-center relative">
                                        {/* Rank Badge */}
                                        <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-lg z-10 border border-white/10
                      ${item.rank === 1 ? 'bg-gradient-to-b from-yellow-300 to-yellow-600 text-white ring-2 ring-yellow-500/30' :
                                                item.rank === 2 ? 'bg-gradient-to-b from-gray-300 to-gray-500 text-white ring-2 ring-gray-400/30' :
                                                    item.rank === 3 ? 'bg-gradient-to-b from-orange-300 to-orange-600 text-white ring-2 ring-orange-500/30' : 'bg-gray-800 text-gray-400'}
                    `}>
                                            {item.rank}
                                        </div>
                                    </div>

                                    <div className="col-span-1 flex justify-center">
                                        {/* Avatar with Gold Border */}
                                        <div className="relative w-12 h-12 rounded-full border-2 border-yellow-500 overflow-hidden shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                                            {item.avatar && (
                                                <Image
                                                    src={item.avatar}
                                                    alt={displayName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-4 font-sans text-base text-gray-100 font-bold flex items-center gap-2">
                                        {displayName}
                                        {item.rank <= 3 && <Trophy size={16} className="text-yellow-500" />}
                                    </div>

                                    <div className={`col-span-3 text-right font-medium flex items-center justify-end gap-1 ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {roi >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {formatPercent(roi)}
                                    </div>

                                    <div className="col-span-3 text-right font-bold text-white text-lg tabular-nums tracking-tight">
                                        {formatCurrency(item.accountValue)}
                                    </div>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="md:hidden p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {/* Rank Badge Mobile */}
                                            <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-lg border border-white/10
                      ${item.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                                    item.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                        item.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 'bg-gray-800 text-gray-400'}
                    `}>
                                                {item.rank}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full border-2 border-yellow-500 overflow-hidden">
                                                    {item.avatar && (
                                                        <Image
                                                            src={item.avatar}
                                                            alt={displayName}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-white font-sans text-base font-bold">
                                                    {displayName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ROI Badge Mobile */}
                                        <div className={`px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs font-bold flex items-center gap-1 ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {roi >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {formatPercent(roi)}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end pt-3 border-t border-white/5">
                                        <span className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                                            Total Equity
                                        </span>
                                        <span className="text-xl font-bold text-white tracking-tight">
                                            {formatCurrency(item.accountValue)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LeaderboardTable;

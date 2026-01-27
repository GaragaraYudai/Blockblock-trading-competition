"use client";

import React, { useState } from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { LayoutGrid } from "lucide-react";

const ASSETS = [
    { symbol: "BINANCE:BTCUSDT", label: "BTC" },
    { symbol: "BINANCE:ETHUSDT", label: "ETH" },
    { symbol: "BINANCE:SOLUSDT", label: "SOL" },
    { symbol: "BINANCE:ARBUSDT", label: "ARB" },
];

const TIMEFRAMES = [
    { label: "1m", value: "1" },
    { label: "5m", value: "5" },
    { label: "15m", value: "15" },
    { label: "1h", value: "60" },
    { label: "1d", value: "D" },
];

const AdvancedChart = () => {
    const [symbol, setSymbol] = useState(ASSETS[0].symbol);
    const [interval, setInterval] = useState("60");
    const [isSplitView, setIsSplitView] = useState(false);

    return (
        <div className="w-full h-[600px] flex flex-col gap-4">
            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#151921]/80 backdrop-blur-md p-3 rounded-xl border border-white/5 sticky top-0 z-20">

                {/* Left: Asset Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {ASSETS.map((asset) => (
                        <button
                            key={asset.symbol}
                            onClick={() => setSymbol(asset.symbol)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
                                ${symbol === asset.symbol
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white"
                                }
                            `}
                        >
                            {asset.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {/* Center: Timeframe Selector */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => setInterval(tf.value)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                                    ${interval === tf.value
                                        ? "bg-gray-700 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-300"
                                    }
                                `}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Layout Toggles (UI Only) */}
                    <div className="flex gap-2">
                        <button
                            className={`p-2 rounded-lg border border-white/5 transition-colors ${isSplitView ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            onClick={() => setIsSplitView(!isSplitView)}
                            title="Split View (Demo)"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-[#0E1015]">
                <div key={symbol} className={`w-full h-full ${isSplitView ? 'grid grid-cols-2 gap-1' : ''}`}>
                    <AdvancedRealTimeChart
                        theme="dark"
                        autosize
                        symbol={symbol}
                        interval={interval as any}
                        timezone="Etc/UTC"
                        style="1"
                        locale="ko"
                        toolbar_bg="#0f1115"
                        enable_publishing={false}
                        hide_top_toolbar={true}
                        hide_legend={false}
                        container_id="tradingview_widget"
                        allow_symbol_change={false}
                    />
                    {isSplitView && (
                        <AdvancedRealTimeChart
                            theme="dark"
                            autosize
                            symbol="BINANCE:ETHUSDT"
                            interval={interval as any}
                            timezone="Etc/UTC"
                            style="1"
                            locale="ko"
                            toolbar_bg="#0f1115"
                            enable_publishing={false}
                            hide_top_toolbar={true}
                            hide_legend={false}
                            container_id="tradingview_widget_2"
                            allow_symbol_change={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedChart;

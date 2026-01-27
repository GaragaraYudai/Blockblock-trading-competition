"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, UTCTimestamp } from "lightweight-charts";

const CryptoChart = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<IChartApi | null>(null);
    const candlestickSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Initialize Chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#111827" }, // tailwind gray-900
                textColor: "#9CA3AF", // tailwind gray-400
            },
            grid: {
                vertLines: { color: "#1f2937" }, // gray-800
                horzLines: { color: "#1f2937" },
            },
            width: chartContainerRef.current.clientWidth || window.innerWidth, // Fallback to window width
            height: 300,
        });

        // Handle Resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener("resize", handleResize);

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#10B981", // emerald-500
            downColor: "#EF4444", // red-500
            borderVisible: false,
            wickUpColor: "#10B981",
            wickDownColor: "#EF4444",
        });

        chartInstance.current = chart;
        candlestickSeries.current = series;

        // Fetch Initial Data (K-Lines)
        fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100")
            .then((res) => res.json())
            .then((data) => {
                const cdata = data.map((d: any) => ({
                    time: (d[0] / 1000) as UTCTimestamp,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }));
                series.setData(cdata);
            })
            .catch(err => console.error("Binance Fetch Error:", err));

        // WebSocket for Real-time Updates
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const k = message.k;
            series.update({
                time: (k.t / 1000) as UTCTimestamp,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            });
        };

        return () => {
            ws.close();
            window.removeEventListener("resize", handleResize);
            chart.remove();
            chartInstance.current = null;
        };
    }, []);

    return (
        <div className="w-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-xl mb-8">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    BTC/USDT Real-time
                </h2>
            </div>
            <div ref={chartContainerRef} className="w-full h-[300px]" />
        </div>
    );
};

export default CryptoChart;

import { useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChevronDown, RefreshCw, AlertCircle } from "lucide-react";
import {
  fetchCandles,
  fetchTicker,
  computeTrend,
  fmtVolume,
  fmtPrice,
  type Candle,
  type Ticker24h,
  type TrendResult,
} from "../services/trendEngine";

// ── Interval helpers ──────────────────────────────────────────────────────────
const TABS = ["1 Minute", "5 Minutes", "15 Minutes"] as const;
type Tab = typeof TABS[number];

const TAB_INTERVAL: Record<Tab, string> = {
  "1 Minute":   "1m",
  "5 Minutes":  "5m",
  "15 Minutes": "15m",
};

const EXCHANGES = ["Binance", "KuCoin", "CoinDCX"] as const;
type Exchange = typeof EXCHANGES[number];

// ── Gauge needle position (−90° = full sell, 0° = neutral, +90° = full buy) ──
function needleAngle(buy: number, sell: number): number {
  const total = buy + sell;
  if (total === 0) return 0;
  const ratio = (buy - sell) / total; // −1 … +1
  return ratio * 85; // ±85° max swing
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Dynamic gauge needle SVG group ───────────────────────────────────────────
function GaugeNeedle({ angleDeg }: { angleDeg: number }) {
  // needle pivot at (130, 130)
  const tip = polarToCartesian(130, 130, 80, angleDeg + 90);
  return (
    <g>
      <ellipse cx="130" cy="130" rx="8" ry="8" fill="#222" />
      <polygon
        points={`130,${130 - 80} 122,130 138,130`}
        fill="#222"
        transform={`rotate(${angleDeg}, 130, 130)`}
      />
      {/* tip override after rotate */}
      <circle cx={tip.x} cy={tip.y} r="3" fill="#222" opacity="0" />
    </g>
  );
}

// ── Symbol abbreviation for the circle avatar ─────────────────────────────────
function symbolAbbr(sym: string) {
  return sym.replace(/[^A-Z]/g, "").slice(0, 4);
}

// ── Number formatting ─────────────────────────────────────────────────────────
function pctClass(v: number) {
  return v >= 0 ? "text-green-600" : "text-red-500";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Trends() {
  const [activeTab, setActiveTab]       = useState<Tab>("5 Minutes");
  const [exchange, setExchange]         = useState<Exchange>("Binance");
  const [pairInput, setPairInput]       = useState("BTCUSDT");

  // Derived state after fetch
  const [candles, setCandles]           = useState<Candle[]>([]);
  const [ticker, setTicker]             = useState<Ticker24h | null>(null);
  const [trend, setTrend]               = useState<TrendResult | null>(null);
  const [currentPair, setCurrentPair]   = useState("BTCUSDT");
  const [currentExchange, setCurrentExchange] = useState<Exchange>("Binance");

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [hasData, setHasData]           = useState(false);

  // ── Run analysis ────────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async (exch: Exchange, pair: string, tab: Tab) => {
    if (!pair.trim()) { setError("Please enter a trading pair."); return; }
    setLoading(true);
    setError(null);
    try {
      const interval = TAB_INTERVAL[tab];
      const [cdls, tkr] = await Promise.all([
        fetchCandles(exch, pair, interval, 250),
        fetchTicker(exch, pair),
      ]);
      const tr = computeTrend(cdls);
      setCandles(cdls);
      setTicker(tkr);
      setTrend(tr);
      setCurrentPair(pair.toUpperCase().replace(/[^A-Z0-9]/g, ""));
      setCurrentExchange(exch);
      setHasData(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch data. Check the pair and exchange.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewTrends = () => runAnalysis(exchange, pairInput, activeTab);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (hasData) runAnalysis(currentExchange, currentPair, tab);
  };

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = candles.slice(-60).map((c) => ({
    name: new Date(c.time).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
    }),
    value: c.close,
  }));

  // ── Price display values ────────────────────────────────────────────────────
  const displayPrice      = ticker ? fmtPrice(ticker.lastPrice) : "—";
  const displayChangePct  = ticker ? ticker.priceChangePct.toFixed(2) : "0.00";
  const displayChangeAbs  = ticker ? Math.abs(ticker.priceChange).toFixed(4) : "—";
  const displayHigh       = ticker ? fmtPrice(ticker.high24h)  : "—";
  const displayLow        = ticker ? fmtPrice(ticker.low24h)   : "—";
  const displayVol        = ticker ? fmtVolume(ticker.volume24h) : "—";
  const displayQuoteVol   = ticker ? fmtVolume(ticker.quoteVolume24h) : "—";

  // ── Gauge ───────────────────────────────────────────────────────────────────
  const buy     = trend?.buy     ?? 0;
  const sell    = trend?.sell    ?? 0;
  const neutral = trend?.neutral ?? 12;
  const label   = trend?.label   ?? "Neutral";
  const nAngle  = needleAngle(buy, sell);

  // Volatility (std-dev of recent close returns)
  const volatility = (() => {
    if (candles.length < 2) return "—";
    const returns = candles.slice(-30).map((c, i, a) =>
      i === 0 ? 0 : (c.close - a[i - 1].close) / a[i - 1].close
    ).slice(1);
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length);
    return (std * 100).toFixed(3) + "%";
  })();

  const priceRange = ticker
    ? `${fmtPrice(ticker.low24h)} – ${fmtPrice(ticker.high24h)}`
    : "—";

  // Base / Quote from pair
  const baseAsset  = currentPair.replace(/(USDT|USDC|BTC|ETH|BNB|BUSD|INR)$/, "") || currentPair;
  const quoteAsset = currentPair.slice(baseAsset.length) || "USDT";

  return (
    <div className="w-full text-[#222] dark:text-white px-8 py-6">

      {/* ── Top Filter Bar ─────────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4 flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">

            {/* Exchange dropdown */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1 dark:text-white">Exchange</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-[#18181b] text-[#222] dark:text-white border-gray-300 dark:border-gray-700"
                value={exchange}
                onChange={(e) => setExchange(e.target.value as Exchange)}
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            {/* Pair input */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1 dark:text-white">Pair</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-[#18181b] text-[#222] dark:text-white border-gray-300 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                placeholder="e.g. BTCUSDT"
                value={pairInput}
                onChange={(e) => setPairInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleViewTrends()}
              />
            </div>
          </div>

          <button
            onClick={handleViewTrends}
            disabled={loading}
            className="bg-[#4A0D0D] text-white px-6 py-2 rounded shadow hover:bg-[#2d0a0a] transition font-semibold w-full md:w-auto self-center dark:bg-[#4A0D0D] dark:hover:bg-[#2d0a0a] mt-5 flex items-center gap-2 justify-center disabled:opacity-60"
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analysing…</>
            ) : (
              "View Trends"
            )}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg px-4 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="w-full mt-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

          {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Price Chart Card */}
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#4A0D0D] flex items-center justify-center text-white font-bold text-[10px]">
                  {symbolAbbr(currentPair)}
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#4A0D0D] dark:text-white leading-tight">
                    {currentExchange.toUpperCase()} · {currentPair}
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-1">
                <span className="text-2xl font-bold text-[#222] dark:text-white">
                  {displayPrice}
                </span>
                {ticker && (
                  <span className={`text-base font-semibold ${pctClass(ticker.priceChangePct)}`}>
                    {ticker.priceChangePct >= 0 ? "+" : ""}{displayChangePct}%{" "}
                    <span className="text-xs">({displayChangeAbs})</span>
                  </span>
                )}
              </div>

              <div className="h-20 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#4A0D0D" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#4A0D0D" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#888" }}
                        interval="preserveStartEnd"
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        formatter={(v: number) => [fmtPrice(v), "Price"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4A0D0D"
                        fill="url(#colorArea)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    {loading ? "Loading chart…" : "Enter a pair and click View Trends"}
                  </div>
                )}
              </div>
            </div>

            {/* Technical Analysis / Gauge Card */}
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4">
              <div className="font-semibold text-[15px] text-[#222] dark:text-white mb-2">
                {currentPair} Technical Analysis
              </div>

              {/* Interval tabs */}
              <div className="flex gap-2 mb-4 items-center">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1 rounded font-medium text-xs transition-colors duration-150 ${
                      activeTab === tab
                        ? "bg-[#FFE6EA] text-[#222]"
                        : "bg-transparent text-[#222] hover:bg-gray-100 dark:text-white dark:hover:bg-[#2a2a2d]"
                    }`}
                    style={activeTab === tab ? { boxShadow: "0 1px 4px #ffe6ea" } : {}}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab}
                  </button>
                ))}
                <div className="flex items-center gap-1 cursor-pointer text-xs text-[#222] dark:text-white ml-2">
                  More <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="flex flex-col items-center">
                {/* Gauge SVG */}
                <div className="relative flex flex-col items-center justify-center" style={{ height: 180 }}>
                  <svg width={260} height={140} viewBox="0 0 260 140">
                    {/* Three colored arcs */}
                    <path d="M30,130 A100,100 0 0,1 80,55"  stroke="#FFE6EA" strokeWidth="24" fill="none" strokeLinecap="butt" />
                    <path d="M80,55 A100,100 0 0,1 180,55"  stroke="#C97A8D" strokeWidth="24" fill="none" strokeLinecap="butt" />
                    <path d="M180,55 A100,100 0 0,1 230,130" stroke="#4A0D0D" strokeWidth="24" fill="none" strokeLinecap="butt" />
                    {/* Dynamic needle */}
                    <GaugeNeedle angleDeg={nAngle} />
                  </svg>
                  {/* Label */}
                  <div className="absolute left-0 right-0 top-[160px] text-center text-[28px] font-normal text-[#222] dark:text-white select-none">
                    {label}
                  </div>
                </div>

                {/* Sell / Neutral / Buy counts */}
                <div className="flex justify-between w-full mt-6 px-2">
                  <div className="flex flex-col items-center">
                    <span className="text-base text-[#222] dark:text-white">Sell</span>
                    <span className="text-base font-semibold text-[#E57373]">{sell}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base text-[#222] dark:text-white">Neutral</span>
                    <span className="text-base font-semibold text-[#888] dark:text-white">{neutral}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base text-[#222] dark:text-white">Buy</span>
                    <span className="text-base font-semibold text-[#1976D2]">{buy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CENTER COLUMN ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Summary Card */}
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#4A0D0D] flex items-center justify-center text-white font-bold text-[10px]">
                  {symbolAbbr(currentPair)}
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#4A0D0D] dark:text-white leading-tight">
                    {currentExchange.toUpperCase()} · {currentPair}
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-1">
                <span className="text-2xl font-bold text-[#222] dark:text-white">{displayPrice}</span>
                {ticker && (
                  <span className={`text-base font-semibold ${pctClass(ticker.priceChangePct)}`}>
                    {ticker.priceChangePct >= 0 ? "+" : ""}{displayChangePct}%{" "}
                    <span className="text-xs">({displayChangeAbs})</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-2 dark:text-gray-400">
                Live Market · {hasData ? new Date().toLocaleString() : "—"}
              </div>

              <div className="flex gap-6 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <div className="text-gray-400 dark:text-gray-500">24h High</div>
                  <div className="font-semibold">{displayHigh}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500">24h Low</div>
                  <div className="font-semibold">{displayLow}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500">Change %</div>
                  <div className={`font-semibold ${pctClass(ticker?.priceChangePct ?? 0)}`}>
                    {ticker ? `${ticker.priceChangePct >= 0 ? "+" : ""}${displayChangePct}%` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Metrics Card (replaces Financials) */}
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4">
              <div className="font-semibold text-[15px] text-[#4A0D0D] mb-3 dark:text-white">
                Market Metrics
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">24h Volume (Base)</div>
                  <div className="font-semibold text-[#222] dark:text-white">{displayVol}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">24h Volume (Quote)</div>
                  <div className="font-semibold text-[#222] dark:text-white">{displayQuoteVol}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">24h High</div>
                  <div className="font-semibold text-[#222] dark:text-white">{displayHigh}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">24h Low</div>
                  <div className="font-semibold text-[#222] dark:text-white">{displayLow}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">Price Range</div>
                  <div className="font-semibold text-[#222] dark:text-white">{priceRange}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">Volatility (30-bar σ)</div>
                  <div className="font-semibold text-[#222] dark:text-white">{volatility}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">Trend Signal</div>
                  <div className={`font-semibold ${
                    label === "Buy" ? "text-green-600" :
                    label === "Sell" ? "text-red-500" :
                    "text-[#888]"
                  }`}>{label}</div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 mb-0.5">Candles Loaded</div>
                  <div className="font-semibold text-[#222] dark:text-white">
                    {candles.length > 0 ? candles.length : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Asset Info Card (replaces Profile) */}
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4 min-h-[320px]">
              <div className="font-semibold text-[15px] text-[#4A0D0D] mb-3 dark:text-white">
                Asset Info
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: "Symbol",      value: currentPair },
                  { label: "Exchange",    value: currentExchange },
                  { label: "Base Asset",  value: baseAsset || "—" },
                  { label: "Quote Asset", value: quoteAsset || "—" },
                  {
                    label: "24h Change",
                    value: ticker
                      ? `${ticker.priceChangePct >= 0 ? "+" : ""}${displayChangePct}%`
                      : "—",
                    valueClass: pctClass(ticker?.priceChangePct ?? 0),
                  },
                  { label: "24h Volume",  value: displayVol },
                  { label: "24h High",    value: displayHigh },
                  { label: "24h Low",     value: displayLow },
                  { label: "Current Price", value: displayPrice },
                ].map(({ label: lbl, value, valueClass }) => (
                  <div key={lbl} className="flex items-start gap-1">
                    <span className="font-semibold text-[#222] dark:text-white min-w-[110px]">{lbl}:</span>
                    <span className={valueClass ?? "text-gray-600 dark:text-gray-300"}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Indicator readings */}
              {hasData && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Indicator Summary
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`rounded-lg py-1.5 text-xs font-semibold ${
                      label === "Buy"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      Buy<br /><span className="text-base">{buy}</span>
                    </div>
                    <div className="rounded-lg py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-white">
                      Neutral<br /><span className="text-base">{neutral}</span>
                    </div>
                    <div className={`rounded-lg py-1.5 text-xs font-semibold ${
                      label === "Sell"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      Sell<br /><span className="text-base">{sell}</span>
                    </div>
                  </div>
                </div>
              )}

              {!hasData && !loading && (
                <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 italic">
                  Select an exchange and pair, then click "View Trends" to load live data.
                </div>
              )}
              {loading && (
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Fetching live data…
                </div>
              )}
            </div>
          </div>

        </div>{/* end 3-col grid */}
      </div>{/* end main content */}
    </div>
  );
}
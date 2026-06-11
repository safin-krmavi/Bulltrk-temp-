import { useEffect, useMemo, useState } from "react";
import { X, Download, TrendingUp, TrendingDown, Activity, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { apiurls } from "@/api/apiurls";
import {
  formatBacktestIntervalLabel,
  resolveBacktestTimeframe,
  type BacktestStrategyContext,
} from "@/utils/backtestTimeframe";

export type { BacktestStrategyContext };

interface BacktestFormData {
  name: string;
  from: string;
  to: string;
  timeframe: string;
  passphrase: string;
}

// API response shape — exactly what the server returns inside `data`
interface BacktestMetrics {
  winRate?: number;
  totalPnL?: number;
  avgTradePnL?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  totalTrades?: number;
  profitFactor?: number;
  pendingTrades?: number;
  returnPercentage?: number;
}

interface BacktestTrade {
  id?: string | number;
  type?: string;
  side?: string;
  dateTime?: string;
  date_time?: string;
  executedAt?: string;
  timestamp?: number;
  price?: number | string;
  quantity?: number | string;
  qty?: number | string;
  profit?: number | string;
  pnl?: number | string;
  [key: string]: any;
}

export interface BacktestResultData {
  // Core run fields
  name?: string;
  strategyType?: string;
  exchange?: string;
  symbol?: string;
  interval?: string;
  startDate?: string;
  endDate?: string;
  initialCapital?: number;
  status?: string;
  completedAt?: string;
  createdAt?: string;
  errorMessage?: string | null;
  passphrase?: string;
  params?: any;

  // Nested metrics
  metrics?: BacktestMetrics;

  // Trade list
  trades?: BacktestTrade[];

  // Equity curve
  equityCurve?: { value: number; timestamp: number }[];

  // Legacy / flat variants still supported
  netPL?: string | number;
  tradesExecuted?: number;
  pendingTrades?: number;
  avgTradePL?: string | number;
  backtestAvailable?: number;
  exportAvailable?: number;

  [key: string]: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null) return "—";
  return n.toFixed(decimals);
}

function fmtPnL(n: number | undefined | null): { text: string; positive: boolean } {
  if (n === undefined || n === null) return { text: "—", positive: true };
  const positive = n >= 0;
  return { text: `${positive ? "+" : ""}${n.toFixed(2)} USDT`, positive };
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

function intervalLabel(v: string | undefined): string {
  const map: Record<string, string> = {
    "1m": "1 Min", "5m": "5 Min", "15m": "15 Min", "30m": "30 Min",
    "1h": "1 Hour", "4h": "4 Hours", "1d": "1 Day", "1w": "1 Week", "1M": "1 Month",
  };
  return v ? (map[v] ?? v) : "—";
}

// ── Metric card ────────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, colorClass,
}: {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1d] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
        {label}
      </span>
      <span className={`text-sm font-bold truncate ${colorClass ?? "text-gray-900 dark:text-white"}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</span>
      )}
    </div>
  );
}

// ── Trades table ───────────────────────────────────────────────────────────────

function TradesTable({ trades }: { trades: BacktestTrade[] }) {
  const HEADERS = ["#", "Side / Type", "Executed At", "Price", "Qty", "P&L"];

  if (trades.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-[#1a1a1d]">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={HEADERS.length}
                className="px-3 py-8 text-center text-xs text-gray-400 dark:text-gray-500"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Activity className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  <span>No trade executions for this backtest run.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-50 dark:bg-[#1a1a1d]">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {trades.map((t, i) => {
            const rawPnl = t.profit ?? t.pnl ?? t.realizedPnl ?? t.realized_pnl ?? null;
            const pnlNum = rawPnl !== null ? Number(rawPnl) : null;
            const isPnlPositive = pnlNum !== null ? pnlNum >= 0 : true;
            const pnlText =
              pnlNum !== null
                ? `${isPnlPositive ? "+" : ""}${pnlNum.toFixed(2)} USDT`
                : "—";

            const rawPrice = t.price ?? t.executionPrice ?? t.avgPrice ?? null;
            const priceText =
              rawPrice !== null ? `${Number(rawPrice).toFixed(2)} USDT` : "—";

            const rawQty = t.quantity ?? t.qty ?? t.amount ?? t.size ?? null;
            const qtyText = rawQty !== null ? String(rawQty) : "—";

            const side = t.type ?? t.side ?? t.direction ?? t.orderType ?? "—";

            const rawDate =
              t.dateTime ?? t.date_time ?? t.executedAt ?? t.executed_at ??
              (t.timestamp ? new Date(t.timestamp).toISOString() : null);
            const dateText = rawDate ? fmtDate(rawDate) : "—";

            return (
              <tr
                key={i}
                className="hover:bg-gray-50 dark:hover:bg-[#2a2a2d] transition-colors"
              >
                <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  {t.id ?? i + 1}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{side}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {dateText}
                </td>
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{priceText}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{qtyText}</td>
                <td
                  className={`px-3 py-2 font-semibold ${
                    isPnlPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {pnlText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Backtest Input Dialog ──────────────────────────────────────────────────────

interface BacktestInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResults: (results: BacktestResultData, name: string) => void;
  strategyContext: BacktestStrategyContext;
}

export function BacktestInputDialog({
  isOpen,
  onClose,
  onResults,
  strategyContext,
}: BacktestInputDialogProps) {
  const resolvedTimeframe = useMemo(
    () => resolveBacktestTimeframe(strategyContext),
    [strategyContext],
  );

  const [form, setForm] = useState<BacktestFormData>({
    name: "",
    from: "",
    to: "",
    timeframe: resolvedTimeframe.interval,
    passphrase: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...prev,
      timeframe: resolvedTimeframe.interval,
    }));
  }, [isOpen, resolvedTimeframe.interval]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BacktestFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRunBacktest = async () => {
    if (!form.name.trim()) { toast.error("Backtest name is required"); return; }
    if (!form.from)        { toast.error("Start date (From) is required"); return; }
    if (!form.to)          { toast.error("End date (To) is required"); return; }
    if (new Date(form.from) >= new Date(form.to)) {
      toast.error("'From' date must be before 'To' date"); return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Running backtest...", {
      description: `${form.name} — ${strategyContext.symbol}`,
    });

    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) { toast.error("Authentication required", { id: toastId }); return; }

      const startDate = new Date(form.from);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(form.to);
      endDate.setUTCHours(23, 59, 59, 999);

      const payload = {
        strategyType:   strategyContext.strategyType || "GROWTH_DCA",
        exchange:       strategyContext.exchange || "BINANCE",
        symbol:         (strategyContext.symbol || "BTCUSDT").toUpperCase(),
        interval:       resolvedTimeframe.interval,
        startDate:      startDate.toISOString(),
        endDate:        endDate.toISOString(),
        initialCapital: strategyContext.investmentCap || 10000,
        name:           form.name,
        passphrase:     form.passphrase || "default-passphrase",
        params: {
          segment: (strategyContext.segment || "SPOT").toUpperCase(),
          capital: {
            perOrderAmount: strategyContext.investmentPerRun || 100,
            maxCapital:     strategyContext.investmentCap || 5000,
          },
          dca: { maxOrders: 20, priceDropPercent: 2 },
        },
      };

      const response = await apiClient.post(apiurls.backtest.run, payload);

      toast.success("Backtest completed!", {
        id: toastId,
        description: "View the summary below",
        duration: 4000,
      });

      // The server wraps result in { success, message, data: { ... } }
      const resultData = response.data?.data ?? response.data ?? {};
      onResults(resultData, form.name);
      onClose();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to run backtest";
      toast.error("Backtest failed", { id: toastId, description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="w-full max-w-[580px] bg-white dark:bg-[#232326] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Backtest Values</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Backtest Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={form.from}
                onChange={(e) => handleChange("from", e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={form.to}
                onChange={(e) => handleChange("to", e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Row 2 — duration/timeframe from strategy (read-only) or hidden */}
          <div
            className={
              resolvedTimeframe.mode === "display"
                ? "grid grid-cols-2 gap-4"
                : "grid grid-cols-1 gap-4"
            }
          >
            {resolvedTimeframe.mode === "display" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {resolvedTimeframe.fieldLabel}
                </label>
                <Input
                  readOnly
                  disabled
                  value={`${resolvedTimeframe.label} (${formatBacktestIntervalLabel(resolvedTimeframe.interval)})`}
                  className="h-9 text-sm bg-gray-50 dark:bg-[#1a1a1d] cursor-default"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Type</label>
              <Input
                placeholder="Enter Pass Phrase"
                value={form.passphrase}
                onChange={(e) => handleChange("passphrase", e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-3 px-6 pb-5">
          <Button
            onClick={handleRunBacktest}
            disabled={isSubmitting}
            className="px-10 h-10 bg-[#4A1C24] hover:bg-[#3a1620] text-white font-semibold text-sm shadow-md"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </span>
            ) : (
              "Run Backtest"
            )}
          </Button>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-10 h-10 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-sm shadow-md"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Backtest Results Dialog ────────────────────────────────────────────────────

interface BacktestResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: BacktestResultData | null;
  backtestName?: string;
}

export function BacktestResultsDialog({
  isOpen,
  onClose,
  results,
  backtestName,
}: BacktestResultsDialogProps) {
  if (!isOpen || !results) return null;

  // ── Pull metrics (prefer nested metrics object) ──────────────────────────────
  const m = results.metrics ?? {};

  const totalPnL       = m.totalPnL       ?? results.netPL       ?? null;
  const totalTrades    = m.totalTrades    ?? results.tradesExecuted ?? 0;
  const pendingTrades  = m.pendingTrades  ?? results.pendingTrades  ?? 0;
  const avgTradePnL    = m.avgTradePnL    ?? results.avgTradePL     ?? null;
  const winRate        = m.winRate        ?? null;
  const maxDrawdown    = m.maxDrawdown    ?? null;
  const sharpeRatio    = m.sharpeRatio    ?? null;
  const returnPct      = m.returnPercentage ?? null;
  const profitFactor   = m.profitFactor   ?? null;

  const { text: pnlText, positive: pnlPositive } = fmtPnL(totalPnL as number | null);
  const { text: avgPnlText, positive: avgPositive } = fmtPnL(avgTradePnL as number | null);

  // ── Run info ─────────────────────────────────────────────────────────────────
  const displayName     = results.name    ?? backtestName ?? "—";
  const strategyType    = results.strategyType ?? "—";
  const exchange        = results.exchange     ?? "—";
  const symbol          = results.symbol       ?? "—";
  const interval        = intervalLabel(results.interval);
  const startDate       = fmtDate(results.startDate);
  const endDate         = fmtDate(results.endDate);
  const initialCapital  = results.initialCapital ?? null;
  const status          = results.status ?? "—";
  const completedAt     = fmtDate(results.completedAt);

  const trades: BacktestTrade[] = Array.isArray(results.trades) ? results.trades : [];

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const rows = [
        ["#", "Side/Type", "Executed At", "Price (USDT)", "Qty", "P&L (USDT)"],
        ...trades.map((t, i) => {
          const rawPnl = t.profit ?? t.pnl ?? t.realizedPnl ?? "";
          const rawPrice = t.price ?? t.executionPrice ?? "";
          const rawQty   = t.quantity ?? t.qty ?? "";
          const rawDate  = t.dateTime ?? t.date_time ?? t.executedAt ??
            (t.timestamp ? new Date(t.timestamp).toISOString() : "");
          return [
            t.id ?? i + 1,
            t.type ?? t.side ?? "",
            rawDate,
            rawPrice !== "" ? Number(rawPrice).toFixed(2) : "",
            rawQty,
            rawPnl !== "" ? Number(rawPnl).toFixed(2) : "",
          ];
        }),
      ].map((r) => r.join(",")).join("\n");

      const blob = new Blob([rows], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `backtest-${displayName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully");
    } catch {
      toast.error("Export failed");
    }
  };

  const statusColor =
    status === "DONE"
      ? "text-green-600 dark:text-green-400"
      : status === "FAILED"
      ? "text-red-500 dark:text-red-400"
      : "text-amber-500 dark:text-amber-400";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="w-full max-w-[740px] max-h-[90vh] bg-white dark:bg-[#232326] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${
                status === "DONE"
                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                  : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
              }`}
            >
              {status === "DONE" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* ── Run summary strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs bg-gray-50 dark:bg-[#1a1a1d] rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
            {[
              { label: "Strategy",       value: strategyType },
              { label: "Exchange",       value: `${exchange} · ${symbol}` },
              { label: "Interval",       value: interval },
              { label: "Initial Capital",value: initialCapital !== null ? `${initialCapital.toLocaleString()} USDT` : "—" },
              { label: "Start Date",     value: startDate },
              { label: "End Date",       value: endDate },
              { label: "Completed",      value: completedAt },
              {
                label: "Status",
                value: status,
                className: statusColor,
              },
            ].map(({ label, value, className }) => (
              <div key={label}>
                <span className="text-gray-500 dark:text-gray-400">{label}: </span>
                <span className={`font-semibold text-gray-800 dark:text-gray-200 ${className ?? ""}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Metrics grid ── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricCard
                label="Net P&L"
                value={pnlText}
                colorClass={pnlPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
              />
              <MetricCard
                label="Return %"
                value={returnPct !== null ? `${returnPct >= 0 ? "+" : ""}${fmt(returnPct)}%` : "—"}
                colorClass={returnPct !== null && returnPct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
              />
              <MetricCard
                label="Win Rate"
                value={winRate !== null ? `${fmt(winRate * 100)}%` : "—"}
              />
              <MetricCard
                label="Avg Trade P&L"
                value={avgPnlText}
                colorClass={avgPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
              />
              <MetricCard
                label="Total Trades"
                value={String(totalTrades)}
              />
              <MetricCard
                label="Pending Trades"
                value={String(pendingTrades)}
              />
              <MetricCard
                label="Max Drawdown"
                value={maxDrawdown !== null ? `${fmt(maxDrawdown)}%` : "—"}
                colorClass="text-red-500 dark:text-red-400"
              />
              <MetricCard
                label="Sharpe Ratio"
                value={sharpeRatio !== null ? fmt(sharpeRatio, 3) : "—"}
              />
              {profitFactor !== null && profitFactor > 0 && (
                <MetricCard
                  label="Profit Factor"
                  value={fmt(profitFactor, 3)}
                  colorClass={profitFactor >= 1 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
                />
              )}
            </div>
          </div>

          {/* ── Trades table ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Trade Executions
                <span className="ml-2 normal-case font-normal text-gray-400 dark:text-gray-500">
                  ({trades.length} {trades.length === 1 ? "trade" : "trades"})
                </span>
              </h3>
              {trades.length > 0 && (
                <Button
                  onClick={handleExport}
                  size="sm"
                  className="bg-[#4A1C24] hover:bg-[#3a1620] text-white h-7 px-3 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              )}
            </div>
            <TradesTable trades={trades} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            {pnlPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={pnlPositive ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-500 dark:text-red-400 font-semibold"}>
              {pnlText}
            </span>
            <span className="mx-1">·</span>
            <span>{totalTrades} trades</span>
          </div>
          <Button
            onClick={onClose}
            className="px-8 h-9 bg-[#4A1C24] hover:bg-[#3a1620] text-white font-semibold text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

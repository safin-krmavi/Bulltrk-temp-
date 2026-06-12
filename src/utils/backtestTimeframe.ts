export interface BacktestStrategyContext {
  strategyType: string;
  exchange: string;
  symbol: string;
  segment?: string;
  investmentPerRun: number;
  investmentCap: number;
  frequency?: string;
  frequencyData?: {
    type?: string;
    intervalHours?: number;
    time?: string;
    days?: number[];
    dates?: number[];
  };
  hourInterval?: number;
  timeFrame?: string;
  timeframe?: string;
  lowerLimit?: number;
  upperLimit?: number;
  entryInterval?: number;
  bookProfitBy?: number;
  levels?: number;
  direction?: string;
  type?: string;
}

export type ResolvedBacktestTimeframe =
  | { mode: "hidden"; interval: string }
  | { mode: "display"; interval: string; label: string; fieldLabel: string };

const INTERVAL_LABELS: Record<string, string> = {
  "1m": "1 Minute",
  "3m": "3 Minutes",
  "5m": "5 Minutes",
  "15m": "15 Minutes",
  "30m": "30 Minutes",
  "1h": "1 Hour",
  "2h": "2 Hours",
  "4h": "4 Hours",
  "6h": "6 Hours",
  "8h": "8 Hours",
  "12h": "12 Hours",
  "1d": "1 Day",
  "3d": "3 Days",
  "1w": "1 Week",
  "1M": "1 Month",
};

export function formatBacktestIntervalLabel(interval: string): string {
  return INTERVAL_LABELS[interval] ?? interval;
}

const BINANCE_HOURLY_INTERVALS = new Set([1, 2, 4, 6, 8, 12]);

function normalizeCandleInterval(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const aliases: Record<string, string> = {
    "1min": "1m",
    "5min": "5m",
    "15min": "15m",
    "30min": "30m",
    "1hour": "1h",
    "2hour": "2h",
    "4hour": "4h",
    "1day": "1d",
    "1week": "1w",
  };
  return aliases[t] ?? t;
}

function growthDcaInterval(ctx: BacktestStrategyContext): string {
  const freq = (
    ctx.frequency ||
    ctx.frequencyData?.type ||
    ""
  ).toUpperCase();

  switch (freq) {
    case "HOURLY": {
      const hours = Number(
        ctx.frequencyData?.intervalHours ?? ctx.hourInterval ?? 1,
      );
      const h = BINANCE_HOURLY_INTERVALS.has(hours) ? hours : 1;
      return `${h}h`;
    }
    case "DAILY":
      return "1d";
    case "WEEKLY":
      return "1d";
    case "MONTHLY":
      return "1d";
    default:
      return "1d";
  }
}

function growthDcaDisplayLabel(ctx: BacktestStrategyContext): string {
  const freq = (
    ctx.frequency ||
    ctx.frequencyData?.type ||
    ""
  ).toUpperCase();

  switch (freq) {
    case "HOURLY": {
      const hours = Number(
        ctx.frequencyData?.intervalHours ?? ctx.hourInterval ?? 1,
      );
      const h = BINANCE_HOURLY_INTERVALS.has(hours) ? hours : 1;
      return h === 1 ? "Hourly" : `Every ${h} hours`;
    }
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    default:
      return formatBacktestIntervalLabel(growthDcaInterval(ctx));
  }
}

/**
 * Derives backtest candle interval from the strategy under review.
 * - Growth DCA / candle strategies: show read-only duration or timeframe.
 * - Grid strategies (no schedule): hide UI; use 1m candles internally.
 */
export function resolveBacktestTimeframe(
  ctx: BacktestStrategyContext,
): ResolvedBacktestTimeframe {
  const type = (ctx.strategyType || "GROWTH_DCA").toUpperCase();

  switch (type) {
    case "GROWTH_DCA":
      return {
        mode: "display",
        interval: growthDcaInterval(ctx),
        label: growthDcaDisplayLabel(ctx),
        fieldLabel: "Duration",
      };

    case "PRICE_ACTION":
    case "UTC":
    case "INDY_TREND":
    case "LESI": {
      const interval = normalizeCandleInterval(
        ctx.timeFrame || ctx.timeframe,
      );
      if (interval) {
        return {
          mode: "display",
          interval,
          label: formatBacktestIntervalLabel(interval),
          fieldLabel: "Time Frame",
        };
      }
      return { mode: "hidden", interval: "5m" };
    }

    case "HUMAN_GRID":
    case "SMART_GRID":
    case "NLP_STRATEGY":
    default:
      return { mode: "hidden", interval: "1m" };
  }
}

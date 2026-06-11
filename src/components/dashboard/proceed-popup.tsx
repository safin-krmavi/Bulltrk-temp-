import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from 'react'
import { BacktestInputDialog, BacktestResultsDialog } from './backtest-dialog'
import type { BacktestStrategyContext } from '@/utils/backtestTimeframe'

interface StrategyData {
  // Account Details
  selectedApi: string;
  exchange: string;
  segment: string;
  pair: string;

  // Common Strategy Details
  name: string;
  investmentPerRun: number;
  investmentCap: number;
  strategyType?: 'GROWTH_DCA' | 'HUMAN_GRID' | 'SMART_GRID' | 'PRICE_ACTION' | 'UTC';

  // Growth DCA specific fields
  frequency?: string;
  frequencyData?: any;
  takeProfitPct?: number;
  priceStart?: number;
  priceStop?: number;
  stopLossPct?: number;

  // Human Grid specific fields
  lowerLimit?: number;
  upperLimit?: number;
  leverage?: number;
  direction?: string;
  entryInterval?: number;
  bookProfitBy?: number;

  // Smart Grid specific fields
  levels?: number;
  profitPercentage?: number;
  dataSetDays?: number;
  gridMode?: string;

  // Price Action / UTC / LESI candle timeframe
  quantity?: number;
  timeframe?: string;
  timeFrame?: string;
  pattern_confidence?: number;
  support_resistance_strength?: number;
  breakout_threshold?: number;
  risk_level?: string;
  supportLevel?: number;
  candlestickPattern?: number;
  operator?: string;
}

interface ProceedPopupProps {
  strategyData: StrategyData;
  onClose: () => void;
  onConfirm: (executionMode: 'LIVE' | 'PUBLISHED') => void;
  isLoading?: boolean;
}

export function ProceedPopup({
  strategyData,
  onClose,
  onConfirm,
  isLoading = false
}: ProceedPopupProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Backtest dialog state
  const [showBacktestInput, setShowBacktestInput] = useState(false);
  const [showBacktestResults, setShowBacktestResults] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [backtestName, setBacktestName] = useState<string>('');

  const isHumanGrid = strategyData.strategyType === 'HUMAN_GRID';
  const isSmartGrid = strategyData.strategyType === 'SMART_GRID';
  const isPriceAction = strategyData.strategyType === 'PRICE_ACTION';
  const isUTC = strategyData.strategyType === 'UTC';
  const isFutures = strategyData.segment?.toUpperCase() === 'FUTURES';

  const accountDetails = [
    { label: 'API Connection', value: strategyData.selectedApi },
    { label: 'Exchange', value: strategyData.exchange },
    { label: 'Segment', value: strategyData.segment },
    { label: 'Trading Pair', value: strategyData.pair },
  ];

  // Bot Details - Dynamic based on strategy type
  const getBotDetails = () => {
    if (isSmartGrid) {
      return [
        { label: 'Strategy Name', value: strategyData.name },
        { label: 'Strategy Type', value: 'Smart Grid' },
        { label: 'Asset Type', value: 'CRYPTO' },
        { label: 'Investment Per Run', value: `${strategyData.investmentPerRun} USDT` },
        { label: 'Investment CAP', value: `${strategyData.investmentCap} USDT` },
        { label: 'Lower Limit', value: `${strategyData.lowerLimit} USDT` },
        { label: 'Upper Limit', value: `${strategyData.upperLimit} USDT` },
        { label: 'Levels', value: `${strategyData.levels}` },
        { label: 'Direction', value: strategyData.direction || 'NEUTRAL' },
      ];
    }

    if (isHumanGrid) {
      return [
        { label: 'Strategy Name', value: strategyData.name },
        { label: 'Strategy Type', value: 'Human Grid' },
        { label: 'Asset Type', value: 'CRYPTO' },
        { label: 'Investment Per Run', value: `${strategyData.investmentPerRun} USDT` },
        { label: 'Investment CAP', value: `${strategyData.investmentCap} USDT` },
        { label: 'Lower Limit', value: `${strategyData.lowerLimit} USDT` },
        { label: 'Upper Limit', value: `${strategyData.upperLimit} USDT` },
        ...(isFutures && strategyData.leverage ? [{ label: 'Leverage', value: `${strategyData.leverage}x` }] : []),
        ...(isFutures && strategyData.direction ? [{ label: 'Direction', value: strategyData.direction }] : []),
      ];
    }

    if (isPriceAction) {
      return [
        { label: 'Strategy Name', value: strategyData.name },
        { label: 'Strategy Type', value: 'Price Action' },
        { label: 'Asset Type', value: 'CRYPTO' },
        { label: 'Risk Level', value: strategyData.risk_level?.toUpperCase() || 'SAFE' },
        { label: 'Time Frame', value: strategyData.timeframe || 'N/A' },
        { label: 'Investment', value: `${strategyData.investmentPerRun || 0} USDT` },
        { label: 'Investment CAP', value: `${strategyData.investmentCap || 0} USDT` },
      ];
    }

    if (isUTC) {
      return [
        { label: 'Strategy Name', value: strategyData.name },
        { label: 'Strategy Type', value: 'Indy UTC' },
        { label: 'Asset Type', value: 'CRYPTO' },
        { label: 'Investment Per Run', value: `${strategyData.investmentPerRun} USDT` },
        { label: 'Investment CAP', value: `${strategyData.investmentCap} USDT` },
        { label: 'Time Frame', value: strategyData.timeFrame || strategyData.timeframe || 'N/A' },
        ...(isFutures && strategyData.leverage
          ? [{ label: 'Leverage', value: `${strategyData.leverage}x` }]
          : []),
      ];
    }

    // Growth DCA
    const formatTime = (time24?: string) => {
      if (!time24) return null;
      try {
        const [hour, min] = time24.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        return time24;
      }
    };

    return [
      { label: 'Strategy Name', value: strategyData.name },
      { label: 'Strategy Type', value: 'Growth DCA' },
      { label: 'Asset Type', value: 'CRYPTO' },
      { label: 'Investment Per Run', value: `${strategyData.investmentPerRun} USDT` },
      { label: 'Investment CAP', value: `${strategyData.investmentCap} USDT` },
      { label: 'Frequency', value: strategyData.frequency || 'N/A' },
      ...(strategyData.frequency === 'WEEKLY' && strategyData.frequencyData?.days 
        ? [{ label: 'Days', value: strategyData.frequencyData.days.join(', ') }] 
        : []),
      ...(strategyData.frequency === 'MONTHLY' && strategyData.frequencyData?.dates 
        ? [{ label: 'Dates', value: strategyData.frequencyData.dates.join(', ') }] 
        : []),
      ...(strategyData.frequency === 'HOURLY' && strategyData.frequencyData?.intervalHours 
        ? [{ label: 'Interval', value: `Every ${strategyData.frequencyData.intervalHours} hours` }] 
        : []),
      ...(strategyData.frequency !== 'HOURLY' && strategyData.frequencyData?.time 
        ? [{ label: 'Scheduled Time', value: formatTime(strategyData.frequencyData.time) || 'N/A' }] 
        : []),
      { label: 'Take Profit %', value: `${strategyData.takeProfitPct || 0}%` },
    ];
  };

  // Advanced Settings - Dynamic based on strategy type
  const getAdvancedSettings = () => {
    if (isSmartGrid) {
      return [
        { label: 'Profit Percentage', value: `${strategyData.profitPercentage}%` },
        { label: 'Data Set Days', value: `${strategyData.dataSetDays} days` },
        { label: 'Grid Mode', value: strategyData.gridMode || 'STATIC' },
        { label: 'Stop Loss %', value: strategyData.stopLossPct ? `${strategyData.stopLossPct}%` : 'N/A' },
      ];
    }

    if (isHumanGrid) {
      return [
        { label: 'Entry Interval', value: `${strategyData.entryInterval} Pts` },
        { label: 'Book Profit By', value: `${strategyData.bookProfitBy}%` },
        { label: 'Stop Loss %', value: strategyData.stopLossPct ? `${strategyData.stopLossPct}%` : 'N/A' },
      ];
    }

    if (isPriceAction) {
      return [
        { label: 'Price Trigger Start', value: strategyData.priceStart ? `${strategyData.priceStart} USDT` : 'N/A' },
        { label: 'Price Trigger Stop', value: strategyData.priceStop ? `${strategyData.priceStop} USDT` : 'N/A' },
        { label: 'Take Profit', value: strategyData.takeProfitPct ? `${strategyData.takeProfitPct}%` : 'N/A' },
        { label: 'Stop Loss By', value: strategyData.stopLossPct ? `${strategyData.stopLossPct}%` : 'N/A' },
      ];
    }

    if (isUTC) {
      return [
        { label: 'Lower Limit', value: strategyData.lowerLimit ? `${strategyData.lowerLimit} USDT` : 'N/A' },
        { label: 'Upper Limit', value: strategyData.upperLimit ? `${strategyData.upperLimit} USDT` : 'N/A' },
        { label: 'Price Trigger Start', value: strategyData.priceStart ? `${strategyData.priceStart} USDT` : 'N/A' },
        { label: 'Price Trigger Stop', value: strategyData.priceStop ? `${strategyData.priceStop} USDT` : 'N/A' },
        { label: 'Take Profit %', value: strategyData.takeProfitPct ? `${strategyData.takeProfitPct}%` : 'N/A' },
        { label: 'Stop Loss %', value: strategyData.stopLossPct ? `${strategyData.stopLossPct}%` : 'N/A' },
      ];
    }

    // Growth DCA
    return [
      { label: 'Price Start', value: (strategyData.priceStart && strategyData.priceStart !== 0) ? `${strategyData.priceStart} USDT` : 'N/A' },
      { label: 'Price Stop', value: (strategyData.priceStop && strategyData.priceStop !== 0) ? `${strategyData.priceStop} USDT` : 'N/A' },
      { label: 'Stop Loss %', value: (strategyData.stopLossPct && strategyData.stopLossPct !== 0) ? `${strategyData.stopLossPct}%` : 'N/A' },
    ];
  };

  const sections = [
    { title: 'Account Details', fields: accountDetails },
    { title: 'Bot Details', fields: getBotDetails() },
    { title: 'Advanced Settings', fields: getAdvancedSettings() },
  ];

  // Build context object for the backtest API
  const backtestContext: BacktestStrategyContext = {
    strategyType: strategyData.strategyType ?? 'GROWTH_DCA',
    exchange: strategyData.exchange,
    segment: strategyData.segment,
    symbol: strategyData.pair,
    investmentPerRun: strategyData.investmentPerRun,
    investmentCap: strategyData.investmentCap,
    frequency: strategyData.frequency,
    frequencyData: strategyData.frequencyData,
    hourInterval: strategyData.frequencyData?.intervalHours,
    timeFrame: strategyData.timeframe ?? (strategyData as { timeFrame?: string }).timeFrame,
    timeframe: strategyData.timeframe,
  };

  const handleBacktestResults = (results: any, name: string) => {
    setBacktestResults(results);
    setBacktestName(name);
    setShowBacktestInput(false);
    setShowBacktestResults(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl bg-white dark:bg-[#232326]">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-white dark:bg-[#232326] rounded-lg">
            <h2 className="text-lg font-semibold">Strategy Review</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isLoading}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Sections */}
              {sections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold mb-2 text-sm border-b pb-1">{section.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[120px]">
                          {field.label}:
                        </span>
                        <span className="text-xs font-medium ml-2 truncate">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Terms & Conditions */}
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer leading-tight"
                >
                  I Agree to Bulltrek's Terms &amp; Conditions, Privacy policy and disclaimers <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                  onClick={() => onConfirm('LIVE')}
                  disabled={!agreedToTerms || isLoading}
                >
                  {isLoading ? "Processing..." : "Run On Live Market"}
                </Button>
                <Button
                  className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button
                  className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                  onClick={() => onConfirm('PUBLISHED')}
                  disabled={!agreedToTerms || isLoading}
                >
                  Publish
                </Button>
                <Button
                  className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white h-9 text-sm font-semibold"
                  onClick={() => setShowBacktestInput(true)}
                  disabled={isLoading}
                >
                  Backtest
                </Button>
              </div>

              {/* Note */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">

              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backtest Input Dialog */}
      <BacktestInputDialog
        isOpen={showBacktestInput}
        onClose={() => setShowBacktestInput(false)}
        onResults={(results, name) => handleBacktestResults(results, name)}
        strategyContext={backtestContext}
      />

      {/* Backtest Results Dialog */}
      <BacktestResultsDialog
        isOpen={showBacktestResults}
        onClose={() => setShowBacktestResults(false)}
        results={backtestResults}
        backtestName={backtestName}
      />
    </>
  );
}
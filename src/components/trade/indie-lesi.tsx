'use client'

import * as React from "react"
import { ChevronDown, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { toast } from "sonner"
import apiClient from "@/api/apiClient"
import { apiurls } from "@/api/apiurls"
import { useStrategyStore } from "@/stores/strategystore"

export default function IndyLESI() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)

  // Account details from AccountDetailsCard
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");
  const [quoteAsset, setQuoteAsset] = useState("USDT");
  const [showRequiredFieldsWarning, setShowRequiredFieldsWarning] = React.useState(false);

  // Form state
  const [strategyName, setStrategyName] = React.useState("");
  const [investment, setInvestment] = React.useState("");
  const [investmentCap, setInvestmentCap] = React.useState("");
  const [timeFrame, setTimeFrame] = React.useState("5m");
  const [leverage, setLeverage] = React.useState("");
  const [lowerLimit, setLowerLimit] = React.useState("");
  const [upperLimit, setUpperLimit] = React.useState("");
  const [priceTriggerStart, setPriceTriggerStart] = React.useState("");
  const [priceTriggerStop, setPriceTriggerStop] = React.useState("");
  const [stopLossBy, setStopLossBy] = React.useState("");

  // Advanced settings — LC
  const [lcEnabled, setLcEnabled] = React.useState(false);
  const [lcSource, setLcSource] = React.useState("close");

  // Advanced settings — EMA
  const [emaEnabled, setEmaEnabled] = React.useState(false);
  const [emaLength, setEmaLength] = React.useState("200");
  const [emaSource, setEmaSource] = React.useState("close");

  // Advanced settings — LaRSI
  const [laRsiEnabled, setLaRsiEnabled] = React.useState(false);
  const [laRsiSource, setLaRsiSource] = React.useState("close");
  const [laRsiAlpha, setLaRsiAlpha] = React.useState("0.2");

  // Feedback
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [availableBalance, setAvailableBalance] = useState<string>("0");

  const { 
    allExchangesBalances, 
    fetchAllExchangesBalances, 
    isLoadingBalances, 
    balancesError,
    fetchBalances,
    getBalanceByAsset
  } = useStrategyStore();

  // Callback to receive data from AccountDetailsCard
  const handleAccountDetailsChange = (data: {
    selectedApi: string;
    exchange: string;
    segment: string;
    pair: string;
    quote: string;
  }) => {
    console.log("Account details received:", data);
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
    setQuoteAsset(data.quote);
  };

  // Update required fields warning
  React.useEffect(() => {
    const hasRequiredFields = selectedApiId && exchange && segment && symbol;
    setShowRequiredFieldsWarning(!hasRequiredFields);
  }, [selectedApiId, exchange, segment, symbol]);

  // Fetch balances for the quote asset when it changes
  React.useEffect(() => {
    if (quoteAsset) {
      fetchAllExchangesBalances(quoteAsset).catch(err => {
        console.error("Failed to fetch multi-exchange balances:", err);
      });
    }
  }, [quoteAsset, fetchAllExchangesBalances]);

  // Update available balance when exchange, segment or balance data changes
  React.useEffect(() => {
    if (allExchangesBalances && exchange && segment) {
      const exchangeKey = exchange.toUpperCase();
      const segmentKey = segment.toUpperCase() as 'SPOT' | 'FUTURES';
      
      const balance = allExchangesBalances.balances?.[exchangeKey]?.[segmentKey];
      
      if (balance !== undefined) {
        setAvailableBalance(balance.toFixed(2));
      } else {
        setAvailableBalance("0");
      }
    }
  }, [exchange, segment, allExchangesBalances]);

  // Fallback to fetchBalances if multi-exchange balance is not available yet
  // This ensures backward compatibility or loading data for the first time
  React.useEffect(() => {
    if (exchange && segment && !allExchangesBalances) {
      fetchBalances(exchange, segment).catch(err => console.error(err));
    }
  }, [exchange, segment, allExchangesBalances, fetchBalances]);

  // Update available balance from old balances if allExchangesBalances is not available
  React.useEffect(() => {
    if (!allExchangesBalances && quoteAsset) {
      const balance = getBalanceByAsset(quoteAsset);
      if (balance) setAvailableBalance(parseFloat(balance.free).toFixed(2));
    }
  }, [allExchangesBalances, quoteAsset, getBalanceByAsset]);

  // Get missing fields for warning
  const getMissingFields = () => {
    const missing = [];
    if (!selectedApiId) missing.push("API Connection");
    if (!exchange) missing.push("Exchange");
    if (!segment) missing.push("Segment");
    if (!symbol) missing.push("Trading Pair");
    return missing;
  };

  // Validate form — only Name, Investment, and Investment Cap are required
  const validateForm = () => {
    if (!strategyName.trim()) {
      toast.error("Please enter a strategy name", {
        description: "Give your strategy a unique name"
      });
      return false;
    }
    if (!investment || Number(investment) <= 0) {
      toast.error("Invalid investment amount", {
        description: "Enter a valid amount greater than 0"
      });
      return false;
    }
    if (!investmentCap || Number(investmentCap) <= 0) {
      toast.error("Invalid investment cap", {
        description: "Enter a valid amount greater than 0"
      });
      return false;
    }
    if (Number(investmentCap) < Number(investment)) {
      toast.error("Invalid investment cap", {
        description: "Investment cap must be greater than or equal to investment"
      });
      return false;
    }
    return true;
  };

  // API call handler
  const handleProceed = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        name: strategyName.trim(),
        strategyType: "INDY_LESI",
        assetType: "CRYPTO",
        exchange: exchange.toUpperCase(),
        segment: segment.toUpperCase(),
        symbol: symbol.toUpperCase(),
        executionMode: "LIVE",
        timeFrame,
        investmentPerRun: Number(investment),
        investmentCap: Number(investmentCap),
        advancedSettings: {
          lc: { enabled: lcEnabled, source: lcSource },
          ema: { enabled: emaEnabled, length: Number(emaLength), source: emaSource },
          laRsi: { enabled: laRsiEnabled, source: laRsiSource, alpha: Number(laRsiAlpha) },
        },
      };

      // Only include optional fields when provided
      if (leverage && Number(leverage) > 0) payload.leverage = Number(leverage);
      if (lowerLimit && Number(lowerLimit) > 0) payload.lowerLimit = Number(lowerLimit);
      if (upperLimit && Number(upperLimit) > 0) payload.upperLimit = Number(upperLimit);
      if (priceTriggerStart && Number(priceTriggerStart) > 0) payload.priceStart = Number(priceTriggerStart);
      if (priceTriggerStop && Number(priceTriggerStop) > 0) payload.priceStop = Number(priceTriggerStop);
      if (stopLossBy && Number(stopLossBy) > 0) payload.stopLossPct = Number(stopLossBy);

      console.log("[IndyLESI] Payload:", payload);

      const response = await apiClient.post(apiurls.strategies.create, payload);

      console.log("[IndyLESI] Response:", response.data);

      toast.success("Strategy created successfully!", {
        description: `${strategyName} is now active and running`,
        duration: 5000,
      });

      setSuccess("Indy LESI strategy created successfully.");
      handleReset();
    } catch (err: any) {
      console.error("Strategy creation error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Something went wrong.";
      setError(errorMsg);
      toast.error("Failed to create strategy", {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStrategyName("");
    setInvestment("");
    setInvestmentCap("");
    setTimeFrame("5m");
    setLeverage("");
    setLowerLimit("");
    setUpperLimit("");
    setPriceTriggerStart("");
    setPriceTriggerStop("");
    setStopLossBy("");
    setLcEnabled(false);
    setLcSource("close");
    setEmaEnabled(false);
    setEmaLength("200");
    setEmaSource("close");
    setLaRsiEnabled(false);
    setLaRsiSource("close");
    setLaRsiAlpha("0.2");
    setError("");
    setSuccess("");

    // toast.success("Form reset", {
    //   description: "All fields have been cleared"
    // });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />

      {/* Required Fields Warning */}
      {showRequiredFieldsWarning && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-400">
            <span className="font-semibold">Required fields missing:</span>
            <span className="ml-1">{getMissingFields().join(", ")}</span>
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 border border-t-0 font-medium text-white hover:bg-[#5A2525]">
            <span>Indy LESI</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
            {/* Strategy Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Strategy Name
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <Input
                placeholder="Enter Name"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
              />
            </div>

            {/* Investment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={investment}
                  onChange={(e) => setInvestment(e.target.value)}
                  type="number"
                  step="0.01"
                />
                <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                  {quoteAsset}
                </div>
              </div>
              {isLoadingBalances ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                  Loading balance...
                </p>
              ) : balancesError ? (
                <p className="text-sm text-red-500">Failed to load balance</p>
              ) : (
                <p className="text-sm text-orange-500">Avbl: {availableBalance} {quoteAsset}</p>
              )}
            </div>

            {/* Investment CAP */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment CAP
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={investmentCap}
                  onChange={(e) => setInvestmentCap(e.target.value)}
                  type="number"
                  step="0.01"
                />
                <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                  {quoteAsset}
                </div>
              </div>
            </div>

            {/* Time Frame */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Time Frame
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leverage */}
            <div className="space-y-2">
              <Label>Leverage</Label>
              <Input
                placeholder="Value"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                type="number"
                step="0.1"
              />
            </div>

            {/* Lower and Upper Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Lower Limit
                  <span className="text-muted-foreground text-xs">ⓘ</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={lowerLimit}
                    onChange={(e) => setLowerLimit(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                    {quoteAsset}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Upper Limit
                  <span className="text-muted-foreground text-xs">ⓘ</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={upperLimit}
                    onChange={(e) => setUpperLimit(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                    {quoteAsset}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Trigger Start */}
            <div className="space-y-2">
              <Label>Price Trigger Start</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={priceTriggerStart}
                  onChange={(e) => setPriceTriggerStart(e.target.value)}
                  type="number"
                  step="0.01"
                />
                <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                  {symbol || "—"}
                </div>
              </div>
            </div>

            {/* Price Trigger Stop */}
            <div className="space-y-2">
              <Label>Price Trigger Stop</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={priceTriggerStop}
                  onChange={(e) => setPriceTriggerStop(e.target.value)}
                  type="number"
                  step="0.01"
                />
                <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                  {symbol || "—"}
                </div>
              </div>
            </div>

            {/* Stop Loss By */}
            <div className="space-y-2">
              <Label>Stop Loss By</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={stopLossBy}
                  onChange={(e) => setStopLossBy(e.target.value)}
                  type="number"
                  step="0.01"
                />
                <Select value="%" disabled>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
            <span>Advanced Settings</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
            {/* LC */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="lc"
                  checked={lcEnabled}
                  onCheckedChange={(checked) => setLcEnabled(!!checked)}
                />
                <label htmlFor="lc" className="text-sm font-medium cursor-pointer">LC</label>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Source</Label>
                <Select value={lcSource} onValueChange={setLcSource}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="close">Close</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="hl2">HL2</SelectItem>
                    <SelectItem value="hlc3">HLC3</SelectItem>
                    <SelectItem value="ohlc4">OHLC4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* EMA */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ema"
                  checked={emaEnabled}
                  onCheckedChange={(checked) => setEmaEnabled(!!checked)}
                />
                <label htmlFor="ema" className="text-sm font-medium cursor-pointer">EMA</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Length</Label>
                  <Input
                    placeholder="200"
                    value={emaLength}
                    onChange={(e) => setEmaLength(e.target.value)}
                    type="number"
                    step="1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Source</Label>
                  <Select value={emaSource} onValueChange={setEmaSource}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="hl2">HL2</SelectItem>
                      <SelectItem value="hlc3">HLC3</SelectItem>
                      <SelectItem value="ohlc4">OHLC4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* LaRSI */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="laRsi"
                  checked={laRsiEnabled}
                  onCheckedChange={(checked) => setLaRsiEnabled(!!checked)}
                />
                <label htmlFor="laRsi" className="text-sm font-medium cursor-pointer">LaRSI</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-sm">
                    Source
                    <span className="text-muted-foreground text-xs">ⓘ</span>
                  </Label>
                  <Select value={laRsiSource} onValueChange={setLaRsiSource}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="hl2">HL2</SelectItem>
                      <SelectItem value="hlc3">HLC3</SelectItem>
                      <SelectItem value="ohlc4">OHLC4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-sm">
                    Alpha
                    <span className="text-muted-foreground text-xs">ⓘ</span>
                  </Label>
                  <Input
                    placeholder="0.2"
                    value={laRsiAlpha}
                    onChange={(e) => setLaRsiAlpha(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="text-green-500 text-sm p-2 border border-green-300 rounded bg-green-50 dark:bg-green-900/20">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-[#4A1515] hover:bg-[#5A2525]"
            onClick={handleProceed}
            disabled={loading}
            type="button"
          >
            {loading ? "Processing..." : "Proceed"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-[#D97706] text-white hover:bg-[#B45309]"
            type="button"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
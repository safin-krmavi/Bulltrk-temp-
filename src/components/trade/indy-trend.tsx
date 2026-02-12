'use client'

import * as React from "react"
import { ChevronDown, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { useState } from "react"
import { useStrategyStore } from "@/stores/strategystore"
import { toast } from "sonner"

export default function IndyTrend() {
  const [isIndyOpen, setIsIndyOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(true)

  // ✅ Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Get balance state from store
  const { balances, isLoadingBalances, balancesError, getBalanceByAsset } = useStrategyStore();

  // Form state
  const [strategyName, setStrategyName] = React.useState("");
  const [investment, setInvestment] = React.useState("");
  const [investmentCap, setInvestmentCap] = React.useState("");
  const [leverage, setLeverage] = React.useState("");
  const [lowerLimit, setLowerLimit] = React.useState("");
  const [upperLimit, setUpperLimit] = React.useState("");
  const [priceTriggerStart, setPriceTriggerStart] = React.useState("");
  const [priceTriggerStop, setPriceTriggerStop] = React.useState("");
  const [stopLossBy, setStopLossBy] = React.useState("");

  // Supertrend settings
  const [supertrendEnabled, setSupertrendEnabled] = React.useState(false);
  const [supertrendDirection, setSupertrendDirection] = React.useState("Neutral");
  const [supertrendTimeframe, setSupertrendTimeframe] = React.useState("1H");
  const [supertrendAtrPeriod, setSupertrendAtrPeriod] = React.useState("10");
  const [supertrendFactor, setSupertrendFactor] = React.useState("3");

  // RSI 1 settings
  const [rsi1Enabled, setRsi1Enabled] = React.useState(false);
  const [rsi1Length, setRsi1Length] = React.useState("21");
  const [rsi1Source, setRsi1Source] = React.useState("Close");
  const [rsi1Timeframe, setRsi1Timeframe] = React.useState("65");

  // RSI 2 settings
  const [rsi2Enabled, setRsi2Enabled] = React.useState(false);
  const [rsi2Length, setRsi2Length] = React.useState("21");
  const [rsi2Source, setRsi2Source] = React.useState("Close");
  const [rsi2Timeframe, setRsi2Timeframe] = React.useState("65");

  // RSI 3 settings
  const [rsi3Enabled, setRsi3Enabled] = React.useState(false);
  const [rsi3Length, setRsi3Length] = React.useState("21");
  const [rsi3Source, setRsi3Source] = React.useState("Close");
  const [rsi3Timeframe, setRsi3Timeframe] = React.useState("65");

  // ADX settings
  const [adxEnabled, setAdxEnabled] = React.useState(false);
  const [adxSmoothing, setAdxSmoothing] = React.useState("21");
  const [adxDiLength, setAdxDiLength] = React.useState("Close");
  const [adxSig, setAdxSig] = React.useState("65");

  // Available balance
  const [availableBalance, setAvailableBalance] = React.useState("0");

  // ✅ Get quote asset for balance display
  const quoteAsset = React.useMemo(() => {
    if (!symbol) return 'USDT';
    
    const knownQuotes = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'INR', 'TUSD', 'DAI', 'FDUSD'];
    const sortedQuotes = knownQuotes.sort((a, b) => b.length - a.length);
    
    for (const quote of sortedQuotes) {
      if (symbol.toUpperCase().endsWith(quote)) {
        return quote;
      }
    }
    
    return 'USDT';
  }, [symbol]);

  // ✅ Update available balance when symbol or balances change
  React.useEffect(() => {
    if (symbol && balances.length > 0) {
      const balance = getBalanceByAsset(quoteAsset);
      if (balance) {
        setAvailableBalance(parseFloat(balance.free).toFixed(2));
      } else {
        setAvailableBalance("0");
      }
    }
  }, [symbol, balances, quoteAsset, getBalanceByAsset]);

  // ✅ Callback to receive data from AccountDetailsCard
  const handleAccountDetailsChange = (data: {
    selectedApi: string;
    exchange: string;
    segment: string;
    pair: string;
  }) => {
    console.log("Account details received:", data);
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
  };

  const handleProceed = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedApiId || !strategyName || !investment || !investmentCap || !lowerLimit || !upperLimit) {
      toast.error("Please fill all required fields");
      return;
    }

    console.log("Form Data:", {
      selectedApiId,
      exchange,
      segment,
      symbol,
      strategyName,
      investment,
      investmentCap,
      leverage,
      lowerLimit,
      upperLimit,
      priceTriggerStart,
      priceTriggerStop,
      stopLossBy,
      indicators: {
        supertrend: supertrendEnabled ? {
          direction: supertrendDirection,
          timeframe: supertrendTimeframe,
          atrPeriod: supertrendAtrPeriod,
          factor: supertrendFactor
        } : null,
        rsi1: rsi1Enabled ? {
          length: rsi1Length,
          source: rsi1Source,
          timeframe: rsi1Timeframe
        } : null,
        rsi2: rsi2Enabled ? {
          length: rsi2Length,
          source: rsi2Source,
          timeframe: rsi2Timeframe
        } : null,
        rsi3: rsi3Enabled ? {
          length: rsi3Length,
          source: rsi3Source,
          timeframe: rsi3Timeframe
        } : null,
        adx: adxEnabled ? {
          smoothing: adxSmoothing,
          diLength: adxDiLength,
          sig: adxSig
        } : null
      }
    });

    toast.success("Strategy configuration saved!");
  };

  const handleReset = () => {
    setStrategyName("");
    setInvestment("");
    setInvestmentCap("");
    setLeverage("");
    setLowerLimit("");
    setUpperLimit("");
    setPriceTriggerStart("");
    setPriceTriggerStop("");
    setStopLossBy("");
    
    // Reset Supertrend
    setSupertrendEnabled(false);
    setSupertrendDirection("Neutral");
    setSupertrendTimeframe("1H");
    setSupertrendAtrPeriod("10");
    setSupertrendFactor("3");
    
    // Reset RSI 1
    setRsi1Enabled(false);
    setRsi1Length("21");
    setRsi1Source("Close");
    setRsi1Timeframe("65");
    
    // Reset RSI 2
    setRsi2Enabled(false);
    setRsi2Length("21");
    setRsi2Source("Close");
    setRsi2Timeframe("65");
    
    // Reset RSI 3
    setRsi3Enabled(false);
    setRsi3Length("21");
    setRsi3Source("Close");
    setRsi3Timeframe("65");
    
    // Reset ADX
    setAdxEnabled(false);
    setAdxSmoothing("21");
    setAdxDiLength("Close");
    setAdxSig("65");

    toast.success("Form reset successfully");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      <form className="space-y-4 mt-4 dark:text-white">
        <Collapsible open={isIndyOpen} onOpenChange={setIsIndyOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
            <span>Indy Trend</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isIndyOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
            {/* Strategy Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                Strategy Name
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input 
                placeholder="Enter Name" 
                value={strategyName} 
                onChange={e => setStrategyName(e.target.value)} 
                className="h-10"
              />
            </div>

            {/* Investment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                Investment
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={investment} 
                  onChange={e => setInvestment(e.target.value)} 
                  type="number"
                  step="0.01"
                  className="h-10"
                />
                <Select value={quoteAsset} disabled>
                  <SelectTrigger className="w-[100px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label className="flex items-center gap-1 text-sm">
                Investment CAP
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={investmentCap} 
                  onChange={e => setInvestmentCap(e.target.value)} 
                  type="number"
                  step="0.01"
                  className="h-10"
                />
                <Select value={quoteAsset} disabled>
                  <SelectTrigger className="w-[100px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Leverage */}
            <div className="space-y-2">
              <Label className="text-sm">Leverage</Label>
              <Input 
                placeholder="Value" 
                value={leverage} 
                onChange={e => setLeverage(e.target.value)} 
                type="number"
                step="1"
                className="h-10"
              />
            </div>

            {/* Lower and Upper Limit - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  Lower Limit
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-1">
                  <Input 
                    placeholder="Value" 
                    value={lowerLimit} 
                    onChange={e => setLowerLimit(e.target.value)} 
                    type="number"
                    step="0.000001"
                    className="h-10"
                  />
                  <Select value={quoteAsset} disabled>
                    <SelectTrigger className="w-[70px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  Upper Limit
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-1">
                  <Input 
                    placeholder="Value" 
                    value={upperLimit} 
                    onChange={e => setUpperLimit(e.target.value)} 
                    type="number"
                    step="0.000001"
                    className="h-10"
                  />
                  <Select value={quoteAsset} disabled>
                    <SelectTrigger className="w-[70px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Price Trigger Start */}
            <div className="space-y-2">
              <Label className="text-sm">Price Trigger Start</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={priceTriggerStart} 
                  onChange={e => setPriceTriggerStart(e.target.value)} 
                  type="number"
                  step="0.000001"
                  className="h-10"
                />
                <Select value={quoteAsset} disabled>
                  <SelectTrigger className="w-[100px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Trigger Stop */}
            <div className="space-y-2">
              <Label className="text-sm">Price Trigger Stop</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={priceTriggerStop} 
                  onChange={e => setPriceTriggerStop(e.target.value)} 
                  type="number"
                  step="0.000001"
                  className="h-10"
                />
                <Select value={quoteAsset} disabled>
                  <SelectTrigger className="w-[100px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={quoteAsset}>{quoteAsset}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stop Loss By */}
            <div className="space-y-2">
              <Label className="text-sm">Stop Loss By</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={stopLossBy} 
                  onChange={e => setStopLossBy(e.target.value)} 
                  type="number"
                  step="0.01"
                  className="h-10"
                />
                <Select value="%" disabled>
                  <SelectTrigger className="w-[70px] h-10">
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
          <CollapsibleContent className="space-y-5 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
            {/* Supertrend Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="supertrend" 
                  checked={supertrendEnabled} 
                  onCheckedChange={(checked) => setSupertrendEnabled(checked as boolean)} 
                  className="h-5 w-5"
                />
                <Label htmlFor="supertrend" className="text-base font-normal cursor-pointer">
                  Supertrend
                </Label>
              </div>
              
              {/* Direction Buttons - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                {['Neutral', 'Long', 'Short'].map((dir) => (
                  <Button
                    key={dir}
                    type="button"
                    variant={supertrendDirection === dir ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSupertrendDirection(dir)}
                    className="h-10 text-sm"
                    disabled={!supertrendEnabled}
                  >
                    {dir}
                  </Button>
                ))}
              </div>

              {/* Timeframe, ATR Period, Factor - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Timeframe</Label>
                  <Select value={supertrendTimeframe} onValueChange={setSupertrendTimeframe} disabled={!supertrendEnabled}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1H">1H</SelectItem>
                      <SelectItem value="4H">4H</SelectItem>
                      <SelectItem value="1D">1D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">ATR Period</Label>
                  <Input 
                    placeholder="10" 
                    value={supertrendAtrPeriod} 
                    onChange={e => setSupertrendAtrPeriod(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!supertrendEnabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Factor</Label>
                  <Input 
                    placeholder="3" 
                    value={supertrendFactor} 
                    onChange={e => setSupertrendFactor(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!supertrendEnabled}
                  />
                </div>
              </div>
            </div>

            {/* RSI 1 Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rsi1" 
                  checked={rsi1Enabled} 
                  onCheckedChange={(checked) => setRsi1Enabled(checked as boolean)} 
                  className="h-5 w-5"
                />
                <Label htmlFor="rsi1" className="text-base font-normal cursor-pointer">
                  RSI 1
                </Label>
              </div>
              
              {/* Length, Source, Timeframe - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Length</Label>
                  <Input 
                    placeholder="21" 
                    value={rsi1Length} 
                    onChange={e => setRsi1Length(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi1Enabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Source</Label>
                  <Select value={rsi1Source} onValueChange={setRsi1Source} disabled={!rsi1Enabled}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Close">Close</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Timeframe</Label>
                  <Input 
                    placeholder="65" 
                    value={rsi1Timeframe} 
                    onChange={e => setRsi1Timeframe(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi1Enabled}
                  />
                </div>
              </div>
            </div>

            {/* RSI 2 Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rsi2" 
                  checked={rsi2Enabled} 
                  onCheckedChange={(checked) => setRsi2Enabled(checked as boolean)} 
                  className="h-5 w-5"
                />
                <Label htmlFor="rsi2" className="text-base font-normal cursor-pointer">
                  RSI 2
                </Label>
              </div>
              
              {/* Length, Source, Timeframe - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Length</Label>
                  <Input 
                    placeholder="21" 
                    value={rsi2Length} 
                    onChange={e => setRsi2Length(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi2Enabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Source</Label>
                  <Select value={rsi2Source} onValueChange={setRsi2Source} disabled={!rsi2Enabled}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Close">Close</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Timeframe</Label>
                  <Input 
                    placeholder="65" 
                    value={rsi2Timeframe} 
                    onChange={e => setRsi2Timeframe(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi2Enabled}
                  />
                </div>
              </div>
            </div>

            {/* RSI 3 Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rsi3" 
                  checked={rsi3Enabled} 
                  onCheckedChange={(checked) => setRsi3Enabled(checked as boolean)} 
                  className="h-5 w-5"
                />
                <Label htmlFor="rsi3" className="text-base font-normal cursor-pointer">
                  RSI 3
                </Label>
              </div>
              
              {/* Length, Source, Timeframe - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Length</Label>
                  <Input 
                    placeholder="21" 
                    value={rsi3Length} 
                    onChange={e => setRsi3Length(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi3Enabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Source</Label>
                  <Select value={rsi3Source} onValueChange={setRsi3Source} disabled={!rsi3Enabled}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Close">Close</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Timeframe</Label>
                  <Input 
                    placeholder="65" 
                    value={rsi3Timeframe} 
                    onChange={e => setRsi3Timeframe(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!rsi3Enabled}
                  />
                </div>
              </div>
            </div>

            {/* ADX Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="adx" 
                  checked={adxEnabled} 
                  onCheckedChange={(checked) => setAdxEnabled(checked as boolean)} 
                  className="h-5 w-5"
                />
                <Label htmlFor="adx" className="text-base font-normal cursor-pointer">
                  ADX
                </Label>
              </div>
              
              {/* Smoothing, DI Length, Sig - Always visible */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Smoothing</Label>
                  <Input 
                    placeholder="21" 
                    value={adxSmoothing} 
                    onChange={e => setAdxSmoothing(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!adxEnabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">DI Length</Label>
                  <Input 
                    placeholder="Close" 
                    value={adxDiLength} 
                    onChange={e => setAdxDiLength(e.target.value)} 
                    className="h-10 text-sm"
                    disabled={!adxEnabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-gray-900 dark:text-gray-100">Sig</Label>
                  <Input 
                    placeholder="65" 
                    value={adxSig} 
                    onChange={e => setAdxSig(e.target.value)} 
                    type="number"
                    className="h-10 text-sm"
                    disabled={!adxEnabled}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          <Button 
            className="flex-1 bg-[#4A1515] text-white hover:bg-[#5A2525] h-11" 
            onClick={handleProceed}
          >
            Proceed
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-11" 
            type="button" 
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}
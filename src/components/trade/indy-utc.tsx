'use client'

import * as React from "react"
import { ChevronDown, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { useState } from "react"
import { useStrategyStore } from "@/stores/strategystore"
import { toast } from "sonner"
import { useNavigate } from 'react-router-dom'

export default function IndyUTC() {
  const router = useNavigate()
  const [isIndyOpen, setIsIndyOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(true)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false);

  // ✅ Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Get balance state and methods from store
  const { 
    balances, 
    isLoadingBalances, 
    balancesError, 
    getBalanceByAsset,
    createUTC,
    isLoading: isCreating 
  } = useStrategyStore();

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
  const [takeProfitPct, setTakeProfitPct] = React.useState("");

  // UT Buy settings
  const [utBuySensitivity, setUtBuySensitivity] = React.useState("2");
  const [utBuyAtrPeriod, setUtBuyAtrPeriod] = React.useState("300");

  // UT Sell settings
  const [utSellSensitivity, setUtSellSensitivity] = React.useState("2");
  const [utSellAtrPeriod, setUtSellAtrPeriod] = React.useState("1");

  // UT Oscillator settings
  const [utOscillatorLength, setUtOscillatorLength] = React.useState("80");
  const [utOscillatorFastLength, setUtOscillatorFastLength] = React.useState("27");

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

  // ✅ Validate form before submission
  const validateForm = (): boolean => {
    if (!selectedApiId) {
      toast.error("Please select an API connection");
      return false;
    }
    if (!strategyName.trim()) {
      toast.error("Please enter a strategy name");
      return false;
    }
    if (!exchange) {
      toast.error("Please select an exchange");
      return false;
    }
    if (!segment) {
      toast.error("Please select a segment");
      return false;
    }
    if (!symbol) {
      toast.error("Please select a trading pair");
      return false;
    }
    if (!investment || parseFloat(investment) <= 0) {
      toast.error("Please enter a valid investment amount");
      return false;
    }
    if (!investmentCap || parseFloat(investmentCap) <= 0) {
      toast.error("Please enter a valid investment cap");
      return false;
    }
    if (parseFloat(investment) > parseFloat(investmentCap)) {
      toast.error("Investment per run cannot exceed investment cap");
      return false;
    }
    if (!timeFrame) {
      toast.error("Please select a time frame");
      return false;
    }

    // Validate numeric fields if entered
    if (leverage && parseFloat(leverage) <= 0) {
      toast.error("Leverage must be greater than 0");
      return false;
    }
    if (lowerLimit && parseFloat(lowerLimit) <= 0) {
      toast.error("Lower limit must be greater than 0");
      return false;
    }
    if (upperLimit && parseFloat(upperLimit) <= 0) {
      toast.error("Upper limit must be greater than 0");
      return false;
    }
    if (lowerLimit && upperLimit && parseFloat(lowerLimit) >= parseFloat(upperLimit)) {
      toast.error("Lower limit must be less than upper limit");
      return false;
    }
    if (stopLossBy && parseFloat(stopLossBy) <= 0) {
      toast.error("Stop loss percentage must be greater than 0");
      return false;
    }
    if (takeProfitPct && parseFloat(takeProfitPct) <= 0) {
      toast.error("Take profit percentage must be greater than 0");
      return false;
    }

    return true;
  };

  // ✅ Handle form submission
  const handleProceed = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log("Creating UTC Strategy...");

      const strategyData = {
        name: strategyName.trim(),
        exchange: exchange.toUpperCase(),
        segment: segment.toUpperCase(),
        symbol: symbol.toUpperCase(),
        executionMode: 'LIVE' as const,
        timeFrame: timeFrame,
        investmentPerRun: parseFloat(investment),
        investmentCap: parseFloat(investmentCap),
        ...(leverage && parseFloat(leverage) > 0 && { leverage: parseFloat(leverage) }),
        ...(lowerLimit && parseFloat(lowerLimit) > 0 && { lowerLimit: parseFloat(lowerLimit) }),
        ...(upperLimit && parseFloat(upperLimit) > 0 && { upperLimit: parseFloat(upperLimit) }),
        ...(priceTriggerStart && parseFloat(priceTriggerStart) > 0 && { priceStart: parseFloat(priceTriggerStart) }),
        ...(priceTriggerStop && parseFloat(priceTriggerStop) > 0 && { priceStop: parseFloat(priceTriggerStop) }),
        ...(stopLossBy && parseFloat(stopLossBy) > 0 && { stopLossPct: parseFloat(stopLossBy) }),
        ...(takeProfitPct && parseFloat(takeProfitPct) > 0 && { takeProfitPct: parseFloat(takeProfitPct) }),
      };

      console.log("Strategy Data:", strategyData);

      const createdStrategy = await createUTC(strategyData);
      
      console.log("UTC Strategy created successfully:", createdStrategy);
      
      toast.success("UTC Strategy created successfully!", {
        description: `Strategy "${strategyName}" has been created and is now active.`
      });

      // Show proceed popup
      setShowProceedPopup(true);

      // Reset form after successful creation
      handleReset();

    } catch (error: any) {
      console.error("Failed to create UTC strategy:", error);
      toast.error("Failed to create UTC strategy", {
        description: error.message || "Please try again"
      });
    }
  };

  // ✅ Handle reset
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
    setTakeProfitPct("");
    setUtBuySensitivity("2");
    setUtBuyAtrPeriod("300");
    setUtSellSensitivity("2");
    setUtSellAtrPeriod("1");
    setUtOscillatorLength("80");
    setUtOscillatorFastLength("27");

    toast.success("Form reset successfully");
  };

  // ✅ Close popup and navigate
  const handleClosePopup = () => {
    setShowProceedPopup(false);
    router('/strategies');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      <form className="space-y-4 mt-4 dark:text-white">
        <Collapsible open={isIndyOpen} onOpenChange={setIsIndyOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
            <span>Indy UTC</span>
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

            {/* Time Frame */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                Time Frame
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="3m">3 Minutes</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leverage */}
            <div className="space-y-2">
              <Label className="text-sm">Leverage (Optional)</Label>
              <Input 
                placeholder="Value" 
                value={leverage} 
                onChange={e => setLeverage(e.target.value)} 
                type="number"
                step="1"
                className="h-10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only for futures trading. Leave empty for spot trading.
              </p>
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
                    placeholder="Optional" 
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
                    placeholder="Optional" 
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
              <Label className="text-sm">Price Trigger Start (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Optional" 
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
              <Label className="text-sm">Price Trigger Stop (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Optional" 
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

            {/* Stop Loss and Take Profit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Stop Loss % (Optional)</Label>
                <div className="flex gap-1">
                  <Input 
                    placeholder="Optional" 
                    value={stopLossBy} 
                    onChange={e => setStopLossBy(e.target.value)} 
                    type="number"
                    step="0.01"
                    className="h-10"
                  />
                  <Select value="%" disabled>
                    <SelectTrigger className="w-[50px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Take Profit % (Optional)</Label>
                <div className="flex gap-1">
                  <Input 
                    placeholder="Optional" 
                    value={takeProfitPct} 
                    onChange={e => setTakeProfitPct(e.target.value)} 
                    type="number"
                    step="0.01"
                    className="h-10"
                  />
                  <Select value="%" disabled>
                    <SelectTrigger className="w-[50px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            {/* UT Buy Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">UT Buy</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    Sensitivity
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="2" 
                    value={utBuySensitivity} 
                    onChange={e => setUtBuySensitivity(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    ATR Period
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="300" 
                    value={utBuyAtrPeriod} 
                    onChange={e => setUtBuyAtrPeriod(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* UT Sell Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">UT Sell</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    Sensitivity
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="2" 
                    value={utSellSensitivity} 
                    onChange={e => setUtSellSensitivity(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    ATR Period
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="1" 
                    value={utSellAtrPeriod} 
                    onChange={e => setUtSellAtrPeriod(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* UT Oscillator Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">UT Oscillator</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    Length
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="80" 
                    value={utOscillatorLength} 
                    onChange={e => setUtOscillatorLength(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-normal text-gray-900 dark:text-gray-100">
                    Fast Length
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input 
                    placeholder="27" 
                    value={utOscillatorFastLength} 
                    onChange={e => setUtOscillatorFastLength(e.target.value)} 
                    type="number"
                    step="1"
                    className="h-10 text-sm"
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
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Creating...
              </>
            ) : (
              'Proceed'
            )}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-11" 
            type="button" 
            onClick={handleReset}
            disabled={isCreating}
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Success Popup */}
      {showProceedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1A1D] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Strategy Created Successfully!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your UTC strategy has been created and is now active.
            </p>
            <Button 
              onClick={handleClosePopup}
              className="w-full bg-[#4A1515] text-white hover:bg-[#5A2525]"
            >
              View Strategies
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
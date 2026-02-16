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
import {  useState } from "react"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { toast } from "sonner"

export default function IndyLESI() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  
  // Account details from AccountDetailsCard
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");
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

  // LESI indicator/settings
  const [lesiIndicator, setLesiIndicator] = React.useState("lorentzian");
  const [lookbackPeriod, setLookbackPeriod] = React.useState("75");
  const [signalThreshold, setSignalThreshold] = React.useState("0.8");
  const [noiseReduction, setNoiseReduction] = React.useState(true);
  const [adaptiveThreshold, setAdaptiveThreshold] = React.useState(true);

  // Feedback
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [availableBalance] = useState<string>("0");

  // Callback to receive data from AccountDetailsCard
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

  // Update required fields warning
  React.useEffect(() => {
    const hasRequiredFields = selectedApiId && exchange && segment && symbol;
    setShowRequiredFieldsWarning(!hasRequiredFields);
  }, [selectedApiId, exchange, segment, symbol]);

  // Get missing fields for warning
  const getMissingFields = () => {
    const missing = [];
    if (!selectedApiId) missing.push("API Connection");
    if (!exchange) missing.push("Exchange");
    if (!segment) missing.push("Segment");
    if (!symbol) missing.push("Trading Pair");
    return missing;
  };

  // Validate form
  const validateForm = () => {
    if (!selectedApiId) {
      toast.error("Please select an API connection", {
        description: "You need to connect an API to create strategies"
      });
      return false;
    }
    if (!exchange) {
      toast.error("Exchange not available", {
        description: "Please select a valid exchange"
      });
      return false;
    }
    if (!segment) {
      toast.error("Please select a segment", {
        description: "Choose between Spot or Futures"
      });
      return false;
    }
    if (!symbol) {
      toast.error("Please select a trading pair", {
        description: "Choose a trading pair like BTC/USDT"
      });
      return false;
    }
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
    if (!timeFrame) {
      toast.error("Please select a time frame", {
        description: "Choose a time frame"
      });
      return false;
    }
    if (!leverage || Number(leverage) <= 0) {
      toast.error("Invalid leverage", {
        description: "Enter a valid leverage value"
      });
      return false;
    }
    if (!lowerLimit || Number(lowerLimit) <= 0) {
      toast.error("Invalid lower limit", {
        description: "Lower limit must be greater than 0"
      });
      return false;
    }
    if (!upperLimit || Number(upperLimit) <= 0) {
      toast.error("Invalid upper limit", {
        description: "Upper limit must be greater than 0"
      });
      return false;
    }
    if (Number(upperLimit) <= Number(lowerLimit)) {
      toast.error("Invalid price limits", {
        description: "Upper limit must be greater than lower limit"
      });
      return false;
    }
    if (!priceTriggerStart || Number(priceTriggerStart) <= 0) {
      toast.error("Invalid price trigger start", {
        description: "Enter a valid price trigger start"
      });
      return false;
    }
    if (!priceTriggerStop || Number(priceTriggerStop) <= 0) {
      toast.error("Invalid price trigger stop", {
        description: "Enter a valid price trigger stop"
      });
      return false;
    }
    if (!stopLossBy || Number(stopLossBy) <= 0) {
      toast.error("Invalid stop loss", {
        description: "Enter a valid stop loss value"
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
      // Robust token retrieval: try all common keys, prioritize AUTH_TOKEN
      let accessToken = localStorage.getItem("AUTH_TOKEN") || 
                       localStorage.getItem("access_token") || 
                       localStorage.getItem("token");
      
      if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
        setError("You are not logged in or token is missing. Please log in again.");
        setLoading(false);
        return;
      }

      accessToken = accessToken.trim();

      const baseUrl = import.meta.env.VITE_API_URL || "";
      if (!baseUrl) {
        setError("API base URL is not set. Please check your environment variables.");
        setLoading(false);
        return;
      }

      console.log("[IndyLESI] API URL:", baseUrl + "/strategies");
      console.log("[IndyLESI] Access token:", accessToken);

      const body = {
        strategy_name: strategyName,
        strategy_type: "indy_lesi",
        api_connection_id: Number(selectedApiId),
        exchange: exchange,
        segment: segment,
        pair: symbol,
        investment: Number(investment),
        investment_cap: Number(investmentCap),
        time_frame: timeFrame,
        leverage: Number(leverage),
        lower_limit: Number(lowerLimit),
        upper_limit: Number(upperLimit),
        price_trigger_start: Number(priceTriggerStart),
        price_trigger_stop: Number(priceTriggerStop),
        stop_loss_by: Number(stopLossBy),
        lesi_indicator: lesiIndicator,
        lesi_settings: {
          lookback_period: Number(lookbackPeriod),
          signal_threshold: Number(signalThreshold),
          noise_reduction: noiseReduction,
          adaptive_threshold: adaptiveThreshold
        }
      };

      const res = await fetch(`${baseUrl}/strategies`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create Indy LESI strategy.");
      }

      toast.success("Strategy created successfully! 🎉", {
        description: `${strategyName} is now active and running`,
        duration: 5000
      });

      setSuccess("Indy LESI strategy created successfully.");
      handleReset();
    } catch (err: any) {
      console.error("Strategy creation error:", err);
      const errorMsg = err.message || "Something went wrong.";
      setError(errorMsg);
      toast.error("Failed to create strategy", {
        description: errorMsg,
        duration: 5000
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
    setLesiIndicator("lorentzian");
    setLookbackPeriod("75");
    setSignalThreshold("0.8");
    setNoiseReduction(true);
    setAdaptiveThreshold(true);
    setError("");
    setSuccess("");
    
    toast.success("Form reset", {
      description: "All fields have been cleared"
    });
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
                <Select value="USDT" disabled>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-orange-500">Avbl: {availableBalance} USDT</p>
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
                <Select value="USDT" disabled>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Frame */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Time Frame
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={timeFrame === "5m" ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setTimeFrame("5m")}
                  className={timeFrame === "5m" ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                >
                  5 Minutes
                </Button>
                <Button
                  variant={timeFrame === "15m" ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setTimeFrame("15m")}
                  className={timeFrame === "15m" ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                >
                  15 Minutes
                </Button>
                <Button
                  variant={timeFrame === "1h" ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setTimeFrame("1h")}
                  className={timeFrame === "1h" ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                >
                  1 Hour
                </Button>
              </div>
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
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={lowerLimit}
                    onChange={(e) => setLowerLimit(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <Select value="USDT" disabled>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Upper Limit
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={upperLimit}
                    onChange={(e) => setUpperLimit(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <Select value="USDT" disabled>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Select value="USDT" disabled>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value="USDT" disabled>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* Advanced Settings */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-200 dark:bg-gray-700 p-3 font-medium">
                <span>Advanced Settings</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {/* LESI Indicator */}
                <div className="space-y-2">
                  <Label>LESI Indicator</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="lorentzian"
                      checked={lesiIndicator === "lorentzian"}
                      onCheckedChange={() => setLesiIndicator("lorentzian")}
                    />
                    <label htmlFor="lorentzian" className="text-sm cursor-pointer">
                      Lorentzian
                    </label>
                  </div>
                </div>

                {/* Lookback Period */}
                <div className="space-y-2">
                  <Label>Lookback Period</Label>
                  <Input
                    placeholder="Value"
                    value={lookbackPeriod}
                    onChange={(e) => setLookbackPeriod(e.target.value)}
                    type="number"
                    step="1"
                  />
                </div>

                {/* Signal Threshold */}
                <div className="space-y-2">
                  <Label>Signal Threshold</Label>
                  <Input
                    placeholder="Value"
                    value={signalThreshold}
                    onChange={(e) => setSignalThreshold(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                </div>

                {/* Noise Reduction */}
                <div className="space-y-2">
                  <Label>Noise Reduction</Label>
                  <Select
                    value={noiseReduction ? "yes" : "no"}
                    onValueChange={(val) => setNoiseReduction(val === "yes")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Adaptive Threshold */}
                <div className="space-y-2">
                  <Label>Adaptive Threshold</Label>
                  <Select
                    value={adaptiveThreshold ? "yes" : "no"}
                    onValueChange={(val) => setAdaptiveThreshold(val === "yes")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
            disabled={loading || showRequiredFieldsWarning}
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
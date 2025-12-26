'use client'

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { AccountDetailsCard } from "./AccountDetailsCard"
import { useStrategyStore } from "@/stores/strategyStore"
import { toast } from "sonner"

export default function GrowthDCA() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Form state
  const [strategyName, setStrategyName] = useState("");
  const [investmentPerRun, setInvestmentPerRun] = useState("");
  const [investmentCap, setInvestmentCap] = useState("");
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY'>("DAILY");
  const [takeProfitPct, setTakeProfitPct] = useState("");
  const [priceStart, setPriceStart] = useState("");
  const [priceStop, setPriceStop] = useState("");
  const [stopLossPct, setStopLossPct] = useState("");

  // Get strategy store
  const { createGrowthDCA, isLoading, error, clearError } = useStrategyStore();

  // Frequency button handler
  const handleFrequency = (val: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => setFrequency(val);

  // Validation
  const validateForm = () => {
    console.log("Validating form with data:", {
      selectedApiId,
      exchange,
      segment,
      symbol,
      strategyName,
      investmentPerRun,
      investmentCap,
      takeProfitPct,
      priceStart,
      priceStop,
      stopLossPct
    });

    if (!selectedApiId) {
      toast.error("Please select an API connection");
      return false;
    }
    if (!exchange) {
      toast.error("Exchange not available");
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
    if (!strategyName.trim()) {
      toast.error("Please enter a strategy name");
      return false;
    }
    if (!investmentPerRun || Number(investmentPerRun) <= 0) {
      toast.error("Please enter a valid investment per run amount");
      return false;
    }
    if (!investmentCap || Number(investmentCap) <= 0) {
      toast.error("Please enter a valid investment cap");
      return false;
    }
    if (!takeProfitPct || Number(takeProfitPct) <= 0) {
      toast.error("Please enter a valid take profit percentage");
      return false;
    }
    if (!priceStart || Number(priceStart) <= 0) {
      toast.error("Please enter a valid price start");
      return false;
    }
    if (!priceStop || Number(priceStop) <= 0) {
      toast.error("Please enter a valid price stop");
      return false;
    }
    if (!stopLossPct || Number(stopLossPct) <= 0) {
      toast.error("Please enter a valid stop loss percentage");
      return false;
    }
    return true;
  };

  // API call handler
  const handleProceed = async (e: React.MouseEvent) => {
    console.log("=== PROCEED BUTTON CLICKED ===");
    e.preventDefault();
    e.stopPropagation();
    
    clearError();

    console.log("Current form state:", {
      selectedApiId,
      exchange,
      segment,
      symbol,
      strategyName,
      investmentPerRun,
      investmentCap,
      frequency,
      takeProfitPct,
      priceStart,
      priceStop,
      stopLossPct
    });

    if (!validateForm()) {
      console.log("Validation failed, stopping...");
      return;
    }

    console.log("Validation passed, preparing API call...");

    try {
      const strategyData = {
        name: strategyName,
        exchange: exchange,
        segment: segment,
        symbol: symbol,
        investmentPerRun: Number(investmentPerRun),
        investmentCap: Number(investmentCap),
        frequency: frequency,
        takeProfitPct: Number(takeProfitPct),
        stopLossPct: Number(stopLossPct),
        priceStart: Number(priceStart),
        priceStop: Number(priceStop),
      };

      console.log("=== SENDING TO API ===");
      console.log("Strategy Data:", JSON.stringify(strategyData, null, 2));

      const result = await createGrowthDCA(strategyData);
      
      console.log("=== API SUCCESS ===");
      console.log("Result:", result);
      
      toast.success("Growth DCA strategy created successfully!");
      handleReset();
    } catch (err: any) {
      console.error("=== API ERROR ===");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response?.data);
      
      toast.error(err.message || "Failed to create strategy");
    }
  };

  const handleReset = () => {
    setStrategyName("");
    setInvestmentPerRun("");
    setInvestmentCap("");
    setFrequency("DAILY");
    setTakeProfitPct("");
    setPriceStart("");
    setPriceStop("");
    setStopLossPct("");
    clearError();
  };

  // Callback to receive data from AccountDetailsCard
  const handleAccountDetailsChange = (data: {
    selectedApi: string;
    exchange: string;
    segment: string;
    pair: string;
  }) => {
    console.log("Account details changed:", data);
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
  };

  // Debug current state
  React.useEffect(() => {
    console.log("Current state update:", {
      selectedApiId,
      exchange,
      segment,
      symbol
    });
  }, [selectedApiId, exchange, segment, symbol]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border border-t-0">
            <span>Growth DCA</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Strategy Name
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <Input placeholder="Enter Name" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment Per Run
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="flex gap-2">
                <Input placeholder="Value" value={investmentPerRun} onChange={e => setInvestmentPerRun(e.target.value)} type="number" />
                <Select value="USDT" disabled>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-orange-500">Avbl: 389 USDT</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment CAP
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="flex gap-2">
                <Input placeholder="Value" value={investmentCap} onChange={e => setInvestmentCap(e.target.value)} type="number" />
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Frequency
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'HOURLY'] as const).map(val => (
                  <Button 
                    key={val} 
                    variant={frequency === val ? "default" : "outline"} 
                    className="flex-1" 
                    type="button" 
                    onClick={() => handleFrequency(val)}
                  >
                    {val.charAt(0) + val.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Take Profit %
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="relative">
                <Input placeholder="Value" value={takeProfitPct} onChange={e => setTakeProfitPct(e.target.value)} type="number" />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border border-t-0">
            <span>Advanced Settings</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
            <div className="space-y-2">
              <Label>Price Start</Label>
              <Input placeholder="Value" value={priceStart} onChange={e => setPriceStart(e.target.value)} type="number" step="0.00001" />
            </div>

            <div className="space-y-2">
              <Label>Price Stop</Label>
              <Input placeholder="Value" value={priceStop} onChange={e => setPriceStop(e.target.value)} type="number" step="0.00001" />
            </div>

            <div className="space-y-2">
              <Label>Stop Loss %</Label>
              <div className="relative">
                <Input placeholder="Value" value={stopLossPct} onChange={e => setStopLossPct(e.target.value)} type="number" />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {error && <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">{error}</div>}

        <div className="flex gap-4">
          <Button
            className="flex-1 bg-[#4A1515] hover:bg-[#5A2525]"
            onClick={handleProceed}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Processing..." : "Proceed"}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-[#D97706] text-white hover:bg-[#B45309]" 
            type="button" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}


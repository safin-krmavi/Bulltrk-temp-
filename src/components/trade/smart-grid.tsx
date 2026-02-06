'use client'

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { toast } from "sonner"
import { useStrategyStore, SmartGridStrategy } from "@/stores/strategystore"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"

export default function SmartGrid() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)
  const [, setIsCalculatingLimits] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Form state - Updated according to new structure
  const [strategyName, setStrategyName] = React.useState("");
  const [type, setType] = React.useState<'NEUTRAL' | 'LONG' | 'SHORT'>("NEUTRAL");
  const [dataSet, setDataSet] = React.useState("30");
  const [lowerLimit, setLowerLimit] = React.useState("");
  const [upperLimit, setUpperLimit] = React.useState("");
  const [levels, setLevels] = React.useState("");
  const [profitPerLevel, setProfitPerLevel] = React.useState(""); // Renamed from profitPercentage
  const [profitUnit, setProfitUnit] = React.useState("%"); // For the % or fixed toggle
  const [investment, setInvestment] = React.useState("");
  const [minimumInvestment, setMinimumInvestment] = React.useState(""); // New field

  // Get strategy store
  const { 
    createSmartGrid, 
    calculateSmartGridLimits,
    isLoading, 
    error, 
    clearError,
    fetchBalances,
    getBalanceByAsset,
    balances,
    isLoadingBalances,
    balancesError
  } = useStrategyStore();

  // Available balance
  const [availableBalance, setAvailableBalance] = useState<string>("0");

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

  // Handlers for type buttons
  const handleTypeSelect = (val: 'NEUTRAL' | 'LONG' | 'SHORT') => setType(val);

  // Handlers for data set buttons
  const handleDataSetSelect = (val: string) => setDataSet(val);

  // ✅ Calculate limits automatically when exchange, segment, symbol, or dataSet changes
  React.useEffect(() => {
    if (exchange && segment && symbol && dataSet) {
      handleCalculateLimits();
    }
  }, [exchange, segment, symbol, dataSet]);

  // ✅ Calculate Smart Grid Limits
  const handleCalculateLimits = async () => {
    if (!exchange || !segment || !symbol) {
      return;
    }

    setIsCalculatingLimits(true);
    
    try {
      console.log("Calculating limits with:", { exchange, segment, symbol, dataSetDays: dataSet });
      
      const { lowerLimit: calcLower, upperLimit: calcUpper } = await calculateSmartGridLimits(
        exchange,
        segment,
        symbol,
        Number(dataSet)
      );

      setLowerLimit(calcLower.toFixed(6));
      setUpperLimit(calcUpper.toFixed(6));

      toast.success("Limits calculated!", {
        description: `Lower: ${calcLower.toFixed(6)} | Upper: ${calcUpper.toFixed(6)}`
      });
    } catch (err: any) {
      console.error("Limits calculation error:", err);
      toast.error("Failed to calculate limits", {
        description: err.message || "Please try again"
      });
    } finally {
      setIsCalculatingLimits(false);
    }
  };

  // Auto-reset type to NEUTRAL if SHORT is selected when segment changes to SPOT
  React.useEffect(() => {
    if (segment === "SPOT" && type === "SHORT") {
      setType("NEUTRAL");
      toast.info("Type changed to NEUTRAL", {
        description: "SHORT is not available for SPOT trading"
      });
    }
  }, [segment, type]);

  // Fetch balances when exchange and segment change
  React.useEffect(() => {
    if (exchange && segment) {
      fetchBalances(exchange, segment).catch(err => {
        console.error("Failed to fetch balances:", err);
        toast.error("Failed to load balance", {
          description: "Unable to fetch account balance"
        });
      });
    }
  }, [exchange, segment, fetchBalances]);

  // Update available balance
  React.useEffect(() => {
    if (symbol && balances.length > 0) {
      const quoteAsset = symbol.replace(/^[A-Z]+/, '');
      const balance = getBalanceByAsset(quoteAsset);
      
      if (balance) {
        setAvailableBalance(parseFloat(balance.free).toFixed(2));
      } else {
        const usdtBalance = getBalanceByAsset('USDT');
        if (usdtBalance) {
          setAvailableBalance(parseFloat(usdtBalance.free).toFixed(2));
        } else {
          setAvailableBalance("0");
        }
      }
    }
  }, [symbol, balances, getBalanceByAsset]);

  // Validation
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
    if (!minimumInvestment || Number(minimumInvestment) <= 0) {
      toast.error("Invalid minimum investment", {
        description: "Enter a valid minimum investment amount"
      });
      return false;
    }
    if (Number(minimumInvestment) > Number(investment)) {
      toast.error("Invalid minimum investment", {
        description: "Minimum investment cannot be greater than total investment"
      });
      return false;
    }
    if (!lowerLimit || Number(lowerLimit) <= 0) {
      toast.error("Invalid lower limit", {
        description: "Lower limit must be calculated or entered"
      });
      return false;
    }
    if (!upperLimit || Number(upperLimit) <= 0) {
      toast.error("Invalid upper limit", {
        description: "Upper limit must be calculated or entered"
      });
      return false;
    }
    if (Number(upperLimit) <= Number(lowerLimit)) {
      toast.error("Invalid price limits", {
        description: "Upper limit must be greater than lower limit"
      });
      return false;
    }
    if (!levels || Number(levels) <= 0) {
      toast.error("Invalid levels", {
        description: "Enter a valid number of levels"
      });
      return false;
    }
    if (!profitPerLevel || Number(profitPerLevel) <= 0) {
      toast.error("Invalid profit per level", {
        description: "Enter a valid profit value greater than 0"
      });
      return false;
    }
    return true;
  };

  // Prepare strategy data for popup
  const getStrategyData = () => {
    return {
      selectedApi: selectedApiId,
      exchange: exchange,
      segment: segment,
      pair: symbol,
      name: strategyName,
      investmentPerRun: Number(minimumInvestment),  // This will map to minimumInvestment
      investmentCap: Number(investment),  // This will map to investment
      lowerLimit: Number(lowerLimit),
      upperLimit: Number(upperLimit),
      levels: Number(levels),
      profitPercentage: Number(profitPerLevel),
      direction: type,  // This will map to type
      dataSetDays: Number(dataSet),
      gridMode: 'STATIC' as const,
      strategyType: 'SMART_GRID' as const,
    };
  };

  // Show popup when Proceed is clicked
  const handleProceed = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    clearError();

    if (!validateForm()) {
      return;
    }

    toast.info("Review your strategy", {
      description: "Please confirm the details before creating"
    });
    setShowProceedPopup(true);
  };

  // API call when user confirms in popup
  const handleConfirmStrategy = async (executionMode: 'LIVE' | 'PUBLISHED') => {
    const toastId = toast.loading("Creating Smart Grid strategy...", {
      description: "Please wait while we process your request"
    });
    
    try {
      const strategyData: Omit<SmartGridStrategy, 'strategyType' | 'assetType'> = {
        name: strategyName,
        exchange: exchange,
        segment: segment,
        symbol: symbol,
        investmentPerRun: Number(minimumInvestment),  // Will be converted to minimumInvestment
        investmentCap: Number(investment),  // Will be converted to investment
        lowerLimit: Number(lowerLimit),
        upperLimit: Number(upperLimit),
        levels: Number(levels),
        profitPercentage: Number(profitPerLevel),
        direction: type,  // Will be converted to type
        dataSetDays: Number(dataSet),
        gridMode: 'STATIC',
        executionMode: executionMode,
      };
      
      console.log("Smart Grid strategy data being sent:", strategyData);
      
      await createSmartGrid(strategyData);
      
      toast.success("Strategy created successfully! 🎉", {
        id: toastId,
        description: `${strategyName} is now active and running in ${executionMode} mode`,
        duration: 5000
      });
      
      setShowProceedPopup(false);
      handleReset();
    } catch (err: any) {
      console.error("Strategy creation error:", err);
      
      toast.error("Failed to create strategy", {
        id: toastId,
        description: err.message || "Please check your inputs and try again",
        duration: 5000
      });
    }
  };

  const handleReset = () => {
    setStrategyName("");
    setType("NEUTRAL");
    setDataSet("30");
    setLowerLimit("");
    setUpperLimit("");
    setLevels("");
    setProfitPerLevel("");
    setProfitUnit("%");
    setInvestment("");
    setMinimumInvestment("");
    
    clearError();
    
    toast.success("Form reset", {
      description: "All fields have been cleared"
    });
  };

  // Determine available type options based on segment
  const getAvailableTypes = () => {
    if (segment === "SPOT") {
      return ['NEUTRAL', 'LONG'] as const;
    }
    return ['NEUTRAL', 'LONG', 'SHORT'] as const;
  };

  const availableTypes = getAvailableTypes();

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 border border-t-0 font-medium text-white hover:bg-[#5A2525]">
            <span>Smart Grid</span>
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
                onChange={e => setStrategyName(e.target.value)} 
              />
            </div>

            {/* Select Type */}
            <div className="space-y-2">
              <Label>Select Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {availableTypes.map(val => (
                  <Button 
                    key={val} 
                    variant={type === val ? "default" : "outline"} 
                    type="button" 
                    onClick={() => handleTypeSelect(val as 'NEUTRAL' | 'LONG' | 'SHORT')}
                    className={type === val ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            {/* Data Set (Days) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Data Set
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {['3','7','20', '30', '180', '365'].map((val, index) => (
                  <Button 
                    key={index} 
                    variant={dataSet === val ? "default" : "outline"} 
                    size="sm" 
                    type="button" 
                    onClick={() => handleDataSetSelect(val)}
                    className={dataSet === val ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                  >
                    {val === '3' && index === 0 ? '3D' :
                     val === '7' && index === 1 ? '7D' :
                     val === '20' && index === 2 ? '20D' :
                     val === '30' && index === 3 ? '30D' : 
                     val === '180' ? '180D' : '365D'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Lower and Upper Limit - Auto-calculated */}
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
                    readOnly
                    type="number"
                    step="0.000001"
                    className="bg-gray-100 dark:bg-[#2A2A2D] cursor-not-allowed"
                  />
                  <Select value="USDT" disabled>
                    <SelectTrigger className="w-[80px] bg-gray-100 dark:bg-[#2A2A2D]">
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
                  <span className="text-muted-foreground text-xs">ⓘ</span>
                </Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Long" 
                    value={upperLimit} 
                    readOnly
                    type="number"
                    step="0.000001"
                    className="bg-gray-100 dark:bg-[#2A2A2D] cursor-not-allowed"
                  />
                  <Select value="USDT" disabled>
                    <SelectTrigger className="w-[80px] bg-gray-100 dark:bg-[#2A2A2D]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Levels */}
            <div className="space-y-2">
              <Label>Levels</Label>
              <Input 
                placeholder="Value" 
                value={levels} 
                onChange={e => setLevels(e.target.value)} 
                type="number"
                min="1"
              />
            </div>

            {/* Profit per Level - Updated with dual input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Profit per Level
                <span className="text-muted-foreground text-xs">ⓘ</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input 
                    placeholder="Value" 
                    value={profitPerLevel} 
                    onChange={e => setProfitPerLevel(e.target.value)} 
                    type="number"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    {profitUnit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">-</span>
                  <div className="relative flex-1">
                    <Input 
                      placeholder="Value" 
                      type="number"
                      step="0.1"
                      disabled
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      {profitUnit}
                    </span>
                  </div>
                </div>
              </div>
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
                  onChange={e => setInvestment(e.target.value)} 
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
              {isLoadingBalances ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                  Loading balance...
                </p>
              ) : balancesError ? (
                <p className="text-sm text-red-500">Failed to load balance</p>
              ) : (
                <p className="text-sm text-orange-500">Avbl: {availableBalance} USDT</p>
              )}
            </div>

            {/* Minimum Investment - New Field */}
            <div className="space-y-2">
              <Label>Minimum Investment</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={minimumInvestment} 
                  onChange={e => setMinimumInvestment(e.target.value)} 
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minimum amount per grid level
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {error && (
          <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}

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

      {showProceedPopup && (
        <ProceedPopup
          strategyData={getStrategyData()}
          onClose={() => setShowProceedPopup(false)}
          onConfirm={handleConfirmStrategy}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
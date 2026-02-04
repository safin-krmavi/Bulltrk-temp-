'use client'

import * as React from "react"
import { ChevronDown} from 'lucide-react'
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
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)
  const [,setIsCalculatingLimits] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Form state
  const [strategyName, setStrategyName] = React.useState("");
  const [type, setType] = React.useState<'NEUTRAL' | 'LONG' | 'SHORT'>("NEUTRAL");
  const [dataSet, setDataSet] = React.useState("30");
  // const [stdDev, setStdDev] = React.useState("2"); // ✅ Add standard deviation
  const [lowerLimit, setLowerLimit] = React.useState("");
  const [upperLimit, setUpperLimit] = React.useState("");
  const [levels, setLevels] = React.useState("");
  const [profitPercentage, setProfitPercentage] = React.useState("");
  const [investment, setInvestment] = React.useState("");
  const [investmentCap, setInvestmentCap] = React.useState("");
  const [gridMode, setGridMode] = React.useState<'STATIC' | 'DYNAMIC'>("STATIC");
  const [stopLossPct, setStopLossPct] = React.useState("");

  // Get strategy store
  const { 
    createSmartGrid, 
    calculateSmartGridLimits, // ✅ Add limits calculator
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

  // ✅ Calculate limits automatically when exchange, segment, symbol, dataSet, or stdDev changes
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
        Number(dataSet)  // ✅ This now correctly maps to dataSetDays parameter
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
        description: "Choose between Spot, Futures, or Margin"
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
        description: "Enter a valid cap amount greater than 0"
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
    if (!profitPercentage || Number(profitPercentage) <= 0) {
      toast.error("Invalid profit percentage", {
        description: "Enter a valid percentage greater than 0"
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
      investmentPerRun: Number(investment),
      investmentCap: Number(investmentCap),
      lowerLimit: Number(lowerLimit),
      upperLimit: Number(upperLimit),
      levels: Number(levels),
      profitPercentage: Number(profitPercentage),
      direction: type,
      dataSetDays: Number(dataSet),
      gridMode: gridMode,
      stopLossPct: stopLossPct ? Number(stopLossPct) : undefined,
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
        investmentPerRun: Number(investment),
        investmentCap: Number(investmentCap),
        lowerLimit: Number(lowerLimit),
        upperLimit: Number(upperLimit),
        levels: Number(levels),
        profitPercentage: Number(profitPercentage),
        direction: type,
        dataSetDays: Number(dataSet),
        gridMode: gridMode,
        executionMode: executionMode,
        
        ...(stopLossPct && { stopLossPct: Number(stopLossPct) }),
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
    // setStdDev("2");
    setLowerLimit("");
    setUpperLimit("");
    setLevels("");
    setProfitPercentage("");
    setInvestment("");
    setInvestmentCap("");
    setGridMode("STATIC");
    setStopLossPct("");
    
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
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Strategy Name
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <Input placeholder="Enter Name" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
            </div>

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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Data Set (Days)
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {['20', '30', '40', '180', '365'].map(val => (
                  <Button 
                    key={val} 
                    variant={dataSet === val ? "default" : "outline"} 
                    size="sm" 
                    type="button" 
                    onClick={() => handleDataSetSelect(val)}
                    className={dataSet === val ? "bg-[#4A1515] hover:bg-[#5A2525] text-white" : ""}
                  >
                    {val}D
                  </Button>
                ))}
              </div>
            </div>

            {/* ✅ Standard Deviation Field */}
            {/* <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Standard Deviation
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <Input 
                placeholder="Enter standard deviation" 
                value={stdDev} 
                onChange={e => setStdDev(e.target.value)} 
                type="number"
                step="0.1"
                min="0.1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Higher values = wider grid range (default: 2)
              </p>
            </div> */}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment
                <span className="text-muted-foreground">ⓘ</span>
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Investment CAP
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Value" 
                  value={investmentCap} 
                  onChange={e => setInvestmentCap(e.target.value)} 
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

            {/* ✅ Auto-calculated limits with manual override */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Lower Limit</Label>
                  <div className="flex gap-2">
                   <Input 
                      placeholder="Auto-calculated" 
                      value={lowerLimit} 
                      readOnly
                      type="number"
                      step="0.000001"
                      className="bg-white dark:bg-[#1a1a1d] cursor-not-allowed"
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
                  <Label className="text-xs">Upper Limit</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Auto-calculated" 
                      value={upperLimit} 
                      readOnly
                      type="number"
                      step="0.000001"
                      className="bg-white dark:bg-[#1a1a1d] cursor-not-allowed"
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Profit Percentage
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="relative">
                <Input 
                  placeholder="Value" 
                  value={profitPercentage} 
                  onChange={e => setProfitPercentage(e.target.value)} 
                  type="number"
                  step="0.1"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between border border-t-0 rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
            <span>Advanced Settings</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
            <div className="space-y-2">
              <Label>Grid Mode</Label>
              <Select value={gridMode} onValueChange={(value: 'STATIC' | 'DYNAMIC') => setGridMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATIC">Static</SelectItem>
                  <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Static: Fixed grid levels | Dynamic: Adjusts based on market
              </p>
            </div>

            <div className="space-y-2">
              <Label>Stop Loss % (Optional)</Label>
              <div className="relative">
                <Input 
                  placeholder="Value" 
                  value={stopLossPct} 
                  onChange={e => setStopLossPct(e.target.value)} 
                  type="number"
                  step="0.1"
                />
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
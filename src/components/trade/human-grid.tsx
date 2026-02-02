'use client'

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { useStrategyStore, HumanGridStrategy } from "@/stores/strategystore"
import { toast } from "sonner"
import { useState } from "react"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"

export default function HumanGrid() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Form state
  const [strategyName, setStrategyName] = React.useState("");
  const [investment, setInvestment] = React.useState("");
  const [investmentCap, setInvestmentCap] = React.useState("");
  const [lowerLimit, setLowerLimit] = React.useState("");
  const [upperLimit, setUpperLimit] = React.useState("");
  const [leverage, setLeverage] = React.useState("");
  const [direction, setDirection] = React.useState("Long");
  const [entryInterval, setEntryInterval] = React.useState("");
  const [bookProfitBy, setBookProfitBy] = React.useState("");
  const [stopLossBy, setStopLossBy] = React.useState("");

  // Get strategy store
  const { 
    createHumanGrid, 
    isLoading, 
    error, 
    clearError,
    fetchBalances,
    getBalanceByAsset,
    balances,
    isLoadingBalances,
    balancesError
  } = useStrategyStore();

  // Available balance for selected quote asset
  const [availableBalance, setAvailableBalance] = useState<string>("0");

  // Check if segment is FUTURES
  const isFutures = segment.toUpperCase() === 'FUTURES';

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

  // Reset leverage and direction when switching from FUTURES to SPOT
  React.useEffect(() => {
    if (!isFutures) {
      setLeverage("");
      setDirection("Long");
    }
  }, [isFutures]);

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
        description: "Enter a valid lower price limit"
      });
      return false;
    }
    if (!upperLimit || Number(upperLimit) <= 0) {
      toast.error("Invalid upper limit", {
        description: "Enter a valid upper price limit"
      });
      return false;
    }
    if (Number(upperLimit) <= Number(lowerLimit)) {
      toast.error("Invalid price limits", {
        description: "Upper limit must be greater than lower limit"
      });
      return false;
    }
    
    // Only validate leverage and direction for FUTURES
    if (isFutures) {
      if (!leverage || Number(leverage) < 1) {
        toast.error("Invalid leverage", {
          description: "Enter a valid leverage (minimum 1)"
        });
        return false;
      }
    }
    
    if (!entryInterval || Number(entryInterval) <= 0) {
      toast.error("Invalid entry interval", {
        description: "Enter a valid entry interval"
      });
      return false;
    }
    if (!bookProfitBy || Number(bookProfitBy) <= 0) {
      toast.error("Invalid book profit percentage", {
        description: "Enter a valid percentage greater than 0"
      });
      return false;
    }
    if (!stopLossBy || Number(stopLossBy) <= 0) {
      toast.error("Invalid stop loss percentage", {
        description: "Enter a valid percentage greater than 0"
      });
      return false;
    }

    return true;
  };

  // Prepare strategy data for popup
  const getStrategyData = () => {
    const data: any = {
      selectedApi: selectedApiId,
      exchange: exchange,
      segment: segment,
      pair: symbol,
      name: strategyName,
      investmentPerRun: Number(investment),
      investmentCap: Number(investmentCap),
      lowerLimit: Number(lowerLimit),
      upperLimit: Number(upperLimit),
      entryInterval: Number(entryInterval),
      bookProfitBy: Number(bookProfitBy),
      stopLossPct: stopLossBy ? Number(stopLossBy) : undefined,
      strategyType: 'HUMAN_GRID' as const,
    };

    // Only add leverage and direction for FUTURES
    if (isFutures) {
      data.leverage = Number(leverage);
      data.direction = direction;
    }

    return data;
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
    const toastId = toast.loading("Creating strategy...", {
      description: "Please wait while we process your request"
    });
    
    try {
      const strategyData: Omit<HumanGridStrategy, 'strategyType' | 'assetType'> = {
        name: strategyName,
        exchange: exchange,
        segment: segment,
        symbol: symbol,
        investmentPerRun: Number(investment),
        investmentCap: Number(investmentCap),
        lowerLimit: Number(lowerLimit),
        upperLimit: Number(upperLimit),
        entryInterval: Number(entryInterval),
        bookProfitBy: Number(bookProfitBy),
        executionMode: executionMode,
        
        // Only add optional fields if they have values
        ...(stopLossBy && { stopLossPct: Number(stopLossBy) }),
      };
      
      console.log("Human Grid strategy data being sent:", strategyData);
      
      await createHumanGrid(strategyData);
      
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
    setInvestment("");
    setInvestmentCap("");
    setLowerLimit("");
    setUpperLimit("");
    setLeverage("");
    setDirection("Long");
    setEntryInterval("");
    setBookProfitBy("");
    setStopLossBy("");

    clearError();

    toast.success("Form reset", {
      description: "All fields have been cleared"
    });
  };

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

  // Update available balance when symbol or balances change
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

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border border-t-0">
            <span>Human Grid</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Strategy Name
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <Input 
                placeholder="Enter Name" 
                value={strategyName} 
                onChange={e => setStrategyName(e.target.value)} 
              />
            </div>

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
                  type="text"
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
                  type="text"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lower Limit</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Value" 
                    value={lowerLimit} 
                    onChange={e => setLowerLimit(e.target.value)} 
                    type="text"
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
              <div className="space-y-2">
                <Label>Upper Limit</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Value" 
                    value={upperLimit} 
                    onChange={e => setUpperLimit(e.target.value)} 
                    type="text"
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
            </div>

            {/* ✅ Only show Leverage and Direction for FUTURES */}
            {isFutures && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Leverage
                    {/* <span className="text-xs text-orange-500">(Futures only)</span> */}
                  </Label>
                  <Input 
                    placeholder="Value" 
                    value={leverage} 
                    onChange={e => setLeverage(e.target.value)} 
                    type="text"
                    min="1"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Direction
                    {/* <span className="text-xs text-orange-500">(Futures only)</span> */}
                  </Label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long">Long</SelectItem>
                      <SelectItem value="Short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Entry Interval
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="relative">
                <Input 
                  placeholder="Value" 
                  value={entryInterval} 
                  onChange={e => setEntryInterval(e.target.value)} 
                  type="text"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Pts</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Book Profit By
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="relative">
                <Input 
                  placeholder="Value" 
                  value={bookProfitBy} 
                  onChange={e => setBookProfitBy(e.target.value)} 
                  type="text"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stop Loss By</Label>
              <div className="relative">
                <Input 
                  placeholder="Value" 
                  value={stopLossBy} 
                  onChange={e => setStopLossBy(e.target.value)} 
                  type="text"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {error && <div className="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">{error}</div>}

        <div className="flex gap-4">
          <Button 
            className="flex-1 bg-[#4A1515] text-white hover:bg-[#5A2525]" 
            onClick={handleProceed} 
            type="button"
            disabled={isLoading}
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
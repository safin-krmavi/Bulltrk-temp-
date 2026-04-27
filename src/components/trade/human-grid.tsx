'use client'

import * as React from "react"
import { ChevronDown, ArrowLeft, Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { useStrategyStore, HumanGridStrategy, Strategy } from "@/stores/strategystore"
import { toast } from "sonner"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"
import { useNavigate } from "react-router-dom"

export default function HumanGrid({ editData }: { editData?: Strategy | null }) {
  const navigate = useNavigate();
  const isEditMode = !!editData;

  const [isOpen, setIsOpen] = React.useState(true)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");
  const [quoteAsset, setQuoteAsset] = useState("USDT");

  // Form state - pre-fill from editData if in edit mode
  const [strategyName, setStrategyName] = React.useState(editData?.name ?? "");
  const [investment, setInvestment] = React.useState(editData?.investmentPerRun?.toString() ?? "");
  const [investmentCap, setInvestmentCap] = React.useState(editData?.investmentCap?.toString() ?? "");
  const [lowerLimit, setLowerLimit] = React.useState(editData?.lowerLimit?.toString() ?? "");
  const [upperLimit, setUpperLimit] = React.useState(editData?.upperLimit?.toString() ?? "");
  const [leverage, setLeverage] = React.useState("");
  const [direction, setDirection] = React.useState("Long");
  const [entryInterval, setEntryInterval] = React.useState(editData?.entryInterval?.toString() ?? "");
  const [bookProfitBy, setBookProfitBy] = React.useState(editData?.bookProfitBy?.toString() ?? "");
  const [stopLossBy, setStopLossBy] = React.useState(editData?.stopLossPct?.toString() ?? "");

  // Get strategy store
  const {
    createHumanGrid,
    updateStrategyById,
    isLoading,
    error,
    clearError,
    allExchangesBalances,
    fetchAllExchangesBalances,
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
    quote: string;
  }) => {
    console.log("Account details received:", data);
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
    setQuoteAsset(data.quote);
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

    if (isEditMode && editData) {
      // In edit mode skip full validation - just check name
      if (!strategyName.trim()) { toast.error("Please enter a strategy name"); return; }
      toast.info("Review your changes", { description: "Please confirm the updates" });
      setShowProceedPopup(true);
      return;
    }

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
    if (isEditMode && editData) {
      const toastId = toast.loading("Updating strategy...");
      try {
        await updateStrategyById(editData.id, {
          name: strategyName,
          lowerLimit: lowerLimit ? Number(lowerLimit) : undefined,
          upperLimit: upperLimit ? Number(upperLimit) : undefined,
          entryInterval: entryInterval ? Number(entryInterval) : undefined,
          bookProfitBy: bookProfitBy ? Number(bookProfitBy) : undefined,
          investmentPerRun: investment ? Number(investment) : undefined,
          stopLossPct: stopLossBy ? Number(stopLossBy) : undefined,
          strategyType: 'HUMAN_GRID',
        } as any);
        toast.success("Strategy updated! ✅", { id: toastId, duration: 5000 });
        setShowProceedPopup(false);
        navigate('/dashboard');
      } catch (err: any) {
        toast.error("Failed to update", { id: toastId, description: err.message });
      }
      return;
    }
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

    // toast.success("Form reset", {
    //   description: "All fields have been cleared"
    // });
  };

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
      const segmentKey = segment.toUpperCase();

      const exchangeData = allExchangesBalances.exchanges?.[exchangeKey];
      const balanceData = exchangeData?.balances?.find(b => b.type === segmentKey);

      if (balanceData) {
        setAvailableBalance(balanceData.free.toFixed(2));
      } else {
        setAvailableBalance("0");
      }
    }
  }, [exchange, segment, allExchangesBalances]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Edit mode banner */}
      {isEditMode && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
          <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Editing Strategy</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{editData?.name}</p>
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </div>
      )}
      <AccountDetailsCard
        onDataChange={handleAccountDetailsChange}
        initialExchange={editData?.exchange}
        initialSegment={editData?.segment}
        initialPair={editData?.symbol}
      />

      <TooltipProvider>
        <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border border-t-0">
              <span>{isEditMode ? 'Edit: Human Grid' : 'Human Grid'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Strategy Name
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>You can keep desired Strategy name for reference and reports</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Investment per Trade</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={investment}
                    onChange={e => setInvestment(e.target.value)}
                    type="text"
                    step="0.01"
                  />
                  <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                    {symbol || "—"}
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Investment CAP
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Strategy stops when total investment of the strategy is equal to cap value</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={investmentCap}
                    onChange={e => setInvestmentCap(e.target.value)}
                    type="text"
                    step="0.01"
                  />
                  <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                    {symbol || "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Lower Limit
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                        <p>Set the Lowest / Starting Price range</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value"
                      value={lowerLimit}
                      onChange={e => setLowerLimit(e.target.value)}
                      type="text"
                      step="0.01"
                    />
                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                      {symbol || "—"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Upper Limit
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                        <p>Set the Maximum / Ending Price range</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value"
                      value={upperLimit}
                      onChange={e => setUpperLimit(e.target.value)}
                      type="text"
                      step="0.01"
                    />
                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                      {symbol || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Only show Leverage and Direction for FUTURES */}
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
                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                      {symbol || "—"}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Entry Interval
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Enter at which intervals each entry should be taken</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>If you wish to book profit by percentage based on buy price, please make sure to check your transaction fees on the respective exchange</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Value"
                    value={bookProfitBy}
                    onChange={e => setBookProfitBy(e.target.value)}
                    type="text"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Pts</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Stop Loss By
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[200px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Set the stop loss percentage to limit potential losses</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
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
              {isLoading ? "Processing..." : isEditMode ? "Update Strategy" : "Proceed"}
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
      </TooltipProvider>

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
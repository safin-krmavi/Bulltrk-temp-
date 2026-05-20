'use client'

import * as React from "react"
import { ChevronDown, AlertCircle, ArrowLeft, Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { toast } from "sonner"
import { useStrategyStore, SmartGridStrategy, Strategy } from "@/stores/strategystore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNavigate } from "react-router-dom"

export default function SmartGrid({ editData }: { editData?: Strategy | null }) {
  const navigate = useNavigate();
  const isEditMode = !!editData;

  const [isOpen, setIsOpen] = React.useState(true)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)
  const [, setIsCalculatingLimits] = React.useState(false)
  const [showRequiredFieldsWarning, setShowRequiredFieldsWarning] = React.useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");
  const [quoteAsset, setQuoteAsset] = useState("USDT");

  // Form state - pre-fill from editData if in edit mode
  const [strategyName, setStrategyName] = React.useState(editData?.name ?? "");
  const [type, setType] = React.useState<'NEUTRAL' | 'LONG' | 'SHORT'>(editData?.direction ?? "NEUTRAL");
  const [dataSet, setDataSet] = React.useState(editData?.dataSetDays?.toString() ?? "30");
  const [lowerLimit, setLowerLimit] = React.useState(editData?.lowerLimit?.toString() ?? "");
  const [upperLimit, setUpperLimit] = React.useState(editData?.upperLimit?.toString() ?? "");
  const [levels, setLevels] = React.useState(editData?.levels?.toString() ?? "");
  const [profitPerLevel, setProfitPerLevel] = React.useState(editData?.profitPercentage?.toString() ?? "");
  const [profitUnit, setProfitUnit] = React.useState("%");
  const [investment, setInvestment] = React.useState(editData?.investmentCap?.toString() ?? "");
  const [minimumInvestment, setMinimumInvestment] = React.useState(editData?.investmentPerRun?.toString() ?? "");

  // Get strategy store
  const {
    createSmartGrid,
    updateStrategyById,
    calculateSmartGridLimits,
    isLoading,
    error,
    clearError,
    allExchangesBalances,
    fetchAllExchangesBalances,
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
    quote: string;
  }) => {
    console.log("Account details received:", data);
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
    setQuoteAsset(data.quote);
  };

  // Handlers for type buttons
  const handleTypeSelect = (val: 'NEUTRAL' | 'LONG' | 'SHORT') => setType(val);

  // Handlers for data set buttons
  const handleDataSetSelect = (val: string) => setDataSet(val);

  // ✅ Remove automatic calculation on mount
  // React.useEffect(() => {
  //   if (exchange && segment && symbol && dataSet) {
  //     handleCalculateLimits();
  //   }
  // }, [exchange, segment, symbol, dataSet]);

  // ✅ Update effect to calculate when exchange, segment, symbol, and dataSet are filled
  React.useEffect(() => {
    // Calculate limits as soon as we have the required fields
    if (exchange && segment && symbol && dataSet) {
      handleCalculateLimits();
    }
  }, [exchange, segment, symbol, dataSet]);  // ✅ Removed investment dependency

  // ✅ Update Calculate Smart Grid Limits function to receive and map investment
  const handleCalculateLimits = async () => {
    if (!exchange || !segment || !symbol) {
      return;
    }

    setIsCalculatingLimits(true);

    try {
      console.log("Calculating limits with:", {
        exchange,
        segment,
        symbol,
        dataSetDays: dataSet,
      });

      // ✅ Call API and receive investment value
      const {
        lowerLimit: calcLower,
        upperLimit: calcUpper,
        levels: calcLevels,
        profitPercentage: calcProfitPercentage,
        minimumInvestment: calcMinimumInvestment,
        investment: calcInvestment  // ✅ Receive investment from API
      } = await calculateSmartGridLimits(
        exchange,
        segment,
        symbol,
        Number(dataSet)
      );

      // ✅ Update all fields with calculated values including investment
      setLowerLimit(calcLower.toFixed(2));
      setUpperLimit(calcUpper.toFixed(2));
      setLevels(calcLevels.toString());
      setProfitPerLevel(calcProfitPercentage.toString());
      setMinimumInvestment(calcMinimumInvestment.toString());
      setInvestment(calcInvestment.toString());  // ✅ Set investment field

      toast.success("Smart Grid parameters calculated!", {
        description: `Limits: ${calcLower.toFixed(2)} - ${calcUpper.toFixed(2)} | Levels: ${calcLevels} | Profit: ${calcProfitPercentage}% | Investment: ${calcInvestment} | Min Investment: ${calcMinimumInvestment}`
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

  // ✅ Update validation - minimumInvestment is now optional for user input
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
    // ✅ minimumInvestment validation - now optional, API calculates it
    if (minimumInvestment && Number(minimumInvestment) <= 0) {
      toast.error("Invalid minimum investment", {
        description: "Enter a valid minimum investment amount"
      });
      return false;
    }
    if (minimumInvestment && Number(minimumInvestment) > Number(investment)) {
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

  // ✅ Update required fields warning - Remove investment from check
  React.useEffect(() => {
    const hasRequiredFields = exchange && segment && symbol;  // ✅ Removed investment
    setShowRequiredFieldsWarning(!hasRequiredFields);
  }, [exchange, segment, symbol]);  // ✅ Removed investment dependency

  // ✅ Update missing fields list - Remove investment
  const getMissingFields = () => {
    const missing = [];
    if (!exchange) missing.push("Exchange");
    if (!segment) missing.push("Segment");
    if (!symbol) missing.push("Trading Pair");
    // ✅ Removed investment from required fields
    return missing;
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

    if (isEditMode && editData) {
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
          direction: type,
          levels: levels ? Number(levels) : undefined,
          profitPercentage: profitPerLevel ? Number(profitPerLevel) : undefined,
          investmentCap: investment ? Number(investment) : undefined,
          dataSetDays: dataSet ? Number(dataSet) : undefined,
          strategyType: 'SMART_GRID',
        } as any);
        toast.success("Strategy updated! ✅", { id: toastId, duration: 5000 });
        setShowProceedPopup(false);
        navigate('/dashboard');
      } catch (err: any) {
        toast.error("Failed to update", { id: toastId, description: err.message });
      }
      return;
    }
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

    // toast.success("Form reset", {
    //   description: "All fields have been cleared"
    // });
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

      {/* ✅ Required Fields Warning */}
      {showRequiredFieldsWarning && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-400">
            <span className="font-semibold">Required fields missing:</span>
            <span className="ml-1">{getMissingFields().join(", ")}</span>
          </AlertDescription>
        </Alert>
      )}

      <TooltipProvider>
        <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 border border-t-0 font-medium text-white hover:bg-[#5A2525]">
              <span>{isEditMode ? 'Edit: Smart Grid' : 'Smart Grid'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
              {/* Strategy Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Strategy Name
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>You can keep desired Strategy name for reference and reports</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  placeholder="Enter Name"
                  value={strategyName}
                  onChange={e => setStrategyName(e.target.value)}
                />
              </div>

              {/* Select Type - only shown for non-SPOT segments */}
              {segment !== "SPOT" && (
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
              )}

              {/* Data Set (Days) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Data Set
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Please select the Timeframe of Historical Data to determine the price range</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {['30', '90', '180', '365'].map((val, index) => (
                    <Button
                      key={index}
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

              {/* Lower and Upper Limit - Auto-calculated */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Lower Limit
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground text-xs">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                        <p>Set the Lowest / Starting Price range</p>
                      </TooltipContent>
                    </Tooltip>
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
                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                      {symbol || "—"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Upper Limit
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground text-xs">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                        <p>Set the Maximum / Ending Price range</p>
                      </TooltipContent>
                    </Tooltip>
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
                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                      {symbol || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Levels */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Levels
                </Label>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Set the profit percentage target for each grid level trade</p>
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Investment per Trade</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={investment}
                    onChange={e => setInvestment(e.target.value)}
                    type="number"
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

              {/* Minimum Investment - Now auto-calculated and displayed */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Minimum Investment
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#FCE8E8] text-black border-[#FCE8E8] max-w-[240px] rounded-xl shadow-lg [&>svg]:fill-[#FCE8E8]">
                      <p>Specify the minimum capital required for this strategy to operate</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Value"
                    value={minimumInvestment}
                    onChange={e => setMinimumInvestment(e.target.value)}
                    type="number"
                    step="0.01"
                    className="bg-gray-50 dark:bg-[#2A2A2D]"
                  />
                  <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                    {symbol || "—"}
                  </div>
                </div>
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
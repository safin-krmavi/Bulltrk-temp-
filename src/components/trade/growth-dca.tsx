'use client'

import * as React from "react"
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { AccountDetailsCard } from "./AccountDetailsCard"
import { useStrategyStore, GrowthDCAStrategy } from "@/stores/strategystore"
import { toast } from "sonner"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"

const WEEKDAYS = [
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' }
];

const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

export default function GrowthDCA() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  const [showProceedPopup, setShowProceedPopup] = React.useState(false)
  const [activeFrequencyPopover, setActiveFrequencyPopover] = React.useState<string | null>(null)
  const [isDaysDropdownOpen, setIsDaysDropdownOpen] = React.useState(false)

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

  // Shared time state for DAILY, WEEKLY, and MONTHLY
  const [sharedTime, setSharedTime] = useState({
    hour: "12",
    minute: "00",
    period: "AM" as "AM" | "PM"
  });

  // Separate state for frequency-specific selections
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [monthlyDates, setMonthlyDates] = useState<number[]>([]);
  const [hourInterval, setHourInterval] = useState<string>("1");

  // Get strategy store
  const { 
    createGrowthDCA, 
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

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: "AM" | "PM") => {
    let hour24 = parseInt(hour) || 12;
    
    if (period === "AM") {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    
    const min = parseInt(minute) || 0;
    return `${hour24.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  // Build frequency data object for API - with explicit return type
  const buildFrequencyData = (): GrowthDCAStrategy['frequency'] | null => {
    const time24 = convertTo24Hour(sharedTime.hour, sharedTime.minute, sharedTime.period);

    switch(frequency) {
      case 'DAILY':
        return {
          type: 'DAILY' as const,
          time: time24,
        };
      
      case 'WEEKLY':
        if (weeklyDays.length === 0) {
          toast.error("Please select at least one day for weekly frequency");
          return null;
        }
        return {
          type: 'WEEKLY' as const,
          days: weeklyDays,
          time: time24,
        };
      
      case 'MONTHLY':
        if (monthlyDates.length === 0) {
          toast.error("Please select at least one date for monthly frequency");
          return null;
        }
        return {
          type: 'MONTHLY' as const,
          dates: monthlyDates.sort((a, b) => a - b),
          time: time24,
        };
      
      case 'HOURLY':
        const interval = parseInt(hourInterval || "1");
        if (interval < 1 || interval > 24) {
          toast.error("Hour interval must be between 1 and 24");
          return null;
        }
        return {
          type: 'HOURLY' as const,
          intervalHours: interval,
        };
      
      default:
        return null;
    }
  };

  // Format time display
  const getFormattedTime = () => {
    const hour = sharedTime.hour.padStart(2, '0');
    const minute = sharedTime.minute.padStart(2, '0');
    return `${hour}:${minute} ${sharedTime.period}`;
  };

  // Get input display value - show values for all frequencies
  const getInputDisplayValue = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    // DAILY input - show time if configured, otherwise empty for placeholder
    if (freq === 'DAILY') {
      // Only show time if it's not the default values
      if (sharedTime.hour !== "12" || sharedTime.minute !== "00" || sharedTime.period !== "AM") {
        return getFormattedTime();
      }
      return '';
    }
    
    // WEEKLY input shows only selected days when active
    if (freq === 'WEEKLY') {
      if (frequency === 'WEEKLY' && weeklyDays.length > 0) {
        return weeklyDays.join(', ');
      }
      // When not active, show count if days are selected
      if (weeklyDays.length > 0) {
        return `${weeklyDays.length} days`;
      }
      return '';
    }
    
    // MONTHLY input shows only selected dates when active
    if (freq === 'MONTHLY') {
      if (frequency === 'MONTHLY' && monthlyDates.length > 0) {
        return monthlyDates.sort((a, b) => a - b).join(', ');
      }
      // When not active, show count if dates are selected
      if (monthlyDates.length > 0) {
        return `${monthlyDates.length} dates`;
      }
      return '';
    }
    
    // HOURLY input shows interval
    if (freq === 'HOURLY') {
      // Only show if interval is not default value
      if (hourInterval && hourInterval !== "1") {
        if (frequency === 'HOURLY') {
          return `Every ${hourInterval}h`;
        }
        return `${hourInterval}h`;
      }
      return '';
    }
    
    return '';
  };

  // Frequency input handler
  const handleFrequencyClick = (val: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    setFrequency(val);
    setActiveFrequencyPopover(val);
    setIsDaysDropdownOpen(false);
  };

  // Close popover handler
  const closePopover = () => {
    setActiveFrequencyPopover(null);
    setIsDaysDropdownOpen(false);
  };

  // Update hour (shared across DAILY, WEEKLY, MONTHLY)
  const updateHour = (value: string) => {
    setSharedTime(prev => ({ ...prev, hour: value }));
  };

  // Update minute (shared across DAILY, WEEKLY, MONTHLY)
  const updateMinute = (value: string) => {
    setSharedTime(prev => ({ ...prev, minute: value }));
  };

  // Update period (shared across DAILY, WEEKLY, MONTHLY)
  const updatePeriod = (value: "AM" | "PM") => {
    setSharedTime(prev => ({ ...prev, period: value }));
  };

  // Toggle day selection for weekly frequency
  const toggleDay = (day: string) => {
    setWeeklyDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Toggle date selection for monthly frequency
  const toggleDate = (date: number) => {
    setMonthlyDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  // Update hour interval for hourly frequency
  const updateHourInterval = (value: string) => {
    setHourInterval(value);
  };

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
    if (!investmentPerRun || Number(investmentPerRun) <= 0) {
      toast.error("Invalid investment per run", {
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
    if (!takeProfitPct || Number(takeProfitPct) <= 0) {
      toast.error("Invalid take profit percentage", {
        description: "Enter a valid percentage greater than 0"
      });
      return false;
    }

    // ✅ Make advanced fields optional - only validate if provided
    if (priceStart && Number(priceStart) <= 0) {
      toast.error("Invalid price start", {
        description: "Enter a valid starting price"
      });
      return false;
    }
    if (priceStop && Number(priceStop) <= 0) {
      toast.error("Invalid price stop", {
        description: "Enter a valid stopping price"
      });
      return false;
    }
    if (stopLossPct && Number(stopLossPct) <= 0) {
      toast.error("Invalid stop loss percentage", {
        description: "Enter a valid percentage greater than 0"
      });
      return false;
    }

    // Validate frequency-specific data
    if (frequency === 'WEEKLY' && weeklyDays.length === 0) {
      toast.error("No days selected for weekly frequency", {
        description: "Please select at least one day"
      });
      return false;
    }
    if (frequency === 'MONTHLY' && monthlyDates.length === 0) {
      toast.error("No dates selected for monthly frequency", {
        description: "Please select at least one date"
      });
      return false;
    }
    if (frequency === 'HOURLY') {
      const interval = parseInt(hourInterval || "0");
      if (interval < 1 || interval > 24) {
        toast.error("Invalid hour interval", {
          description: "Hour interval must be between 1 and 24"
        });
        return false;
      }
    }

    return true;
  };

  // Prepare strategy data for popup
  const getStrategyData = () => {
    const frequencyData = buildFrequencyData();
    
    return {
      selectedApi: selectedApiId,
      exchange: exchange,
      segment: segment,
      pair: symbol,
      name: strategyName,
      investmentPerRun: Number(investmentPerRun),
      investmentCap: Number(investmentCap),
      frequency: frequency,
      frequencyData: frequencyData,
      takeProfitPct: Number(takeProfitPct),
      priceStart: Number(priceStart),
      priceStop: Number(priceStop),
      stopLossPct: Number(stopLossPct),
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
    const toastId = toast.loading("Creating strategy...", {
      description: "Please wait while we process your request"
    });
    
    try {
      const frequencyData = buildFrequencyData();
      
      if (!frequencyData) {
        toast.dismiss(toastId);
        return;
      }

      const strategyData: Omit<GrowthDCAStrategy, 'strategyType' | 'assetType'> = {
        name: strategyName,
        exchange: exchange,
        segment: segment,
        symbol: symbol,
        investmentPerRun: Number(investmentPerRun),
        investmentCap: Number(investmentCap),
        frequency: frequencyData,
        takeProfitPct: Number(takeProfitPct),
        executionMode: executionMode,
        
        // ✅ Only add optional fields if they have values
        ...(stopLossPct && { stopLossPct: Number(stopLossPct) }),
        ...(priceStart && { priceStart: Number(priceStart) }),
        ...(priceStop && { priceStop: Number(priceStop) }),
      };
      
      console.log("Strategy data being sent:", strategyData);
      
      await createGrowthDCA(strategyData);
      
      toast.success("Strategy created successfully! 🎉", {
        id: toastId,
        description: `${strategyName} is now active and running in LIVE mode`,
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
    setInvestmentPerRun("");
    setInvestmentCap("");
    setFrequency("DAILY");
    setTakeProfitPct("");
    setPriceStart("");
    setPriceStop("");
    setStopLossPct("");
    
    // Reset shared time and frequency-specific states
    setSharedTime({ hour: "12", minute: "00", period: "AM" });
    setWeeklyDays([]);
    setMonthlyDates([]);
    setHourInterval("1");
    
    clearError();
    
    toast.success("Form reset", {
      description: "All fields have been cleared"
    });
  };

  // Callback to receive data from AccountDetailsCard
  const handleAccountDetailsChange = (data: {
    selectedApi: string;
    exchange: string;
    segment: string;
    pair: string;
  }) => {
    setSelectedApiId(data.selectedApi);
    setExchange(data.exchange);
    setSegment(data.segment);
    setSymbol(data.pair);
  };

  // Fetch balances when exchange and segment change
  React.useEffect(() => {
    if (exchange && segment) {
      console.log("Fetching balances for:", { exchange, segment, symbol });
      fetchBalances(exchange, segment).catch(err => {
        console.error("Failed to fetch balances:", err);
        toast.error("Failed to load balance", {
          description: "Unable to fetch account balance"
        });
      });
    }
  }, [exchange, segment, symbol, fetchBalances]); // ✅ Added symbol to dependencies

  // ✅ Update available balance when symbol or balances change
  React.useEffect(() => {
    if (symbol && balances.length > 0) {
      console.log("Updating balance for symbol:", symbol);
      console.log("Available balances:", balances);
      
      // Extract both base and quote asset from symbol (e.g., 0GUSDT → base: 0G, quote: USDT)
      let baseAsset = '';
      let quoteAsset = '';
      const knownQuotes = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'INR'];
      
      // Find the quote asset
      for (const quote of knownQuotes) {
        if (symbol.toUpperCase().endsWith(quote)) {
          quoteAsset = quote;
          baseAsset = symbol.slice(0, -quote.length); // Extract base asset by removing quote
          break;
        }
      }
      
      console.log("Extracted assets:", { baseAsset, quoteAsset });
      
      // Priority 1: Try to find the quote asset balance (USDT, BTC, etc.)
      if (quoteAsset) {
        const quoteBalance = getBalanceByAsset(quoteAsset);
        console.log("Found balance for quote asset", quoteAsset, ":", quoteBalance);
        
        if (quoteBalance && parseFloat(quoteBalance.free) > 0) {
          setAvailableBalance(parseFloat(quoteBalance.free).toFixed(2));
          return;
        }
      }
      
      // Priority 2: Try to find the base asset balance (0G, BTC, etc.)
      if (baseAsset) {
        const baseBalance = getBalanceByAsset(baseAsset);
        console.log("Found balance for base asset", baseAsset, ":", baseBalance);
        
        if (baseBalance && parseFloat(baseBalance.free) > 0) {
          setAvailableBalance(parseFloat(baseBalance.free).toFixed(6)); // More decimals for base asset
          return;
        }
      }
      
      // Priority 3: Fallback to USDT if neither found
      const usdtBalance = getBalanceByAsset('USDT');
      if (usdtBalance) {
        console.log("Using USDT balance as fallback:", usdtBalance);
        setAvailableBalance(parseFloat(usdtBalance.free).toFixed(2));
      } else {
        console.log("No balance found, setting to 0");
        setAvailableBalance("0");
      }
    } else if (!symbol) {
      console.log("No symbol selected, resetting balance");
      setAvailableBalance("0");
    }
  }, [symbol, balances, getBalanceByAsset]);

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
                <Input placeholder="Value" value={investmentPerRun} onChange={e => setInvestmentPerRun(e.target.value)} type="text" />
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
                <Input placeholder="Value" value={investmentCap} onChange={e => setInvestmentCap(e.target.value)} type="text" />
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
                Duration
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'HOURLY'] as const).map(val => {
                  const displayValue = getInputDisplayValue(val);
                  const placeholderText = val.charAt(0) + val.slice(1).toLowerCase();
                  
                  return (
                    <Popover 
                      key={val} 
                      open={activeFrequencyPopover === val} 
                      onOpenChange={(open) => {
                        if (!open) {
                          closePopover();
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Input
                          placeholder={placeholderText}
                          value={displayValue}
                          onClick={() => handleFrequencyClick(val)}
                          readOnly
                          className={`cursor-pointer text-xs placeholder:text-black dark:placeholder:text-white focus:bg-orange-50 dark:focus:bg-orange-900/20 focus-visible:ring-orange-500 ${
                            frequency === val ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : ''
                          }`}
                        />
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-56 p-3 bg-white dark:bg-[#232326]" 
                        align="start"
                        onInteractOutside={(e) => {
                          if ((e.target as HTMLElement).closest('.popover-content')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="space-y-2.5 popover-content">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-sm">{placeholderText} Settings</h3>
                            <button
                              type="button"
                              onClick={closePopover}
                              className="h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2d] flex items-center justify-center"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {val === 'WEEKLY' && (
                            <div className="space-y-1.5">
                              <h4 className="font-medium text-xs">Select Days</h4>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDaysDropdownOpen(!isDaysDropdownOpen);
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs border rounded-md bg-white dark:bg-[#1a1a1d] hover:bg-gray-50 dark:hover:bg-[#2a2a2d]"
                                >
                                  <span>
                                    {weeklyDays.length > 0 ? `${weeklyDays.length} day(s)` : 'Days'}
                                  </span>
                                  {isDaysDropdownOpen ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                                
                                {isDaysDropdownOpen && (
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#232326] border rounded-md shadow-lg max-h-48 overflow-auto">
                                    {WEEKDAYS.map((day) => (
                                      <label
                                        key={day.short}
                                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2d] cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Checkbox
                                          checked={weeklyDays.includes(day.short)}
                                          onCheckedChange={() => toggleDay(day.short)}
                                          className="h-3.5 w-3.5"
                                        />
                                        <span className="text-xs">{day.full}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {val === 'MONTHLY' && (
                            <div className="space-y-1.5">
                              <h4 className="font-medium text-xs">Select Dates</h4>
                              <div className="grid grid-cols-7 gap-1">
                                {MONTH_DATES.map((date) => (
                                  <button
                                    key={date}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDate(date);
                                    }}
                                    className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition-colors ${
                                      monthlyDates.includes(date)
                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                        : 'bg-gray-100 dark:bg-[#1a1a1d] hover:bg-gray-200 dark:hover:bg-[#2a2a2d]'
                                    }`}
                                  >
                                    {date}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {val === 'HOURLY' && (
                            <div className="space-y-3">
                              {/* Interval */}
                              <div className="space-y-1.5">
                                <h4 className="font-medium text-xs">Run Every</h4>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="1"
                                    value={hourInterval}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (
                                        value === '' ||
                                        (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 24)
                                      ) {
                                        updateHourInterval(value);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 h-8 text-center text-xs"
                                    min="1"
                                    max="24"
                                  />
                                  <span className="text-xs">hour(s)</span>
                                </div>
                              </div>

                              {/* Start Time */}
                              <div className="space-y-1.5">
                                <h4 className="font-medium text-xs">Start Time</h4>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5">
                                    <Input
                                      type="text"
                                      placeholder="HH"
                                      value={sharedTime.hour}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (
                                          value === '' ||
                                          (/^\d{0,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 12)
                                        ) {
                                          updateHour(value);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-10 h-8 text-center text-xs"
                                      maxLength={2}
                                    />
                                    <span className="text-sm">:</span>
                                    <Input
                                      type="text"
                                      placeholder="MM"
                                      value={sharedTime.minute}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (
                                          value === '' ||
                                          (/^\d{0,2}$/.test(value) && Number(value) <= 59)
                                        ) {
                                          updateMinute(value);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-10 h-8 text-center text-xs"
                                      maxLength={2}
                                    />
                                  </div>

                                  <Select
                                    value={sharedTime.period}
                                    onValueChange={(value) => updatePeriod(value as "AM" | "PM")}
                                  >
                                    <SelectTrigger className="w-16 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AM" className="text-xs">AM</SelectItem>
                                      <SelectItem value="PM" className="text-xs">PM</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}


                          {val !== 'HOURLY' && (
                            <div className="space-y-1.5">
                              <h4 className="font-medium text-xs">Repeats On</h4>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  <Input
                                    type="text"
                                    placeholder="HH"
                                    value={sharedTime.hour}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || (/^\d{0,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 12)) {
                                        updateHour(value);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-8 text-center text-xs"
                                    maxLength={2}
                                  />
                                  <span className="text-sm">:</span>
                                  <Input
                                    type="text"
                                    placeholder="MM"
                                    value={sharedTime.minute}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || (/^\d{0,2}$/.test(value) && Number(value) <= 59)) {
                                        updateMinute(value);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-8 text-center text-xs"
                                    maxLength={2}
                                  />
                                </div>
                                <Select value={sharedTime.period} onValueChange={(value) => updatePeriod(value as "AM" | "PM")}>
                                  <SelectTrigger className="w-16 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AM" className="text-xs">AM</SelectItem>
                                    <SelectItem value="PM" className="text-xs">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Take Profit %
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="relative">
                <Input placeholder="Value" value={takeProfitPct} onChange={e => setTakeProfitPct(e.target.value)} type="text" />
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
              <Input placeholder="Value" value={priceStart} onChange={e => setPriceStart(e.target.value)} type="text" step="0.00001" />
            </div>

            <div className="space-y-2">
              <Label>Price Stop</Label>
              <Input placeholder="Value" value={priceStop} onChange={e => setPriceStop(e.target.value)} type="text" step="0.00001" />
            </div>

            <div className="space-y-2">
              <Label>Stop Loss %</Label>
              <div className="relative">
                <Input placeholder="Value" value={stopLossPct} onChange={e => setStopLossPct(e.target.value)} type="text" />
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
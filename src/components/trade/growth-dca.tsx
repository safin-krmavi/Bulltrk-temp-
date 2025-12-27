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
import { useStrategyStore } from "@/stores/strategyStore"
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

interface FrequencyTimeState {
  hour: string;
  minute: string;
  period: "AM" | "PM";
  days: string[];
  dates: number[]; // For monthly date selection
  hourInterval?: string; // For hourly frequency
}

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

  // Independent state for each frequency
  const [dailyTime, setDailyTime] = useState<FrequencyTimeState>({
    hour: "12",
    minute: "00",
    period: "AM",
    days: [],
    dates: [],
    hourInterval: "1"
  });
  
  const [weeklyTime, setWeeklyTime] = useState<FrequencyTimeState>({
    hour: "12",
    minute: "00",
    period: "AM",
    days: [],
    dates: [],
    hourInterval: "1"
  });
  
  const [monthlyTime, setMonthlyTime] = useState<FrequencyTimeState>({
    hour: "12",
    minute: "00",
    period: "AM",
    days: [],
    dates: [],
    hourInterval: "1"
  });
  
  const [hourlyTime, setHourlyTime] = useState<FrequencyTimeState>({
    hour: "12",
    minute: "00",
    period: "AM",
    days: [],
    dates: [],
    hourInterval: "1"
  });

  // Get strategy store
  const { createGrowthDCA, isLoading, error, clearError } = useStrategyStore();

  // Get the state for current frequency
  const getFrequencyState = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    switch(freq) {
      case 'DAILY': return dailyTime;
      case 'WEEKLY': return weeklyTime;
      case 'MONTHLY': return monthlyTime;
      case 'HOURLY': return hourlyTime;
    }
  };

  // Set the state for current frequency
  const setFrequencyState = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY', state: FrequencyTimeState) => {
    switch(freq) {
      case 'DAILY': setDailyTime(state); break;
      case 'WEEKLY': setWeeklyTime(state); break;
      case 'MONTHLY': setMonthlyTime(state); break;
      case 'HOURLY': setHourlyTime(state); break;
    }
  };

  // Format time display
  const getFormattedTime = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    const state = getFrequencyState(freq);
    const hour = state.hour.padStart(2, '0');
    const minute = state.minute.padStart(2, '0');
    return `${hour}:${minute} ${state.period}`;
  };

  // Get input display value - show values for all frequencies
  const getInputDisplayValue = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    const state = getFrequencyState(freq);
    
    // For the active frequency, show detailed info
    if (frequency === freq) {
      if (freq === 'WEEKLY' && state.days.length > 0) {
        return `${state.days.join(', ')}`;
      }
      if (freq === 'MONTHLY' && state.dates.length > 0) {
        return `${state.dates.sort((a, b) => a - b).join(', ')}`;
      }
      if (freq === 'HOURLY' && state.hourInterval) {
        return `Every ${state.hourInterval} hour(s)`;
      }
      return getFormattedTime(freq);
    }
    
    // For inactive frequencies, show if they have data configured
    if (freq === 'WEEKLY' && state.days.length > 0) {
      return `${state.days.length} days`;
    }
    if (freq === 'MONTHLY' && state.dates.length > 0) {
      return `${state.dates.length} dates`;
    }
    if (freq === 'HOURLY' && state.hourInterval && state.hourInterval !== "1") {
      return `${state.hourInterval}h`;
    }
    if (freq === 'DAILY' && (state.hour !== "12" || state.minute !== "00")) {
      return getFormattedTime(freq);
    }
    
    return '';
  };

  // Frequency input handler
  const handleFrequencyClick = (val: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY') => {
    setFrequency(val);
    setActiveFrequencyPopover(val);
    setIsDaysDropdownOpen(false); // Close days dropdown when switching frequency
  };

  // Close popover handler
  const closePopover = () => {
    setActiveFrequencyPopover(null);
    setIsDaysDropdownOpen(false);
  };

  // Update hour for specific frequency
  const updateHour = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY', value: string) => {
    const state = getFrequencyState(freq);
    setFrequencyState(freq, { ...state, hour: value });
  };

  // Update minute for specific frequency
  const updateMinute = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY', value: string) => {
    const state = getFrequencyState(freq);
    setFrequencyState(freq, { ...state, minute: value });
  };

  // Update period for specific frequency
  const updatePeriod = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY', value: "AM" | "PM") => {
    const state = getFrequencyState(freq);
    setFrequencyState(freq, { ...state, period: value });
  };

  // Toggle day selection for specific frequency
  const toggleDay = (freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY', day: string) => {
    const state = getFrequencyState(freq);
    const newDays = state.days.includes(day) 
      ? state.days.filter(d => d !== day)
      : [...state.days, day];
    setFrequencyState(freq, { ...state, days: newDays });
  };

  // Toggle date selection for monthly frequency
  const toggleDate = (freq: 'MONTHLY', date: number) => {
    const state = getFrequencyState(freq);
    const newDates = state.dates.includes(date) 
      ? state.dates.filter(d => d !== date)
      : [...state.dates, date];
    setFrequencyState(freq, { ...state, dates: newDates });
  };

  // Update hour interval for hourly frequency
  const updateHourInterval = (value: string) => {
    const state = getFrequencyState('HOURLY');
    setFrequencyState('HOURLY', { ...state, hourInterval: value });
  };

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

  // Prepare strategy data for popup
  const getStrategyData = () => ({
    selectedApi: selectedApiId,
    exchange: exchange,
    segment: segment,
    pair: symbol,
    name: strategyName,
    investmentPerRun: Number(investmentPerRun),
    investmentCap: Number(investmentCap),
    frequency: frequency,
    takeProfitPct: Number(takeProfitPct),
    priceStart: Number(priceStart),
    priceStop: Number(priceStop),
    stopLossPct: Number(stopLossPct),
  });

  // Show popup when Proceed is clicked
  const handleProceed = (e: React.MouseEvent) => {
    console.log("=== PROCEED BUTTON CLICKED ===");
    e.preventDefault();
    e.stopPropagation();
    
    clearError();

    if (!validateForm()) {
      console.log("Validation failed, stopping...");
      return;
    }

    console.log("Validation passed, showing popup...");
    setShowProceedPopup(true);
  };

  // API call when user confirms in popup
  const handleConfirmStrategy = async () => {
    console.log("=== CONFIRM BUTTON CLICKED IN POPUP ===");
    
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
      setShowProceedPopup(false);
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
    
    // Reset all frequency states
    setDailyTime({ hour: "12", minute: "00", period: "AM", days: [], dates: [], hourInterval: "1" });
    setWeeklyTime({ hour: "12", minute: "00", period: "AM", days: [], dates: [], hourInterval: "1" });
    setMonthlyTime({ hour: "12", minute: "00", period: "AM", days: [], dates: [], hourInterval: "1" });
    setHourlyTime({ hour: "12", minute: "00", period: "AM", days: [], dates: [], hourInterval: "1" });
    
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
                Duration
                <span className="text-muted-foreground">ⓘ</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'HOURLY'] as const).map(val => {
                  const state = getFrequencyState(val);
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
                          // Prevent closing when clicking inside
                          if ((e.target as HTMLElement).closest('.popover-content')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="space-y-2.5 popover-content">
                          {/* Close button */}
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

                          {/* Select Days - only for Weekly with dropdown */}
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
                                    {state.days.length > 0 ? `${state.days.length} day(s)` : 'Days'}
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
                                          checked={state.days.includes(day.short)}
                                          onCheckedChange={() => toggleDay(val, day.short)}
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

                          {/* Select Dates - only for Monthly with calendar */}
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
                                      toggleDate('MONTHLY', date);
                                    }}
                                    className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition-colors ${
                                      state.dates.includes(date)
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

                          {/* Hourly - Select number of hours */}
                          {val === 'HOURLY' && (
                            <div className="space-y-1.5">
                              <h4 className="font-medium text-xs">Run Every</h4>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={state.hourInterval}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 24)) {
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
                          )}

                          {/* Repeats On - Hide for Hourly */}
                          {val !== 'HOURLY' && (
                            <div className="space-y-1.5">
                              <h4 className="font-medium text-xs">Repeats On</h4>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  <Input
                                    type="text"
                                    placeholder="HH"
                                    value={state.hour}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || (/^\d{0,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 12)) {
                                        updateHour(val, value);
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
                                    value={state.minute}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || (/^\d{0,2}$/.test(value) && Number(value) <= 59)) {
                                        updateMinute(val, value);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-8 text-center text-xs"
                                    maxLength={2}
                                  />
                                </div>
                                <Select value={state.period} onValueChange={(value) => updatePeriod(val, value as "AM" | "PM")}>
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

      {/* Proceed Popup */}
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
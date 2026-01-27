'use client'

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { toast } from "sonner"
import { useState } from "react"

export default function HumanGrid() {
  const [isOpen, setIsOpen] = React.useState(true)

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

  const handleProceed = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Basic validation
    if (!selectedApiId || !exchange || !segment || !symbol) {
      toast.error("Please complete account details");
      return;
    }

    if (!strategyName.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    if (!investment || Number(investment) <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    if (!investmentCap || Number(investmentCap) <= 0) {
      toast.error("Please enter a valid investment cap");
      return;
    }

    if (!lowerLimit || !upperLimit || Number(upperLimit) <= Number(lowerLimit)) {
      toast.error("Please enter valid price limits");
      return;
    }

    if (!leverage || Number(leverage) < 1) {
      toast.error("Please enter valid leverage");
      return;
    }

    if (!entryInterval || Number(entryInterval) <= 0) {
      toast.error("Please enter a valid entry interval");
      return;
    }

    if (!bookProfitBy || Number(bookProfitBy) <= 0) {
      toast.error("Please enter a valid book profit percentage");
      return;
    }

    if (!stopLossBy || Number(stopLossBy) <= 0) {
      toast.error("Please enter a valid stop loss percentage");
      return;
    }

    // Log form data
    const formData = {
      strategy_name: strategyName,
      api_connection_id: Number(selectedApiId),
      exchange: exchange,
      segment: segment,
      pair: symbol,
      investment: Number(investment),
      investment_cap: Number(investmentCap),
      lower_limit: Number(lowerLimit),
      upper_limit: Number(upperLimit),
      leverage: Number(leverage),
      direction: direction,
      entry_interval: Number(entryInterval),
      book_profit_by: Number(bookProfitBy),
      stop_loss_by: Number(stopLossBy)
    };

    console.log("Form submitted with data:", formData);
    toast.success("Strategy validated successfully! 🎉");
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

    toast.success("Form reset");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
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
              <p className="text-sm text-orange-500">Avbl: 389 USDT</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lower Limit</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Value" 
                    value={lowerLimit} 
                    onChange={e => setLowerLimit(e.target.value)} 
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
              <div className="space-y-2">
                <Label>Upper Limit</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Value" 
                    value={upperLimit} 
                    onChange={e => setUpperLimit(e.target.value)} 
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Leverage</Label>
                <Input 
                  placeholder="Value" 
                  value={leverage} 
                  onChange={e => setLeverage(e.target.value)} 
                  type="number"
                  min="1"
                  step="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
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
                  type="number"
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
                  type="number"
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
                  type="number"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex gap-4">
          <Button 
            className="flex-1 bg-[#4A1515] hover:bg-[#5A2525]" 
            onClick={handleProceed} 
            type="button"
          >
            Proceed
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-[#D97706] text-white hover:bg-[#B45309]" 
            type="button" 
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}
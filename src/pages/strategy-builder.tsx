'use client'

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { AccountDetailsCard } from "../components/trade/AccountDetailsCard"
import { toast } from "sonner"
import apiClient from "@/api/apiClient"
import { apiurls } from "@/api/apiurls"

export default function InstantTrade() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Account details from child component
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [exchange, setExchange] = useState("");
  const [segment, setSegment] = useState("SPOT");
  const [symbol, setSymbol] = useState("");

  // Instant Trade State
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [leverage, setLeverage] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

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

  // Instant Trade Creation
  const handleCreateInstantTrade = async () => {
    console.log("CREATING INSTANT TRADE");
    
    if (!selectedApiId || !exchange || !symbol) {
      toast.error("Please select API connection and trading pair");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (orderType === 'LIMIT' && (!limitPrice || Number(limitPrice) <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('AUTH_TOKEN');
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const payload: any = {
        symbol: symbol,
        side: side,
        quantity: quantity,
        orderType: orderType,
        leverage: leverage
      };

      if (orderType === 'LIMIT') {
        payload.price = limitPrice;
      }

      const requestBody = {
        exchange: exchange,
        type: segment,
        payload: payload
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await apiClient.post(
        apiurls.spottrades.createstrategy,
        requestBody
      );

      console.log("=== TRADE CREATED SUCCESSFULLY ===");
      console.log("Response:", response.data);

      toast.success(`${side} order placed successfully!`);
      
      handleResetInstantTrade();
    } catch (error: any) {
      console.error("=== TRADE CREATION ERROR ===");
      console.error("Error:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Failed to create trade";
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInstantTrade = () => {
    setQuantity("");
    setOrderType('MARKET');
    setLimitPrice("");
    setLeverage("1");
    setSide('BUY');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Account Details Card */}
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      {/* Instant Trade Form */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border">
            <span>Instant {segment} Trade</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4 bg-white dark:bg-[#1A1A1D]">
            {/* Order Side */}
            <div className="space-y-2">
              <Label>Order Side</Label>
              <Select value={side} onValueChange={(value) => setSide(value as 'BUY' | 'SELL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(value) => setOrderType(value as 'MARKET' | 'LIMIT')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">MARKET</SelectItem>
                  <SelectItem value="LIMIT">LIMIT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                placeholder="Enter quantity" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                type="number"
                step="0.00000001"
              />
            </div>

            {/* Limit Price - only show for LIMIT orders */}
            {orderType === 'LIMIT' && (
              <div className="space-y-2">
                <Label>Limit Price</Label>
                <Input 
                  placeholder="Enter limit price" 
                  value={limitPrice} 
                  onChange={e => setLimitPrice(e.target.value)} 
                  type="number"
                  step="0.00000001"
                />
              </div>
            )}

            {/* Leverage - only show for FUTURES */}
            {segment === 'FUTURES' && (
              <div className="space-y-2">
                <Label>Leverage</Label>
                <Input 
                  placeholder="Enter leverage" 
                  value={leverage} 
                  onChange={e => setLeverage(e.target.value)} 
                  type="number"
                  min="1"
                  max="125"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            className={`flex-1 ${side === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={handleCreateInstantTrade}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Processing..." : `${side} ${symbol || 'Asset'}`}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            type="button" 
            onClick={handleResetInstantTrade}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}
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
// import { apiClient } from "@/lib/apiClient"
import apiClient from "@/api/apiClient"
import { apiurls } from "@/api/apiurls"

// Order types for different exchanges - FIXED: Added missing types
type OrderType = 
  | 'MARKET' 
  | 'LIMIT' 
  | 'STOP_LIMIT' 
  | 'STOP_MARKET' 
  // | 'TAKE_PROFIT_LIMIT' 
  // | 'TAKE_PROFIT_MARKET'
  // | 'TAKE_PROFIT'  // Added this
  | 'STOP'
  | 'STOP_LOSS'
  | 'STOP_LOSS_LIMIT';

// Position margin type for KuCoin
type PositionMarginType = 'isolated' | 'cross';

// Stop type for KuCoin
type StopType = 'up' | 'down';

// Stop price type for KuCoin
type StopPriceType = 'TP' | 'IP' | 'MP';

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
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [leverage, setLeverage] = useState("1");
  
  // Price fields
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  
  // Take Profit & Stop Loss (Only for MARKET and LIMIT orders on most exchanges)
  const [takeProfitPrice, setTakeProfitPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");

  // KuCoin specific fields
  const [positionMarginType, setPositionMarginType] = useState<PositionMarginType>('isolated');
  const [stopType, setStopType] = useState<StopType>('down');
  const [stopPriceType, setStopPriceType] = useState<StopPriceType>('MP');

  // Add price state
  const [price, setPrice] = useState("");

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

  // Get exchange name in uppercase
  const exchangeUpper = exchange.toUpperCase();
  const isBinance = exchangeUpper === 'BINANCE';
  const isCoinDCX = exchangeUpper === 'COINDCX';
  const isKuCoin = exchangeUpper === 'KUCOIN';
  const formatSymbolForExchange = (symbol: string, exchange: string): string => {
  if (!symbol) return symbol;

  const ex = exchange.toUpperCase();

  // CoinDCX format → B-BASE_QUOTE (e.g. POLUSDT → B-POL_USDT)
  if (ex === 'COINDCX') {
    // already formatted
    if (symbol.startsWith('B-') && symbol.includes('_')) {
      return symbol;
    }

    const knownQuotes = ['USDT', 'INR', 'BTC', 'ETH'];

    for (const quote of knownQuotes) {
      if (symbol.endsWith(quote)) {
        const base = symbol.replace(quote, '');
        return `B-${base}_${quote}`;
      }
    }

    console.warn('CoinDCX: Unable to auto-format symbol:', symbol);
  }

  return symbol;
};
  // Get available order types based on exchange and segment
  const getOrderTypes = (): { value: OrderType; label: string }[] => {
    // CoinDCX
    if (isCoinDCX) {
      return [
        { value: 'MARKET', label: 'MARKET' },
        { value: 'LIMIT', label: 'LIMIT' },
        { value: 'STOP_LIMIT', label: 'STOP LIMIT' },
        { value: 'STOP_MARKET', label: 'STOP MARKET' },
        // { value: 'TAKE_PROFIT_LIMIT', label: 'TAKE PROFIT LIMIT' },
        // { value: 'TAKE_PROFIT_MARKET', label: 'TAKE PROFIT MARKET' },
      ];
    }
    
    // Binance Futures
    if (isBinance && segment === 'FUTURES') {
      return [
        { value: 'MARKET', label: 'MARKET' },
        { value: 'LIMIT', label: 'LIMIT' },
        { value: 'STOP', label: 'STOP' },
        { value: 'STOP_MARKET', label: 'STOP MARKET' },
        // { value: 'TAKE_PROFIT', label: 'TAKE PROFIT' },
        // { value: 'TAKE_PROFIT_MARKET', label: 'TAKE PROFIT MARKET' },
      ];
    }
    
    // Binance Spot
    if (isBinance && segment === 'SPOT') {
      return [
        { value: 'MARKET', label: 'MARKET' },
        { value: 'LIMIT', label: 'LIMIT' },
        { value: 'STOP_LOSS', label: 'STOP LOSS' },
        { value: 'STOP_LOSS_LIMIT', label: 'STOP LOSS LIMIT' },
        // { value: 'TAKE_PROFIT_LIMIT', label: 'TAKE PROFIT LIMIT' },
      ];
    }

    // KuCoin Futures
  if (isKuCoin && segment === 'SPOT') {
    return [
      { value: 'MARKET', label: 'MARKET' },
      { value: 'LIMIT', label: 'LIMIT' },
    ];
  }

  // KuCoin Futures
  if (isKuCoin && segment === 'FUTURES') {
    return [
      { value: 'MARKET', label: 'MARKET' },
      { value: 'LIMIT', label: 'LIMIT' },
    ];
  }
    
    // Default order types for other exchanges
    return [
      { value: 'MARKET', label: 'MARKET' },
      { value: 'LIMIT', label: 'LIMIT' },
    ];
  };

  // Check if order type requires limit price
  const requiresLimitPrice = [
    'LIMIT', 
    'STOP_LIMIT', 
    'STOP_LOSS_LIMIT'
  ].includes(orderType);

  // Check if order type requires stop price
  const requiresStopPrice = [
    'STOP_LIMIT', 
    'STOP_MARKET', 
    'STOP',
    'STOP_LOSS',
    'STOP_LOSS_LIMIT'
  ].includes(orderType);

  // ✅ Hide leverage, TP/SL fields for KuCoin Spot
  const showLeverageField = segment === 'FUTURES';

  // Check if order type allows TP/SL
  const allowsTPSL = ['MARKET', 'LIMIT'].includes(orderType) && !isKuCoin;

  // Check if order type is STOP_LOSS or STOP_LOSS_LIMIT (these orders require TP/SL fields)
  const requiresTPSLForStop = ['STOP_LOSS', 'STOP_LOSS_LIMIT'].includes(orderType) && !isKuCoin;

  // Update the condition to check if price is required for STOP orders on Binance Futures
  const requiresPrice = ['STOP', 'STOP_MARKET'].includes(orderType) && isBinance && segment === 'FUTURES';

  // Instant Trade Creation
  const handleCreateInstantTrade = async () => {
    // Validation
    if (!selectedApiId || !exchange || !symbol) {
      toast.error("Missing required fields", {
        description: "Please select API connection and trading pair"
      });
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      toast.error("Invalid quantity", {
        description: "Please enter a valid quantity greater than 0"
      });
      return;
    }

    const toastId = toast.loading(`Placing ${side} order...`, {
      description: `${orderType} order for ${quantity} ${symbol}`
    });

    setIsLoading(true);

    try {
      const token = localStorage.getItem('AUTH_TOKEN');
      if (!token) {
        toast.error("Authentication required", {
          id: toastId,
          description: "Please login again to continue"
        });
        return;
      }

      // Build payload based on exchange and order type
      const formattedSymbol = formatSymbolForExchange(symbol, exchange);

      const payload: any = {
        symbol: formattedSymbol,
        side: side,
        quantity: Number(quantity),
        orderType: orderType,
      };

      // Add leverage for futures
      if (segment === 'FUTURES') {
        payload.leverage = Number(leverage);
      }

      // ✅ Build price and stopPrice based on order type and exchange/segment
    
      // For BINANCE SPOT
      if (isBinance && segment === 'SPOT') {
        switch (orderType) {
          case 'MARKET':
            // MARKET: no price or stopPrice needed
            break;
          
          case 'LIMIT':
            // LIMIT: requires price
            if (!limitPrice || Number(limitPrice) <= 0) {
              toast.error("Invalid limit price", {
                description: "LIMIT order requires a valid limit price"
              });
              return;
            }
            payload.price = Number(limitPrice);
            break;
          
          case 'STOP_LOSS':
            // STOP_LOSS: requires stopPrice
            if (!stopPrice || Number(stopPrice) <= 0) {
              toast.error("Invalid stop price", {
                description: "STOP_LOSS order requires a valid stop price"
              });
              return;
            }
            payload.stopPrice = Number(stopPrice);
            break;
          
          case 'STOP_LOSS_LIMIT':
            // STOP_LOSS_LIMIT: requires both price and stopPrice
            if (!limitPrice || Number(limitPrice) <= 0) {
              toast.error("Invalid limit price", {
                description: "STOP_LOSS_LIMIT order requires a valid limit price"
              });
              return;
            }
            if (!stopPrice || Number(stopPrice) <= 0) {
              toast.error("Invalid stop price", {
                description: "STOP_LOSS_LIMIT order requires a valid stop price"
              });
              return;
            }
            payload.price = Number(limitPrice);
            payload.stopPrice = Number(stopPrice);
            break;
        }
      }
      // For BINANCE FUTURES
else if (isBinance && segment === 'FUTURES') {
  switch (orderType) {
    case 'MARKET':
      // MARKET: no price or stopPrice needed
      break;
    
    case 'LIMIT':
      // LIMIT: requires price (limit price)
      if (!limitPrice || Number(limitPrice) <= 0) {
        toast.error("Invalid limit price", {
          description: "LIMIT order requires a valid limit price"
        });
        return;
      }
      payload.price = Number(limitPrice);
      break;
    
    case 'STOP':
      // STOP: requires both price and stopPrice ✅ UPDATED
      if (!price || Number(price) <= 0) {
        toast.error("Invalid price", {
          description: "STOP order requires a valid price"
        });
        return;
      }
      if (!stopPrice || Number(stopPrice) <= 0) {
        toast.error("Invalid stop price", {
          description: "STOP order requires a valid stop price"
        });
        return;
      }
      payload.price = Number(price);
      payload.stopPrice = Number(stopPrice);
      break;
    
    case 'STOP_MARKET':
      // STOP_MARKET: requires stopPrice (trigger price)
      if (!stopPrice || Number(stopPrice) <= 0) {
        toast.error("Invalid stop price", {
          description: "STOP_MARKET order requires a valid stop price (trigger price)"
        });
        return;
      }
      payload.stopPrice = Number(stopPrice);
      break;
  }
}
else if (isKuCoin && segment === 'SPOT') {
  switch (orderType) {
    case 'MARKET':
      // MARKET: only requires quantity
      if (!quantity || Number(quantity) <= 0) {
        toast.error("Invalid quantity", {
          description: "MARKET order requires a valid quantity"
        });
        return;
      }
      payload.quantity = Number(quantity);
      break;
    
    case 'LIMIT':
      // LIMIT: requires both price and quantity
      if (!limitPrice || Number(limitPrice) <= 0) {
        toast.error("Invalid limit price", {
          description: "LIMIT order requires a valid limit price"
        });
        return;
      }
      if (!quantity || Number(quantity) <= 0) {
        toast.error("Invalid quantity", {
          description: "LIMIT order requires a valid quantity"
        });
        return;
      }
      payload.price = Number(limitPrice);
      payload.quantity = Number(quantity);
      break;
  }
}

      // For other exchanges (CoinDCX, KuCoin)
      else {
        // Add limit price if required
        if (requiresLimitPrice) {
          payload.price = Number(limitPrice);
        }

        // Add price for STOP and STOP_MARKET on Binance Futures
        if (requiresPrice) {
          payload.price = Number(price);
        }

        // Add stop price if required
        if (requiresStopPrice) {
          payload.stopPrice = Number(stopPrice);
        }
      }

      // Add TP/SL for MARKET and LIMIT orders (not for KuCoin)
      if (allowsTPSL) {
        if (takeProfitPrice && Number(takeProfitPrice) > 0) {
          payload.takeProfitPrice = Number(takeProfitPrice);
        }
        if (stopLossPrice && Number(stopLossPrice) > 0) {
          payload.stopLossPrice = Number(stopLossPrice);
        }
      }

      // KuCoin specific fields for futures
      if (isKuCoin && segment === 'FUTURES') {
        payload.positionMarginType = positionMarginType;
        
        // Add stop fields if stop price is provided
        if (stopPrice && Number(stopPrice) > 0) {
          payload.stop = stopType;
          payload.stopPriceType = stopPriceType;
          payload.stopPrice = Number(stopPrice);
        }
      }

      const requestBody = {
        exchange: exchange,
        type: segment,
        payload: payload
      };

      console.log("Order payload:", requestBody);

      await apiClient.post(
        apiurls.spottrades.createstrategy,
        requestBody
      );

      toast.success(`${side} order placed successfully! 🎉`, {
        id: toastId,
        description: `${orderType} order for ${quantity} ${symbol} at ${exchange}`,
        duration: 5000
      });
      
      handleResetInstantTrade();
    } catch (error: any) {
      console.error("Trade creation error:", error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Failed to place order";
      
      toast.error("Order failed", {
        id: toastId,
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update reset handler
  const handleResetInstantTrade = () => {
    setQuantity("");
    setOrderType('MARKET');
    setLimitPrice("");
    setPrice(""); 
    setStopPrice("");
    setTakeProfitPrice("");
    setStopLossPrice("");
    setLeverage("1");
    setSide('BUY');
    setPositionMarginType('isolated');
    setStopType('down');
    setStopPriceType('MP');
    
    toast.success("Form reset", {
      description: "All fields have been cleared"
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Account Details Card */}
      <AccountDetailsCard onDataChange={handleAccountDetailsChange} />
      
      {/* Instant Trade Form */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border">
            <span>
              Instant {segment} Trade 
              {isCoinDCX && ' (CoinDCX)'}
              {isBinance && ' (Binance)'}
              {isKuCoin && ' (KuCoin)'}
            </span>
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
              <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getOrderTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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

            {/* Limit Price - Only show for orders that require it */}
            {requiresLimitPrice && (
              <div className="space-y-2">
                <Label>
                  Limit Price 
                  {(isBinance && segment === 'FUTURES' && orderType === 'LIMIT') && ' (Limit Price)'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  placeholder="Enter limit price" 
                  value={limitPrice} 
                  onChange={e => setLimitPrice(e.target.value)} 
                  type="number"
                  step="0.00000001"
                />
                <p className="text-xs text-gray-500">
                  {isBinance && segment === 'FUTURES' 
                    ? 'Limit price at which the order will be executed'
                    : 'Price at which the order will be executed'
                  }
                </p>
              </div>
            )}
            {/* Price - Only for Binance Futures STOP orders */}
            {isBinance && segment === 'FUTURES' && orderType === 'STOP' && (
              <div className="space-y-2">
                <Label>
                  Price
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  placeholder="Enter price" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  type="number"
                  step="0.00000001"
                />
                <p className="text-xs text-gray-500">
                  Price for STOP order on Binance Futures
                </p>
              </div>
            )}


            {/* Stop Price - Only show for orders that require it */}
            {requiresStopPrice && (
              <div className="space-y-2">
                <Label>
                  {isBinance && segment === 'FUTURES' && (orderType === 'STOP' || orderType === 'STOP_MARKET')
                    ? 'Stop Price (Trigger Price)'
                    : 'Stop Price'
                  }
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  placeholder={
                    isBinance && segment === 'FUTURES' && (orderType === 'STOP' || orderType === 'STOP_MARKET')
                      ? "Enter trigger price"
                      : "Enter stop price"
                  }
                  value={stopPrice} 
                  onChange={e => setStopPrice(e.target.value)} 
                  type="number"
                  step="0.00000001"
                />
                <p className="text-xs text-gray-500">
                  {isBinance && segment === 'FUTURES' && (orderType === 'STOP' || orderType === 'STOP_MARKET')
                    ? 'Trigger price at which the order will be executed'
                    : 'Price at which the order will be triggered'
                  }
                </p>
              </div>
            )}

            {/* KuCoin Futures Specific Fields */}
            {isKuCoin && segment === 'FUTURES' && (
              <>
                <div className="space-y-2">
                  <Label>Position Margin Type</Label>
                  <Select value={positionMarginType} onValueChange={(value) => setPositionMarginType(value as PositionMarginType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="isolated">Isolated</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose margin type for your position
                  </p>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Optional Stop Loss Configuration
                  </p>

                  <div className="space-y-2">
                    <Label>Stop Type</Label>
                    <Select value={stopType} onValueChange={(value) => setStopType(value as StopType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* <SelectItem value="up">Up (Take Profit)</SelectItem> */}
                        <SelectItem value="down">Down (Stop Loss)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Stop Price Type</Label>
                    <Select value={stopPriceType} onValueChange={(value) => setStopPriceType(value as StopPriceType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TP">TP (Trade Price)</SelectItem>
                        <SelectItem value="IP">IP (Index Price)</SelectItem>
                        <SelectItem value="MP">MP (Mark Price)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      TP: Trade Price, IP: Index Price, MP: Mark Price
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Stop Price (Optional)</Label>
                    <Input 
                      placeholder="Enter stop price" 
                      value={stopPrice} 
                      onChange={e => setStopPrice(e.target.value)} 
                      type="number"
                      step="0.00000001"
                    />
                    <p className="text-xs text-gray-500">
                      Trigger price for stop loss/take profit
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Take Profit & Stop Loss - Only for STOP_LOSS and STOP_LOSS_LIMIT orders (non-KuCoin) */}
            {requiresTPSLForStop && (
              <>
                <div className="border-t pt-4 space-y-4">
                  {/* <div className="space-y-2">
                    <Label>Price</Label>
                    <Input 
                      placeholder="Enter take profit price" 
                      value={takeProfitPrice} 
                      onChange={e => setTakeProfitPrice(e.target.value)} 
                      type="number"
                      step="0.00000001"
                    />
                    <p className="text-xs text-gray-500">
                      Automatically sell when price reaches this level
                    </p>
                  </div> */}

                  {/* <div className="space-y-2">
                    <Label>Stop Loss Price (Optional)</Label>
                    <Input 
                      placeholder="Enter stop loss price" 
                      value={stopLossPrice} 
                      onChange={e => setStopLossPrice(e.target.value)} 
                      type="number"
                      step="0.00000001"
                    />
                    <p className="text-xs text-gray-500">
                      Automatically sell to limit losses if price drops
                    </p>
                  </div> */}
                </div>
              </>
            )}

            {/* Leverage - only show for FUTURES */}
            {showLeverageField && (
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

            {/* Order Summary */}
           <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-gray-700">Order Summary:</p>
            <p className="text-xs text-gray-600">
              {side} {quantity || '0'} {symbol || 'Asset'} @ {orderType}
            </p>
            {requiresLimitPrice && limitPrice && (
              <p className="text-xs text-gray-600">
                Limit Price: {limitPrice}
              </p>
            )}
            {isBinance && segment === 'FUTURES' && orderType === 'STOP' && price && (
              <p className="text-xs text-gray-600">
                Price: {price}
              </p>
            )}
            {requiresStopPrice && stopPrice && (
              <p className="text-xs text-gray-600">
                Stop Price: {stopPrice}
              </p>
            )}
            {takeProfitPrice && (
              <p className="text-xs text-green-600">
                Take Profit: {takeProfitPrice}
              </p>
            )}
            {stopLossPrice && (
              <p className="text-xs text-red-600">
                Stop Loss: {stopLossPrice}
              </p>
            )}
            {segment === 'FUTURES' && leverage && (
              <p className="text-xs text-blue-600">
                Leverage: {leverage}x
              </p>
            )}
          </div>
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
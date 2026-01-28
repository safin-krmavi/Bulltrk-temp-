"use client"

import { useEffect, useState } from "react"
import { BadgeCustom } from "@/components/ui/badge-custom"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Clock, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'
import { TradingCard } from "@/components/copy-trade-trading-card"
import { ScrollButtons } from "@/components/scroll-buttons"
import { useCopyTradeStore, PublishedStrategy } from "@/stores/copytradestote"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/authstore"

// Transform API data to match TradingCard props
const transformStrategyToCard = (strategy: PublishedStrategy) => {
  // Generate mock chart data based on strategy performance or use random data
  const generateChartData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      value: 50 + Math.random() * 20 + i
    }))
  }

  // Extract take profit percentage from config
  const takeProfitPct = strategy.config?.exit?.bookProfit?.percentage || 0
  const maxCapital = strategy.config?.capital?.maxCapital || 0
  const perOrderAmount = strategy.config?.capital?.perOrderAmount || 0
  return {
    id: strategy.id,
    subtitle: `${strategy.exchange} • ${strategy.segment}`,
    name: strategy.name,
    symbol: strategy.symbol,
    percentage: takeProfitPct,
    totalPnl: 0, // This would come from performance metrics if available
    aumValues: [maxCapital, perOrderAmount, strategy._count?.copyFollowers || 0],
    chartData: generateChartData(),
    strategy: strategy // ✅ Pass full strategy object
  }
}

const AVAILABLE_EXCHANGES = [
  { value: "BINANCE", label: "Binance" },
  { value: "KUCOIN", label: "KuCoin" },
  { value: "COINDCX", label: "CoinDCX" },
]

const sections = [
  { id: "all-strategies", label: "All Strategies" },
  { id: "high-roi", label: "High ROI" },
  { id: "high-yields", label: "High Yields" },
  { id: "followers", label: "Most Followed" },
  { id: "active", label: "Active" }
]


// Helper function to format date
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function CopyTradePage() {
  // ✅ Add auth store
  const { user } = useAuthStore()
  
  const {
    publishedStrategies,
    isLoadingPublished,
    publishedError,
    fetchPublishedStrategies,
    subscribeToStrategy,
    isSubscribing,
  } = useCopyTradeStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStrategy, setSelectedStrategy] = useState<PublishedStrategy | null>(null)
  const [multiplier, setMultiplier] = useState("1")
  const [followerExchange, setFollowerExchange] = useState<string>("BINANCE")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch published strategies on mount
  useEffect(() => {
    fetchPublishedStrategies()
  }, [fetchPublishedStrategies])

  // Filter strategies based on search
  const filteredStrategies = publishedStrategies.filter((strategy) =>
    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Transform strategies to card format
  const tradingCards = filteredStrategies.map(transformStrategyToCard)

  // Calculate summary stats
  const totalCopyingAssets = filteredStrategies.length
  const totalProfit = 0
  const netProfit = 0
  const unrealizedPnl = 0

  // Handle subscribe
  const handleSubscribe = async () => {
    if (!selectedStrategy) return

    try {
      const mult = parseFloat(multiplier)
      
      if (!mult || mult <= 0) {
        toast.error("Invalid multiplier", {
          description: "Please enter a multiplier greater than 0"
        })
        return
      }

      if (!followerExchange) {
        toast.error("Exchange required", {
          description: "Please select your trading exchange"
        })
        return
      }

      await subscribeToStrategy(selectedStrategy.id, mult, followerExchange)
      
      setIsDialogOpen(false)
      setMultiplier("1")
      setFollowerExchange("BINANCE")
      setSelectedStrategy(null)
    } catch (error) {
      console.error("Subscription error:", error)
    }
  }

  // Open subscription dialog
  const openSubscribeDialog = (strategy: PublishedStrategy) => {
    // ✅ Check if user owns this strategy
    if (user?.id === strategy.userId) {
      toast.info("This is your strategy", {
        description: "You cannot subscribe to your own published strategies"
      });
      return;
    }
    
    setSelectedStrategy(strategy)
    setFollowerExchange("BINANCE")
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-[#18181B] dark:text-white">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">Copy Trading Assets:</span>
            <BadgeCustom>{totalCopyingAssets}</BadgeCustom>
          </button>
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">Profit:</span>
            <BadgeCustom>${totalProfit.toFixed(2)}</BadgeCustom>
          </button>
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">Net Profit:</span>
            <BadgeCustom>${netProfit.toFixed(2)}</BadgeCustom>
          </button>
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">Unrealized PnL:</span>
            <BadgeCustom>${unrealizedPnl.toFixed(2)}</BadgeCustom>
          </button>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search Strategy/Symbol/Exchange"
            className="pl-8 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoadingPublished && (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading strategies...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {publishedError && (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{publishedError}</p>
          <Button onClick={fetchPublishedStrategies} className="bg-orange-500 hover:bg-orange-600">
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoadingPublished && !publishedError && (
        <Tabs defaultValue="all-strategies" className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="bg-transparent w-full justify-start rounded-none p-0 h-auto">
              {sections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="px-4 py-2 rounded-t-md data-[state=active]:bg-[#581C3D] data-[state=active]:text-white"
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all-strategies" className="space-y-4">
            <div className="text-sm text-gray-500">
              Browse all published strategies
            </div>
            {tradingCards.length > 0 ? (
              <div className="relative">
                <div 
                  id="scroll-container-all"
                  className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide relative"
                >
                  {tradingCards.map((card) => (
                    <div key={card.id} onClick={() => openSubscribeDialog(card.strategy)}>
                      <TradingCard {...card} />
                    </div>
                  ))}
                </div>
                <ScrollButtons scrollContainerId="scroll-container-all" />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No strategies found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high-roi" className="space-y-4">
            <div className="text-sm text-gray-500">
              Strategies with highest returns on investment
            </div>
            {tradingCards.length > 0 ? (
              <div className="relative">
                <div 
                  id="scroll-container-roi"
                  className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide relative"
                >
                  {tradingCards.map((card) => (
                    <div key={card.id} onClick={() => openSubscribeDialog(card.strategy)}>
                      <TradingCard {...card} />
                    </div>
                  ))}
                </div>
                <ScrollButtons scrollContainerId="scroll-container-roi" />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No strategies available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high-yields" className="space-y-4">
            <div className="text-sm text-gray-500">
              Strategies with highest profit percentages
            </div>
            {tradingCards.length > 0 ? (
              <div className="relative">
                <div 
                  id="scroll-container-yields"
                  className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide relative"
                >
                  {tradingCards.map((card) => (
                    <div key={card.id} onClick={() => openSubscribeDialog(card.strategy)}>
                      <TradingCard {...card} />
                    </div>
                  ))}
                </div>
                <ScrollButtons scrollContainerId="scroll-container-yields" />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No strategies available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            <div className="text-sm text-gray-500">
              Most followed strategies by community
            </div>
            {tradingCards.length > 0 ? (
              <div className="relative">
                <div 
                  id="scroll-container-followers"
                  className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide relative"
                >
                  {tradingCards
                    .sort((a, b) => (b.aumValues[2] || 0) - (a.aumValues[2] || 0))
                    .map((card) => (
                      <div key={card.id} onClick={() => openSubscribeDialog(card.strategy)}>
                        <TradingCard {...card} />
                      </div>
                    ))}
                </div>
                <ScrollButtons scrollContainerId="scroll-container-followers" />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No strategies available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="text-sm text-gray-500">
              Currently active strategies
            </div>
            {tradingCards.length > 0 ? (
              <div className="relative">
                <div 
                  id="scroll-container-active"
                  className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide relative"
                >
                  {tradingCards
                    .filter((card) => card.strategy.status === 'ACTIVE')
                    .map((card) => (
                      <div key={card.id} onClick={() => openSubscribeDialog(card.strategy)}>
                        <TradingCard {...card} />
                      </div>
                    ))}
                </div>
                <ScrollButtons scrollContainerId="scroll-container-active" />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No active strategies</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Enhanced Subscribe Dialog - Compact Version */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-lg">{selectedStrategy?.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1 text-sm">
                  <span>{selectedStrategy?.exchange}</span>
                  <span>•</span>
                  <span>{selectedStrategy?.segment}</span>
                  <span>•</span>
                  <span className="font-semibold">{selectedStrategy?.symbol}</span>
                  {/* ✅ Show owner badge if viewing own strategy */}
                  {user?.id === selectedStrategy?.userId && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-semibold">Your Strategy</span>
                    </>
                  )}
                </DialogDescription>
              </div>
              <Badge 
                className={`${
                  selectedStrategy?.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}
              >
                {selectedStrategy?.status}
              </Badge>
            </div>
          </DialogHeader>

          {selectedStrategy && (
            <div className="space-y-4 py-2">
              {/* Key Metrics - Compact */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-gray-200 rounded-lg">
                  <div className="flex items-center gap-1 text-black dark:text-green-400 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">Take Profit</span>
                  </div>
                  <p className="text-xl font-bold text-black dark:text-green-400">
                    {selectedStrategy.config?.exit?.bookProfit?.percentage || 0}%
                  </p>
                </div>

                <div className="p-3 bg-gray-200 rounded-lg">
                  <div className="flex items-center gap-1 text-black dark:text-red-400 mb-1">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-xs font-medium">Stop Loss</span>
                  </div>
                  <p className="text-xl font-bold text-black dark:text-red-400">
                    {selectedStrategy.config?.risk?.stopLoss?.enabled 
                      ? `${selectedStrategy.config?.risk?.stopLoss?.percentage || 0}%`
                      : 'N/A'
                    }
                  </p>
                </div>

                <div className="p-3 bg-gray-200 rounded-lg">
                  <div className="flex items-center gap-1 text-black dark:text-blue-400 mb-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-medium">Followers</span>
                  </div>
                  <p className="text-xl font-bold text-black dark:text-blue-400">
                    {selectedStrategy._count?.copyFollowers || 0}
                  </p>
                </div>
              </div>

              {/* Combined Details - More Compact */}
              <div className="grid grid-cols-2 gap-3">
                {/* Capital Details */}
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-[#1a1a1d] rounded-lg">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Capital
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Per Order:</span>
                      <span className="font-semibold">
                        ${selectedStrategy.config?.capital?.perOrderAmount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Max Cap:</span>
                      <span className="font-semibold">
                        ${selectedStrategy.config?.capital?.maxCapital || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule Details */}
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-[#1a1a1d] rounded-lg">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Schedule
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                      <span className="font-semibold">
                        {selectedStrategy.config?.schedule?.frequency || 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="font-semibold ml-1">
                        {selectedStrategy.config?.schedule?.weekly?.time || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline - Compact */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-[#1a1a1d] rounded-lg">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timeline
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Last Run:</span>
                    <span className="font-medium ml-1 block">
                      {formatDate(selectedStrategy.lastExecutedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Next Run:</span>
                    <span className="font-medium ml-1 block">
                      {formatDate(selectedStrategy.nextRunAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Form - Compact */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold">Subscribe Configuration</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="exchange" className="text-xs">Your Exchange</Label>
                  <Select value={followerExchange} onValueChange={setFollowerExchange}>
                    <SelectTrigger id="exchange" className="h-9">
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_EXCHANGES.map((exchange) => (
                        <SelectItem key={exchange.value} value={exchange.value}>
                          {exchange.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multiplier" className="text-xs">Investment Multiplier</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    placeholder="e.g., 1, 2, 0.5"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="h-9"
                  />
                  <div className="flex justify-between text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                    <span className="text-gray-600 dark:text-gray-400">
                      Base: ${selectedStrategy.config?.capital?.perOrderAmount || 0}
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      You pay: $
                      {(
                        (selectedStrategy.config?.capital?.perOrderAmount || 0) *
                        parseFloat(multiplier || "1")
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="flex-1 h-9"
                  disabled={isSubscribing}
                >
                  {user?.id === selectedStrategy.userId ? 'Close' : 'Cancel'}
                </Button>
                {/* ✅ Hide subscribe button if user owns the strategy */}
                {user?.id !== selectedStrategy.userId && (
                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing || !multiplier || !followerExchange}
                    className="flex-1 h-9 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubscribing ? "Subscribing..." : "Subscribe"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
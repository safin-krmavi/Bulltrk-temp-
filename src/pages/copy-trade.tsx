"use client"

import { useEffect, useState } from "react"
import { BadgeCustom } from "@/components/ui/badge-custom"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from 'lucide-react'
import { TradingCard } from "@/components/copy-trade-trading-card"
import { ScrollButtons } from "@/components/scroll-buttons"
import { useCopyTradeStore, PublishedStrategy } from "@/stores/copytradestote"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
  // const stopLossPct = strategy.config?.risk?.stopLoss?.percentage || 0
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
    strategy: strategy // Pass full strategy for subscription dialog
  }
}

const sections = [
  { id: "all-strategies", label: "All Strategies" },
  { id: "high-roi", label: "High ROI" },
  { id: "high-yields", label: "High Yields" },
  { id: "followers", label: "Most Followed" },
  { id: "active", label: "Active" }
]

export default function CopyTradePage() {
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
  const totalProfit = 0 // Calculate from actual data when available
  const netProfit = 0 // Calculate from actual data when available
  const unrealizedPnl = 0 // Calculate from actual data when available

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

      // Calculate allocation based on multiplier and per order amount
      const perOrderAmount = selectedStrategy.config?.capital?.perOrderAmount || 0
      const allocation = perOrderAmount * mult

      await subscribeToStrategy(selectedStrategy.id, allocation)
      
      setIsDialogOpen(false)
      setMultiplier("1")
      setSelectedStrategy(null)
    } catch (error) {
      console.error("Subscription error:", error)
    }
  }

  // Open subscription dialog
  const openSubscribeDialog = (strategy: PublishedStrategy) => {
    setSelectedStrategy(strategy)
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

      {/* Subscribe Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Subscribe to Strategy</DialogTitle>
            <DialogDescription>
              {selectedStrategy?.name} - {selectedStrategy?.symbol}
            </DialogDescription>
          </DialogHeader>

          {selectedStrategy && (
            <div className="space-y-4">
              {/* Strategy Details */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-[#1a1a1d] rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exchange:</span>
                  <span className="font-medium">{selectedStrategy.exchange}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Segment:</span>
                  <span className="font-medium">{selectedStrategy.segment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Take Profit:</span>
                  <span className="font-medium text-green-500">
                    {selectedStrategy.config?.exit?.bookProfit?.percentage || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
                  <span className="font-medium text-red-500">
                    {selectedStrategy.config?.risk?.stopLoss?.percentage || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Per Order:</span>
                  <span className="font-medium">
                    ${selectedStrategy.config?.capital?.perOrderAmount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Max Capital:</span>
                  <span className="font-medium">
                    ${selectedStrategy.config?.capital?.maxCapital || 0}
                  </span>
                </div>
              </div>

              {/* Multiplier Input */}
              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  placeholder="Enter multiplier (e.g., 1, 2, 0.5)"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
                <p className="text-xs text-gray-500">
                  Your allocation will be: $
                  {(
                    (selectedStrategy.config?.capital?.perOrderAmount || 0) *
                    parseFloat(multiplier || "1")
                  ).toFixed(2)}{" "}
                  per order
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubscribing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubscribe}
                  disabled={isSubscribing || !multiplier}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


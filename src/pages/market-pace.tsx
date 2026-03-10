import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BadgeCustom } from "@/components/ui/badge-custom"
import { Search, ShoppingCart, Loader2, AlertCircle } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { usePublishedStrategies, useMyPurchases, usePurchaseStrategy } from "@/hooks/useMarketplace"
import type { MarketplaceStrategy, ExecutionMode } from "@/api/marketplace"

// ── helpers ───────────────────────────────────────────────────────────────

const generateChartData = () =>
  Array.from({ length: 20 }, (_, i) => ({ value: 50 + Math.random() * 20 + i }))

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

// ── Marketplace card ──────────────────────────────────────────────────────

interface MarketplaceCardProps {
  strategy: MarketplaceStrategy
  isPurchased: boolean
  onBuy: (strategy: MarketplaceStrategy) => void
}

function MarketplaceCard({ strategy, isPurchased, onBuy }: MarketplaceCardProps) {
  const chartData = useMemo(() => generateChartData(), [])
  const takeProfitPct = strategy.config?.exit?.bookProfit?.percentage ?? 0
  const maxCapital = strategy.config?.capital?.maxCapital ?? 0
  const perOrderAmount = strategy.config?.capital?.perOrderAmount ?? 0
  const followers = strategy._count?.copyFollowers ?? 0
  const purchases = strategy._count?.purchases ?? 0
  const stopLossEnabled = strategy.config?.risk?.stopLoss?.enabled ?? false
  const stopLossPct = strategy.config?.risk?.stopLoss?.percentage ?? 0

  return (
    <Card className="w-[280px] flex-shrink-0 border-2 border-[#581C3D] dark:border-gray-700 rounded-xl p-4 bg-card dark:bg-[#232326] shadow-lg dark:text-white transition-colors duration-300 hover:shadow-xl">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-[#581C3D] to-[#8B2E5C] text-white text-sm font-semibold">
              {getInitials(strategy.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {strategy.exchange} • {strategy.segment}
            </div>
            <div className="text-sm font-semibold truncate mt-0.5">{strategy.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">{strategy.symbol}</div>
          </div>
        </div>

        {/* ROI */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-green-500">+{takeProfitPct.toFixed(2)}%</div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Take Profit</span>
        </div>

        {/* Chart */}
        <div className="h-16 bg-white dark:bg-[#232326] rounded-md">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#22c55e" fill={`url(#grad-${strategy.id})`} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Max Capital</span>
            <span className="font-semibold">${maxCapital.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Per Order</span>
            <span className="font-semibold">${perOrderAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Followers</span>
            <span className="font-semibold">{followers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Purchases</span>
            <span className="font-semibold">{purchases}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${strategy.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{strategy.status ?? 'UNKNOWN'}</span>
            </div>
            <div className="flex items-center gap-1" title={stopLossEnabled ? `Stop Loss: ${stopLossPct}%` : 'No Stop Loss'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={stopLossEnabled ? 'text-red-500' : 'text-gray-400'}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span>{stopLossEnabled ? `${stopLossPct}%` : 'N/A'}</span>
            </div>
          </div>
          <Button
            onClick={() => onBuy(strategy)}
            disabled={isPurchased}
            className={`w-full h-8 rounded-md font-medium ${
              isPurchased
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-[#581C3D] hover:bg-[#581C3D]/90 text-white'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {isPurchased ? 'Purchased' : 'Purchase'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ── Purchase Dialog ───────────────────────────────────────────────────────

interface PurchaseDialogProps {
  strategy: MarketplaceStrategy | null
  onClose: () => void
}

function PurchaseDialog({ strategy, onClose }: PurchaseDialogProps) {
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("PAPER")
  const [customName, setCustomName] = useState("")
  const purchaseMutation = usePurchaseStrategy()

  const handleSubmit = async () => {
    if (!strategy) return
    await purchaseMutation.mutateAsync({
      strategyId: strategy.id,
      executionMode,
      customName: customName.trim() || strategy.name,
    })
    onClose()
  }

  return (
    <Dialog open={!!strategy} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md dark:bg-[#1a1a1d] dark:text-white">
        <DialogHeader>
          <DialogTitle>Purchase Strategy</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Configure how you want to run <strong>{strategy?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Strategy summary */}
          <div className="rounded-lg bg-gray-50 dark:bg-[#232326] p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Exchange</span>
              <span className="font-medium">{strategy?.exchange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Symbol</span>
              <span className="font-medium">{strategy?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Type</span>
              <span className="font-medium">{strategy?.strategyType}</span>
            </div>
          </div>

          {/* Execution mode */}
          <div className="space-y-1.5">
            <Label>Execution Mode</Label>
            <Select value={executionMode} onValueChange={(v) => setExecutionMode(v as ExecutionMode)}>
              <SelectTrigger className="dark:bg-[#232326] dark:border-gray-600 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAPER">Paper Trading (Simulated)</SelectItem>
                <SelectItem value="LIVE">Live Trading (Real Money)</SelectItem>
              </SelectContent>
            </Select>
            {executionMode === "LIVE" && (
              <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> Live mode uses real funds. Proceed with caution.
              </p>
            )}
          </div>

          {/* Custom name */}
          <div className="space-y-1.5">
            <Label>Custom Name <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input
              placeholder={strategy?.name ?? "My Copy of the Strategy"}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="dark:bg-[#232326] dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={purchaseMutation.isPending}
            className="bg-[#581C3D] hover:bg-[#581C3D]/90 text-white"
          >
            {purchaseMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Purchasing…</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" /> Confirm Purchase</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Purchased strategy row card ───────────────────────────────────────────

function PurchasedCard({ purchase }: { purchase: any }) {
  const strategy = purchase.strategy
  const name = purchase.customName || strategy?.name || purchase.strategyId
  const exchange = strategy?.exchange ?? '—'
  const symbol = strategy?.symbol ?? '—'

  return (
    <Card className="flex items-center justify-between p-4 border border-border dark:border-gray-700 dark:bg-[#232326] dark:text-white rounded-xl">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-[#581C3D] to-[#8B2E5C] text-white text-xs font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{exchange} • {symbol}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={purchase.executionMode === 'LIVE' ? 'destructive' : 'secondary'}>
          {purchase.executionMode}
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : '—'}
        </span>
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function MarketPlacePage() {
  const [search, setSearch] = useState("")
  const [selectedStrategy, setSelectedStrategy] = useState<MarketplaceStrategy | null>(null)

  const { data: published = [], isLoading: loadingPublished, error: publishedError } = usePublishedStrategies()
  const { data: purchases = [], isLoading: loadingPurchases } = useMyPurchases()

  const purchasedIds = useMemo(() => new Set(purchases.map((p: any) => p.strategyId)), [purchases])

  const filtered = useMemo(() => {
    if (!search.trim()) return published
    const q = search.toLowerCase()
    return published.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.symbol.toLowerCase().includes(q) ||
        s.exchange.toLowerCase().includes(q)
    )
  }, [published, search])

  // Tab groupings
  const byROI = useMemo(
    () => [...filtered].sort((a, b) => (b.config?.exit?.bookProfit?.percentage ?? 0) - (a.config?.exit?.bookProfit?.percentage ?? 0)),
    [filtered]
  )
  const byFollowers = useMemo(
    () => [...filtered].sort((a, b) => (b._count?.copyFollowers ?? 0) - (a._count?.copyFollowers ?? 0)),
    [filtered]
  )
  const topSeller = useMemo(
    () => [...filtered].sort((a, b) => (b._count?.purchases ?? 0) - (a._count?.purchases ?? 0)),
    [filtered]
  )

  const renderCards = (list: MarketplaceStrategy[]) => {
    if (loadingPublished) {
      return (
        <div className="flex items-center gap-2 text-gray-500 py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading strategies…
        </div>
      )
    }
    if (publishedError) {
      return (
        <div className="flex items-center gap-2 text-red-500 py-8">
          <AlertCircle className="h-5 w-5" /> Failed to load strategies.
        </div>
      )
    }
    if (list.length === 0) {
      return <div className="text-gray-400 py-8">No strategies found.</div>
    }
    return (
      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
        {list.map((s) => (
          <MarketplaceCard
            key={s.id}
            strategy={s}
            isPurchased={purchasedIds.has(s.id)}
            onBuy={setSelectedStrategy}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 w-full max-w-7xl mx-auto dark:text-white min-h-full">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 flex-wrap">
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">Published:</span>
            <BadgeCustom>{loadingPublished ? '…' : published.length}</BadgeCustom>
          </button>
          <button className="flex items-center gap-2 border-2 px-[16px] py-[10px] rounded-md border-[#581C3D]">
            <span className="text-sm font-medium">My Purchases:</span>
            <BadgeCustom>{loadingPurchases ? '…' : purchases.length}</BadgeCustom>
          </button>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search Seller/Strategy Name"
            className="pl-8 border-gray-200 dark:bg-[#232326] dark:border-gray-600 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabsList className="bg-transparent w-full justify-start rounded-none p-0 h-auto">
            {[
              { value: "all", label: "All Strategies" },
              { value: "high-roi", label: "High ROI" },
              { value: "top-seller", label: "Top Seller" },
              { value: "most-followed", label: "Most Followed" },
              { value: "my-purchases", label: "My Purchases" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="px-4 py-2 rounded-t-md data-[state=active]:bg-[#581C3D] data-[state=active]:text-white"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          {renderCards(filtered)}
        </TabsContent>

        <TabsContent value="high-roi" className="mt-4">
          {renderCards(byROI)}
        </TabsContent>

        <TabsContent value="top-seller" className="mt-4">
          {renderCards(topSeller)}
        </TabsContent>

        <TabsContent value="most-followed" className="mt-4">
          {renderCards(byFollowers)}
        </TabsContent>

        <TabsContent value="my-purchases" className="mt-4 space-y-3">
          {loadingPurchases ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading your purchases…
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-gray-400 py-8">You haven't purchased any strategies yet.</div>
          ) : (
            purchases.map((p: any) => <PurchasedCard key={p.id} purchase={p} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase confirmation dialog */}
      <PurchaseDialog
        strategy={selectedStrategy}
        onClose={() => setSelectedStrategy(null)}
      />
    </div>
  )
}


'use client'

import * as React from "react"
// Removed unused import ChevronDown
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Removed unused import Checkbox
// Removed unused imports Collapsible, CollapsibleContent, CollapsibleTrigger
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { toast } from "sonner"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { brokerageService } from "@/api/brokerage"

export default function IndyUTC() {
  // Removed unused state isOpen, setIsOpen
  const [selectedApi, setSelectedApi] = React.useState("")
  const [isBrokeragesLoading, setIsBrokeragesLoading] = React.useState(false)
  const [brokerages, setBrokerages] = React.useState([])
  // Form state for required fields
  const [name, setName] = React.useState("")
  const [direction, setDirection] = React.useState("both")
  const [quantity, setQuantity] = React.useState("")
  const [asset, setAsset] = React.useState("")
  const [utcSession, setUtcSession] = React.useState("london_open")
  const [tradingWindowStart, setTradingWindowStart] = React.useState("")
  const [tradingWindowEnd, setTradingWindowEnd] = React.useState("")
  const [timezone, setTimezone] = React.useState("UTC")
  const [riskLevel, setRiskLevel] = React.useState("medium")
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    async function fetchBrokerages() {
      setIsBrokeragesLoading(true)
      try {
        const res = await brokerageService.getBrokerageDetails()
        setBrokerages(res.data.data || [])
      } catch {
        setBrokerages([])
      } finally {
        setIsBrokeragesLoading(false)
      }
    }
    fetchBrokerages()
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Sidebar input cards */}
      <AccountDetailsCard
        selectedApi={selectedApi}
        setSelectedApi={setSelectedApi}
        isBrokeragesLoading={isBrokeragesLoading}
        brokerages={brokerages}
      />
      <div className="mt-4 rounded-lg border border-[#e5e7eb] dark:border-[#4A1515] bg-white dark:bg-[#18181B] shadow-lg">
        <div className="rounded-t-lg bg-[#4A1515] dark:bg-[#4A1515] px-4 py-3 flex items-center">
          <span className="text-lg font-semibold text-white dark:text-white">Indy UTC</span>
        </div>
        <form
          className="p-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const token = localStorage.getItem("token");
              const body = {
                name,
                strategy_type: "indy_utc",
                provider: "IndyUTCService",
                conditions: [
                  {
                    indicator: "UTC Session",
                    action: "active_during",
                    value: utcSession,
                  },
                ],
                direction,
                quantity: Number(quantity),
                asset,
                utc_session: utcSession,
                trading_window_start: tradingWindowStart,
                trading_window_end: tradingWindowEnd,
                timezone,
                risk_level: riskLevel,
              };
              const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/strategies`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
              });
              if (!res.ok) throw new Error("Failed to create strategy");
              toast.success("Strategy created successfully!");
              // Optionally reset form
              setName("");
              setDirection("both");
              setQuantity("");
              setAsset("");
              setUtcSession("london_open");
              setTradingWindowStart("");
              setTradingWindowEnd("");
              setTimezone("UTC");
              setRiskLevel("medium");
            } catch (err: any) {
              toast.error(err.message || "Error creating strategy");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Strategy Name</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Direction</Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="w-full bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white">
                <SelectValue placeholder="Select Direction" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326] text-gray-900 dark:text-white">
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Quantity</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              type="number"
              placeholder="Enter Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Asset</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="e.g. EURUSD"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">UTC Session</Label>
            <Select value={utcSession} onValueChange={setUtcSession}>
              <SelectTrigger className="w-full bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326] text-gray-900 dark:text-white">
                <SelectItem value="london_open">London Open</SelectItem>
                <SelectItem value="newyork_open">New York Open</SelectItem>
                <SelectItem value="tokyo_open">Tokyo Open</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Trading Window Start</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              type="time"
              value={tradingWindowStart}
              onChange={(e) => setTradingWindowStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Trading Window End</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              type="time"
              value={tradingWindowEnd}
              onChange={(e) => setTradingWindowEnd(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Timezone</Label>
            <Input
              className="bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="UTC"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-900 dark:text-white">Risk Level</Label>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="w-full bg-white dark:bg-[#232326] border border-[#e5e7eb] dark:border-[#4A1515] text-gray-900 dark:text-white">
                <SelectValue placeholder="Select Risk" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326] text-gray-900 dark:text-white">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 mt-6">
            <Button
              className="flex-1 bg-[#4A1515] dark:bg-[#4A1515] hover:bg-[#5A2525] dark:hover:bg-[#5A2525] text-white font-semibold rounded"
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Proceed"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-[#F59E42] dark:bg-[#D97706] text-white hover:bg-[#B45309] font-semibold rounded"
              type="button"
              onClick={() => {
                setName("");
                setDirection("both");
                setQuantity("");
                setAsset("");
                setUtcSession("london_open");
                setTradingWindowStart("");
                setTradingWindowEnd("");
                setTimezone("UTC");
                setRiskLevel("medium");
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


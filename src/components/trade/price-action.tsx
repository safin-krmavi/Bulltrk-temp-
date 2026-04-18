'use client'

import * as React from "react"
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useMemo, useEffect } from "react"
import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
import { useStrategyStore, PriceActionStrategy } from "@/stores/strategystore"
import { toast } from "sonner"
import { ProceedPopup } from "@/components/dashboard/proceed-popup"

type RiskLevel = 'SAFE' | 'MODERATE' | 'RISKY';

export default function PriceAction() {
    const [isMainOpen, setIsMainOpen] = useState(true)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [showProceedPopup, setShowProceedPopup] = useState(false)

    // Account details from AccountDetailsCard
    const [selectedApiId, setSelectedApiId] = useState<string>("");
    const [exchange, setExchange] = useState("");
    const [segment, setSegment] = useState("SPOT");
    const [symbol, setSymbol] = useState("");

    // Get strategy store
    const {
        createPriceAction,
        isLoading,
        allExchangesBalances,
        fetchAllExchangesBalances,
        isLoadingBalances,
    } = useStrategyStore();

    // Main form state
    const [riskLevel, setRiskLevel] = useState<RiskLevel>("SAFE");
    const [strategyName, setStrategyName] = useState("");
    const [investment, setInvestment] = useState("");
    const [investmentCap, setInvestmentCap] = useState("");
    const [timeFrame, setTimeFrame] = useState("1h");

    // Advanced settings state
    const [priceStart, setPriceStart] = useState("");
    const [priceStop, setPriceStop] = useState("");
    const [takeProfitPct, setTakeProfitPct] = useState("");
    const [stopLossByPercent, setStopLossByPercent] = useState("");

    // Available balance
    const [availableBalance, setAvailableBalance] = useState("0");

    // Quote asset derived from symbol
    const quoteAsset = useMemo(() => {
        if (!symbol) return 'USDT';
        const knownQuotes = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'INR', 'TUSD', 'DAI', 'FDUSD'];
        const sortedQuotes = [...knownQuotes].sort((a, b) => b.length - a.length);
        for (const quote of sortedQuotes) {
            if (symbol.toUpperCase().endsWith(quote)) return quote;
        }
        return 'USDT';
    }, [symbol]);

    // Fetch balances for the quote asset when it changes
    useEffect(() => {
        if (quoteAsset) {
            fetchAllExchangesBalances(quoteAsset).catch(() => { });
        }
    }, [quoteAsset, fetchAllExchangesBalances]);

    // Update available balance when exchange, segment or balance data changes
    useEffect(() => {
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

    // AccountDetailsCard callback
    const handleAccountDetailsChange = (data: {
        selectedApi: string;
        exchange: string;
        segment: string;
        pair: string;
        quote: string;
    }) => {
        setSelectedApiId(data.selectedApi);
        setExchange(data.exchange);
        setSegment(data.segment);
        setSymbol(data.pair);
        // Note: quoteAsset is derived from symbol in this file, 
        // but we could just use data.quote if we wanted to simplify.
    };

    const validateForm = () => {
        if (!selectedApiId) { toast.error("Please select an API connection"); return false; }
        if (!strategyName.trim()) { toast.error("Please enter a strategy name"); return false; }
        if (!investment || Number(investment) <= 0) { toast.error("Please enter a valid investment amount"); return false; }
        if (!investmentCap || Number(investmentCap) <= 0) { toast.error("Please enter a valid investment cap"); return false; }
        return true;
    };

    const handleProceed = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowProceedPopup(true);
    };

    const handleConfirmStrategy = async (executionMode: 'LIVE' | 'PUBLISHED') => {
        const toastId = toast.loading("Creating Price Action strategy...");
        try {
            const strategyData: Omit<PriceActionStrategy, 'strategyType' | 'assetType'> = {
                name: strategyName,
                exchange,
                segment,
                symbol,
                executionMode,
                timeFrame,
                riskLevel,
                investment: Number(investment),
                investmentCap: Number(investmentCap),
                ...(priceStart && Number(priceStart) > 0 && { priceStart: Number(priceStart) }),
                ...(priceStop && Number(priceStop) > 0 && { priceStop: Number(priceStop) }),
                ...(takeProfitPct && Number(takeProfitPct) > 0 && { takeProfitPct: Number(takeProfitPct) }),
                ...(stopLossByPercent && Number(stopLossByPercent) > 0 && { stopLossByPercent: Number(stopLossByPercent) }),
            };

            await createPriceAction(strategyData);
            toast.success("Price Action strategy created! 🎉", {
                id: toastId,
                description: `${strategyName} is now running in ${executionMode} mode`,
                duration: 5000
            });
            setShowProceedPopup(false);
            handleReset();
        } catch (err: any) {
            toast.error("Failed to create strategy", {
                id: toastId,
                description: err.message || "Please check your inputs and try again"
            });
        }
    };

    const handleReset = () => {
        setRiskLevel("SAFE");
        setStrategyName("");
        setInvestment("");
        setInvestmentCap("");
        setTimeFrame("1h");
        setPriceStart("");
        setPriceStop("");
        setTakeProfitPct("");
        setStopLossByPercent("");
        // toast.success("Form reset");
    };

    // Build data for the review popup
    const popupData = {
        selectedApi: selectedApiId,
        exchange,
        segment,
        pair: symbol,
        name: strategyName,
        investmentPerRun: Number(investment),
        investmentCap: Number(investmentCap),
        strategyType: 'PRICE_ACTION' as const,
        risk_level: riskLevel.toLowerCase(),
        pattern_confidence: undefined,
        timeframe: timeFrame,
        quantity: Number(investment),
        direction: undefined,
        priceStart: priceStart ? Number(priceStart) : undefined,
        priceStop: priceStop ? Number(priceStop) : undefined,
        takeProfitPct: takeProfitPct ? Number(takeProfitPct) : undefined,
        stopLossPct: stopLossByPercent ? Number(stopLossByPercent) : undefined,
    };

    const riskOptions: { label: string; value: RiskLevel }[] = [
        { label: 'Safe', value: 'SAFE' },
        { label: 'Moderate', value: 'MODERATE' },
        { label: 'Risky', value: 'RISKY' },
    ];

    return (
        <div className="w-full max-w-md mx-auto">
            <AccountDetailsCard onDataChange={handleAccountDetailsChange} />

            <form className="space-y-4 mt-4 dark:text-white" onSubmit={(e) => e.preventDefault()}>
                {/* ─── Price Action Card ─── */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                    {/* Header */}
                    <div
                        className="flex w-full items-center justify-between bg-[#4A1515] p-4 font-medium text-white cursor-pointer hover:bg-[#5A2525]"
                        onClick={() => setIsMainOpen(v => !v)}
                    >
                        <span>Price Action</span>
                        {isMainOpen
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        }
                    </div>

                    {isMainOpen && (
                        <div className="bg-white dark:bg-[#1A1A1D] p-4 space-y-5">
                            {/* Risk Level Tabs */}
                            <div>
                                <div className="flex border-b border-gray-200 dark:border-gray-700">
                                    {riskOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRiskLevel(opt.value)}
                                            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${riskLevel === opt.value
                                                ? 'text-white'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {riskLevel === opt.value ? (
                                                <span className="bg-[#D97706] text-white px-4 py-1.5 rounded-md inline-block">
                                                    {opt.label}
                                                </span>
                                            ) : (
                                                opt.label
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Strategy Name */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Strategy Name
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </Label>
                                <Input
                                    placeholder="Enter Name"
                                    value={strategyName}
                                    onChange={e => setStrategyName(e.target.value)}
                                    className="h-12 rounded-lg border-gray-200 dark:border-gray-700"
                                />
                            </div>

                            {/* Time Frame */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Time Frame
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </Label>
                                <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                                    {quoteAsset}
                                </div>
                            </div>

                            {/* Investment */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Investment
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Value"
                                        value={investment}
                                        onChange={e => setInvestment(e.target.value)}
                                        type="number"
                                        step="0.01"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 flex-1"
                                    />
                                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                                        {quoteAsset}
                                    </div>
                                </div>
                                {isLoadingBalances ? (
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                        Loading balance...
                                    </p>
                                ) : (
                                    <p className="text-sm text-orange-500 font-medium">
                                        Avbl: {availableBalance} {quoteAsset}
                                    </p>
                                )}
                            </div>

                            {/* Investment CAP */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Investment CAP
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Value"
                                        value={investmentCap}
                                        onChange={e => setInvestmentCap(e.target.value)}
                                        type="number"
                                        step="0.01"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 flex-1"
                                    />
                                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                                        {quoteAsset}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Advanced Settings Card ─── */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                    {/* Header */}
                    <div
                        className="flex w-full items-center justify-between bg-[#4A1515] p-4 font-medium text-white cursor-pointer hover:bg-[#5A2525]"
                        onClick={() => setIsAdvancedOpen(v => !v)}
                    >
                        <span>Advanced Settings</span>
                        {isAdvancedOpen
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        }
                    </div>

                    {isAdvancedOpen && (
                        <div className="bg-white dark:bg-[#1A1A1D] p-4 space-y-5">
                            {/* Price Trigger Start */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Price Trigger Start
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Value"
                                        value={priceStart}
                                        onChange={e => setPriceStart(e.target.value)}
                                        type="number"
                                        step="0.01"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 flex-1"
                                    />
                                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                                        {quoteAsset}
                                    </div>
                                </div>
                            </div>

                            {/* Price Trigger Stop */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Price Trigger Stop
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Value"
                                        value={priceStop}
                                        onChange={e => setPriceStop(e.target.value)}
                                        type="number"
                                        step="0.01"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 flex-1"
                                    />
                                    <div className="w-[100px] h-10 flex items-center justify-center rounded-md border bg-muted px-3 text-sm font-medium text-muted-foreground truncate">
                                        {quoteAsset}
                                    </div>
                                </div>
                            </div>

                            {/* Take Profit */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Take Profit
                                </Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Value"
                                        value={takeProfitPct}
                                        onChange={e => setTakeProfitPct(e.target.value)}
                                        type="number"
                                        step="0.1"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* Stop Loss By */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    Stop Loss By
                                </Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Value"
                                        value={stopLossByPercent}
                                        onChange={e => setStopLossByPercent(e.target.value)}
                                        type="number"
                                        step="0.1"
                                        className="h-12 rounded-lg border-gray-200 dark:border-gray-700 pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                    <Button
                        className="flex-1 bg-[#4A1515] text-white hover:bg-[#5A2525] h-11"
                        onClick={handleProceed}
                        disabled={isLoading}
                        type="button"
                    >
                        {isLoading ? "Processing..." : "Proceed"}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 h-11 bg-[#D97706] text-white hover:bg-[#B45309] border-0"
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
                    strategyData={popupData}
                    onClose={() => setShowProceedPopup(false)}
                    onConfirm={handleConfirmStrategy}
                    isLoading={isLoading}
                />
            )}
        </div>
    )
}

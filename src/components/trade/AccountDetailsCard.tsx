import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authstore";
import { useStrategyStore } from "../../stores/strategystore";
import apiClient from "@/api/apiClient";
import { apiurls } from "@/api/apiurls";
import { toast } from "sonner";

interface AccountDetailsCardProps {
  title?: string;
  onDataChange?: (data: {
    selectedApi: string;
    exchange: string;
    segment: string;
    pair: string;
    quote: string;
  }) => void;
  allowedSegments?: string[];
  initialSegment?: string;
  initialPair?: string;
  initialExchange?: string;
}

const SEGMENTS = [
  { value: "SPOT", label: "Spot" },
  { value: "FUTURES", label: "Futures" },
  // { value: "MARGIN", label: "Margin" },
];

interface BrokerageConnection {
  id: string;
  userId: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string;
  apiKeyVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export const AccountDetailsCard: React.FC<AccountDetailsCardProps> = ({
  title = "Account Details",
  onDataChange,
  allowedSegments,
  initialSegment,
  initialPair,
  initialExchange,
}) => {
  const [open, setOpen] = React.useState(true);
  const [selectedApi, setSelectedApi] = React.useState("");

  // Filter segments based on allowedSegments prop
  const filteredSegments = React.useMemo(() => {
    if (!allowedSegments || allowedSegments.length === 0) return SEGMENTS;
    const allowedUpper = allowedSegments.map(s => s.toUpperCase());
    return SEGMENTS.filter(s => allowedUpper.includes(s.value));
  }, [allowedSegments]);

  const [segment, setSegment] = React.useState(() => {
    if (initialSegment) return initialSegment.toUpperCase();
    // Default to SPOT if allowed, otherwise first allowed segment, otherwise SEGMENTS[0]
    if (!allowedSegments || allowedSegments.includes("SPOT")) return "SPOT";
    return filteredSegments[0]?.value || "SPOT";
  });

  const [pair, setPair] = React.useState(initialPair || "");
  const [pairSearch, setPairSearch] = React.useState("");
  const [connections, setConnections] = useState<BrokerageConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isPairDropdownOpen, setIsPairDropdownOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const { user } = useAuthStore();
  const { fetchSymbols, getSymbolsByExchange, isLoadingSymbols } = useStrategyStore();

  // Get filtered symbols based on selected exchange and segment
  const availableSymbols = React.useMemo(() => {
    if (!selectedApi || !segment) return [];

    const selectedConnection = connections.find(c => c.id === selectedApi);
    if (!selectedConnection) return [];

    return getSymbolsByExchange(selectedConnection.exchange, segment);
  }, [selectedApi, segment, connections, getSymbolsByExchange]);

  // Filter symbols based on search query
  const filteredSymbols = React.useMemo(() => {
    if (!pairSearch.trim()) return availableSymbols;

    const searchLower = pairSearch.toLowerCase();
    return availableSymbols.filter(symbol =>
      symbol.symbol.toLowerCase().includes(searchLower) ||
      symbol.base.toLowerCase().includes(searchLower) ||
      symbol.quote.toLowerCase().includes(searchLower)
    );
  }, [availableSymbols, pairSearch]);

  // Fetch symbols on mount
  useEffect(() => {
    console.log("Fetching all symbols on mount...");
    fetchSymbols().catch(err => {
      console.error("Failed to fetch symbols:", err);
      toast.error("Failed to load trading pairs");
    });
  }, []);

  // Fetch connections on mount
  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id]);

  // Sync initial pair and segment if they arrive late or change
  const lastInitialPair = React.useRef(initialPair);
  useEffect(() => {
    if (initialPair && initialPair !== lastInitialPair.current) {
      setPair(initialPair);
      lastInitialPair.current = initialPair;
    }
  }, [initialPair]);

  const lastInitialSegment = React.useRef(initialSegment);
  useEffect(() => {
    if (initialSegment && initialSegment !== lastInitialSegment.current) {
      setSegment(initialSegment.toUpperCase());
      lastInitialSegment.current = initialSegment;
    }
  }, [initialSegment]);

  // Auto-select first symbol when available symbols change - ONLY IF NO PAIR IS SET
  useEffect(() => {
    if (availableSymbols.length > 0 && !pair) {
      setPair(availableSymbols[0].symbol);
    }
  }, [availableSymbols, pair]);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      const selectedConnection = connections.find(c => c.id === selectedApi);
      const selectedPairInfo = availableSymbols.find(s => s.symbol === pair);
      const dataToSend = {
        selectedApi: selectedApi,
        exchange: selectedConnection?.exchange || "",
        segment,
        pair,
        quote: selectedPairInfo?.quote || "USDT",
      };

      console.log("Sending data to parent:", dataToSend);
      onDataChange(dataToSend);

      // Broadcast selection so parent pages on other routes can sync chart symbol.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("account-details-change", { detail: dataToSend })
        );
      }
    }
  }, [selectedApi, segment, pair, connections, onDataChange, availableSymbols]);

  // Reset search and handle focus when dropdown opens/closes
  useEffect(() => {
    if (!isPairDropdownOpen) {
      setPairSearch("");
    }
  }, [isPairDropdownOpen]);

  // Ensure focus stays on input when search updates - but avoid unnecessary calls if already focused
  // useEffect(() => {
  //   if (isPairDropdownOpen && searchInputRef.current) {
  //     if (document.activeElement !== searchInputRef.current) {
  //       searchInputRef.current.focus();
  //     }
  //   }
  // }, [pairSearch, isPairDropdownOpen]);

  const fetchConnections = async () => {
    setIsLoadingConnections(true);
    try {
      if (!user?.id) {
        console.error("No user ID available");
        return;
      }

      const url = apiurls.credentials.getConnections.replace(':userId', user.id);
      console.log("Fetching connections from:", url);
      const response = await apiClient.get(url);

      console.log("Connections response:", response.data);

      if (response.data?.data) {
        const connectionsData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];

        // ✅ Sort connections to prioritize Binance FIRST
        const sortedConnections = connectionsData.sort((a: { exchange: string; }, b: { exchange: string; }) => {
          const aIsBinance = a.exchange.toUpperCase() === 'BINANCE';
          const bIsBinance = b.exchange.toUpperCase() === 'BINANCE';

          if (aIsBinance && !bIsBinance) return -1;
          if (!aIsBinance && bIsBinance) return 1;
          return 0;
        });

        console.log("Sorted connections (Binance first):", sortedConnections.map((c: { exchange: any; }) => c.exchange));

        // ✅ Set connections FIRST before auto-selecting
        setConnections(sortedConnections);

        // ✅ Auto-select connection
        if (sortedConnections.length > 0 && !selectedApi) {
          let connectionToSelect;

          if (initialExchange) {
            // Try to find connection matching initial exchange
            connectionToSelect = sortedConnections.find((c: { exchange: string; }) =>
              c.exchange.toUpperCase() === initialExchange.toUpperCase()
            );
          }

          if (!connectionToSelect) {
            // Fallback to Binance or first connection
            const binanceConnection = sortedConnections.find((c: { exchange: string; }) =>
              c.exchange.toUpperCase() === 'BINANCE'
            );
            connectionToSelect = binanceConnection || sortedConnections[0];
          }

          console.log("Auto-selecting connection:", connectionToSelect.exchange, connectionToSelect.id);
          setSelectedApi(connectionToSelect.id);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch connections:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load API connections");
      }
    } finally {
      setIsLoadingConnections(false);
    }
  };

  // Helper function to get platform label from exchange value
  const getPlatformLabel = (exchange: string) => {
    const platformMap: { [key: string]: string } = {
      BINANCE: "Binance",
      ZERODHA: "Zerodha",
      KUCOIN: "KuCoin",
      OKX: "OKX",
    };
    return platformMap[exchange.toUpperCase()] || exchange;
  };

  return (
    <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white rounded-lg transition-colors duration-300">
      <CardHeader
        className="bg-[#4A1C24] dark:bg-[#232326] dark:border-gray-700 text-white cursor-pointer flex flex-row items-center justify-between p-4 rounded-t-lg"
        onClick={() => setOpen((prev) => !prev)}
      >
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CardHeader>
      <div className={cn("transition-all duration-200", open ? "block" : "hidden")}>
        <CardContent className="p-6 space-y-6">
          {/* API Connect Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              API Connect <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedApi}
              onValueChange={(value) => {
                console.log("API connection selected:", value);
                setSelectedApi(value);
              }}
              disabled={isLoadingConnections || connections.length === 0}
            >
              <SelectTrigger className="w-full bg-white dark:bg-[#1a1a1d] border border-border dark:border-gray-600 rounded-md h-12 text-base">
                <SelectValue placeholder="API connection name" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326]">
                {isLoadingConnections ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading connections...
                    </div>
                  </SelectItem>
                ) : connections.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No API connections found
                  </SelectItem>
                ) : (
                  connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {getPlatformLabel(connection.exchange)}
                      {connection.exchange.toUpperCase() === 'BINANCE' && (
                        <span className="ml-2 text-xs text-green-600"></span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Segment Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Segment <span className="text-red-500">*</span>
            </label>
            <Select
              value={segment}
              onValueChange={(value) => {
                console.log("Segment selected:", value);
                setSegment(value);
              }}
            >
              <SelectTrigger className="w-full bg-white dark:bg-[#1a1a1d] border border-border dark:border-gray-600 rounded-md h-12 text-base">
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326]">
                {filteredSegments.map((seg) => (
                  <SelectItem key={seg.value} value={seg.value}>
                    {seg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enter Pair Field with Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter Pair <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!isLoadingSymbols && availableSymbols.length > 0 && selectedApi) {
                    setIsPairDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={isLoadingSymbols || availableSymbols.length === 0 || !selectedApi}
                className="w-full bg-white dark:bg-[#1a1a1d] border border-border dark:border-gray-600 rounded-md h-12 text-base px-3 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={pair ? "text-foreground dark:text-white" : "text-muted-foreground"}>
                  {pair || "Select trading pair"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isPairDropdownOpen && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPairDropdownOpen(false)}
                  />
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#232326] border border-border dark:border-gray-600 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          placeholder="Search pairs..."
                          value={pairSearch}
                          onChange={(e) => setPairSearch(e.target.value)}
                          className="pl-8 h-9 w-full rounded-md border border-input bg-white dark:bg-[#1a1a1d] px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          autoFocus
                        />
                      </div>
                      {pairSearch && (
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          {filteredSymbols.length} of {availableSymbols.length} pairs
                        </p>
                      )}
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[250px] overflow-y-auto">
                      {filteredSymbols.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No pairs found</p>
                          <p className="text-xs text-gray-400">Try a different search</p>
                        </div>
                      ) : (
                        filteredSymbols.map((symbol) => (
                          <div
                            key={symbol.symbol}
                            onClick={() => {
                              setPair(symbol.symbol);
                              setPairSearch("");
                              setIsPairDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2d] ${pair === symbol.symbol ? "bg-orange-50 dark:bg-orange-500/10" : ""
                              }`}
                          >
                            <span className="font-medium text-sm">{symbol.symbol}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {symbol.base}/{symbol.quote}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {isLoadingSymbols && (
              <p className="text-xs text-orange-500">Loading trading pairs...</p>
            )}
            {!isLoadingSymbols && availableSymbols.length === 0 && selectedApi && (
              <p className="text-xs text-red-500">
                No trading pairs available for this combination
              </p>
            )}
            {!isLoadingSymbols && availableSymbols.length > 0 && (
              <p className="text-xs text-green-500">
                {availableSymbols.length} pairs available
              </p>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
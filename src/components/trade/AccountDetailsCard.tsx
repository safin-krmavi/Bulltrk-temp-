import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  }) => void;
}

const SEGMENTS = [
  { value: "SPOT", label: "Spot" },
  { value: "FUTURES", label: "Futures" },
  { value: "MARGIN", label: "Margin" },
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
}) => {
  const [open, setOpen] = React.useState(true);
  const [selectedApi, setSelectedApi] = React.useState("");
  const [segment, setSegment] = React.useState("SPOT");
  const [pair, setPair] = React.useState("");
  const [pairSearch, setPairSearch] = React.useState("");
  const [connections, setConnections] = useState<BrokerageConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isPairDropdownOpen, setIsPairDropdownOpen] = React.useState(false);

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

  // Auto-select first symbol when available symbols change
  useEffect(() => {
    if (availableSymbols.length > 0) {
      console.log("Auto-selecting first symbol:", availableSymbols[0].symbol);
      setPair(availableSymbols[0].symbol);
    } else {
      console.log("No symbols available, clearing pair");
      setPair("");
    }
  }, [availableSymbols]);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      const selectedConnection = connections.find(c => c.id === selectedApi);
      const dataToSend = {
        selectedApi: selectedApi,
        exchange: selectedConnection?.exchange || "",
        segment,
        pair,
      };
      
      console.log("Sending data to parent:", dataToSend);
      onDataChange(dataToSend);
    }
  }, [selectedApi, segment, pair, connections, onDataChange]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isPairDropdownOpen) {
      setPairSearch("");
    }
  }, [isPairDropdownOpen]);

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
        
        console.log("Connections loaded:", connectionsData);
        setConnections(connectionsData);
        
        // Auto-select first connection if available
        if (connectionsData.length > 0 && !selectedApi) {
          console.log("Auto-selecting first connection:", connectionsData[0].id);
          setSelectedApi(connectionsData[0].id);
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
                {SEGMENTS.map((seg) => (
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
            <Select 
              value={pair} 
              onValueChange={(value) => {
                console.log("Pair selected:", value);
                setPair(value);
                setPairSearch("");
              }}
              disabled={isLoadingSymbols || availableSymbols.length === 0 || !selectedApi}
              open={isPairDropdownOpen}
              onOpenChange={setIsPairDropdownOpen}
            >
              <SelectTrigger className="w-full bg-white dark:bg-[#1a1a1d] border border-border dark:border-gray-600 rounded-md h-12 text-base">
                <SelectValue placeholder="Select trading pair" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#232326]">
                {/* Search Input */}
                {!isLoadingSymbols && availableSymbols.length > 0 && (
                  <div className="sticky top-0 z-10 bg-white dark:bg-[#232326] p-2 border-b dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search pairs..."
                        value={pairSearch}
                        onChange={(e) => setPairSearch(e.target.value)}
                        className="pl-8 h-9 bg-white dark:bg-[#1a1a1d]"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {pairSearch && (
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {filteredSymbols.length} of {availableSymbols.length} pairs
                      </p>
                    )}
                  </div>
                )}

                {/* Scrollable Content */}
                <div className="max-h-[250px] overflow-y-auto">
                  {isLoadingSymbols ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading pairs...
                      </div>
                    </SelectItem>
                  ) : availableSymbols.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {selectedApi ? "No trading pairs found for this exchange/segment" : "Select API connection first"}
                    </SelectItem>
                  ) : filteredSymbols.length === 0 ? (
                    <SelectItem value="no-results" disabled>
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">No pairs found</p>
                        <p className="text-xs text-gray-400">Try a different search</p>
                      </div>
                    </SelectItem>
                  ) : (
                    filteredSymbols.map((symbol) => (
                      <SelectItem key={symbol.symbol} value={symbol.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{symbol.symbol}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {symbol.base}/{symbol.quote}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
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
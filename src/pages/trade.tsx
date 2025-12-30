import GrowthDCA from "@/components/trade/growth-dca";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useBotManagement } from "@/hooks/useBotManagement";
import { format } from "date-fns";
import { BrokerageConnection, brokerageService } from "@/api/brokerage";
import { CandlestickChart } from "@/components/chart/CandlestickChart";
import { ChartControls } from "@/components/chart/ChartControls";
import HumanGrid from "@/components/trade/human-grid";
import IndyLESI from "@/components/trade/indie-lesi";
import IndyTrend from "@/components/trade/indy-trend";
import PriceAction from "@/components/trade/price-action";
import SmartGrid from "@/components/trade/smart-grid";
import { TradeConfirmationDialog } from "@/components/trade/trade-confirmation-dialog";
import IndyUTC from "@/components/trade/indy-UTC";

export default function TradePage() {
  const [sections, setSections] = useState({
    accountDetails: true,
    botName: false,
    advancedSettings: false,
  });

  const [selectedApi, setSelectedApi] = useState<string>("");
  const [selectedBot, setSelectedBot] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [brokerages, setBrokerages] = useState<BrokerageConnection[]>([]);
  const [isBrokeragesLoading, setIsBrokeragesLoading] = useState(true);

  // Chart state
  const [chartExchange, setChartExchange] = useState<string>("BINANCE");
  const [chartSymbol, setChartSymbol] = useState<string>("BTCUSDT");
  const [chartInterval, setChartInterval] = useState<string>("1h");

  const {
    bots,
    isLoading: isBotsLoading,
    getBotDetails,
  } = useBotManagement(selectedBot);

  const selectedBotDetails = getBotDetails.data;
  const pathName = useLocation().pathname;

  useEffect(() => {
    async function fetchBrokerages() {
      setIsBrokeragesLoading(true);
      try {
        const res = await brokerageService.getBrokerageDetails();
        setBrokerages(res.data.data || []);
      } catch {
        setBrokerages([]);
      } finally {
        setIsBrokeragesLoading(false);
      }
    }
    fetchBrokerages();
  }, []);

  const handleProceed = () => {
    if (!selectedApi || !selectedBot) {
      return;
    }
    setShowConfirmation(true);
  };

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden">
      {/* Chart Section */}
      <div className="flex-1 flex flex-col min-w-0 gap-2">
        <div className="flex-shrink-0">
          <ChartControls
            onExchangeChange={setChartExchange}
            onSymbolChange={setChartSymbol}
            onIntervalChange={setChartInterval}
          />
        </div>
        <div className="flex-1 min-h-0">
          <CandlestickChart
            exchange={chartExchange}
            symbol={chartSymbol}
            interval={chartInterval}
            height="100%"
          />
        </div>
      </div>

      {/* Strategy/Bot Section */}
      {pathName === "/trade" && (
        <div className="w-[400px] flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Account Details */}
          <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white rounded-lg transition-colors duration-300">
            <CardHeader
              className="bg-[#4A1C24] text-white cursor-pointer flex flex-row items-center justify-between p-4 rounded-t-lg"
              onClick={() => toggleSection("accountDetails")}
            >
              <CardTitle className="text-base font-medium">
                Account Details
              </CardTitle>
              {sections.accountDetails ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>
            <div
              className={cn(
                "transition-all duration-200",
                sections.accountDetails ? "block" : "hidden"
              )}
            >
              <CardContent className="p-4 pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Select value={selectedApi} onValueChange={setSelectedApi}>
                    <SelectTrigger className="w-full bg-background border border-border rounded">
                      <SelectValue placeholder="Select API connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {isBrokeragesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : brokerages.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No brokerages found
                        </SelectItem>
                      ) : (
                        brokerages.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.brokerage_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter Coin/Stock/Pairs
                  </label>
                  <Select>
                    <SelectTrigger className="w-full bg-background border border-border rounded">
                      <SelectValue placeholder="Name equal pairs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pair1">BTC/USDT</SelectItem>
                      <SelectItem value="pair2">ETH/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* BOT Name */}
          <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white rounded-lg transition-colors duration-300">
            <CardHeader
              className="bg-[#4A1C24] text-white cursor-pointer flex flex-row items-center justify-between p-4 rounded-t-lg"
              onClick={() => toggleSection("botName")}
            >
              <CardTitle className="text-base font-medium">BOT Name</CardTitle>
              {sections.botName ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>
            <div
              className={cn(
                "transition-all duration-200",
                sections.botName ? "block" : "hidden"
              )}
            >
              <CardContent className="p-4 pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Bot</label>
                  <Select value={selectedBot} onValueChange={setSelectedBot}>
                    <SelectTrigger className="w-full bg-background border border-border rounded">
                      <SelectValue placeholder="Select a bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {isBotsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading bots...
                        </SelectItem>
                      ) : !bots?.data || bots.data?.length === 0 ? (
                        <SelectItem value="no-bots" disabled>
                          No bots available
                        </SelectItem>
                      ) : (
                        bots.data?.map((bot) => (
                          <SelectItem key={bot.id} value={bot.id.toString()}>
                            {bot.name} ({bot.mode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBot && selectedBotDetails && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <h3 className="font-medium">Bot Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Name:</div>
                        <div>{selectedBotDetails.name}</div>

                        <div className="text-muted-foreground">Strategy ID:</div>
                        <div>{selectedBotDetails.strategy_id}</div>

                        <div className="text-muted-foreground">Mode:</div>
                        <div className="capitalize">{selectedBotDetails.mode}</div>

                        <div className="text-muted-foreground">Status:</div>
                        <div className="capitalize">{selectedBotDetails.status}</div>

                        <div className="text-muted-foreground">Execution Type:</div>
                        <div className="capitalize">{selectedBotDetails.execution_type}</div>

                        <div className="text-muted-foreground">Created:</div>
                        <div>
                          {format(new Date(selectedBotDetails.created_at), "dd MMM yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              className="w-fit px-6 bg-[#4A1C24] hover:bg-[#5A2525] text-white shadow-md transition-colors duration-200"
              onClick={handleProceed}
              disabled={!selectedApi || !selectedBot}
            >
              Proceed
            </Button>
            <Button
              className="w-fit px-4 bg-[#D97706] hover:bg-[#B45309] text-white shadow-md transition-colors duration-200"
              onClick={() => console.log("Reset clicked")}
            >
              Reset
            </Button>
          </div>

          <TradeConfirmationDialog
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            selectedApi={selectedApi}
            selectedBot={selectedBotDetails || null}
          />
        </div>
      )}

      {pathName !== "/trade" && (
        <div className="w-[400px] flex-shrink-0 space-y-4 overflow-y-auto">
          {pathName === "/indie-trend" && <IndyTrend />}
          {pathName === "/growth-dca" && <GrowthDCA />}
          {pathName === "/indie-lesi" && <IndyLESI />}
          {pathName === "/indy-utc" && <IndyUTC />}
          {pathName === "/price-action" && <PriceAction />}
          {pathName === "/human-grid" && <HumanGrid />}
          {pathName === "/smart-grid" && <SmartGrid />}
        </div>
      )}
    </div>
  );
}

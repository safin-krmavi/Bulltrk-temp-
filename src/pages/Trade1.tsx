import GrowthDCA from "@/components/trade/growth-dca";
// import HumanGrid from "@/components/trade/human-grid";
// import IndyLESI from "@/components/trade/indie-lesi";
// import IndyTrend from "@/components/trade/indy-trend";
// import PriceAction from "@/components/trade/price-action";
// import SmartGrid from "@/components/trade/smart-grid";
import { TradeConfirmationDialog } from "@/components/trade/trade-confirmation-dialog";
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
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useBotManagement } from "@/hooks/useBotManagement";
import { format } from "date-fns";
import { BrokerageConnection, brokerageService } from "@/api/brokerage";
import { useTheme } from "@/App";

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

  const {
    bots,
    isLoading: isBotsLoading,
    getBotDetails,
  } = useBotManagement(selectedBot);

  // Get the selected bot details - updated to match the API response structure
  const selectedBotDetails = getBotDetails.data;

  const { theme } = useTheme();

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

  useEffect(() => {
    console.log("Bot Data:", {
      bots,
      isLoading: isBotsLoading,
      botList: bots?.data,
      hasBots: bots?.data && bots.data.length > 0,
      selectedBotDetails,
    });
  }, [bots, isBotsLoading, selectedBotDetails]);

  const handleProceed = () => {
    if (!selectedApi || !selectedBot) {
      // You might want to show an error message here
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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const pathName = useLocation().pathname;

  useEffect(() => {
    const loadTradingViewScripts = async () => {
      // Dynamically load the charting library script
      const script1 = document.createElement("script");
      script1.src = "/charting_library/charting_library.standalone.js";
      script1.async = true;

      // Load the datafeed script
      const script2 = document.createElement("script");
      script2.src = "/datafeeds/udf/dist/bundle.js";
      script2.async = true;

      document.body.appendChild(script1);
      document.body.appendChild(script2);

      // Wait until both scripts are loaded
      script2.onload = () => {
        console.log("TradingView scripts loaded");

        // Check if TradingView and Datafeeds are available
        if ((window as any).TradingView && (window as any).Datafeeds) {
          // Initialize the widget
          new (window as any).TradingView.widget({
            container: chartContainerRef.current,
            locale: "en",
            library_path: "/charting_library/",
            datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
              "https://demo-feed-data.tradingview.com"
            ),
            // datafeed: customDatafeed,
            symbol: "AAPL",
            // symbol: "BTCUSDT",
            interval: "1D",
            fullscreen: true,
            debug: true,
            theme: theme === 'dark' ? 'dark' : 'light',
          });
        } else {
          console.error("TradingView or Datafeeds not available.");
        }
      };
    };

    loadTradingViewScripts();

    // Clean up on unmount
    return () => {
      document
        .querySelectorAll("script[src*='charting_library']")
        .forEach((s) => s.remove());
      document
        .querySelectorAll("script[src*='datafeeds']")
        .forEach((s) => s.remove());
    };
  }, [theme]);

  return (
    <div className="flex w-full p-4 h-full">
      {/* TradingView Chart */}
      <div
        id="chartContainer"
        ref={chartContainerRef}
        className="w-full !h-fit mb-4 border border-border"
      ></div>

      {pathName === "/trade" && (
        <div className="max-w-[400px] w-full h-full mx-auto p-4 space-y-4">
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
              <CardContent className="p-4 pt-0 space-y-4">
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
              <CardContent className="p-4 pt-0 space-y-4">
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

                {/* Bot Details */}
                {selectedBot && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <h3 className="font-medium">Bot Details</h3>
                    {getBotDetails.isLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Loading bot details...
                      </div>
                    ) : getBotDetails.error ? (
                      <div className="text-sm text-destructive">
                        Error loading bot details
                      </div>
                    ) : selectedBotDetails ? (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-muted-foreground">Name:</div>
                          <div>{selectedBotDetails.name}</div>

                          <div className="text-muted-foreground">
                            Strategy ID:
                          </div>
                          <div>{selectedBotDetails.strategy_id}</div>

                          <div className="text-muted-foreground">Mode:</div>
                          <div className="capitalize">
                            {selectedBotDetails.mode}
                          </div>

                          <div className="text-muted-foreground">Status:</div>
                          <div className="capitalize">
                            {selectedBotDetails.status}
                          </div>

                          <div className="text-muted-foreground">
                            Execution Type:
                          </div>
                          <div className="capitalize">
                            {selectedBotDetails.execution_type}
                          </div>

                          {selectedBotDetails.schedule_expression && (
                            <>
                              <div className="text-muted-foreground">
                                Schedule:
                              </div>
                              <div>
                                {selectedBotDetails.schedule_expression}
                              </div>
                            </>
                          )}

                          <div className="text-muted-foreground">Created:</div>
                          <div>
                            {format(
                              new Date(selectedBotDetails.created_at),
                              "dd MMM yyyy HH:mm"
                            )}
                          </div>

                          <div className="text-muted-foreground">
                            Last Updated:
                          </div>
                          <div>
                            {format(
                              new Date(selectedBotDetails.updated_at),
                              "dd MMM yyyy HH:mm"
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white rounded-lg transition-colors duration-300">
            <CardHeader
              className="bg-[#4A1C24] text-white cursor-pointer flex flex-row items-center justify-between p-4 rounded-t-lg"
              onClick={() => toggleSection("advancedSettings")}
            >
              <CardTitle className="text-base font-medium">
                Advanced Settings
              </CardTitle>
              {sections.advancedSettings ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>
            <div
              className={cn(
                "transition-all duration-200",
                sections.advancedSettings ? "block" : "hidden"
              )}
            >
              <CardContent className="p-4 pt-0">
                {/* Advanced Settings content here */}
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

          {/* Confirmation Dialog */}
          <TradeConfirmationDialog
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            selectedApi={selectedApi}
            selectedBot={selectedBotDetails || null}
          />
        </div>
      )}
      {pathName !== "/trade" && (
        <div className="max-w-[400px] w-full h-full mx-auto p-4 space-y-4">
          {/* {pathName === "/indie-trend" && <IndyTrend />} */}
          {pathName === "/growth-dca" && <GrowthDCA />}
          {/* {pathName === "/indie-lesi" && <IndyLESI />} */}
          {/* {pathName === "/price-action" && <PriceAction />} */}
          {/* {pathName === "/human-grid" && <HumanGrid />} */}
          {/* {pathName === "/smart-grid" && <SmartGrid />} */}
        </div>
      )}
    </div>
  );
}

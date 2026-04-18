import GrowthDCA from '@/components/trade/growth-dca';
import { AccountDetailsCard } from '@/components/trade/AccountDetailsCard';
import HumanGrid from '@/components/trade/human-grid';
import IndyLESI from '@/components/trade/indie-lesi';
import IndyTrend from '@/components/trade/indy-trend';
import PriceAction from '@/components/trade/price-action';
import IndyUTC from '@/components/trade/indy-utc';
import SmartGrid from '@/components/trade/smart-grid';
import { TradeConfirmationDialog } from '@/components/trade/trade-confirmation-dialog';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBotManagement } from '@/hooks/useBotManagement';
// import { useUserProfile } from '@/hooks/useUserProfile';
import { format } from 'date-fns';

interface AccountSelectionData {
  selectedApi: string;
  exchange: string;
  segment: string;
  pair: string;
  quote: string;
}

export default function TradePage() {
  const [sections, setSections] = useState({
    accountDetails: true,
    botName: false,
    advancedSettings: false
  });

  const [selectedApi, setSelectedApi] = useState<string>("");
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [selectedBot, setSelectedBot] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { bots, isLoading: isBotsLoading, getBotDetails } = useBotManagement(selectedBot);
  // const { data: profileData } = useUserProfile();

  // Get the selected bot details - updated to match the API response structure
  const selectedBotDetails = getBotDetails.data;

  useEffect(() => {
    console.log('Bot Data:', {
      bots,
      isLoading: isBotsLoading,
      botList: bots?.data,
      hasBots: bots?.data && bots.data.length > 0,
      selectedBotDetails
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
      [section]: !prev[section]
    }));
  };

  const handleAccountDetailsChange = useCallback((data: AccountSelectionData) => {
    setSelectedApi(data.selectedApi);
    setSelectedExchange(data.exchange);
    setSelectedPair(data.pair);
  }, []);

  useEffect(() => {
    const handleGlobalAccountDetailsChange = (event: Event) => {
      const customEvent = event as CustomEvent<AccountSelectionData>;
      const data = customEvent.detail;

      if (!data) return;

      setSelectedApi(data.selectedApi || "");
      setSelectedExchange(data.exchange || "");
      setSelectedPair(data.pair || "");
    };

    window.addEventListener("account-details-change", handleGlobalAccountDetailsChange);

    return () => {
      window.removeEventListener("account-details-change", handleGlobalAccountDetailsChange);
    };
  }, []);

  const normalizedPair = selectedPair.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const chartSymbol = selectedExchange && normalizedPair
    ? `${selectedExchange.toUpperCase()}:${normalizedPair}`
    : 'BINANCE:BTCUSDT';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const pathName = useLocation().pathname;

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: chartSymbol,
      interval: '1D',
      theme: 'light',
      style: '1',               // candlestick
      locale: 'en',
      timezone: 'Etc/UTC',
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [chartSymbol]);

  return (
    <div className="flex flex-col lg:flex-row w-full p-4 lg:p-6 gap-6 min-h-[calc(100vh-80px)] items-start">
      {/* TradingView Chart Container */}
      <div
        id="chartContainer"
        ref={chartContainerRef}
        className="flex-1 w-full border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white"
        style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}
      />


      {pathName === "/trade" && (
        <div className="w-full lg:w-[420px] flex-shrink-0 space-y-6">
          {/* Account Details */}
          <AccountDetailsCard onDataChange={handleAccountDetailsChange} allowedSegments={['SPOT']} />

          {/* BOT Name */}
          <Card className="border bg-white rounded-lg shadow-sm">
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer p-4"
              onClick={() => toggleSection('botName')}
            >
              <CardTitle className="text-base font-medium">BOT Name</CardTitle>
              {sections.botName ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>
            <div className={cn(
              "transition-all duration-200",
              sections.botName ? "block" : "hidden"
            )}>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Bot</label>
                  <Select value={selectedBot} onValueChange={setSelectedBot}>
                    <SelectTrigger className="w-full bg-white border rounded">
                      <SelectValue placeholder="Select a bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {isBotsLoading ? (
                        <SelectItem value="loading" disabled>Loading bots...</SelectItem>
                      ) : !bots?.data || bots.data?.length === 0 ? (
                        <SelectItem value="no-bots" disabled>No bots available</SelectItem>
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
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <h3 className="font-medium">Bot Details</h3>
                    {getBotDetails.isLoading ? (
                      <div className="text-sm text-muted-foreground">Loading bot details...</div>
                    ) : getBotDetails.error ? (
                      <div className="text-sm text-red-500">Error loading bot details</div>
                    ) : selectedBotDetails ? (
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

                          {selectedBotDetails.schedule_expression && (
                            <>
                              <div className="text-muted-foreground">Schedule:</div>
                              <div>{selectedBotDetails.schedule_expression}</div>
                            </>
                          )}

                          <div className="text-muted-foreground">Created:</div>
                          <div>{format(new Date(selectedBotDetails.created_at), 'dd MMM yyyy HH:mm')}</div>

                          <div className="text-muted-foreground">Last Updated:</div>
                          <div>{format(new Date(selectedBotDetails.updated_at), 'dd MMM yyyy HH:mm')}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card className="border bg-white rounded-lg shadow-sm">
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer p-4"
              onClick={() => toggleSection('advancedSettings')}
            >
              <CardTitle className="text-base font-medium">Advanced Settings</CardTitle>
              {sections.advancedSettings ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>
            <div className={cn(
              "transition-all duration-200",
              sections.advancedSettings ? "block" : "hidden"
            )}>
              <CardContent className="p-4 pt-0">
                {/* Advanced Settings content here */}
              </CardContent>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              className="w-fit px-6 bg-[#4A1C24] text-white hover:bg-[#3A161C]"
              onClick={handleProceed}
              disabled={!selectedApi || !selectedBot}
            >
              Proceed
            </Button>
            <Button
              className="w-fit px-4 bg-[#D97706] text-white hover:bg-[#B45309]"
              onClick={() => console.log('Reset clicked')}
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
        <div className="w-full lg:w-[420px] flex-shrink-0 space-y-6">
          {pathName === "/indie-trend" && <IndyTrend />}
          {pathName === "/indy-utc" && <IndyUTC />}
          {pathName === "/growth-dca" && <GrowthDCA />}
          {pathName === "/indie-lesi" && <IndyLESI />}
          {pathName === "/price-action" && <PriceAction />}
          {pathName === "/human-grid" && <HumanGrid />}
          {pathName === "/smart-grid" && <SmartGrid />}
        </div>
      )}


    </div>
  );
}
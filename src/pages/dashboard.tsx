import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApiConnect } from "@/components/account/ApiConnect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  MessageSquare,
  RefreshCw,
  MoreVertical,
  Settings,
  Copy,
  Share2,
} from "lucide-react";
import { useState } from "react";

interface StrategyDataItem {
  id: number;
  broker: string;
  api: string;
  strategy: string;
  assetSymbol: string;
  quantity: number;
  direction: string;
  runTime: string;
  availableInvestment: number;
  frozenInvestment: number;
  unrealizedPL: number;
  netPL: number;
  netPLPercentage: number;
  tradesExecuted: number;
  status: "Active" | "Inactive";
  botName: string;
  botMode: string;
  botExecutionType: string;
}

interface ScannerData {
  name: string;
  dateTime: string;
  pairs: string;
  status: "Active" | "Closed";
}

interface SupportTicketData {
  number: string;
  createdOn: string;
  status: "Resolved" | "In Progress";
}

interface PlanData {
  name: string;
  duration: string;
  renewalDate: string;
}

export default function Dashboard() {
  const [openSections, setOpenSections] = useState({
    strategy: true,
    scanner: true,
    api: true,
    support: true,
    plan: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const strategiesPerPage = 4;
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);

  // Static data
  const userName = "User";
  const platformsAdded = 2;
  const strategiesActive = 3;
  const totalTradesExecuted = 45;
  const netPL = 1250.50;
  const netPLPercentage = 8.5;

  // Referral data
  const referralId = "12345TH";
  const referralLink = "https://referralLinknameIdnameStrategy.co";
  const verifiedReferrals = 238;
  const pendingReferrals = 23;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    // You can add a toast notification here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Referral Link',
        text: `Join using my referral ID: ${referralId}`,
        url: referralLink,
      });
    }
  };

  const strategyData: StrategyDataItem[] = [
    {
      id: 1,
      broker: "Binance",
      api: "REST API",
      strategy: "RSI < 30 AND MACD > 0",
      assetSymbol: "BTCUSDT",
      quantity: 0.5,
      direction: "Buy",
      runTime: "2 Hrs",
      availableInvestment: 5000,
      frozenInvestment: 2000,
      unrealizedPL: 350,
      netPL: 450,
      netPLPercentage: 9.0,
      tradesExecuted: 15,
      status: "Active",
      botName: "BTC Bot 1",
      botMode: "Live",
      botExecutionType: "Auto",
    },
    {
      id: 2,
      broker: "Binance",
      api: "REST API",
      strategy: "SMA 50 > SMA 200",
      assetSymbol: "ETHUSDT",
      quantity: 2,
      direction: "Buy",
      runTime: "4 Hrs",
      availableInvestment: 3000,
      frozenInvestment: 1500,
      unrealizedPL: 200,
      netPL: 300,
      netPLPercentage: 10.0,
      tradesExecuted: 20,
      status: "Active",
      botName: "ETH Bot 1",
      botMode: "Live",
      botExecutionType: "Auto",
    },
    {
      id: 3,
      broker: "Binance",
      api: "REST API",
      strategy: "Bollinger Bands Breakout",
      assetSymbol: "BNBUSDT",
      quantity: 5,
      direction: "Sell",
      runTime: "1 Hr",
      availableInvestment: 2000,
      frozenInvestment: 800,
      unrealizedPL: -50,
      netPL: 100,
      netPLPercentage: 5.0,
      tradesExecuted: 10,
      status: "Inactive",
      botName: "BNB Bot 1",
      botMode: "Paper",
      botExecutionType: "Manual",
    },
  ];

  const scanners: ScannerData[] = [];
  const supportTickets: SupportTicketData[] = [];

  const plan: PlanData = {
    name: "Gold Membership",
    duration: "24 Months",
    renewalDate: "12 July 2025",
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof openSections],
    }));
  };

  // Pagination
  const indexOfLastStrategy = currentPage * strategiesPerPage;
  const indexOfFirstStrategy = indexOfLastStrategy - strategiesPerPage;
  const currentStrategies = strategyData.slice(
    indexOfFirstStrategy,
    indexOfLastStrategy
  );
  const totalPages = Math.ceil(strategyData.length / strategiesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[#18181b] text-foreground dark:text-white w-full transition-colors duration-300">
      <main className="max-w-7xl mx-auto py-6 w-full px-4">
        {/* Summary Section */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* Left: Greeting + Summary Cards */}
          <div className="flex-1 max-w-[calc(100%-250px)]">
            <div className="bg-white dark:bg-[#232326] rounded-xl shadow p-4 flex flex-row items-center gap-6 h-[130px]">
              {/* Greeting */}
              <div className="flex flex-col justify-center items-start min-w-[140px] pr-2 mb-2">
                <span className="font-semibold text-[16px] leading-tight text-black dark:text-white">
                  Hi {userName},
                </span>
                <span className="text-[15px] text-black/80 dark:text-white/80">
                  here is your summary
                </span>
              </div>
              {/* Summary Cards */}
              <div className="flex flex-row gap-6 flex-1 justify-end">
                {/* Platforms Added */}
                <div className="flex flex-row items-center justify-between bg-[#FFE6EA] dark:bg-[#2d2326] rounded-lg min-w-[150px] w-[150px] min-h-[100px] h-[100px] px-4 py-3">
                  <span className="text-[15px] text-[#4A0D0D] dark:text-white text-left leading-tight">
                    Platforms
                    <br />
                    Added
                  </span>
                  <span className="text-[22px] font-bold text-[#2D0A0A] dark:text-white text-right leading-none">
                    {platformsAdded}
                  </span>
                </div>
                {/* Strategies Active */}
                <div className="flex flex-row items-center justify-between bg-[#FFE6EA] dark:bg-[#2d2326] rounded-lg min-w-[150px] w-[150px] min-h-[100px] h-[100px] px-4 py-3">
                  <span className="text-[15px] text-[#4A0D0D] dark:text-white text-left leading-tight">
                    Strategies
                    <br />
                    Active
                  </span>
                  <span className="text-[22px] font-bold text-[#2D0A0A] dark:text-white text-right leading-none">
                    {strategiesActive}
                  </span>
                </div>
                {/* Trades Executed */}
                <div className="flex flex-row items-center justify-between bg-[#FFE6EA] dark:bg-[#2d2326] rounded-lg min-w-[150px] w-[150px] min-h-[100px] h-[100px] px-4 py-2">
                  <span className="text-[15px] text-[#4A0D0D] dark:text-white text-left leading-tight">
                    Trades
                    <br />
                    Executed
                  </span>
                  <span className="text-[22px] font-bold text-[#2D0A0A] dark:text-white text-right leading-none">
                    {totalTradesExecuted}
                  </span>
                </div>
                {/* Net P/L */}
                <div className="flex flex-row items-center justify-between bg-[#FFE6EA] dark:bg-[#2d2326] rounded-lg min-w-[150px] w-[150px] min-h-[100px] h-[100px] px-4 py-3">
                  <span className="text-[15px] text-[#4A0D0D] dark:text-white text-left leading-tight">
                    Net
                    <br />
                    P/L
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[22px] font-bold text-green-600 dark:text-green-400 text-right leading-none">
                      ${netPL}
                    </span>
                    <span className="text-[14px] font-semibold text-green-600 dark:text-green-400 text-right leading-none">
                      +{netPLPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Referral Card */}
          <div className="flex flex-col w-full md:w-[450px] max-w-[500px] h-[130px]">
            <Card className="bg-gray-100 dark:bg-white border border-gray-200 dark:border-gray-700 h-full">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                {/* Header with Referral ID and Settings */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Referral ID:
                    </span>
                    <span className="text-base font-bold text-black dark:text-white">
                      {referralId}
                    </span>
                  </div>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Referral Link with Copy and Share */}
                <div className="flex items-center gap-2 mb-3">
                  <a
                    href={referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
                  >
                    {referralLink}
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    <span>Share on</span>
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Verified and Pending Referrals */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Verified Referrals:
                    </span>
                    <span className="font-bold text-black dark:text-white">
                      {verifiedReferrals}
                    </span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Pending Referrals:
                    </span>
                    <span className="font-bold text-black dark:text-white">
                      {pendingReferrals}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strategy Summary */}
        <Collapsible
          open={openSections.strategy}
          onOpenChange={() => toggleSection("strategy")}
          className="mt-6"
        >
          <Card className="border-0 dark:bg-[#232326]">
            <CardHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white rounded-t-lg transition-colors duration-300 dark:text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-medium">
                    Strategy Summary
                  </CardTitle>
                  <RefreshCw className="h-4 w-4" />
                </div>
                <CollapsibleTrigger>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-0 overflow-visible">
                <Table className="bg-card dark:bg-[#232326] text-foreground dark:text-white transition-colors duration-300 relative">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground dark:text-white">
                        Broker/Exchange
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Strategy Rule
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Asset
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Quantity
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Direction
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Bot
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Status
                      </TableHead>
                      <TableHead className="text-foreground dark:text-white">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="relative">
                    {currentStrategies.map((strategy, i) => (
                      <TableRow
                        key={strategy.id}
                        className="border-border dark:text-white"
                      >
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.broker}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.strategy}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.assetSymbol}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.quantity}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.direction}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          {strategy.botName}
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                strategy.status === "Active"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {strategy.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground dark:text-white relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setOpenMenuIndex(
                                openMenuIndex === i ? null : i
                              )
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {openMenuIndex === i && (
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                                Edit
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400">
                                Delete
                              </button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 flex items-center justify-between text-sm">
                  <div>
                    {indexOfFirstStrategy + 1}-
                    {Math.min(indexOfLastStrategy, strategyData.length)} of{" "}
                    {strategyData.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          className={
                            currentPage === page
                              ? "bg-[#4A0D0D] text-white"
                              : ""
                          }
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Smart Scanner Summary */}
          <div>
            <Collapsible
              open={openSections.scanner}
              onOpenChange={() => toggleSection("scanner")}
            >
              <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white transition-colors duration-300">
                <CardHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white rounded-t-lg transition-colors duration-300 dark:text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">
                        Smart Scanner Summary
                      </CardTitle>
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <CollapsibleTrigger>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scanner Name</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Pairs</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanners.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-4"
                            >
                              No data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          scanners.map((scanner, i) => (
                            <TableRow key={i}>
                              <TableCell>{scanner.name}</TableCell>
                              <TableCell>{scanner.dateTime}</TableCell>
                              <TableCell>{scanner.pairs}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2 w-2 rounded-full ${
                                      scanner.status === "Active"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  {scanner.status}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Plan Details */}
            <Collapsible
              open={openSections.plan}
              onOpenChange={() => toggleSection("plan")}
              className="mt-6"
            >
              <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white transition-colors duration-300">
                <CardHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white rounded-t-lg transition-colors duration-300 dark:text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">
                        Plan Details
                      </CardTitle>
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <CollapsibleTrigger>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">
                            Plan Name
                          </div>
                          <div className="font-medium">{plan.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-medium">{plan.duration}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            Next Renewal Date
                          </div>
                          <div className="font-medium">{plan.renewalDate}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button className="bg-[#4A0D0D] hover:bg-[#3A0808] text-white">
                          Upgrade
                        </Button>
                        <Button variant="outline">Renew</Button>
                        <Button
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          Gift Membership
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          <div className="space-y-6">
            {/* API Connect */}
            <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white transition-colors duration-300">
              <CardHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white rounded-t-lg transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    API Connect
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ApiConnect 
                  showModal={showApiModal}
                  setShowModal={setShowApiModal}
                />
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Collapsible
              open={openSections.support}
              onOpenChange={() => toggleSection("support")}
            >
              <Card className="bg-card dark:bg-[#232326] border border-border dark:border-gray-700 shadow-lg text-foreground dark:text-white transition-colors duration-300">
                <CardHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white rounded-t-lg transition-colors duration-300 dark:text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">
                        Support Tickets
                      </CardTitle>
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <CollapsibleTrigger>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket Number</TableHead>
                          <TableHead>Created On</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportTickets.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center py-4"
                            >
                              No data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          supportTickets.map((ticket, i) => (
                            <TableRow key={i}>
                              <TableCell>{ticket.number}</TableCell>
                              <TableCell>{ticket.createdOn}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    ticket.status === "Resolved"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {ticket.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <div className="p-4 text-center">
                      <Button variant="ghost" className="text-gray-500">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Give Feedback
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </main>
    </div>
  );
}
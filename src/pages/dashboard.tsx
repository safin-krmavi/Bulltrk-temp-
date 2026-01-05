import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ApiConnect } from "@/components/account/ApiConnect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown,
  MessageSquare,
  RefreshCw,
  MoreVertical,
  Settings,
  Copy,
  Share2,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useStrategyStore, Strategy } from "@/stores/strategystore";
import { toast } from "sonner";

// interface StrategyDataItem {
//   id: number;
//   broker: string;
//   api: string;
//   strategy: string;
//   assetSymbol: string;
//   quantity: number;
//   direction: string;
//   runTime: string;
//   availableInvestment: number;
//   frozenInvestment: number;
//   unrealizedPL: number;
//   netPL: number;
//   netPLPercentage: number;
//   tradesExecuted: number;
//   status: "Active" | "Inactive";
//   botName: string;
//   botMode: string;
//   botExecutionType: string;
// }

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
  
  // Edit Strategy Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Strategy>>({});

  // Get strategy store
  const { 
    strategies, 
    isLoading, 
    error,
    fetchStrategies,
    updateStrategyById,
    deleteStrategyById,
    clearError
  } = useStrategyStore();

  // Static data
  const userName = "User";
  const platformsAdded = 2;
  const strategiesActive = strategies.filter(s => s.status === 'ACTIVE').length;
  const totalTradesExecuted = 45;
  const netPL = 1250.50;
  const netPLPercentage = 8.5;

  // Referral data
  const referralId = "12345TH";
  const referralLink = "https://referralLinknameIdnameStrategy.co";
  const verifiedReferrals = 238;
  const pendingReferrals = 23;

  const scanners: ScannerData[] = [];
  const supportTickets: SupportTicketData[] = [];

  const plan: PlanData = {
    name: "Gold Membership",
    duration: "24 Months",
    renewalDate: "12 July 2025",
  };

  // Fetch strategies on component mount
  useEffect(() => {
    console.log("Dashboard mounted, fetching strategies...");
    fetchStrategies().catch(err => {
      console.error("Failed to load strategies:", err);
      toast.error("Failed to load strategies", {
        description: "Unable to fetch your strategies"
      });
    });
  }, []);

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Referral Link',
        text: `Join using my referral ID: ${referralId}`,
        url: referralLink,
      });
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof openSections],
    }));
  };

  // Open edit modal
  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setEditFormData({
      name: strategy.name,
      investmentPerRun: strategy.investmentPerRun,
      investmentCap: strategy.investmentCap,
      takeProfitPct: strategy.takeProfitPct,
      stopLossPct: strategy.stopLossPct,
      frequency: strategy.frequency,
      time: strategy.time,
      daysOfWeek: strategy.daysOfWeek,
      datesOfMonth: strategy.datesOfMonth,
      hourInterval: strategy.hourInterval,
    });
    setIsEditModalOpen(true);
    setOpenMenuIndex(null);
  };

  // Handle form field change
  const handleEditFormChange = (field: keyof Strategy, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save edited strategy
  const handleSaveStrategy = async () => {
    if (!editingStrategy) return;

    const toastId = toast.loading("Updating strategy...");

    try {
      await updateStrategyById(editingStrategy.id, editFormData);
      
      toast.success("Strategy updated successfully!", {
        id: toastId,
        description: `${editFormData.name || editingStrategy.name} has been updated`
      });
      
      setIsEditModalOpen(false);
      setEditingStrategy(null);
      setEditFormData({});
    } catch (error: any) {
      toast.error("Failed to update strategy", {
        id: toastId,
        description: error.message || "Please try again"
      });
    }
  };

  // Delete strategy
  const handleDeleteStrategy = async (strategy: Strategy) => {
    if (!confirm(`Are you sure you want to delete "${strategy.name}"?`)) {
      return;
    }

    const toastId = toast.loading("Deleting strategy...");
    setOpenMenuIndex(null);

    try {
      await deleteStrategyById(strategy.id);
      
      toast.success("Strategy deleted successfully!", {
        id: toastId,
        description: `${strategy.name} has been removed`
      });
    } catch (error: any) {
      toast.error("Failed to delete strategy", {
        id: toastId,
        description: error.message || "Please try again"
      });
    }
  };

  // Refresh strategies
  const handleRefreshStrategies = async () => {
    const toastId = toast.loading("Refreshing strategies...");
    
    try {
      await fetchStrategies();
      toast.success("Strategies refreshed!", { id: toastId });
    } catch (error) {
      toast.error("Failed to refresh", { id: toastId });
    }
  };

  // Pagination
  const indexOfLastStrategy = currentPage * strategiesPerPage;
  const indexOfFirstStrategy = indexOfLastStrategy - strategiesPerPage;
  const currentStrategies = strategies.slice(indexOfFirstStrategy, indexOfLastStrategy);
  const totalPages = Math.ceil(strategies.length / strategiesPerPage);

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
                  <button onClick={handleCopyLink} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Copy link">
                    <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-gray-400">|</span>
                  <button onClick={handleShare} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
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
                  <button 
                    onClick={handleRefreshStrategies}
                    disabled={isLoading}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <CollapsibleTrigger>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-0 overflow-visible">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : strategies.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No strategies found</p>
                    <p className="text-sm mt-2">Create your first strategy to get started</p>
                  </div>
                ) : (
                  <>
                    <Table className="bg-card dark:bg-[#232326] text-foreground dark:text-white transition-colors duration-300 relative">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-foreground dark:text-white">Exchange</TableHead>
                          <TableHead className="text-foreground dark:text-white">Strategy</TableHead>
                          <TableHead className="text-foreground dark:text-white">Symbol</TableHead>
                          <TableHead className="text-foreground dark:text-white">Frequency</TableHead>
                          <TableHead className="text-foreground dark:text-white">Investment/Run</TableHead>
                          <TableHead className="text-foreground dark:text-white">Status</TableHead>
                          <TableHead className="text-foreground dark:text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="relative">
                        {currentStrategies.map((strategy, i) => (
                          <TableRow key={strategy.id} className="border-border dark:text-white">
                            <TableCell className="text-foreground dark:text-white">
                              {strategy.exchange}
                            </TableCell>
                            <TableCell className="text-foreground dark:text-white">
                              <div>
                                <div className="font-medium">{strategy.name}</div>
                                <div className="text-xs text-gray-500">{strategy.strategyType}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground dark:text-white">
                              {strategy.symbol}
                            </TableCell>
                            <TableCell className="text-foreground dark:text-white">
                              <div>
                                <div>{strategy.frequency}</div>
                                {strategy.time && (
                                  <div className="text-xs text-gray-500">{strategy.time}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground dark:text-white">
                              ${strategy.investmentPerRun}
                            </TableCell>
                            <TableCell className="text-foreground dark:text-white">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    strategy.status === "ACTIVE"
                                      ? "bg-green-500"
                                      : strategy.status === "PAUSED"
                                      ? "bg-yellow-500"
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
                                onClick={() => setOpenMenuIndex(openMenuIndex === i ? null : i)}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                              {openMenuIndex === i && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                                  <button
                                    onClick={() => handleEditStrategy(strategy)}
                                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStrategy(strategy)}
                                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                        {indexOfFirstStrategy + 1}-{Math.min(indexOfLastStrategy, strategies.length)} of{" "}
                        {strategies.length} entries
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant="outline"
                            size="sm"
                            className={currentPage === page ? "bg-[#4A0D0D] text-white" : ""}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ))}
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
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Edit Strategy Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#232326]">
            <DialogHeader>
              <DialogTitle>Edit Strategy</DialogTitle>
            </DialogHeader>
            {editingStrategy && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Strategy Name</Label>
                  <Input
                    value={editFormData.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="Enter strategy name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Investment Per Run</Label>
                    <Input
                      type="number"
                      value={editFormData.investmentPerRun || ''}
                      onChange={(e) => handleEditFormChange('investmentPerRun', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Investment Cap</Label>
                    <Input
                      type="number"
                      value={editFormData.investmentCap || ''}
                      onChange={(e) => handleEditFormChange('investmentCap', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Take Profit %</Label>
                    <Input
                      type="number"
                      value={editFormData.takeProfitPct || ''}
                      onChange={(e) => handleEditFormChange('takeProfitPct', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss %</Label>
                    <Input
                      type="number"
                      value={editFormData.stopLossPct || ''}
                      onChange={(e) => handleEditFormChange('stopLossPct', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={editFormData.frequency}
                    onValueChange={(value) => handleEditFormChange('frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editFormData.frequency !== 'HOURLY' && (
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={editFormData.time || ''}
                      onChange={(e) => handleEditFormChange('time', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#4A0D0D] hover:bg-[#3A0808]"
                onClick={handleSaveStrategy}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
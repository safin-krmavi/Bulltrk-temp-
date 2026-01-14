// 'use client'

// import * as React from "react"
// import { ChevronDown } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// // import { cn } from "@/lib/utils"
// import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
// import { useEffect } from "react"
// import { brokerageService } from "@/api/brokerage"

// // import { BrokerageConnection, brokerageService } from "@/api/brokerage"

// export default function HumanGrid() {
//   const [isOpen, setIsOpen] = React.useState(true)
//   const [selectedApi, setSelectedApi] = React.useState("");
//   const [isBrokeragesLoading, setIsBrokeragesLoading] = React.useState(false);
//   const [brokerages, setBrokerages] = React.useState([]);

//   // Form state
//   const [strategyName, setStrategyName] = React.useState("");
//   const [investment, setInvestment] = React.useState("");
//   const [investmentCap, setInvestmentCap] = React.useState("");
//   const [lowerLimit, setLowerLimit] = React.useState("");
//   const [upperLimit, setUpperLimit] = React.useState("");
//   const [leverage, setLeverage] = React.useState("");
//   const [direction, setDirection] = React.useState("Long");
//   const [entryInterval, setEntryInterval] = React.useState("");
//   const [bookProfitBy, setBookProfitBy] = React.useState("");
//   const [stopLossBy, setStopLossBy] = React.useState("");
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState("");
//   const [success, setSuccess] = React.useState("");

//   useEffect(() => {
//     async function fetchBrokerages() {
//       setIsBrokeragesLoading(true);
//       try {
//         const res = await brokerageService.getBrokerageDetails();
//         setBrokerages(res.data.data || []);
//       } catch {
//         setBrokerages([]);
//       } finally {
//         setIsBrokeragesLoading(false);
//       }
//     }
//     fetchBrokerages();
//   }, []);

//   // API call handler
//   const handleProceed = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!selectedApi || !strategyName || !investment || !investmentCap || !lowerLimit || !upperLimit || !leverage || !direction || !entryInterval || !bookProfitBy || !stopLossBy) {
//       setError("Please fill all required fields.");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Robust token retrieval: try all common keys, prioritize AUTH_TOKEN
//       let accessToken = localStorage.getItem("AUTH_TOKEN") || localStorage.getItem("access_token") || localStorage.getItem("token");
//       if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
//         setError("You are not logged in or token is missing. Please log in again.");
//         setLoading(false);
//         return;
//       }
//       accessToken = accessToken.trim();
//       const apiUrl = "https://newterminals.apimachine.com/api/v1/human-grid/create";
//       const headers: Record<string, string> = {
//         "Authorization": `Bearer ${accessToken}`,
//         "Accept": "application/json",
//         "Content-Type": "application/json"
//       };
//       const body = {
//         strategy_name: strategyName,
//         api_connection_id: Number(selectedApi),
//         segment: "Delivery/Spot/Cash",
//         pair: "BTCUSDT",
//         investment: Number(investment),
//         investment_cap: Number(investmentCap),
//         lower_limit: Number(lowerLimit),
//         upper_limit: Number(upperLimit),
//         leverage: Number(leverage),
//         direction,
//         entry_interval: Number(entryInterval),
//         book_profit_by: Number(bookProfitBy),
//         stop_loss_by: Number(stopLossBy)
//       };
//       // Debug log for headers and body
//       console.log("[HumanGrid] API URL:", apiUrl);
//       console.log("[HumanGrid] Headers:", headers);
//       console.log("[HumanGrid] Body:", body);
//       const res = await fetch(apiUrl, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body)
//       });
//       console.log("[HumanGrid] Response status:", res.status);
//       if (!res.ok) {
//         let errMsg = "Failed to create Human Grid strategy.";
//         try {
//           const err = await res.json();
//           errMsg = err.message || errMsg;
//         } catch {}
//         throw new Error(errMsg);
//       }
//       setSuccess("Human Grid strategy created successfully.");
//     } catch (err: any) {
//       setError(err.message || "Something went wrong.");
//       if ((err.message || "").toLowerCase().includes("not logged in") || (err.message || "").toLowerCase().includes("unauthenticated")) {
//         console.error("[HumanGrid] Auth error. Please check if the AUTH_TOKEN in localStorage is valid and not expired.");
//         console.log("[HumanGrid] To debug, open DevTools > Application > Local Storage and check the value of AUTH_TOKEN.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setStrategyName("");
//     setInvestment("");
//     setInvestmentCap("");
//     setLowerLimit("");
//     setUpperLimit("");
//     setLeverage("");
//     setDirection("Long");
//     setEntryInterval("");
//     setBookProfitBy("");
//     setStopLossBy("");
//     setError("");
//     setSuccess("");
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <AccountDetailsCard
//         selectedApi={selectedApi}
//         setSelectedApi={setSelectedApi}
//         isBrokeragesLoading={isBrokeragesLoading}
//         brokerages={brokerages}
//       />
//       <AccountDetailsCard
//         selectedApi={selectedApi}
//         setSelectedApi={setSelectedApi}
//         isBrokeragesLoading={isBrokeragesLoading}
//         brokerages={brokerages}
//       />
//       <form className="space-y-4 mt-4 dark:text-white">
//         {error && <div className="text-red-500 text-sm">{error}</div>}
//         {success && <div className="text-green-500 text-sm">{success}</div>}
//         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//           <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
//             <span>Human Grid</span>
//             <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
//           </CollapsibleTrigger>
//           <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Strategy Name
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <Input placeholder="Enter Name" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Investment
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <div className="flex gap-2">
//                 <Input placeholder="Value" value={investment} onChange={e => setInvestment(e.target.value)} />
//                 <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//               </div>
//               <p className="text-sm text-orange-500">Avbl: 389 USTD</p>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Investment CAP
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <div className="flex gap-2">
//                 <Input placeholder="Value" value={investmentCap} onChange={e => setInvestmentCap(e.target.value)} />
//                 <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Lower Limit</Label>
//                 <div className="flex gap-2">
//                   <Input placeholder="Value" value={lowerLimit} onChange={e => setLowerLimit(e.target.value)} />
//                   <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label>Upper Limit</Label>
//                 <div className="flex gap-2">
//                   <Input placeholder="Value" value={upperLimit} onChange={e => setUpperLimit(e.target.value)} />
//                   <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Leverage</Label>
//                 <Input placeholder="Value" value={leverage} onChange={e => setLeverage(e.target.value)} />
//               </div>
//               <div className="space-y-2">
//                 <Label>Direction</Label>
//                 <Select value={direction} onValueChange={setDirection}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Long">Long</SelectItem>
//                     <SelectItem value="Short">Short</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Entry Interval
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <div className="relative">
//                 <Input placeholder="Value" value={entryInterval} onChange={e => setEntryInterval(e.target.value)} />
//                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Pts</span>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Book Profit By
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <Input placeholder="Value" value={bookProfitBy} onChange={e => setBookProfitBy(e.target.value)} />
//             </div>

//             <div className="space-y-2">
//               <Label>Stop Loss By</Label>
//               <div className="relative">
//                 <Input placeholder="Value" value={stopLossBy} onChange={e => setStopLossBy(e.target.value)} />
//                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
//               </div>
//             </div>
//           </CollapsibleContent>
//         </Collapsible>

//         {error && <div className="text-red-500 text-sm">{error}</div>}
//         {success && <div className="text-green-500 text-sm">{success}</div>}

//         <div className="flex gap-4">
//           <Button className="flex-1 bg-[#4A1515] hover:bg-[#5A2525]" onClick={handleProceed} disabled={!selectedApi || loading}>{loading ? "Processing..." : "Proceed"}</Button>
//           <Button variant="outline" className="flex-1 bg-[#D97706] text-white hover:bg-[#B45309]" type="button" onClick={handleReset}>
//             Reset
//           </Button>
//         </div>
//       </form>
//     </div>
//   )
// }


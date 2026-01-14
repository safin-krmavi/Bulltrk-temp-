// 'use client'

// import * as React from "react"
// import { ChevronDown } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useEffect } from "react"
// import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
// import { brokerageService } from "@/api/brokerage"

// export default function SmartGrid() {
//   const [isOpen, setIsOpen] = React.useState(true)
//   const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
//   const [selectedApi, setSelectedApi] = React.useState("")
//   const [isBrokeragesLoading, setIsBrokeragesLoading] = React.useState(false)
//   const [brokerages, setBrokerages] = React.useState([])

//   // Form state
//   const [strategyName, setStrategyName] = React.useState("");
//   const [type, setType] = React.useState("Neutral");
//   const [dataSet, setDataSet] = React.useState("7D");
//   const [lowerLimit, setLowerLimit] = React.useState("");
//   const [upperLimit, setUpperLimit] = React.useState("");
//   const [levels, setLevels] = React.useState("");
//   const [profitBuy, setProfitBuy] = React.useState("");
//   const [profitSell, setProfitSell] = React.useState("");
//   const [investment, setInvestment] = React.useState("");
//   const [minimumInvestment, setMinimumInvestment] = React.useState("");
//   const [stopGridLoss, setStopGridLoss] = React.useState("");
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState("");
//   const [success, setSuccess] = React.useState("");

//   useEffect(() => {
//     async function fetchBrokerages() {
//       setIsBrokeragesLoading(true)
//       try {
//         const res = await brokerageService.getBrokerageDetails()
//         setBrokerages(res.data.data || [])
//       } catch {
//         setBrokerages([])
//       } finally {
//         setIsBrokeragesLoading(false)
//       }
//     }
//     fetchBrokerages()
//   }, [])

//   // Handlers for type and dataSet buttons
//   const handleTypeSelect = (val: string) => setType(val);
//   const handleDataSetSelect = (val: string) => setDataSet(val);

//   // API call handler
//   const handleProceed = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!strategyName || !selectedApi || !lowerLimit || !upperLimit || !levels || !profitBuy || !profitSell || !investment || !minimumInvestment || !stopGridLoss) {
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
//       const baseUrl = import.meta.env.VITE_API_URL || "";
//       if (!baseUrl) {
//         setError("API base URL is not set. Please check your environment variables.");
//         setLoading(false);
//         return;
//       }
//       console.log("[SmartGrid] API URL:", baseUrl + "/smart-grid/create");
//       console.log("[SmartGrid] Access token:", accessToken);
//       const body = {
//         strategy_name: strategyName,
//         api_connection_id: Number(selectedApi),
//         segment: "Delivery/Spot/Cash",
//         pair: "BTCUSDT",
//         type,
//         data_set: dataSet,
//         lower_limit: Number(lowerLimit),
//         upper_limit: Number(upperLimit),
//         levels: Number(levels),
//         profit_per_level: {
//           buy: Number(profitBuy),
//           sell: Number(profitSell)
//         },
//         investment: Number(investment),
//         minimum_investment: Number(minimumInvestment),
//         stop_grid_loss: Number(stopGridLoss)
//       };
//       const res = await fetch(`${baseUrl}/smart-grid/create`, {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${accessToken}`,
//           "Accept": "application/json",
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(body)
//       });
//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.message || "Failed to create Smart Grid strategy.");
//       }
//       setSuccess("Smart Grid strategy created successfully.");
//     } catch (err: any) {
//       setError(err.message || "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setStrategyName("");
//     setType("Neutral");
//     setDataSet("7D");
//     setLowerLimit("");
//     setUpperLimit("");
//     setLevels("");
//     setProfitBuy("");
//     setProfitSell("");
//     setInvestment("");
//     setMinimumInvestment("");
//     setStopGridLoss("");
//     setError("");
//     setSuccess("");
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       {/* <AccountDetailsCard
//         selectedApi={selectedApi}
//         setSelectedApi={setSelectedApi}
//         isBrokeragesLoading={isBrokeragesLoading}
//         brokerages={brokerages}
//       /> */}
//       <form className="space-y-4 mt-4 dark:text-white">
//         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//           <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 border border-t-0 font-medium text-white hover:bg-[#5A2525]">
//             <span>Smart Grid</span>
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
//               <Label>Select Type</Label>
//               <div className="grid grid-cols-3 gap-2">
//                 {['Neutral', 'Long', 'Short'].map(val => (
//                   <Button key={val} variant={type === val ? "default" : "outline"} type="button" onClick={() => handleTypeSelect(val)}>{val}</Button>
//                 ))}
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Data Set
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <div className="grid grid-cols-5 gap-2">
//                 {['3D', '7D', '30D', '180D', '365D'].map(val => (
//                   <Button key={val} variant={dataSet === val ? "default" : "outline"} size="sm" type="button" onClick={() => handleDataSetSelect(val)}>{val}</Button>
//                 ))}
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label className="flex items-center gap-2">
//                   Lower Limit
//                   <span className="text-muted-foreground">ⓘ</span>
//                 </Label>
//                 <div className="flex gap-2">
//                   <Input placeholder="Value" value={lowerLimit} onChange={e => setLowerLimit(e.target.value)} />
//                   <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label className="flex items-center gap-2">
//                   Upper Limit
//                   <span className="text-muted-foreground">ⓘ</span>
//                 </Label>
//                 <div className="flex gap-2">
//                   <Input placeholder="Value" value={upperLimit} onChange={e => setUpperLimit(e.target.value)} />
//                   <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Levels</Label>
//               <Input placeholder="Value" value={levels} onChange={e => setLevels(e.target.value)} />
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Profit per Level
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="relative">
//                   <Input placeholder="Buy %" value={profitBuy} onChange={e => setProfitBuy(e.target.value)} />
//                   <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
//                 </div>
//                 <div className="relative">
//                   <Input placeholder="Sell %" value={profitSell} onChange={e => setProfitSell(e.target.value)} />
//                   <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
//                 </div>
//               </div>
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
//             </div>

//             <div className="space-y-2">
//               <Label>Minimum Investment</Label>
//               <Input placeholder="Value" value={minimumInvestment} onChange={e => setMinimumInvestment(e.target.value)} />
//             </div>
//           </CollapsibleContent>
//         </Collapsible>

//         <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
//           <CollapsibleTrigger className="flex w-full items-center justify-between border border-t-0 rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
//             <span>Advanced Settings</span>
//             <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
//           </CollapsibleTrigger>
//           <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
//             <div className="space-y-2">
//               <Label>Stop Grid Loss</Label>
//               <div className="flex gap-2">
//                 <Input placeholder="Numeric Value" value={stopGridLoss} onChange={e => setStopGridLoss(e.target.value)} />
//                 <Select defaultValue="point-9" disabled>
//                   <SelectTrigger className="w-[120px]">
//                     <SelectValue placeholder="Point 9" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="point-9">Point 9</SelectItem>
//                     <SelectItem value="point-8">Point 8</SelectItem>
//                     <SelectItem value="point-7">Point 7</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </CollapsibleContent>
//         </Collapsible>

//         {error && <div className="text-red-500 text-sm">{error}</div>}
//         {success && <div className="text-green-500 text-sm">{success}</div>}

//         <div className="flex gap-4">
//           <Button className="flex-1 bg-[#4A1515] hover:bg-[#5A2525]" onClick={handleProceed} disabled={loading}>{loading ? "Processing..." : "Proceed"}</Button>
//           <Button variant="outline" className="flex-1 bg-[#D97706] text-white hover:bg-[#B45309]" type="button" onClick={handleReset}>
//             Reset
//           </Button>
//         </div>
//       </form>
//     </div>
//   )
// }


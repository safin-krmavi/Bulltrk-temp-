// 'use client'

// import * as React from "react"
// import { ChevronDown } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// // import { cn } from "@/lib/utils"
// import { useEffect } from "react"
// import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
// import { brokerageService } from "@/api/brokerage"

// export default function IndyLESI() {
//   const [isOpen, setIsOpen] = React.useState(true)
//   const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
//   const [selectedApi, setSelectedApi] = React.useState("")
//   const [isBrokeragesLoading, setIsBrokeragesLoading] = React.useState(false)
//   const [brokerages, setBrokerages] = React.useState([])

//   // Form state
//   const [strategyName, setStrategyName] = React.useState("");
//   const [investment, setInvestment] = React.useState("");
//   const [investmentCap, setInvestmentCap] = React.useState("");
//   const [timeFrame, setTimeFrame] = React.useState("5m");
//   const [leverage, setLeverage] = React.useState("");
//   const [lowerLimit, setLowerLimit] = React.useState("");
//   const [upperLimit, setUpperLimit] = React.useState("");
//   const [priceTriggerStart, setPriceTriggerStart] = React.useState("");
//   const [priceTriggerStop, setPriceTriggerStop] = React.useState("");
//   const [stopLossBy, setStopLossBy] = React.useState("");
//   // LESI indicator/settings
//   const [lesiIndicator, setLesiIndicator] = React.useState("lorentzian");
//   const [lookbackPeriod, setLookbackPeriod] = React.useState("75");
//   const [signalThreshold, setSignalThreshold] = React.useState("0.8");
//   const [noiseReduction, setNoiseReduction] = React.useState(true);
//   const [adaptiveThreshold, setAdaptiveThreshold] = React.useState(true);
//   // Feedback
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

//   // API call handler
//   const handleProceed = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!selectedApi || !strategyName || !investment || !investmentCap || !timeFrame || !leverage || !lowerLimit || !upperLimit || !priceTriggerStart || !priceTriggerStop || !stopLossBy) {
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
//       console.log("[IndyLESI] API URL:", baseUrl + "/strategies");
//       console.log("[IndyLESI] Access token:", accessToken);
//       const body = {
//         strategy_name: strategyName,
//         strategy_type: "indy_lesi",
//         api_connection_id: Number(selectedApi),
//         segment: "spot",
//         pair: "BTCUSDT",
//         investment: Number(investment),
//         investment_cap: Number(investmentCap),
//         time_frame: timeFrame,
//         leverage: Number(leverage),
//         lower_limit: Number(lowerLimit),
//         upper_limit: Number(upperLimit),
//         price_trigger_start: Number(priceTriggerStart),
//         price_trigger_stop: Number(priceTriggerStop),
//         stop_loss_by: Number(stopLossBy),
//         lesi_indicator: lesiIndicator,
//         lesi_settings: {
//           lookback_period: Number(lookbackPeriod),
//           signal_threshold: Number(signalThreshold),
//           noise_reduction: noiseReduction,
//           adaptive_threshold: adaptiveThreshold
//         }
//       };
//       const res = await fetch(`${baseUrl}/strategies`, {
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
//         throw new Error(err.message || "Failed to create Indy LESI strategy.");
//       }
//       setSuccess("Indy LESI strategy created successfully.");
//     } catch (err: any) {
//       setError(err.message || "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setStrategyName("");
//     setInvestment("");
//     setInvestmentCap("");
//     setTimeFrame("5m");
//     setLeverage("");
//     setLowerLimit("");
//     setUpperLimit("");
//     setPriceTriggerStart("");
//     setPriceTriggerStop("");
//     setStopLossBy("");
//     setLesiIndicator("lorentzian");
//     setLookbackPeriod("75");
//     setSignalThreshold("0.8");
//     setNoiseReduction(true);
//     setAdaptiveThreshold(true);
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
//       <form className="space-y-4 mt-4 dark:text-white ">
//         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//           <CollapsibleTrigger className="flex w-full items-center  border border-t-0 justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
//             <span>Indy LESI</span>
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
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 Time Frame
//                 <span className="text-muted-foreground">ⓘ</span>
//               </Label>
//               <Select value={timeFrame} onValueChange={setTimeFrame}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="5m">5 Minutes</SelectItem>
//                   <SelectItem value="15m">15 Minutes</SelectItem>
//                   <SelectItem value="1h">1 Hour</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Leverage</Label>
//               <Input placeholder="Value" value={leverage} onChange={e => setLeverage(e.target.value)} />
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
//             <div className="space-y-2">
//               <Label>Price Trigger Start</Label>
//               <div className="flex gap-2">
//                 <Input placeholder="Value" value={priceTriggerStart} onChange={e => setPriceTriggerStart(e.target.value)} />
//                 <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label>Price Trigger Stop</Label>
//               <div className="flex gap-2">
//                 <Input placeholder="Value" value={priceTriggerStop} onChange={e => setPriceTriggerStop(e.target.value)} />
//                 <div className="w-[100px] rounded-md border px-3 py-2">USTD</div>
//               </div>
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
//         <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
//           <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525] border border-t-0">
//             <span>Advanced Settings</span>
//             <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
//           </CollapsibleTrigger>
//           <CollapsibleContent className="space-y-6 rounded-b-md border border-t-0 p-4">
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <Checkbox id="lorentzian" checked={lesiIndicator === "lorentzian"} onCheckedChange={() => setLesiIndicator("lorentzian")} />
//                 <Label htmlFor="lorentzian">Lorentzian</Label>
//               </div>
//               <div className="space-y-2">
//                 <Label>Lookback Period</Label>
//                 <Input value={lookbackPeriod} onChange={e => setLookbackPeriod(e.target.value)} />
//               </div>
//               <div className="space-y-2">
//                 <Label>Signal Threshold</Label>
//                 <Input value={signalThreshold} onChange={e => setSignalThreshold(e.target.value)} />
//               </div>
//               <div className="space-y-2">
//                 <Label>Noise Reduction</Label>
//                 <Select value={noiseReduction ? "yes" : "no"} onValueChange={val => setNoiseReduction(val === "yes") }>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="yes">Yes</SelectItem>
//                     <SelectItem value="no">No</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label>Adaptive Threshold</Label>
//                 <Select value={adaptiveThreshold ? "yes" : "no"} onValueChange={val => setAdaptiveThreshold(val === "yes") }>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="yes">Yes</SelectItem>
//                     <SelectItem value="no">No</SelectItem>
//                   </SelectContent>
//                 </Select>
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


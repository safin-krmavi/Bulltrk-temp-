// 'use client'

// import * as React from "react"
// import { ChevronDown } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// import { Checkbox } from "@/components/ui/checkbox"
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// // import { cn } from "@/lib/utils"
// import { AccountDetailsCard } from "@/components/trade/AccountDetailsCard"
// import { useEffect } from "react"

// import { brokerageService } from "@/api/brokerage"

// export default function IndyTrend() {
//   const [isIndyOpen, setIsIndyOpen] = React.useState(true)
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
//   // Indicators
//   const [indicators, setIndicators] = React.useState<string[]>([]);
//   // Trend settings
//   const [signalStrength, setSignalStrength] = React.useState("medium");
//   const [confirmationRequired, setConfirmationRequired] = React.useState(true);
//   const [minSignalsForBuy, setMinSignalsForBuy] = React.useState("2");
//   const [minSignalsForSell, setMinSignalsForSell] = React.useState("1");
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

//   // Indicator checkbox handler
//   const handleIndicatorChange = (indicator: string) => {
//     setIndicators(prev => prev.includes(indicator) ? prev.filter(i => i !== indicator) : [...prev, indicator]);
//   };

//   // API call handler
//   const handleProceed = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!selectedApi || !strategyName || !investment || !investmentCap || !leverage || !lowerLimit || !upperLimit || !priceTriggerStart || !priceTriggerStop || !stopLossBy) {
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
//       console.log("[IndyTrend] API URL:", baseUrl + "/strategies");
//       console.log("[IndyTrend] Access token:", accessToken);
//       const body = {
//         strategy_name: strategyName,
//         strategy_type: "indy_trend",
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
//         indicators,
//         trend_settings: {
//           signal_strength: signalStrength,
//           confirmation_required: confirmationRequired,
//           min_signals_for_buy: Number(minSignalsForBuy),
//           min_signals_for_sell: Number(minSignalsForSell)
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
//         throw new Error(err.message || "Failed to create Indy Trend strategy.");
//       }
//       setSuccess("Indy Trend strategy created successfully.");
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
//     setIndicators([]);
//     setSignalStrength("medium");
//     setConfirmationRequired(true);
//     setMinSignalsForBuy("2");
//     setMinSignalsForSell("1");
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
//       <form className="space-y-4 mt-4 dark:text-white">
//         <Collapsible
//           open={isIndyOpen}
//           onOpenChange={setIsIndyOpen}
//           className="space-y-2"
//         >
//           <CollapsibleTrigger className="flex w-full items-center justify-between border border-t-0 rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
//             <span>Indy Trend</span>
//             <ChevronDown className={`h-4 w-4 transition-transform ${isIndyOpen ? "rotate-180" : ""}`} />
//           </CollapsibleTrigger>
//           <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
//             <div className="space-y-2">
//               <Label htmlFor="strategy">Strategy Name</Label>
//               <Input id="strategy" placeholder="Enter Name" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="investment">Investment</Label>
//               <div className="relative">
//                 <Input id="investment" placeholder="Value" value={investment} onChange={e => setInvestment(e.target.value)} />
//                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">USTD</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="investment-cap">Investment CAP</Label>
//               <div className="relative">
//                 <Input id="investment-cap" placeholder="Value" value={investmentCap} onChange={e => setInvestmentCap(e.target.value)} />
//                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">USTD</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label>Time Frame</Label>
//               <Input placeholder="5m" value={timeFrame} onChange={e => setTimeFrame(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Leverage</Label>
//               <Input placeholder="Value" value={leverage} onChange={e => setLeverage(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Lower Limit</Label>
//               <Input placeholder="Value" value={lowerLimit} onChange={e => setLowerLimit(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Upper Limit</Label>
//               <Input placeholder="Value" value={upperLimit} onChange={e => setUpperLimit(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Price Trigger Start</Label>
//               <Input placeholder="Value" value={priceTriggerStart} onChange={e => setPriceTriggerStart(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Price Trigger Stop</Label>
//               <Input placeholder="Value" value={priceTriggerStop} onChange={e => setPriceTriggerStop(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="stop-loss">Stop Loss By</Label>
//               <div className="relative">
//                 <Input id="stop-loss" placeholder="Value" value={stopLossBy} onChange={e => setStopLossBy(e.target.value)} />
//                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">USTD</span>
//               </div>
//             </div>
//           </CollapsibleContent>
//         </Collapsible>
//         <Collapsible
//           open={isAdvancedOpen}
//           onOpenChange={setIsAdvancedOpen}
//           className="space-y-2"
//         >
//           <CollapsibleTrigger className="flex w-full items-center justify-between border border-t-0 rounded-t-md bg-[#4A1515] p-4 font-medium text-white hover:bg-[#5A2525]">
//             <span>Advanced Settings</span>
//             <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
//           </CollapsibleTrigger>
//           <CollapsibleContent className="space-y-4 rounded-b-md border border-t-0 p-4">
//             <div className="flex items-center space-x-2">
//               <Checkbox id="supertread" checked={indicators.includes('supertread')} onCheckedChange={() => handleIndicatorChange('supertread')} />
//               <Label htmlFor="supertread">Supertread</Label>
//             </div>
//             <div className="grid grid-cols-3 gap-4">
//               {['Neutral', 'Long', 'Short'].map(val => (
//                 <Button key={val} variant={signalStrength === val.toLowerCase() ? "default" : "outline"} size="sm" type="button" onClick={() => setSignalStrength(val.toLowerCase())}>{val}</Button>
//               ))}
//             </div>
//             {['rsi', 'macd', 'ema', 'adx'].map((item, index) => (
//               <div key={index} className="space-y-4">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox id={item} checked={indicators.includes(item)} onCheckedChange={() => handleIndicatorChange(item)} />
//                   <Label htmlFor={item}>{item.toUpperCase()}</Label>
//                 </div>
//               </div>
//             ))}
//             <div className="space-y-2">
//               <Label>Confirmation Required</Label>
//               <Select value={confirmationRequired ? "yes" : "no"} onValueChange={val => setConfirmationRequired(val === "yes") }>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="yes">Yes</SelectItem>
//                   <SelectItem value="no">No</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Min Signals for Buy</Label>
//               <Input placeholder="2" value={minSignalsForBuy} onChange={e => setMinSignalsForBuy(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Min Signals for Sell</Label>
//               <Input placeholder="1" value={minSignalsForSell} onChange={e => setMinSignalsForSell(e.target.value)} />
//             </div>
//           </CollapsibleContent>
//         </Collapsible>
//         {error && <div className="text-red-500 text-sm">{error}</div>}
//         {success && <div className="text-green-500 text-sm">{success}</div>}
//         <div className="flex gap-4">
//           <Button className="flex-1 bg-[#4A1515] text-white hover:bg-[#5A2525]" onClick={handleProceed} disabled={!selectedApi || loading}>{loading ? "Processing..." : "Proceed"}</Button>
//           <Button variant="outline" className="flex-1" type="button" onClick={handleReset}>Reset</Button>
//         </div>
//       </form>
//     </div>
//   )
// }


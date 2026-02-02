// import React from 'react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useChartStore } from '@/stores/chartStore';

// const EXCHANGES = [
//   { value: 'BINANCE', label: 'Binance' },
//   { value: 'KUCOIN', label: 'KuCoin' },
// ];

// const INTERVALS = [
//   { value: '1m', label: '1 Minute' },
//   { value: '5m', label: '5 Minutes' },
//   { value: '15m', label: '15 Minutes' },
//   { value: '30m', label: '30 Minutes' },
//   { value: '1h', label: '1 Hour' },
//   { value: '4h', label: '4 Hours' },
//   { value: '1d', label: '1 Day' },
//   { value: '1w', label: '1 Week' },
// ];

// interface ChartControlsProps {
//   onExchangeChange?: (exchange: string) => void;
//   onSymbolChange?: (symbol: string) => void;
//   onIntervalChange?: (interval: string) => void;
// }

// export const ChartControls: React.FC<ChartControlsProps> = ({
//   onExchangeChange,
//   onSymbolChange,
//   onIntervalChange,
// }) => {
//   const { exchange, symbol, interval, setExchange, setSymbol, setInterval, fetchCandles } = useChartStore();

//   const handleExchangeChange = (value: string) => {
//     setExchange(value);
//     fetchCandles(value, symbol, interval);
//     onExchangeChange?.(value);
//   };

//   const handleSymbolChange = (value: string) => {
//     setSymbol(value);
//     fetchCandles(exchange, value, interval);
//     onSymbolChange?.(value);
//   };

//   const handleIntervalChange = (value: string) => {
//     setInterval(value);
//     fetchCandles(exchange, symbol, value);
//     onIntervalChange?.(value);
//   };

//   return (
//     <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white dark:bg-[#232326] rounded-lg border border-gray-200 dark:border-gray-700">
//       {/* Exchange Selector */}
//       <div className="flex-1 min-w-[150px]">
//         <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Exchange</label>
//         <Select value={exchange} onValueChange={handleExchangeChange}>
//           <SelectTrigger className="h-9">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {EXCHANGES.map((ex) => (
//               <SelectItem key={ex.value} value={ex.value}>
//                 {ex.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Symbol Input */}
//       <div className="flex-1 min-w-[150px]">
//         <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Symbol</label>
//         <input
//           type="text"
//           value={symbol}
//           onChange={(e) => handleSymbolChange(e.target.value.toUpperCase())}
//           placeholder="BTCUSDT"
//           className="h-9 w-full px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1d] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
//         />
//       </div>

//       {/* Interval Selector */}
//       <div className="flex-1 min-w-[150px]">
//         <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Interval</label>
//         <Select value={interval} onValueChange={handleIntervalChange}>
//           <SelectTrigger className="h-9">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {INTERVALS.map((int) => (
//               <SelectItem key={int.value} value={int.value}>
//                 {int.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   );
// };
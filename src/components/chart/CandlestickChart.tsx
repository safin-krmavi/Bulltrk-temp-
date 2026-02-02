// import React, { useEffect, useRef, useState } from 'react';
// import { 
//   createChart, 
//   IChartApi, 
//   CandlestickData,
//   ColorType,
//   Time
// } from 'lightweight-charts';
// import { useChartStore } from '@/stores/chartStore';
// import { Loader2 } from 'lucide-react';

// interface CandlestickChartProps {
//   exchange?: string;
//   symbol?: string;
//   interval?: string;
//   height?: number | string;
// }

// export const CandlestickChart: React.FC<CandlestickChartProps> = ({
//   exchange = 'BINANCE',
//   symbol = 'BTCUSDT',
//   interval = '1h',
//   height = '100%',
// }) => {
//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const wrapperRef = useRef<HTMLDivElement>(null);
//   const chartRef = useRef<IChartApi | null>(null);
//   const candlestickSeriesRef = useRef<any>(null);
//   const [containerHeight, setContainerHeight] = useState<number>(600);
  
//   const { candles, isLoading, error, fetchCandles } = useChartStore();

//   // Get theme from localStorage or default to 'light'
//   const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
//     return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
//   });

//   // Calculate container height
//   useEffect(() => {
//     const updateHeight = () => {
//       if (wrapperRef.current && height === '100%') {
//         const rect = wrapperRef.current.getBoundingClientRect();
//         setContainerHeight(rect.height);
//       } else if (typeof height === 'number') {
//         setContainerHeight(height);
//       }
//     };

//     updateHeight();
//     window.addEventListener('resize', updateHeight);
    
//     // Use ResizeObserver for better responsiveness
//     const resizeObserver = new ResizeObserver(updateHeight);
//     if (wrapperRef.current) {
//       resizeObserver.observe(wrapperRef.current);
//     }

//     return () => {
//       window.removeEventListener('resize', updateHeight);
//       resizeObserver.disconnect();
//     };
//   }, [height]);

//   // Listen for theme changes
//   useEffect(() => {
//     const handleThemeChange = () => {
//       const newTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
//       setTheme(newTheme);
//     };

//     window.addEventListener('storage', handleThemeChange);
//     window.addEventListener('themeChange', handleThemeChange);

//     return () => {
//       window.removeEventListener('storage', handleThemeChange);
//       window.removeEventListener('themeChange', handleThemeChange);
//     };
//   }, []);

//   // Initialize chart
//   useEffect(() => {
//     if (!chartContainerRef.current || containerHeight === 0) {
//       console.log('Chart container not ready:', { 
//         hasContainer: !!chartContainerRef.current, 
//         height: containerHeight 
//       });
//       return;
//     }

//     console.log('=== Initializing Chart ===');
//     console.log('Container height:', containerHeight);
    
//     try {
//       // Clean up existing chart first
//       if (chartRef.current) {
//         chartRef.current.remove();
//         chartRef.current = null;
//         candlestickSeriesRef.current = null;
//       }

//       const chart = createChart(chartContainerRef.current, {
//         width: chartContainerRef.current.clientWidth,
//         height: containerHeight,
//         layout: {
//           background: { 
//             type: ColorType.Solid,
//             color: theme === 'dark' ? '#18181b' : '#ffffff' 
//           },
//           textColor: theme === 'dark' ? '#d1d5db' : '#374151',
//         },
//         grid: {
//           vertLines: { 
//             color: theme === 'dark' ? '#374151' : '#e5e7eb',
//           },
//           horzLines: { 
//             color: theme === 'dark' ? '#374151' : '#e5e7eb',
//           },
//         },
//         crosshair: {
//           mode: 0,
//         },
//         rightPriceScale: {
//           borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
//         },
//         timeScale: {
//           borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
//           timeVisible: true,
//           secondsVisible: false,
//         },
//       });

//       console.log('Chart created, adding candlestick series...');

//       // Try different methods based on the API version
//       let candlestickSeries;
      
//       // Method 1: Try addCandlestickSeries (newer versions)
//       if (typeof (chart as any).addCandlestickSeries === 'function') {
//         candlestickSeries = (chart as any).addCandlestickSeries({
//           upColor: '#26a69a',
//           downColor: '#ef5350',
//           borderVisible: false,
//           wickUpColor: '#26a69a',
//           wickDownColor: '#ef5350',
//         });
//       } 
//       // Method 2: Try addSeries with 'Candlestick' type (v4.x)
//       else if (typeof (chart as any).addSeries === 'function') {
//         candlestickSeries = (chart as any).addSeries('Candlestick', {
//           upColor: '#26a69a',
//           downColor: '#ef5350',
//           borderVisible: false,
//           wickUpColor: '#26a69a',
//           wickDownColor: '#ef5350',
//         });
//       }
//       // Method 3: Fallback error
//       else {
//         throw new Error('No supported method to add candlestick series found');
//       }

//       console.log('Candlestick series added');

//       chartRef.current = chart;
//       candlestickSeriesRef.current = candlestickSeries;

//       // Handle resize
//       const handleResize = () => {
//         if (chartContainerRef.current && chartRef.current) {
//           chartRef.current.applyOptions({ 
//             width: chartContainerRef.current.clientWidth 
//           });
//         }
//       };

//       window.addEventListener('resize', handleResize);

//       return () => {
//         console.log('Cleaning up chart...');
//         window.removeEventListener('resize', handleResize);
//         if (chartRef.current) {
//           chartRef.current.remove();
//           chartRef.current = null;
//           candlestickSeriesRef.current = null;
//         }
//       };
//     } catch (err) {
//       console.error('Failed to initialize chart:', err);
//     }
//   }, [containerHeight, theme]);

//   // Fetch candle data
//   useEffect(() => {
//     if (exchange && symbol && interval) {
//       console.log('Fetching candles:', { exchange, symbol, interval });
//       fetchCandles(exchange, symbol, interval);

//       // Optional: Set up polling for real-time updates
//       const intervalId = setInterval(() => {
//         fetchCandles(exchange, symbol, interval);
//       }, 60000); // Update every minute

//       return () => clearInterval(intervalId);
//     }
//   }, [exchange, symbol, interval, fetchCandles]);

//   // Update chart data
//   useEffect(() => {
//     console.log('=== Chart Data Update Effect ===');
//     console.log('Candles available:', candles?.length || 0);
//     console.log('Chart ref exists:', !!chartRef.current);
//     console.log('Series ref exists:', !!candlestickSeriesRef.current);

//     if (!candlestickSeriesRef.current) {
//       console.log('Series not initialized yet, skipping data update');
//       return;
//     }
    
//     if (!candles || candles.length === 0) {
//       console.log('No candles to display');
//       return;
//     }

//     try {
//       console.log('Processing candle data...');

//       // Convert timestamps from milliseconds to seconds
//       const chartData: CandlestickData[] = candles.map((candle) => {
//         const timestamp = Math.floor(candle.openTime / 1000);

//         return {
//           time: timestamp as Time,
//           open: Number(candle.open),
//           high: Number(candle.high),
//           low: Number(candle.low),
//           close: Number(candle.close),
//         };
//       });

//       // Sort by time ascending
//       chartData.sort((a, b) => (a.time as number) - (b.time as number));

//       console.log('Processed data:', {
//         count: chartData.length,
//         first: chartData[0],
//         last: chartData[chartData.length - 1]
//       });

//       console.log('Setting data on series...');
//       candlestickSeriesRef.current.setData(chartData);
//       console.log('Data set successfully');

//       // Fit content to screen
//       if (chartRef.current) {
//         chartRef.current.timeScale().fitContent();
//         console.log('Chart fitted to content');
//       }
//     } catch (err) {
//       console.error('Failed to update chart data:', err);
//       console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
//     }
//   }, [candles]);

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
//         <div className="text-center">
//           <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Failed to load chart</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
//           <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
//             <p>Exchange: {exchange}</p>
//             <p>Symbol: {symbol}</p>
//             <p>Interval: {interval}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div 
//       ref={wrapperRef}
//       className="relative w-full h-full bg-white dark:bg-[#232326] rounded-lg border border-gray-200 dark:border-gray-700"
//     >
//       {isLoading && (
//         <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#18181b]/80 z-10 rounded-lg">
//           <div className="flex flex-col items-center gap-2">
//             <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
//             <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart data...</p>
//           </div>
//         </div>
//       )}
//       {!isLoading && (!candles || candles.length === 0) && !error && (
//         <div className="absolute inset-0 flex items-center justify-center">
//           <p className="text-sm text-gray-500">No data available for this symbol</p>
//         </div>
//       )}
//       <div ref={chartContainerRef} className="w-full h-full rounded-lg" />
//     </div>
//   );
// };
// import apiClient from './apiClient';
// import { apiurls } from './apiurls';

// export interface CandleData {
//   openTime: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
//   closeTime: number;
//   quoteVolume: number;
//   trades: number;
//   takerBuyBaseVolume: number;
//   takerBuyQuoteVolume: number;
// }

// export interface CandleResponse {
//   success: boolean;
//   message: string;
//   data: CandleData[];
// }

// export const candleService = {
//   async getCandles(
//     exchange: string,
//     symbol: string,
//     interval: string
//   ): Promise<CandleResponse> {
//     try {
//       console.log('Fetching candles with params:', { exchange, symbol, interval });
      
//       // Properly construct URL with query parameters
//       const url = `${apiurls.candlechart.candlegraph}?exchange=${exchange}&symbol=${symbol}&interval=${interval}`;
      
//       console.log('Full URL:', url);
      
//       const response = await apiClient.get(url);
      
//       console.log('Candle API response:', response.data);
      
//       return response.data;
//     } catch (error: any) {
//       console.error('Failed to fetch candle data:', error);
//       console.error('Error response:', error.response?.data);
//       console.error('Error status:', error.response?.status);
      
//       throw new Error(
//         error.response?.data?.message || 
//         error.message || 
//         'Failed to fetch candle data'
//       );
//     }
//   }
// };
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '')
}

// Generate mock data
export function generateMockData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    platform: 'Zerodha',
    accountName: 'Account/API Name',
    botName: 'Indy UTC',
    dateTime: '2024-01-12T12:00:00',
    type: 'Coin',
    buy: 'Buy',
    sell: 'Sell',
    quantity: 300,
    pl: i % 3 === 0 ? 89 : i % 4 === 0 ? -900 : -88,
    transactionId: '1234GHY'
  }))
}

// ✅ Add symbol formatting utility for different exchanges
export function formatSymbolForExchange(symbol: string, exchange: string): string {
  if (!symbol) return symbol;

  const ex = exchange.toUpperCase();

  // CoinDCX format → B-BASE_QUOTE (e.g. POLUSDT → B-POL_USDT)
  if (ex === 'COINDCX') {
    // Already formatted
    if (symbol.startsWith('B-') && symbol.includes('_')) {
      return symbol;
    }

    const knownQuotes = ['USDT', 'INR', 'BTC', 'ETH'];

    for (const quote of knownQuotes) {
      if (symbol.endsWith(quote)) {
        const base = symbol.replace(quote, '');
        return `B-${base}_${quote}`;
      }
    }

    console.warn('CoinDCX: Unable to auto-format symbol:', symbol);
  }

  // Binance and KuCoin use standard format (BTCUSDT)
  return symbol;
}

// ✅ Extract quote asset from symbol (the currency you're spending)
export function getQuoteAsset(symbol: string): string {
  if (!symbol) return 'USDT';
  
  const knownQuotes = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'INR', 'TUSD', 'DAI', 'FDUSD'];
  const sortedQuotes = knownQuotes.sort((a, b) => b.length - a.length);
  
  for (const quote of sortedQuotes) {
    if (symbol.toUpperCase().endsWith(quote)) {
      return quote;
    }
  }
  
  return 'USDT'; // Fallback
}

// ✅ Extract base asset from symbol (the currency you're buying)
export function getBaseAsset(symbol: string): string {
  if (!symbol) return '';
  
  const knownQuotes = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB', 'INR', 'TUSD', 'DAI', 'FDUSD'];
  const sortedQuotes = knownQuotes.sort((a, b) => b.length - a.length);
  
  for (const quote of sortedQuotes) {
    if (symbol.toUpperCase().endsWith(quote)) {
      return symbol.slice(0, -quote.length); // Remove quote to get base
    }
  }
  
  return symbol; // Return full symbol if no quote found
}


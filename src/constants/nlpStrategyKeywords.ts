export const NLP_KEYWORD_GROUPS: { label: string; keywords: string[] }[] = [
  {
    label: 'Numbers',
    keywords: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  },
  {
    label: 'Actions',
    keywords: ['Buy', 'Sell'],
  },
  {
    label: 'Timeframes',
    keywords: ['1M', '5M', '10M', '15M', '30M', '45M'],
  },
  {
    label: 'Indicators',
    keywords: ['RSI', 'EMA', 'SMA', 'MACD', 'Price', 'Volume'],
  },
  {
    label: 'Targets',
    keywords: ['Profit', 'Loss', 'Stop', 'Take Profit', '%'],
  },
];

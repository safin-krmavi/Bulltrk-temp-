export type NlpStrategyStep = 'entry' | 'exit';

export interface NlpClarificationAnswer {
  question: string;
  answer: string;
}

export interface NlpConditionPreview {
  indicator: string;
  period?: number;
  operator: string;
  value: number;
  interval: string;
}

export interface NlpExitRulePreview {
  type: string;
  value: number;
}

export interface NlpParsedPreview {
  asset: string;
  quote: string;
  exchange: string;
  segment?: string;
  side: string;
  entryConditions: NlpConditionPreview[];
  entryOperator: string;
  exitRules: NlpExitRulePreview[];
  capital: { type: string; percent?: number; amount?: number };
  orderType: string;
  candleInterval: string;
  confidence: number;
  ambiguities: string[];
}

export interface NlpPreviewResponse {
  parsed: NlpParsedPreview;
  resolvedSymbol: string | null;
  needsClarification: boolean;
  ambiguities: string[];
  confidence: number;
}

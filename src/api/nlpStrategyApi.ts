import apiClient from './apiClient';
import { apiurls } from './apiurls';
import type {
  NlpClarificationAnswer,
  NlpPreviewResponse,
} from '@/types/nlpStrategy';

export async function previewNlpStrategy(text: string): Promise<NlpPreviewResponse> {
  const res = await apiClient.post(apiurls.nlpStrategy.preview, { text });
  return res.data?.data ?? res.data;
}

export async function createNlpStrategy(params: {
  text: string;
  name: string;
  executionMode: 'LIVE' | 'PAPER';
  clarifications?: NlpClarificationAnswer[];
}) {
  const res = await apiClient.post(apiurls.nlpStrategy.create, params);
  return res.data?.data ?? res.data;
}

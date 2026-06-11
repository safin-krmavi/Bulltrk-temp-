'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AccountDetailsCard } from '@/components/trade/AccountDetailsCard';
import { NLP_KEYWORD_GROUPS } from '@/constants/nlpStrategyKeywords';
import { createNlpStrategy, previewNlpStrategy } from '@/api/nlpStrategyApi';
import type { NlpClarificationAnswer, NlpPreviewResponse, NlpStrategyStep } from '@/types/nlpStrategy';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

function buildCombinedStrategyText(
  entryConditions: string[],
  exitConditions: string[]
): string {
  const entry = entryConditions.filter(Boolean).join('. ');
  const exit = exitConditions.filter(Boolean).join('. ');
  if (entry && exit) {
    return `Entry: ${entry}. Exit: ${exit}`;
  }
  return entry || exit;
}

export default function NlpStrategyBuilder() {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<NlpStrategyStep>('entry');
  const [entryConditions, setEntryConditions] = useState<string[]>([]);
  const [exitConditions, setExitConditions] = useState<string[]>([]);
  const [draftText, setDraftText] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [executionMode, setExecutionMode] = useState<'PAPER' | 'LIVE'>('PAPER');
  const [keywordGroupIndex, setKeywordGroupIndex] = useState(0);

  const [preview, setPreview] = useState<NlpPreviewResponse | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [showProceedPopup, setShowProceedPopup] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const activeConditions = step === 'entry' ? entryConditions : exitConditions;
  const placeholder =
    step === 'entry'
      ? 'Type or select  keywords to describe your entry strategy'
      : 'Type or select  keywords to describe your exit strategy';

  const keywordGroup = NLP_KEYWORD_GROUPS[keywordGroupIndex];

  const combinedText = useMemo(
    () => buildCombinedStrategyText(entryConditions, exitConditions),
    [entryConditions, exitConditions]
  );

  const appendKeyword = (keyword: string) => {
    setDraftText((prev) => (prev ? `${prev} ${keyword}` : keyword));
  };

  const scrollKeywords = (dir: 'left' | 'right') => {
    setKeywordGroupIndex((i) => {
      const next = dir === 'left' ? i - 1 : i + 1;
      if (next < 0) return NLP_KEYWORD_GROUPS.length - 1;
      if (next >= NLP_KEYWORD_GROUPS.length) return 0;
      return next;
    });
  };

  const handleAddCondition = () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      toast.error('Enter a condition before adding');
      return;
    }
    if (step === 'entry') {
      setEntryConditions((prev) => [...prev, trimmed]);
    } else {
      setExitConditions((prev) => [...prev, trimmed]);
    }
    setDraftText('');
  };

  const handleNext = async () => {
    if (step === 'entry') {
      if (draftText.trim()) {
        setEntryConditions((prev) => [...prev, draftText.trim()]);
        setDraftText('');
      }
      if (entryConditions.length === 0 && !draftText.trim()) {
        toast.error('Add at least one entry condition');
        return;
      }
      setStep('exit');
      return;
    }

    const finalExit = [...exitConditions];
    if (draftText.trim()) finalExit.push(draftText.trim());

    if (finalExit.length === 0) {
      toast.error('Add at least one exit condition');
      return;
    }
    setExitConditions(finalExit);
    setDraftText('');

    const text = buildCombinedStrategyText(entryConditions, finalExit);
    setIsPreviewLoading(true);
    try {
      const result = await previewNlpStrategy(text);
      setPreview(result);
      const initial: Record<string, string> = {};
      result.ambiguities.forEach((q) => {
        initial[q] = '';
      });
      setClarificationAnswers(initial);
      if (!strategyName) {
        setStrategyName(`NLP ${result.parsed.asset}${result.parsed.quote}`);
      }
      setShowProceedPopup(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to parse strategy';
      toast.error(msg);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!strategyName.trim()) {
      toast.error('Strategy name is required');
      return;
    }

    const clarifications: NlpClarificationAnswer[] = Object.entries(
      clarificationAnswers
    )
      .filter(([, answer]) => answer.trim())
      .map(([question, answer]) => ({ question, answer: answer.trim() }));

    setIsCreating(true);
    try {
      await createNlpStrategy({
        text: combinedText,
        name: strategyName.trim(),
        executionMode,
        clarifications: clarifications.length ? clarifications : undefined,
      });
      toast.success('NLP strategy created and activated');
      setShowProceedPopup(false);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create strategy';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <AccountDetailsCard allowedSegments={['SPOT']} />

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

        {/* ── Slider-style stepper ── */}
        <div className="flex items-center justify-between px-2">
          {/* Entry label + dot */}
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-sm font-semibold',
                step === 'entry' ? 'text-[#4A151B]' : 'text-gray-400'
              )}
            >
              Entry Strategy
            </span>
          </div>

          {/* Exit label */}
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-sm font-semibold',
                step === 'exit' ? 'text-[#4A151B]' : 'text-gray-400'
              )}
            >
              Exit Strategy
            </span>
          </div>
        </div>

        {/* Track with dots */}
        <div className="relative flex items-center px-2 -mt-4">
          {/* filled dot – Entry */}
          <div
            className={cn(
              'z-10 h-4 w-4 rounded-full border-2 shrink-0',
              'bg-[#E67E22] border-[#E67E22]'
            )}
          />
          {/* track line */}
          <div className="relative flex-1 h-0.5 bg-[#F5C27A]">
            {/* progress fill */}
            <div
              className="absolute inset-y-0 left-0 bg-[#E67E22] transition-all duration-300"
              style={{ width: step === 'exit' ? '100%' : '0%' }}
            />
          </div>
          {/* circle dot – Exit */}
          <div
            className={cn(
              'z-10 h-4 w-4 rounded-full border-2 shrink-0 transition-colors duration-300',
              step === 'exit'
                ? 'bg-[#E67E22] border-[#E67E22]'
                : 'bg-white border-[#E67E22]'
            )}
          />
        </div>

        {/* ── Stacked conditions ── */}
        {activeConditions.map((cond, idx) => (
          <div
            key={`${step}-${idx}-${cond}`}
            className="rounded-md border border-[#E67E22]/40 bg-[#FFF6EE] px-4 py-3 text-sm text-gray-800"
          >
            <span className="font-medium text-gray-500">Condition {idx + 1}:</span>{' '}
            {cond}
          </div>
        ))}

        {/* ── Draft input ── */}
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{placeholder}</p>
          <div className="relative">
            <Input
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder={placeholder}
              className="pr-4 border-b border-gray-300 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[#E67E22] bg-transparent text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCondition();
                }
              }}
            />
            {/* underline accent */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
          </div>
        </div>

        {/* ── Keyword carousel ── */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollKeywords('left')}
            aria-label="Previous keywords"
            className="shrink-0 flex items-center justify-center h-8 w-6 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={carouselRef}
            className="flex flex-1 flex-wrap gap-2 py-1"
          >
            {keywordGroup.keywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => appendKeyword(kw)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollKeywords('right')}
            aria-label="Next keywords"
            className="shrink-0 flex items-center justify-center h-8 w-6 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex justify-end gap-3 pt-2">
          {step === 'exit' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('entry')}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            className="bg-[#4A151B] hover:bg-[#3A1015] text-white"
            onClick={handleNext}
            disabled={isPreviewLoading}
          >
            {isPreviewLoading ? 'Parsing...' : 'Next'}
          </Button>
          <Button
            type="button"
            className="bg-[#E67E22] hover:bg-[#D35400] text-white"
            onClick={handleAddCondition}
          >
            Add another Condition
          </Button>
        </div>
      </div>

      {/* ── Preview / Confirm popup ── */}
      {showProceedPopup && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[#4A151B]">Review NLP Strategy</h3>
            <div className="text-sm space-y-2 text-gray-700">
              <p>
                <span className="font-medium">Symbol:</span>{' '}
                {preview.resolvedSymbol ?? `${preview.parsed.asset}${preview.parsed.quote}`}
              </p>
              <p>
                <span className="font-medium">Side:</span> {preview.parsed.side} on{' '}
                {preview.parsed.exchange}
              </p>
              <p>
                <span className="font-medium">Confidence:</span>{' '}
                {(preview.confidence * 100).toFixed(0)}%
              </p>
              {preview.parsed.entryConditions.length > 0 && (
                <div>
                  <p className="font-medium">Entry conditions</p>
                  <ul className="list-disc pl-5">
                    {preview.parsed.entryConditions.map((c, i) => (
                      <li key={i}>
                        {c.indicator} {c.operator} {c.value} ({c.interval})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {preview.parsed.exitRules.length > 0 && (
                <div>
                  <p className="font-medium">Exit rules</p>
                  <ul className="list-disc pl-5">
                    {preview.parsed.exitRules.map((r, i) => (
                      <li key={i}>
                        {r.type}: {r.value}
                        {r.type === 'TIME_EXIT' ? ' min' : '%'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {preview.needsClarification && preview.ambiguities.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-amber-700">Clarifications needed</p>
                {preview.ambiguities.map((q) => (
                  <div key={q} className="space-y-1">
                    <Label className="text-xs">{q}</Label>
                    <Input
                      value={clarificationAnswers[q] ?? ''}
                      onChange={(e) =>
                        setClarificationAnswers((prev) => ({
                          ...prev,
                          [q]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Strategy name</Label>
              <Input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Execution mode</Label>
              <Select
                value={executionMode}
                onValueChange={(v) => setExecutionMode(v as 'PAPER' | 'LIVE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAPER">Paper (simulated)</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowProceedPopup(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#4A151B] text-white hover:bg-[#3A1015]"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Strategy'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

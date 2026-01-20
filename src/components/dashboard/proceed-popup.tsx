import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from 'react'

interface StrategyData {
  // Account Details
  selectedApi: string;
  exchange: string;
  segment: string;
  pair: string;
  
  // Strategy Details
  name: string;
  investmentPerRun: number;
  investmentCap: number;
  frequency: string;
  takeProfitPct: number;
  
  // Advanced Settings
  priceStart: number;
  priceStop: number;
  stopLossPct: number;
}

interface ProceedPopupProps {
  strategyData: StrategyData;
  onClose: () => void;
  onConfirm: (executionMode: 'LIVE' | 'PUBLISHED') => void;
  isLoading?: boolean;
}

export function ProceedPopup({ 
  strategyData, 
  onClose, 
  onConfirm,
  isLoading = false 
}: ProceedPopupProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const accountDetails = [
    { label: 'API Connection', value: strategyData.selectedApi },
    { label: 'Exchange', value: strategyData.exchange },
    { label: 'Segment', value: strategyData.segment },
    { label: 'Trading Pair', value: strategyData.pair },
  ];

  const botDetails = [
    { label: 'Strategy Name', value: strategyData.name },
    { label: 'Strategy Type', value: 'Growth DCA' },
    { label: 'Asset Type', value: 'CRYPTO' },
    { label: 'Investment Per Run', value: `${strategyData.investmentPerRun} USDT` },
    { label: 'Investment CAP', value: `${strategyData.investmentCap} USDT` },
    { label: 'Frequency', value: strategyData.frequency },
    { label: 'Take Profit %', value: `${strategyData.takeProfitPct}%` },
  ];

  const advancedSettings = [
    { label: 'Price Start', value: strategyData.priceStart.toString() },
    { label: 'Price Stop', value: strategyData.priceStop.toString() },
    { label: 'Stop Loss %', value: `${strategyData.stopLossPct}%` },
  ];

  const sections = [
    { title: 'Account Details', fields: accountDetails },
    { title: 'Bot Details', fields: botDetails },
    { title: 'Advanced Settings', fields: advancedSettings },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl bg-white dark:bg-[#232326]">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-white dark:bg-[#232326]">
          <h2 className="text-lg font-semibold">Strategy Review</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            disabled={isLoading}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Sections */}
            {sections.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2 text-sm border-b pb-1">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[120px]">
                        {field.label}:
                      </span>
                      <span className="text-xs font-medium ml-2 truncate">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label 
                htmlFor="terms" 
                className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer leading-tight"
              >
                I Agree to Bulltrek's Terms & Conditions, Privacy policy and disclaimers
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                onClick={() => onConfirm('LIVE')}
                disabled={!agreedToTerms || isLoading}
              >
                {isLoading ? "Processing..." : "Run On Live Market"}
              </Button>
              <Button 
                className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                onClick={onClose}
                disabled={isLoading}
              >
                Edit
              </Button>
              <Button 
                className="flex-1 bg-[#5D1D21] hover:bg-[#4D1721] text-white h-9 text-sm"
                onClick={() => onConfirm('PUBLISHED')}
                disabled={!agreedToTerms || isLoading}
              >
                Publish
              </Button>
              <Button 
                className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white h-9 text-sm"
                disabled={true}
              >
                Backtest
              </Button>
            </div>

            {/* Note */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
              ** For Buttons see respective user **
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
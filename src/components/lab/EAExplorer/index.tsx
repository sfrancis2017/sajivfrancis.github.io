import { useState } from 'react';
import type { GenerateResult, Industry, Selections } from './types';
import { generateArchitectures } from './api';
import { IndustryPicker } from './IndustryPicker';
import { SelectionsPage } from './SelectionsPage';
import { LoadingView } from './LoadingView';
import { ResultsView } from './ResultsView';
import './styles.css';

type Step = 'industry' | 'selections' | 'generating' | 'results';

export default function EAExplorer() {
  const [step, setStep] = useState<Step>('industry');
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [selections, setSelections] = useState<Selections>({});
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleIndustrySelect(ind: Industry) {
    setIndustry(ind);
    setSelections({});
    setResult(null);
    setError(null);
    setStep('selections');
  }

  function handleToggle(layerId: string, vendorId: string) {
    setSelections((prev) => {
      const current = prev[layerId] ?? [];
      return {
        ...prev,
        [layerId]: current.includes(vendorId)
          ? current.filter((id) => id !== vendorId)
          : [...current, vendorId],
      };
    });
  }

  async function handleGenerate() {
    if (!industry) return;
    setStep('generating');
    setError(null);
    try {
      const res = await generateArchitectures(industry.id, selections);
      setResult(res);
      setStep('results');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setStep('selections');
      setTimeout(() => setError(null), 6000);
    }
  }

  function handleReset() {
    setStep('industry');
    setIndustry(null);
    setSelections({});
    setResult(null);
    setError(null);
  }

  return (
    <div className="ea-root">
      {error && (
        <div className="ea-error" role="alert">
          ⚠ {error}
        </div>
      )}

      {step === 'industry' && <IndustryPicker onSelect={handleIndustrySelect} />}

      {step === 'selections' && industry && (
        <SelectionsPage
          industryId={industry.id}
          selections={selections}
          onToggle={handleToggle}
          onGenerate={handleGenerate}
          onBack={handleReset}
        />
      )}

      {step === 'generating' && <LoadingView />}

      {step === 'results' && result && industry && (
        <ResultsView result={result} industry={industry} onReset={handleReset} />
      )}
    </div>
  );
}

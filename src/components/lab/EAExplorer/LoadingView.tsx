import { useEffect, useState } from 'react';

const STEPS = [
  'Analysing vendor selections',
  'Applying integration patterns',
  'Computing optimal topology',
  'Generating alternate architectures',
  'Composing roadmaps & summaries',
];

export function LoadingView() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1)),
      1500,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ea-loading">
      <div className="ea-spinner" aria-hidden="true" />
      <div className="ea-loading-title">Architecting…</div>
      <div className="ea-loading-steps">
        {STEPS.map((step, i) => {
          const cls =
            i < activeStep ? 'done' : i === activeStep ? 'active' : '';
          return (
            <div key={i} className={`ea-loading-step ${cls}`}>
              <span className="ea-loading-dot" aria-hidden="true" />
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

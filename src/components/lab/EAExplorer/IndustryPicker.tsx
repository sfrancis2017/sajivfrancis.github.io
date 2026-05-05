import { INDUSTRIES } from './data';
import type { Industry } from './types';

interface Props {
  onSelect: (industry: Industry) => void;
}

export function IndustryPicker({ onSelect }: Props) {
  return (
    <div>
      <div className="ea-eyebrow">Step 1 of 2</div>
      <h2 className="ea-section-title">Select your industry</h2>
      <p className="ea-section-sub">
        Pick an industry to load its vendor taxonomy and architecture layers. Then
        toggle the systems you use (or want to evaluate) and the AI will recommend
        a primary plus two alternate reference architectures.
      </p>

      <div className="ea-industry-grid">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            type="button"
            onClick={() => onSelect(ind)}
            className="ea-industry-card"
            aria-label={`Select industry: ${ind.label}`}
          >
            <div className="ea-industry-icon" aria-hidden="true">
              {ind.icon}
            </div>
            <div className="ea-industry-label">{ind.label}</div>
            <div className="ea-industry-desc">{ind.desc}</div>
          </button>
        ))}
      </div>

      <div className="ea-hint">
        <span aria-hidden="true">💡</span>
        <span>
          Generations are rate-limited (3 per day per IP) and the output includes
          three architecture variants — primary plus a cloud-native alternate and a
          cost-optimised alternate. Each is exportable as a PDF.
        </span>
      </div>
    </div>
  );
}

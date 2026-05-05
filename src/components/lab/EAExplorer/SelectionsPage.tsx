import { INDUSTRIES, VENDORS, getApplicableLayers } from './data';
import type { Selections, Vendor } from './types';

interface Props {
  industryId: string;
  selections: Selections;
  onToggle: (layerId: string, vendorId: string) => void;
  onGenerate: () => void;
  onBack: () => void;
}

interface VendorCardProps {
  vendor: Vendor;
  selected: boolean;
  onToggle: (id: string) => void;
}

function VendorCard({ vendor, selected, onToggle }: VendorCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(vendor.id)}
      className={`ea-vendor-card${selected ? ' selected' : ''}`}
      aria-pressed={selected}
    >
      <span className="ea-vendor-checkbox" aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="ea-vendor-name">{vendor.name}</span>
        <span className="ea-vendor-desc" style={{ display: 'block' }}>
          {vendor.desc}
        </span>
      </span>
    </button>
  );
}

export function SelectionsPage({
  industryId,
  selections,
  onToggle,
  onGenerate,
  onBack,
}: Props) {
  const industry = INDUSTRIES.find((i) => i.id === industryId);
  const applicableLayers = getApplicableLayers(industryId);
  const totalSelected = Object.values(selections).flat().length;

  if (!industry) return null;

  return (
    <div>
      <div className="ea-industry-banner">
        <span className="ea-industry-banner-icon" aria-hidden="true">
          {industry.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div className="ea-industry-banner-title">{industry.label}</div>
          <div className="ea-industry-banner-sub">
            Pick the systems you use across each layer · {totalSelected} selected
          </div>
        </div>
        <button type="button" onClick={onBack} className="ea-action">
          ← Change industry
        </button>
      </div>

      {applicableLayers.map((layer) => {
        const vendors = VENDORS[industryId]?.[layer.id] ?? [];
        if (vendors.length === 0) return null;
        const selectedInLayer = selections[layer.id] ?? [];

        return (
          <div key={layer.id} className="ea-layer">
            <div className="ea-layer-header">
              <span aria-hidden="true">{layer.icon}</span>
              <div>
                <div className="ea-layer-label">{layer.label}</div>
                <div className="ea-layer-sub">{layer.sublabel}</div>
              </div>
              {selectedInLayer.length > 0 && (
                <span className="ea-layer-badge">
                  {selectedInLayer.length} selected
                </span>
              )}
            </div>
            <div className="ea-vendor-grid">
              {vendors.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  selected={selectedInLayer.includes(v.id)}
                  onToggle={(id) => onToggle(layer.id, id)}
                />
              ))}
            </div>
            <hr className="ea-divider" />
          </div>
        );
      })}

      <div className="ea-generate-bar">
        <button
          type="button"
          onClick={onGenerate}
          className="ea-generate-button"
          aria-label="Generate architecture"
        >
          Generate architecture
          <span className="ea-generate-meta">
            {totalSelected > 0
              ? `${totalSelected} vendor${totalSelected === 1 ? '' : 's'} selected · 3 architectures will be produced`
              : 'AI will recommend vendors for any unselected layer'}
          </span>
        </button>
      </div>
    </div>
  );
}

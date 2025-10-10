// src/components/modules/PriceSuggestion/PriceSuggestion.tsx
import React from 'react';
import { BrainCircuit } from 'lucide-react';
import './PriceSuggestion.scss';

interface PriceSuggestionProps {
  summary: {
    title: string;
    subtitle: string;
    display: {
      min: number;
      suggested: number;
      max: number;
      labelSuggested: string;
    }
  };
}

const PriceSuggestion: React.FC<PriceSuggestionProps> = ({ summary }) => {
  const { title, subtitle, display } = summary;

  // Tính toán vị trí của marker trên thanh giá
  const range = display.max - display.min;
  const positionPercent = range > 0 ? ((display.suggested - display.min) / range) * 100 : 50;

  const formatPrice = (price: number) => `${(price / 1000000).toFixed(0)}tr`;

  return (
    <div className="price-suggestion-card">
      <div className="card-header">
        <BrainCircuit size={20} />
        <h4>{title}</h4>
      </div>
      <p className="subtitle">{subtitle}</p>
      <div className="price-range-bar">
        <div className="bar">
          <div className="suggested-marker" style={{ left: `clamp(5%, ${positionPercent}%, 95%)` }}>
            <div className="suggested-label">{display.labelSuggested}</div>
            <div className="marker-dot"></div>
          </div>
        </div>
        <div className="labels">
          <span>{formatPrice(display.min)}</span>
          <span>{formatPrice(display.max)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceSuggestion;
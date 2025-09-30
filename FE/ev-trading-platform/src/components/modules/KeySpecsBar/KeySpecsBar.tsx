// src/components/modules/KeySpecsBar/KeySpecsBar.tsx
import React from 'react';
import { Calendar, Gauge, BatteryCharging, Palette } from 'lucide-react';
import type { IEVDetails } from '../../../types';
import './KeySpecsBar.scss';

interface KeySpecsBarProps {
  details: IEVDetails;
}

const KeySpecsBar: React.FC<KeySpecsBarProps> = ({ details }) => {
  return (
    <div className="key-specs-bar">
      <div className="spec-item">
        <Calendar size={20} />
        <span>Năm SX: <strong>{details.year_of_manufacture}</strong></span>
      </div>
      <div className="spec-item">
        <Gauge size={20} />
        <span>Số km: <strong>{details.mileage.toLocaleString('vi-VN')}</strong></span>
      </div>
      <div className="spec-item">
        <BatteryCharging size={20} />
        <span>Pin: <strong>{details.battery_capacity} kWh</strong></span>
      </div>
      <div className="spec-item">
        <Palette size={20} />
        <span>Màu: <strong>{details.color}</strong></span>
      </div>
    </div>
  );
};

export default KeySpecsBar;
// src/components/modules/KeySpecsBar/KeySpecsBar.tsx
import React from "react";
import {
  Calendar,
  Gauge,
  BatteryCharging,
  Zap,
  Battery,
  ShieldCheck,
  Package,
  Atom,
  Clock,
  Palette,
  Users,
  Car,
} from "lucide-react";
import type { EVDetail, BatteryDetail } from "../../../types";
import "./KeySpecsBar.scss";

interface KeySpecsBarProps {
  details: EVDetail | BatteryDetail;
}

// Type guard to check if details are for an EV
function isEV(details: EVDetail | BatteryDetail): details is EVDetail {
  return (details as EVDetail).mileage !== undefined;
}

const KeySpecsBar: React.FC<KeySpecsBarProps> = ({ details }) => {
  return (
    <div className="key-specs-bar">
      {isEV(details) ? (
        // --- EV Specs ---
        <>
          <div className="spec-item">
            <Calendar size={20} className="icon" />
            <div className="spec-content">
              <span>Năm SX</span>
              <strong>{details.year_of_manufacture}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Gauge size={20} className="icon" />
            <div className="spec-content">
              <span>Đã đi</span>
              <strong>{details.mileage.toLocaleString("vi-VN")} km</strong>
            </div>
          </div>
          <div className="spec-item">
            <BatteryCharging size={20} className="icon" />
            <div className="spec-content">
              <span>Quãng đường</span>
              <strong>{details.range} km</strong>
            </div>
          </div>
          <div className="spec-item">
            <Zap size={20} className="icon" />
            <div className="spec-content">
              <span>Công suất</span>
              <strong>{details.motor_power} kW</strong>
            </div>
          </div>
          <div className="spec-item">
            <Battery size={20} className="icon" />
            <div className="spec-content">
              <span>Dung lượng pin</span>
              <strong>{details.battery_capacity} kWh</strong>
            </div>
          </div>
          <div className="spec-item">
            <Clock size={20} className="icon" />
            <div className="spec-content">
              <span>Thời gian sạc</span>
              <strong>{details.charging_time} phút</strong>
            </div>
          </div>
          <div className="spec-item">
            <Palette size={20} className="icon" />
            <div className="spec-content">
              <span>Màu sắc</span>
              <strong>{details.color}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Users size={20} className="icon" />
            <div className="spec-content">
              <span>Số ghế</span>
              <strong>{details.seats}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Car size={20} className="icon" />
            <div className="spec-content">
              <span>Số cửa</span>
              <strong>{details.doors}</strong>
            </div>
          </div>
          <div className="spec-item">
            <ShieldCheck size={20} className="icon" />
            <div className="spec-content">
              <span>Hộp số</span>
              <strong>{details.transmission}</strong>
            </div>
          </div>
        </>
      ) : (
        // --- Battery Specs ---
        <>
          <div className="spec-item">
            <Package size={20} className="icon" />
            <div className="spec-content">
              <span>Dung lượng</span>
              <strong>{details.capacity} kWh</strong>
            </div>
          </div>
          <div className="spec-item">
            <ShieldCheck size={20} className="icon" />
            <div className="spec-content">
              <span>Sức khỏe (SOH)</span>
              <strong>{details.state_of_health} %</strong>
            </div>
          </div>
          <div className="spec-item">
            <Battery size={20} className="icon" />
            <div className="spec-content">
              <span>Điện áp</span>
              <strong>{details.voltage} V</strong>
            </div>
          </div>
          <div className="spec-item">
            <Atom size={20} className="icon" />
            <div className="spec-content">
              <span>Loại pin</span>
              <strong>{details.chemistry_type}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Gauge size={20} className="icon" />
            <div className="spec-content">
              <span>Số lần sạc</span>
              <strong>{details.cycle_count}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Calendar size={20} className="icon" />
            <div className="spec-content">
              <span>Ngày SX</span>
              <strong>{new Date(details.manufacturing_date).toLocaleDateString("vi-VN")}</strong>
            </div>
          </div>
          <div className="spec-item">
            <Package size={20} className="icon" />
            <div className="spec-content">
              <span>Cân nặng</span>
              <strong>{details.weight} kg</strong>
            </div>
          </div>
          {details.dimensions && (
            <div className="spec-item">
              <Car size={20} className="icon" />
              <div className="spec-content">
                <span>Kích thước</span>
                <strong>{details.dimensions.length}×{details.dimensions.width}×{details.dimensions.height} mm</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KeySpecsBar;
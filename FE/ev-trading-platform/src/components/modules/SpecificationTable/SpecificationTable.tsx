// src/components/modules/SpecificationTable/SpecificationTable.tsx
import React from 'react';
import type { EVDetail, BatteryDetail } from '../../../types';
import './SpecificationTable.scss';
interface SpecTableProps {
  details: IEVDetails | IBatteryDetails;
}
const SpecificationTable: React.FC<SpecTableProps> = ({ details }) => {
  const isEv = 'mileage' in details; // Heuristic to check if it's EV or Battery
  return (
    <div className="spec-table">
      <h3>Thông số kỹ thuật</h3>
      <table>
        <tbody>
          {isEv ? (
            <>
              <tr><td>Năm sản xuất</td><td>{details.year_of_manufacture}</td></tr>
              <tr><td>Số KM đã đi</td><td>{details.mileage.toLocaleString('vi-VN')} km</td></tr>
              <tr><td>Dung lượng pin</td><td>{details.battery_capacity} kWh</td></tr>
              <tr><td>Quãng đường đi được</td><td>{details.range} km</td></tr>
              {details.color && <tr><td>Màu sắc</td><td>{details.color}</td></tr>}
              {details.seats && <tr><td>Số ghế</td><td>{details.seats}</td></tr>}
            </>
          ) : (
            <>
              <tr><td>Dung lượng</td><td>{details.capacity} Ah</td></tr>
              <tr><td>Tình trạng pin</td><td>{details.state_of_health} %</td></tr>
              <tr><td>Số lần sạc</td><td>{details.cycle_count}</td></tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default SpecificationTable;
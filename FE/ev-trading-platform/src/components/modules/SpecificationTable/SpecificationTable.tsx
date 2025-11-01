// src/components/modules/SpecificationTable/SpecificationTable.tsx
import React from "react";
import type { EVDetail, BatteryDetail } from "../../../types";
import "./SpecificationTable.scss";

interface SpecTableProps {
  details: EVDetail | BatteryDetail;
}

// Type guard to check if details are for an EV
function isEV(details: EVDetail | BatteryDetail): details is EVDetail {
  return (details as EVDetail).mileage_km !== undefined || (details as EVDetail).mileage !== undefined;
}

// Helper component for a table row
const SpecRow: React.FC<{ label: string; value?: string | number | null }> = ({
  label,
  value,
}) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <tr>
      <td>{label}</td>
      <td>{value}</td>
    </tr>
  );
};

// Helper component for an array row
const SpecArrayRow: React.FC<{ label: string; items?: string[] | null }> = ({
  label,
  items,
}) => {
  if (!items || items.length === 0) return null;
  return (
    <tr>
      <td>{label}</td>
      <td>
        <ul className="spec-list">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
};

const SpecificationTable: React.FC<SpecTableProps> = ({ details }) => {
  return (
    <div className="spec-table">
      {isEV(details) ? (
        // --- RENDER EV DETAILS ---
        <>
          <h3 className="spec-group-title">Thông số cơ bản</h3>
          <table>
            <tbody>
              <SpecRow
                label="Năm sản xuất"
                value={details.year || details.year_of_manufacture}
              />
              <SpecRow
                label="Số KM đã đi"
                value={
                  details.mileage_km 
                    ? `${details.mileage_km.toLocaleString("vi-VN")} km`
                    : details.mileage 
                    ? `${details.mileage.toLocaleString("vi-VN")} km`
                    : undefined
                }
              />
              <SpecRow label="Màu sắc" value={details.color} />
              <SpecRow label="Số ghế" value={details.seats} />
              <SpecRow label="Số cửa" value={details.doors} />
              <SpecRow label="Hộp số" value={details.transmission} />
              <SpecRow
                label="Tình trạng đăng ký"
                value={details.registration_status}
              />
              <SpecRow
                label="Bảo hành còn lại"
                value={details.warranty_remaining}
              />
            </tbody>
          </table>

          <h3 className="spec-group-title">Thông số vận hành</h3>
          <table>
            <tbody>
              <SpecRow
                label="Dung lượng pin"
                value={
                  details.battery_capacity_kwh !== undefined
                    ? `${details.battery_capacity_kwh} kWh`
                    : details.battery_capacity !== undefined
                    ? `${details.battery_capacity} kWh`
                    : undefined
                }
              />
              <SpecRow
                label="Quãng đường (tối đa)"
                value={
                  details.range_km !== undefined
                    ? `${details.range_km.toLocaleString("vi-VN")} km`
                    : details.range !== undefined
                    ? `${details.range.toLocaleString("vi-VN")} km`
                    : undefined
                }
              />
              <SpecRow
                label="Thời gian sạc"
                value={details.charging_time ? `${details.charging_time} phút` : undefined}
              />
              <SpecRow
                label="Công suất động cơ"
                value={details.motor_power ? `${details.motor_power} kW` : undefined}
              />
            </tbody>
          </table>

          {details.features && details.features.length > 0 && (
            <>
              <h3 className="spec-group-title">Tính năng & Tiện ích</h3>
              <table>
                <tbody>
                  <SpecArrayRow label="Tính năng" items={details.features} />
                </tbody>
              </table>
            </>
          )}
        </>
      ) : (
        // --- RENDER BATTERY DETAILS ---
        <>
          <h3 className="spec-group-title">Thông số kỹ thuật cơ bản</h3>
          <table>
            <tbody>
              <SpecRow 
                label="Dung lượng" 
                value={
                  details.capacity_kwh !== undefined
                    ? `${details.capacity_kwh} kWh`
                    : details.capacity !== undefined
                    ? `${details.capacity} kWh`
                    : undefined
                } 
              />
              <SpecRow 
                label="Điện áp" 
                value={details.voltage ? `${details.voltage} V` : undefined} 
              />
              <SpecRow
                label="Tình trạng pin (SOH)"
                value={
                  details.soh_percent !== undefined
                    ? `${details.soh_percent} %`
                    : details.state_of_health !== undefined
                    ? `${details.state_of_health} %`
                    : undefined
                }
              />
              <SpecRow 
                label="Loại pin" 
                value={details.battery_type || details.chemistry_type} 
              />
              <SpecRow 
                label="Số lần sạc" 
                value={details.cycle_count} 
              />
            </tbody>
          </table>

          <h3 className="spec-group-title">Thông tin sản xuất & Bảo hành</h3>
          <table>
            <tbody>
              <SpecRow
                label="Năm sản xuất"
                value={
                  details.manufacture_year !== undefined
                    ? details.manufacture_year.toString()
                    : details.manufacturing_date
                    ? new Date(details.manufacturing_date).getFullYear().toString()
                    : undefined
                }
              />
              <SpecRow
                label="Ngày sản xuất"
                value={
                  details.manufacturing_date
                    ? new Date(details.manufacturing_date).toLocaleDateString("vi-VN")
                    : undefined
                }
              />
              <SpecRow
                label="Bảo hành còn lại"
                value={details.warranty_remaining}
              />
            </tbody>
          </table>

          {(details.weight || details.dimensions) && (
            <>
              <h3 className="spec-group-title">Thông số vật lý</h3>
              <table>
                <tbody>
                  <SpecRow label="Cân nặng" value={details.weight ? `${details.weight} kg` : undefined} />
                  {details.dimensions && details.dimensions.length && details.dimensions.width && details.dimensions.height && (
                    <SpecRow
                      label="Kích thước (D x R x C)"
                      value={`${details.dimensions.length} x ${details.dimensions.width} x ${details.dimensions.height} mm`}
                    />
                  )}
                </tbody>
              </table>
            </>
          )}

          {(details.compatible_models || details.certification) && (
            <>
              <h3 className="spec-group-title">Tương thích & Chứng nhận</h3>
              <table>
                <tbody>
                  <SpecArrayRow
                    label="Model tương thích"
                    items={details.compatible_models}
                  />
                  <SpecArrayRow
                    label="Chứng nhận"
                    items={details.certification}
                  />
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
};
export default SpecificationTable;
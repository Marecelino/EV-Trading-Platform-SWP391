// src/components/admin/TrendChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendChartProps {
  chartData: any; // Bạn có thể định nghĩa kiểu chi tiết hơn
}

const TrendChart: React.FC<TrendChartProps> = ({ chartData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Phân tích xu hướng thị trường' },
    },
    scales: {
        y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: { display: true, text: 'Số lượng' }
        },
        y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: { display: true, text: 'Giá (Triệu VND)' },
            grid: { drawOnChartArea: false }, // không vẽ lưới cho trục y1
        },
    },
  };

  return <Line options={options} data={chartData} />;
};

export default TrendChart;
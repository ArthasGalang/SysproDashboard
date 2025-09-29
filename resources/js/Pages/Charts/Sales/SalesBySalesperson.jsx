import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesBySalesperson = () => {
  const data = {
    labels: ['J. Doe', 'S. Smith', 'A. Lee'],
    datasets: [
      {
        label: 'Sales',
        data: [80000, 25000, 10000],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => value.toLocaleString(),
        },
      },
    },
  };

  return (
    <div className="dashboard-panel-sidegraph">
      <div style={{ height: '350px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default SalesBySalesperson;

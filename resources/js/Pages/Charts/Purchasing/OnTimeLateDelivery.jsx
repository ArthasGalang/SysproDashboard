import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "@css/dashboard.css";

const COLORS = ["#75c579ff", "#ee6866ff"];

const OnTimeLateDelivery = ({ suppliers = [], buyers = [], dateFrom = null, dateTo = null }) => {
  const [chartData, setChartData] = useState({
    labels: ["On-Time", "Late"],
    datasets: [
      {
        label: "Deliveries",
        data: [0, 0],
        backgroundColor: COLORS,
      },
    ],
  });
  useEffect(() => {
    const params = new URLSearchParams();
    if (suppliers && suppliers.length) params.set('suppliers', suppliers.join(','));
    if (buyers && buyers.length) params.set('buyers', buyers.join(','));
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const url = "http://127.0.0.1:8000/api/purchase" + (params.toString() ? `?${params.toString()}` : '');

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((data) => {
        const validDeliveries = data.filter(
          (po) => po.MLastReceiptDat && po.MLatestDueDate
        );

        const onTimeCount = validDeliveries.filter((po) => {
          const receipt = new Date(po.MLastReceiptDat);
          const due = new Date(po.MLatestDueDate);
          return receipt <= due;
        }).length;

        const lateCount = validDeliveries.length - onTimeCount;

        setChartData({
          labels: ["On-Time", "Late"],
          datasets: [
            {
              label: "Deliveries",
              data: [onTimeCount, lateCount],
              backgroundColor: COLORS,
            },
          ],
        });
      })
      .catch((err) => console.error("Error fetching delivery data:", err));
  }, [suppliers, buyers, dateFrom, dateTo]);

  return (
    <div className="chart-container">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
          },
        }}
      />
    </div>
  );
};

export default OnTimeLateDelivery;

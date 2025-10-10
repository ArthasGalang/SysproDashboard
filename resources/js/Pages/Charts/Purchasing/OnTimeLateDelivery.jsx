import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "@css/dashboard.css";

const COLORS = ["#75c579ff", "#ee6866ff"];

const OnTimeLateDelivery = () => {
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
    fetch("http://127.0.0.1:8000/api/purchase")
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
  }, []);

  return (
    <Doughnut
      data={chartData}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
      }}
    />
  );
};

export default OnTimeLateDelivery;

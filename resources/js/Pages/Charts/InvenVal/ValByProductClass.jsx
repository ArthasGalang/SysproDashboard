import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "@css/dashboard.css";


const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const ValByProductClass = ({ warehouses = [], productClasses = [] }) => {
  const [classData, setClassData] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (warehouses && warehouses.length) params.set('warehouses', warehouses.join(','));
    if (productClasses && productClasses.length) params.set('product_classes', productClasses.join(','));
    const url = "http://127.0.0.1:8000/api/invenvaldb" + (params.toString() ? `?${params.toString()}` : '');

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Aggregate by ProductClass
        const items = Array.isArray(data.data) ? data.data : [];
        const classMap = {};
        items.forEach((item) => {
          const cls = item.ProductClass || 'Unknown';
          if (!classMap[cls]) classMap[cls] = 0;
          classMap[cls] += Number(item.TotalValue) || 0;
        });
        const formatted = Object.entries(classMap).map(([name, value]) => ({ name, value }));
        setClassData(formatted);
      })
      .catch((err) => console.error("Error fetching product class data:", err));
  }, [warehouses, productClasses]);

  return (
    <div className="chart-container">
      <Doughnut
        data={{
          labels: classData.map((d) => d.name),
          datasets: [
            {
              label: "Total Value",
              data: classData.map((d) => d.value),
              backgroundColor: COLORS,
            },
          ],
        }}
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

export default ValByProductClass;

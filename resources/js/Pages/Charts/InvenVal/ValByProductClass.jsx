import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "@css/dashboard.css";


const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const ValByProductClass = () => {
  const [classData, setClassData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/value-by-class")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((d) => ({
          name: d.ProductClass,
          value: Number(d.TotalValue),
        }));
        setClassData(formatted);
      })
      .catch((err) => console.error("Error fetching product class data:", err));
  }, []);

  return (
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

export default ValByProductClass;

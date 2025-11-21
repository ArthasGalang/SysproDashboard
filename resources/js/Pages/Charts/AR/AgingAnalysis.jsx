import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import { Bar } from 'react-chartjs-2';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const AgingAnalysis = () => {
    const [warehouseData, setWarehouseData] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/value-by-warehouse")
            .then((res) => res.json())
            .then((data) => {
                const formatted = data.map((d) => ({
                    name: d.Warehouse,
                    value: Number(d.TotalValue),
                }));
                setWarehouseData(formatted);
            })
            .catch((err) => console.error("Error fetching warehouse data:", err));
    }, []);

    return (
        <div className="chart-container">
            <Bar
                data={{
                    labels: warehouseData.map(d => d.name),
                    datasets: [{
                        data: warehouseData.map(d => d.value),
                        backgroundColor: COLORS[3],
                    }]
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                }}
            />
        </div>
    );
};

export default AgingAnalysis;

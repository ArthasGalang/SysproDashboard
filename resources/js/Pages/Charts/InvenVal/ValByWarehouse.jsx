import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import { Bar } from 'react-chartjs-2';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const ValByWarehouse = ({ warehouses = [], productClasses = [] }) => {
    const [warehouseData, setWarehouseData] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (warehouses && warehouses.length) params.set('warehouses', warehouses.join(','));
        if (productClasses && productClasses.length) params.set('product_classes', productClasses.join(','));
        const url = "http://127.0.0.1:8000/api/invenvaldb" + (params.toString() ? `?${params.toString()}` : '');

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                // Aggregate by Warehouse
                const items = Array.isArray(data.data) ? data.data : [];
                const warehouseMap = {};
                items.forEach((item) => {
                    const wh = item.Warehouse || 'Unknown';
                    if (!warehouseMap[wh]) warehouseMap[wh] = 0;
                    warehouseMap[wh] += Number(item.TotalValue) || 0;
                });
                const formatted = Object.entries(warehouseMap).map(([name, value]) => ({ name, value }));
                setWarehouseData(formatted);
            })
            .catch((err) => console.error("Error fetching warehouse data:", err));
    }, [warehouses, productClasses]);

    return (
                <Bar
                    data={{
                        labels: warehouseData.map(d => d.name),
                        datasets: [{
                            label: 'Total Value',
                            data: warehouseData.map(d => d.value),
                            backgroundColor: COLORS[3],
                        }]
                    }}
                    options={{
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                        },
                    }}
                />
    );
};

export default ValByWarehouse;

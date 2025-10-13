import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import { Bar } from 'react-chartjs-2';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const SpendBySupplier = ({ suppliers = [], buyers = [], year = 2021 }) => {
    const [warehouseData, setWarehouseData] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('year', year);
        if (suppliers && suppliers.length) params.set('suppliers', suppliers.join(','));
        if (buyers && buyers.length) params.set('buyers', buyers.join(','));

        fetch(`http://127.0.0.1:8000/api/purchase/spend-by-supplier?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                const formatted = data.map((d) => ({
                    name: d.SupplierName || d.Supplier,
                    value: Number(d.POValue),
                }));
                setWarehouseData(formatted);
            })
            .catch((err) => console.error("Error fetching spend-by-supplier data:", err));
    }, [suppliers, buyers, year]);

    return (
                <Bar
                    data={{
                        labels: warehouseData.map(d => d.name),
                        datasets: [{
                            label: 'Spend (POValue)',
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

export default SpendBySupplier;
import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import OnTimeLateDelivery from './Charts/Purchasing/OnTimeLateDelivery';
import SpendBySupplier from './Charts/Purchasing/SpendBySupplier';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const InvenValDB = () => {
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    const [stats, setStats] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/purchase")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                return response.json();
            })
            .then((data) => {
                setPurchases(data);
                setLoading(false);
                
                const openPOValue = data
                    .filter(po => po.OrderStatus !== 9)
                    .reduce((sum, po) => sum + (Number(po.POValue) || 0), 0);

                const validDeliveries = data.filter(po => po.MLastReceiptDat && po.MLatestDueDate);

                const onTimeCount = validDeliveries.filter(po => {
                    const lastReceipt = new Date(po.MLastReceiptDat);
                    const latestDue = new Date(po.MLatestDueDate);
                    return lastReceipt <= latestDue;
                }).length;

                const totalValid = validDeliveries.length;
                const onTimePercentage = totalValid > 0 ? (onTimeCount / totalValid) * 100 : 0;


                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const mtdCount = data.filter(po => {
                    if (!po.OrderEntryDate) return false;
                    const orderDate = new Date(po.OrderEntryDate);
                    return (
                        orderDate.getMonth() === currentMonth &&
                        orderDate.getFullYear() === currentYear
                    );
                }).length;

                setStats([
                    { label: 'Open Purchase Orders Value', value: `$${openPOValue.toLocaleString()}`, color: 'default' },
                    { label: 'Supplier On-Time Delivery', value: `${onTimePercentage.toFixed(2)}%`, color: 'default' },
                    { label: 'Purchase Price Variance (PPV)', value: `+$`, color: 'green' },
                    { label: 'POs Placed (MTD)', value: mtdCount, color: 'blue' },
                ]);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="dashboard-root">
            <h1 className="dashboard-title">Purchasing Dashboard</h1>
            <div className="dashboard-subtitle">
                Live snapshot of purchase order activity and supplier performance.
            </div>

            {/* Dashboard cards */}
            <div className="dashboard-cards">
                {[
                    { label: 'Open Purchase Orders Value', highlight: false },
                    { label: 'Supplier On-Time Delivery', highlight: false },
                    { label: 'Purchase Price Variance (PPV)', color: 'green' },
                    { label: 'POs Placed (MTD)', color: 'blue' },
                ].map((card, idx) => {
                    const stat = stats.find(s => s.label === card.label);
                    return (
                        <div
                            key={card.label}
                            className={`dashboard-card ${
                                card.color === 'blue'
                                    ? 'dashboard-card-blue'
                                    : card.color === 'green'
                                    ? 'dashboard-card-green'
                                    : ''
                            }`}
                        >
                            <span className="dashboard-card-label">{card.label}</span>
                            <span className="dashboard-card-value">
                                {stat ? stat.value : 'Loading...'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="dashboard-row">
                <div className="dashboard-panel">
                    <div className="dashboard-panel-title">Spend By Supplier (YTD)</div>
                    <div className="dashboard-bar-chart">
                        <SpendBySupplier />
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="dashboard-panel-title">On-Time vs. Late Deliveries</div>
                    <div className="dashboard-doughnut-chart">
                        <OnTimeLateDelivery />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="dashboard-table-panel">
                <div className="dashboard-panel-title">Top 10 Open Purchase Orders By Value</div>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>PO NUMBER</th>
                            <th>SUPPLIER NAME</th>
                            <th>ORDER DATE</th>
                            <th>BUYER</th>
                            <th>PO VALUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>Loading...</td>
                            </tr>
                        ) : purchases.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>No data available</td>
                            </tr>
                        ) : (
                            purchases
                                .sort((a, b) => {
                                    const numA = parseFloat(a.POValue) || 0;
                                    const numB = parseFloat(b.POValue) || 0;
                                    return numB - numA;
                                })
                                .slice(0, 10)
                                .map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.PONumber ?? ""}</td>
                                        <td>{row.SupplierName ?? ""}</td>
                                        <td>{row.OrderEntryDate ?? ""}</td>
                                        <td>{row.Name ?? ""}</td>
                                        <td>
                                            {row.POValue
                                                ? `$${Number(row.POValue).toFixed(2)}`
                                                : ""}
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvenValDB;

import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import OnTimeLateDelivery from './Charts/Purchasing/OnTimeLateDelivery';
import SpendBySupplier from './Charts/Purchasing/SpendBySupplier';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const InvenValDB = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]); 

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stats")
            .then((res) => res.json())
            .then((data) => {
                setStats([
                    { label: 'Open Purchase Orders Value', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null, color: 'default'},
                    { label: 'Supplier On-Time Delivery', value: `${Number(data.SlowMovingStockValue).toLocaleString()}%`, icon: null, color: 'default' },
                    { label: 'Purchase Price Variance (PPV)', value: `+$${Number(data.SlowMovingStockValue).toLocaleString()}`, icon: null , color: 'green'},
                    { label: 'POs Placed (MTD)', value: data.SlowMovingStockValue, icon: null, color: 'blue' },
                ]);
            })
            .catch((err) => console.error("Error fetching stats:", err));
    }, []);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stocks")
            .then((response) => response.json())
            .then((data) => {
                const sortedStocks = data
                    .sort((a, b) => (Number(b.TotalValue) || 0) - (Number(a.TotalValue) || 0))
                    .slice(0, 10);
                setStocks(sortedStocks);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching stocks:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="dashboard-root">
            <h1 className="dashboard-title">Purchasing Dashboard</h1>
            <div className="dashboard-subtitle">
                Live snapshot of accounts receivable and customer debt.
            </div>

            {/* Dashboard cards */}
            <div className="dashboard-cards">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                          className={`dashboard-card ${
                                stat.color === 'blue' ? 'dashboard-card-blue' :
                                stat.color === 'green' ? 'dashboard-card-green' : ''
                            }`}
                    >
                        <span className="dashboard-card-label">{stat.label}</span>
                        <span className="dashboard-card-value">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Row with charts */}
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
                            <th>DESCRIPTION</th>
                            <th>QTY ON HAND</th>
                            <th>UNIT COST</th>
                            <th>TOTAL VALUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>Loading...</td>
                            </tr>
                        ) : stocks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>No data available</td>
                            </tr>
                        ) : (
                            stocks.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.StockCode ?? ""}</td>
                                    <td>{row.ProductDescription ?? ""}</td>
                                    <td>{Number(row.QtyOnHand ?? 0).toLocaleString()}</td>
                                    <td>{row.UnitCost ? `$${Number(row.UnitCost).toFixed(2)}` : ""}</td>
                                    <td>{row.TotalValue ? `$${Number(row.TotalValue).toFixed(2)}` : ""}</td>
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

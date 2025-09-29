import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import AgingAnalysis from './Charts/AR/AgingAnalysis';
import CurrentOverdue from './Charts/AR/CurrentOverdue';

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
                    { label: 'Total A/R Outstanding', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null },
                    { label: 'Overdue Invoices (%)', value: `${Number(data.TotalQuantityOnHand).toLocaleString()}%`, icon: null },
                    { label: 'Avg. Overdue Days', value: data.UniqueStockCodes, icon: null },
                    { label: 'A/R Over 90 Days', value: `$${Number(data.SlowMovingStockValue).toLocaleString()}`, icon: null, highlight: true },
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
            <h1 className="dashboard-title">A/R Dashboard</h1>
            <div className="dashboard-subtitle">
                Live snapshot of accounts receivable and customer debt.
            </div>

            {/* Dashboard cards */}
            <div className="dashboard-cards">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={`dashboard-card${stat.highlight ? ' dashboard-card-red' : ''}`}
                    >
                        <span className="dashboard-card-label">{stat.label}</span>
                        <span className="dashboard-card-value">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Row with charts */}
            <div className="dashboard-row">
                <div className="dashboard-panel">
                    <div className="dashboard-panel-title">A/R Aging Analysis</div>
                    <div className="dashboard-bar-chart">
                        <AgingAnalysis />
                    </div>
                </div>

                <div className="dashboard-panel">
                <div className="dashboard-panel-title">Current vs. Overdue</div>
                    <div className="dashboard-doughnut-chart"> 
                        <CurrentOverdue />
                    </div>
                </div>

            </div>


            {/* Table */}
            <div className="dashboard-table-panel">
                <div className="dashboard-panel-title">Top 10 Overdue Customers</div>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>STOCK CODE</th>
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

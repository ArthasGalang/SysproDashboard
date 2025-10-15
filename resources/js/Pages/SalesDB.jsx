import React, { useEffect, useState } from 'react';
import FloatingButton from '../Components/FloatingButton';
import '../../css/dashboard.css';
import SalesTrendChart from './Charts/Sales/SalesTrendChart';
import SalesBySalesperson from './Charts/Sales/SalesBySalesperson';


const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const Dashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]); // now dynamic

    // Stats (cards)
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stats")
            .then((res) => res.json())
            .then((data) => {
                setStats([
                    { label: 'Sales (Month-To-Date)', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null },
                    { label: 'Open Orders Value', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null },
                    { label: 'Average Order Value (MTD)', value: `$${Number(data.UniqueStockCodes).toLocaleString()}`, icon: null},
                    { label: 'New Customers (MTD)', value: data.UniqueStockCodes, icon: null, highlight: true },
                ]);
            })
            .catch((err) => console.error("Error fetching stats:", err));
    }, []);


    // Stock table
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
            <h1 className="dashboard-title">Sales Dashboard</h1>
            <div className="dashboard-subtitle">
                Live overview of sales performance and open orders.
            </div>

            {/* Dashboard cards */}
            <div className="dashboard-cards">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={`dashboard-card${stat.highlight ? ' dashboard-card-blue' : ''}`}
                    >
                        <span className="dashboard-card-label">{stat.label}</span>
                        <span className="dashboard-card-value">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Row with charts */}
            <div className="dashboard-row">
                {/* Bar chart on the left card*/}
                <div className="dashboard-panel">
                    <div className="dashboard-panel-title">Sales Trend (Last 6 Months)</div>
                    <div className="dashboard-bar-chart">
                        <SalesTrendChart />
                    </div>
                </div>

                <div className="dashboard-panel">
                <div className="dashboard-panel-title">Sales by Salesperson (MTD)</div>
                    <div className="dashboard-doughnut-chart"> 
                        <SalesBySalesperson />
                    </div>
                </div>

            </div>
            {/* Table */}
            <div className="dashboard-table-panel">
                <div className="dashboard-panel-title">Top 10 Open Orders By Value</div>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>ORDER ID</th>
                            <th>CUSTOMER NAME</th>
                            <th>ORDER DATE</th>
                            <th>SALESPERSON</th>
                            <th>ORDER VALUE</th>
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
            <FloatingButton iconType="menu" />
        </div>
    );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import '../../css/dashboard.css';
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const Dashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]); 
    const [stats, setStats] = useState([]); // now dynamic

    // ProductClass distribution
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/value-by-class")
            .then((res) => res.json())
            .then((data) => {
                const formatted = data.map((d) => ({
                    name: d.ProductClass,
                    value: Number(d.TotalValue), // 👈 use total value instead of count
                }));
                setChartData(formatted);
            })
            .catch((err) => console.error("Error:", err));
    }, []);


    // Stats (cards)
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stats")
            .then((res) => res.json())
            .then((data) => {
                setStats([
                    { label: 'Total Inventory Value', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null },
                    { label: 'Total Quantity on Hand', value: Number(data.TotalQuantityOnHand).toLocaleString(), icon: null },
                    { label: 'Unique Stock Codes', value: data.UniqueStockCodes, icon: null },
                    { label: 'Slow-Moving Stock Value', value: `$${Number(data.SlowMovingStockValue).toLocaleString()}`, icon: null, highlight: true },
                ]);
            })
            .catch((err) => console.error("Error fetching stats:", err));
    }, []);

    // Stock table
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stocks")
            .then((response) => response.json())
            .then((data) => {
                setStocks(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching stocks:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="dashboard-root">
            <h1 className="dashboard-title">Inventory Valuation Dashboard</h1>
            <div className="dashboard-subtitle">
                Live snapshot of inventory value and key metrics.
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
                    <div className="dashboard-panel-title">Value by Warehouse</div>
                    <div className="dashboard-bar-chart">
                        <svg width="100%" height="180">
                            <rect x="30" y="40" width="50" height="120" fill="#6cb2eb" />
                            <rect x="100" y="20" width="50" height="140" fill="#6cb2eb" />
                            <rect x="170" y="100" width="50" height="60" fill="#6cb2eb" />
                            <rect x="240" y="150" width="50" height="10" fill="#6cb2eb" />
                            <text x="45" y="175" fontSize="12">FG</text>
                            <text x="115" y="175" fontSize="12">RAW</text>
                            <text x="185" y="175" fontSize="12">WIP</text>
                            <text x="255" y="175" fontSize="12">OBS</text>
                        </svg>
                    </div>
                </div>

                <div className="dashboard-panel">
                <div className="dashboard-panel-title">Value by Product Class</div>

                <div style={{ display: "flex", alignItems: "flex-start" }}>
                    {/* Pie chart on the left */}
                    <PieChart width={250} height={250}>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}  // smaller outer radius
                        innerRadius={50}  // smaller inner radius
                        label={false}     // remove labels
                    >
                        {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${(index * 360) / chartData.length}, 70%, 50%)`} // unique color
                        />
                        ))}
                    </Pie>
                    <Tooltip formatter={(val) => `$${Number(val).toLocaleString()}`} />
                    </PieChart>

                    {/* Glossary (legend) on the right, 2 columns */}
                    <div style={{ marginLeft: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {chartData.map((entry, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "center" }}>
                        <div
                            style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor: `hsl(${(index * 360) / chartData.length}, 70%, 50%)`,
                            marginRight: "8px",
                            borderRadius: "3px",
                            }}
                        ></div>
                        <span style={{ fontSize: "14px" }}>
                            {entry.name}: <strong>${Number(entry.value).toLocaleString()}</strong>
                        </span>
                        </div>
                    ))}
                    </div>
                </div>
                </div>

            </div>
            {/* Table */}
            <div className="dashboard-table-panel">
                <div className="dashboard-panel-title">All Inventory Items</div>
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

export default Dashboard;

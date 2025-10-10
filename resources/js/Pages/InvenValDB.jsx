import React, { useEffect, useState } from 'react';
import '@css/dashboard.css';
import ValByProductClass from './Charts/InvenVal/ValByProductClass';
import ValByWarehouse from './Charts/InvenVal/ValByWarehouse'


const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const InvenValDB = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]); 
    const [warehouse, setWarehouse] = useState('');
    const [productClass, setProductClass] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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
            <div className="dashboard-container">
                <h1 className="dashboard-title">Inventory Valuation Dashboard</h1>
                <div className="dashboard-subtitle">
                    Live snapshot of inventory value and key metrics.
                </div>

            {/*Filter card*/}
            <div className="dashboard-table-panel-top">
                <div>
                    <div className="dashboard-panel-title-filter">Filters</div>        
                    <div className="dashboardFilterClose">
                        <button>Hide</button>
                    </div>

                </div>
                {/* Filter form - UI only (no filtering logic yet) */}
                <div className="dashboard-filters">
                    <div className="filter-item">
                        <label htmlFor="warehouse-select" className="filter-label">Warehouse</label>
                        <select id="warehouse-select" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                            <option value="">All</option>
                            <option value="WH-001">WH-001</option>
                            <option value="WH-002">WH-002</option>
                            <option value="WH-003">WH-003</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="product-class-select" className="filter-label">Product Class</label>
                        <select id="product-class-select" value={productClass} onChange={(e) => setProductClass(e.target.value)}>
                            <option value="">All</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label className="filter-label">Date From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    <div className="filter-item">
                        <label className="filter-label">Date To</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>

                    <div className="filter-actions">
                        <button type="button" onClick={() => {/* TODO: apply filters */}} className="btn-primary">Apply</button>
                        <button type="button" onClick={() => { setWarehouse(''); setProductClass(''); setDateFrom(''); setDateTo(''); }} className="btn-secondary">Reset</button>
                    </div>
                </div>
            </div>


            {/* Dashboard cards */}
            <div className="dashboard-cards">
                {[
                    { label: 'Total Inventory Value', highlight: false },
                    { label: 'Total Quantity on Hand', highlight: false },
                    { label: 'Unique Stock Codes', highlight: false },
                    { label: 'Slow-Moving Stock Value', highlight: true },
                ].map((card, idx) => {
                    const stat = stats.find(s => s.label === card.label);
                    return (
                        <div
                            key={card.label}
                            className={`dashboard-card${card.highlight ? ' dashboard-card-red' : ''}`}
                        >
                            <span className="dashboard-card-label">{card.label}</span>
                            <span className="dashboard-card-value">{stat ? stat.value : 'Loading...'}</span>
                        </div>
                    );
                })}
            </div>

            {/* Row with charts */}
            <div className="dashboard-row">
                <div className="dashboard-panel">
                    <div className="dashboard-panel-title">Value by Warehouse</div>
                    <div className="dashboard-bar-chart">
                        <ValByWarehouse />
                    </div>
                </div>

                <div className="dashboard-panel">
                <div className="dashboard-panel-title">Value by Product Class</div>
                    <div className="dashboard-doughnut-chart"> 
                        <ValByProductClass />
                    </div>
                </div>

            </div>


            {/* Table */}
            <div className="dashboard-table-panel">
                <div className="dashboard-panel-title">Top 10 Inventory Items by Value</div>
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
        </div>
    );
};

export default InvenValDB;

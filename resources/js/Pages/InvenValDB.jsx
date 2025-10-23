import React, { useEffect, useState, useRef } from 'react';
import FloatingButton from '../Components/FloatingButton';
import Select from 'react-select';
import '@css/dashboard.css';
import ValByProductClass from './Charts/InvenVal/ValByProductClass';
import ValByWarehouse from './Charts/InvenVal/ValByWarehouse'
import LoadingModal from '../Components/LoadingModal';


const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const InvenValDB = () => {
    const [stocks, setStocks] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'TotalValue', direction: 'desc' });
    const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
    const [loading, setLoading] = useState(true);
    // Track active fetches to reliably show/hide global fetching modal
    const [fetching, setFetching] = useState(true); // true on initial load
    const fetchCounterRef = useRef(0);
    const [manualFetching, setManualFetching] = useState(false);
    const [stats, setStats] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [selectedProductClasses, setSelectedProductClasses] = useState([]);
    const [appliedWarehouses, setAppliedWarehouses] = useState([]);
    const [appliedProductClasses, setAppliedProductClasses] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [productClasses, setProductClasses] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedWarehouses && appliedWarehouses.length) params.set('warehouses', appliedWarehouses.join(','));
        if (appliedProductClasses && appliedProductClasses.length) params.set('product_classes', appliedProductClasses.join(','));
        const url = "http://127.0.0.1:8000/api/invenvaldb" + (params.toString() ? `?${params.toString()}` : '');

        // increment fetch counter and show modal
        fetchCounterRef.current += 1;
        setFetching(true);

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                setStats([
                    { label: 'Total Inventory Value', value: `$${Number(data.TotalInventoryValue).toLocaleString()}`, icon: null },
                    { label: 'Total Quantity on Hand', value: Number(data.TotalQuantityOnHand).toLocaleString(), icon: null },
                    { label: 'Unique Stock Codes', value: data.UniqueStockCodes, icon: null },
                    { label: 'Slow-Moving Stock Value', value: `$${Number(data.SlowMovingStockValue).toLocaleString()}`, icon: null, highlight: true },
                ]);
            })
            .catch((err) => console.error("Error fetching stats:", err))
            .finally(() => {
                fetchCounterRef.current = Math.max(0, fetchCounterRef.current - 1);
                if (fetchCounterRef.current === 0) {
                    setFetching(false);
                    setManualFetching(false);
                }
            });
    }, [appliedWarehouses, appliedProductClasses]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedWarehouses && appliedWarehouses.length) params.set('warehouses', appliedWarehouses.join(','));
        if (appliedProductClasses && appliedProductClasses.length) params.set('product_classes', appliedProductClasses.join(','));
        const url = "http://127.0.0.1:8000/api/invenvaldb" + (params.toString() ? `?${params.toString()}` : '');

        // increment fetch counter and show modal
        fetchCounterRef.current += 1;
        setFetching(true);

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                const items = Array.isArray(data.data) ? data.data : [];
                setStocks(items);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching stocks:", error);
                setLoading(false);
            })
            .finally(() => {
                fetchCounterRef.current = Math.max(0, fetchCounterRef.current - 1);
                if (fetchCounterRef.current === 0) {
                    setFetching(false);
                    setManualFetching(false);
                }
            });
    }, [appliedWarehouses, appliedProductClasses]);

    // Merging (deduplication & aggregation)
    const mergedStocks = React.useMemo(() => {
        if (!stocks || stocks.length === 0) return [];
        const map = new Map();
        stocks.forEach((row) => {
            const key = `${row.StockCode}|${row.UnitCost}`;
            if (!map.has(key)) {
                map.set(key, { ...row });
            } else {
                const agg = map.get(key);
                agg.QtyOnHand = (Number(agg.QtyOnHand) || 0) + (Number(row.QtyOnHand) || 0);
                agg.TotalValue = (Number(agg.TotalValue) || 0) + (Number(row.TotalValue) || 0);
            }
        });
        return Array.from(map.values());
    }, [stocks]);

    // Filtering (out of stock)
    const filteredStocks = React.useMemo(() => {
        if (!excludeOutOfStock) return mergedStocks;
        return mergedStocks.filter(row => Number(row.QtyOnHand) > 0);
    }, [mergedStocks, excludeOutOfStock]);

    // Sorting
    const sortableColumns = {
        QtyOnHand: true,
        UnitCost: true,
        TotalValue: true,
    };
    const sortedStocks = React.useMemo(() => {
        if (!filteredStocks || filteredStocks.length === 0) return [];
        const { key, direction } = sortConfig;
        if (!sortableColumns[key]) return filteredStocks.slice(0, 10);
        const sorted = [...filteredStocks].sort((a, b) => {
            const aVal = Number(a[key]) || 0;
            const bVal = Number(b[key]) || 0;
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted.slice(0, 10);
    }, [filteredStocks, sortConfig]);

    const handleSort = (key) => {
        if (!sortableColumns[key]) return;
        setSortConfig((prev) => {
            if (prev.key === key) {
                // Toggle direction
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            } else {
                // New sort key, default to descending
                return { key, direction: 'desc' };
            }
        });
    };

    useEffect(() => {
        fetchCounterRef.current += 1;
        setFetching(true);
        fetch("http://127.0.0.1:8000/api/invenvaldb")
            .then((res) => res.json())
            .then((data) => {
                const items = Array.isArray(data.data) ? data.data : [];
                const warehouseSet = new Set();
                const productClassSet = new Set();
                items.forEach((item) => {
                    if (item.Warehouse) warehouseSet.add(item.Warehouse);
                    if (item.ProductClass) productClassSet.add(item.ProductClass);
                });
                setWarehouses(Array.from(warehouseSet));
                setProductClasses(Array.from(productClassSet));
            })
            .catch((err) => console.error("Error fetching filter options:", err))
            .finally(() => {
                fetchCounterRef.current = Math.max(0, fetchCounterRef.current - 1);
                if (fetchCounterRef.current === 0) setFetching(false);
            });
    }, []);

    // Reusable LoadingModal imported from components

    const PortalSelect = (props) => {
        const wrapperRef = useRef(null);
        const [width, setWidth] = useState(null);

        useEffect(() => {
            const update = () => {
                if (wrapperRef.current) setWidth(wrapperRef.current.offsetWidth);
            };
            update();
            window.addEventListener('resize', update);
            return () => window.removeEventListener('resize', update);
        }, []);

        const userStyles = props.styles || {};
        const mergedStyles = {
            ...userStyles,
            menuPortal: (base, state) => {
                const baseResult = userStyles.menuPortal ? userStyles.menuPortal(base, state) : base;
                return { ...baseResult, zIndex: 9999 };
            },
            menu: (base, state) => {
                const baseResult = userStyles.menu ? userStyles.menu(base, state) : base;
                return { ...baseResult, width: width ? width : baseResult.width };
            },
        };

        return (
            <div ref={wrapperRef} style={{ display: 'inline-block', width: '100%' }}>
                <Select
                    {...props}
                    styles={mergedStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                />
            </div>
        );
    };

    return (
        <div className="dashboard-root">
            <LoadingModal visible={fetching || manualFetching} text={manualFetching ? 'Fetching data' : 'Fetching data'} />
            <div className="dashboard-container">
                {/* ...existing dashboard content... */}
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="dashboard-title">Inventory Valuation Dashboard</h1>
                        <div className="dashboard-subtitle">
                            Live snapshot of inventory value and key metrics.
                        </div>
                    </div>
                    {!showFilters && (
                        <>
                            {/* Desktop Filter Button */}
                            <div className="dashboard-header-filter-btn" style={{ position: 'relative', zIndex: 1002, marginLeft: 'auto', display: window.innerWidth > 600 ? 'block' : 'none' }}>
                                <button className="btn-primary" onClick={() => setShowFilters(true)}>Filter</button>
                            </div>
                            {/* Mobile Filter Card */}
                            <div
                                className="dashboard-header-filter-mobile"
                                style={{
                                    display: window.innerWidth <= 600 ? 'block' : 'none',
                                    width: '100%',
                                    borderRadius: '16px',
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    margin: '0.5rem 0',
                                    padding: '0.5rem 0',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 1002,
                                }}
                                onClick={() => setShowFilters(true)}
                            >
                                Filters
                                <div style={{ fontSize: '1rem', marginTop: '0.1rem', color: '#222' }}>&#x25BC;</div>
                            </div>
                        </>
                    )}
                </div>

                <div className={`dashboard-table-panel-top filter-panel ${showFilters ? 'open' : ''}`} aria-hidden={!showFilters}>
                    <div>
                        <div className="dashboard-panel-title-filter">Filters</div>
                        <div className="dashboardFilterClose">
                            <button onClick={() => setShowFilters(false)}>Hide</button>
                        </div>
                    </div>
                    <div className="dashboard-filters">
                        <div className="filter-item">
                            <label className="filter-label">Warehouse</label>
                            <PortalSelect
                                isMulti
                                options={warehouses.map(w => ({ value: w, label: w }))}
                                value={selectedWarehouses}
                                onChange={setSelectedWarehouses}
                                placeholder="Select warehouses"
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Product Class</label>
                            <PortalSelect
                                isMulti
                                options={productClasses.map(c => ({ value: c, label: c }))}
                                value={selectedProductClasses}
                                onChange={setSelectedProductClasses}
                                placeholder="Select product classes"
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
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
                            <button
                                type="button"
                                onClick={() => {
                                    setManualFetching(true);
                                    setFetching(true);
                                    setAppliedWarehouses(selectedWarehouses.map(s => s.value));
                                    setAppliedProductClasses(selectedProductClasses.map(s => s.value));
                                }}
                                className="btn-primary"
                            >Apply</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedWarehouses([]);
                                    setSelectedProductClasses([]);
                                    setDateFrom('');
                                    setDateTo('');
                                    setAppliedWarehouses([]);
                                    setAppliedProductClasses([]);
                                }}
                                className="btn-secondary"
                            >Reset</button>
                        </div>
                    </div>
                </div>

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

                <div className="dashboard-row">
                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">Value by Warehouse</div>
                        <div className="dashboard-bar-chart">
                            <ValByWarehouse warehouses={appliedWarehouses} productClasses={appliedProductClasses} />
                        </div>
                    </div>

                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">Value by Product Class</div>
                        <div className="dashboard-doughnut-chart">
                            <ValByProductClass warehouses={appliedWarehouses} productClasses={appliedProductClasses} />
                        </div>
                    </div>
                </div>

                <div className="dashboard-table-panel">
                    <div className="dashboard-panel-title">Top 10 Inventory Items</div>
                    <div style={{ marginBottom: 8 }}>
                        <label style={{ fontWeight: 400, fontSize: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={excludeOutOfStock}
                                onChange={e => setExcludeOutOfStock(e.target.checked)}
                                style={{ marginRight: 6 }}
                            />
                            Exclude out of stock items
                        </label>
                    </div>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>STOCK CODE</th>
                                <th>DESCRIPTION</th>
                                <th
                                    style={{ cursor: sortableColumns.QtyOnHand ? 'pointer' : 'default' }}
                                    onClick={() => handleSort('QtyOnHand')}
                                >
                                    QTY ON HAND
                                    {sortConfig.key === 'QtyOnHand' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                                <th
                                    style={{ cursor: sortableColumns.UnitCost ? 'pointer' : 'default' }}
                                    onClick={() => handleSort('UnitCost')}
                                >
                                    UNIT COST
                                    {sortConfig.key === 'UnitCost' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                                <th
                                    style={{ cursor: sortableColumns.TotalValue ? 'pointer' : 'default' }}
                                    onClick={() => handleSort('TotalValue')}
                                >
                                    TOTAL VALUE
                                    {sortConfig.key === 'TotalValue' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="dashboard-table-value" style={{ textAlign: "center" }}>Loading...</td>
                                </tr>
                            ) : sortedStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="dashboard-table-value" style={{ textAlign: "center" }}>No data available</td>
                                </tr>
                            ) : (
                                sortedStocks.map((row, idx) => (
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
            <FloatingButton iconType="menu" />
        </div>
    );
};

export default InvenValDB;

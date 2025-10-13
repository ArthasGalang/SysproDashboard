import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import '@css/dashboard.css';
import OnTimeLateDelivery from './Charts/Purchasing/OnTimeLateDelivery';
import SpendBySupplier from './Charts/Purchasing/SpendBySupplier';
import LoadingModal from '../Components/LoadingModal';

const COLORS = ["#38c172", "#f6ad55", "#e3342f", "#6cb2eb"];

const InvenValDB = () => {
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    const [stats, setStats] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [selectedBuyers, setSelectedBuyers] = useState([]);
    const [appliedSuppliers, setAppliedSuppliers] = useState([]);
    const [appliedBuyers, setAppliedBuyers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedSuppliers && appliedSuppliers.length) params.set('suppliers', appliedSuppliers.join(','));
        if (appliedBuyers && appliedBuyers.length) params.set('buyers', appliedBuyers.join(','));
        const url = "http://127.0.0.1:8000/api/purchase" + (params.toString() ? `?${params.toString()}` : '');

        fetch(url)
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
    }, [appliedSuppliers, appliedBuyers]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/purchase")
            .then((res) => res.json())
            .then((data) => {
                const uniqueSuppliers = Array.from(new Set(data.map(d => d.SupplierName).filter(Boolean)));
                const uniqueBuyers = Array.from(new Set(data.map(d => d.Buyer).filter(Boolean)));
                setSuppliers(uniqueSuppliers);
                setBuyers(uniqueBuyers);
            })
            .catch(() => {
            });
    }, []);

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
            <LoadingModal visible={loading} text={loading ? 'Fetching data' : ''} />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Purchasing Dashboard</h1>
                        <div className="dashboard-subtitle">
                            Live snapshot of purchase order activity and supplier performance.
                        </div>
                    </div>
                    {!showFilters && (
                        <div className="dashboard-header-filter-btn">
                            <button className="btn-primary" onClick={() => setShowFilters(true)}>Filter</button>
                        </div>
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
                            <label className="filter-label">Supplier</label>
                            <PortalSelect
                                isMulti
                                options={suppliers.map(s => ({ value: s, label: s }))}
                                value={selectedSuppliers}
                                onChange={setSelectedSuppliers}
                                placeholder="Select suppliers"
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Buyer</label>
                            <PortalSelect
                                isMulti
                                options={buyers.map(b => ({ value: b, label: b }))}
                                value={selectedBuyers}
                                onChange={setSelectedBuyers}
                                placeholder="Select buyers"
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
                                    setLoading(true);
                                    setAppliedSuppliers(selectedSuppliers.map(s => s.value));
                                    setAppliedBuyers(selectedBuyers.map(s => s.value));
                                }}
                                className="btn-primary"
                            >Apply</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoading(true);
                                    setSelectedSuppliers([]);
                                    setSelectedBuyers([]);
                                    setDateFrom('');
                                    setDateTo('');
                                    setAppliedSuppliers([]);
                                    setAppliedBuyers([]);
                                }}
                                className="btn-secondary"
                            >Reset</button>
                        </div>
                    </div>
                </div>

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
                                className={`dashboard-card${card.color === 'blue' ? ' dashboard-card-blue' : card.color === 'green' ? ' dashboard-card-green' : ''}`}
                            >
                                <span className="dashboard-card-label">{card.label}</span>
                                <span className="dashboard-card-value">{stat ? stat.value : 'Loading...'}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="dashboard-row">
                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">Spend By Supplier (YTD)</div>
                        <div className="dashboard-bar-chart">
                            <SpendBySupplier suppliers={appliedSuppliers} buyers={appliedBuyers} />
                        </div>
                    </div>

                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">On-Time vs. Late Deliveries</div>
                        <div className="dashboard-doughnut-chart">
                            <OnTimeLateDelivery suppliers={appliedSuppliers} buyers={appliedBuyers} />
                        </div>
                    </div>
                </div>

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
                                    <td colSpan="5" className="dashboard-table-value" style={{ textAlign: "center" }}>Loading...</td>
                                </tr>
                            ) : purchases.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="dashboard-table-value" style={{ textAlign: "center" }}>No data available</td>
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
                                            <td>{row.POValue ? `$${Number(row.POValue).toFixed(2)}` : ""}</td>
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

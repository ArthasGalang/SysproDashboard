import React, { useEffect, useState, useRef } from 'react';
import FloatingButton from '../Components/FloatingButton';
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
    const [appliedDateFrom, setAppliedDateFrom] = useState('');
    const [appliedDateTo, setAppliedDateTo] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'POValue', direction: 'desc' });

    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedSuppliers && appliedSuppliers.length) params.set('suppliers', appliedSuppliers.join(','));
        if (appliedBuyers && appliedBuyers.length) params.set('buyers', appliedBuyers.join(','));
        if (appliedDateFrom) params.set('dateFrom', appliedDateFrom);
        if (appliedDateTo) params.set('dateTo', appliedDateTo);
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

                // PPV Calculation
                const totalCurGrnValue = data.reduce((sum, po) => sum + (Number(po.TotalCurGrnValue) || 0), 0);
                const totalOrigPurchaseValue = data.reduce((sum, po) => sum + (Number(po.TotalOrigPurchaseValue) || 0), 0);
                const ppv = totalOrigPurchaseValue - totalCurGrnValue;

                let ppvDisplay = '';
                let ppvColor = '';
                if (ppv > 0) {
                    ppvDisplay = `+$${ppv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    ppvColor = '#38c172';
                } else if (ppv < 0) {
                    ppvDisplay = `-$${Math.abs(ppv).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    ppvColor = 'red';
                } else {
                    ppvDisplay = `$0.00`;
                    ppvColor = 'default';
                }

                // POs placed count: if a date range is applied, count POs inside that range,
                // otherwise default to Month-To-Date (current month/year)
                const parseDate = (d) => {
                    if (!d) return null;
                    const dt = new Date(d);
                    return isNaN(dt.getTime()) ? null : dt;
                };

                let mtdCount = 0;
                if (appliedDateFrom || appliedDateTo) {
                    const from = appliedDateFrom ? parseDate(appliedDateFrom) : null;
                    const to = appliedDateTo ? parseDate(appliedDateTo) : null;
                    mtdCount = data.filter(po => {
                        if (!po.OrderEntryDate) return false;
                        const od = parseDate(po.OrderEntryDate);
                        if (!od) return false;
                        if (from && od < from) return false;
                        if (to && od > to) return false;
                        return true;
                    }).length;
                } else {
                    // no date filter applied -> count all purchases returned by the API
                    mtdCount = data.length;
                }

                setStats([
                    { label: 'Open Purchase Orders Value', value: `$${openPOValue.toLocaleString()}`, color: 'default' },
                    { label: 'Supplier On-Time Delivery', value: `${onTimePercentage.toFixed(2)}%`, color: 'default' },
                    { label: 'Purchase Price Variance (PPV)', value: ppvDisplay, color: ppvColor },
                    { label: 'POs Placed', value: mtdCount, color: 'blue' },
                ]);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, [appliedSuppliers, appliedBuyers, appliedDateFrom, appliedDateTo]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/purchase")
            .then((res) => res.json())
            .then((data) => {
                // Build supplier options as { value: Supplier (code), label: SupplierName }
                const supplierMap = {};
                const buyerMap = {};
                data.forEach(d => {
                    if (d.Supplier) supplierMap[d.Supplier] = d.SupplierName || d.Supplier;
                    if (d.Buyer) buyerMap[d.Buyer] = d.BuyerName || d.Buyer;
                });

                const supplierOptions = Object.keys(supplierMap).map(k => ({ value: k, label: supplierMap[k] }));
                const buyerOptions = Object.keys(buyerMap).map(k => ({ value: k, label: buyerMap[k] }));

                setSuppliers(supplierOptions);
                setBuyers(buyerOptions);
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

    const sortableColumns = {
        SupplierName: true,
        OrderEntryDate: true,
        BuyerName: true,
        POValue: true,
    };

    const handleSort = (key) => {
        if (!sortableColumns[key]) return;
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const sortedPurchases = React.useMemo(() => {
        if (!purchases || purchases.length === 0) return [];
        const key = sortConfig.key;
        const dir = sortConfig.direction === 'asc' ? 1 : -1;

        const sorted = [...purchases].sort((a, b) => {
            const va = a[key];
            const vb = b[key];
            // Numeric sort for POValue
            if (key === 'POValue') {
                const na = Number(va) || 0;
                const nb = Number(vb) || 0;
                return (na - nb) * dir;
            }
            // Date sort for OrderEntryDate
            if (key === 'OrderEntryDate') {
                const da = va ? new Date(va) : new Date(0);
                const db = vb ? new Date(vb) : new Date(0);
                return (da - db) * dir;
            }
            // String fallback
            const sa = (va || '').toString().toLowerCase();
            const sb = (vb || '').toString().toLowerCase();
            if (sa < sb) return -1 * dir;
            if (sa > sb) return 1 * dir;
            return 0;
        });
        return sorted;
    }, [purchases, sortConfig]);

    return (
        <div className="dashboard-root">
            <LoadingModal visible={loading} text={loading ? 'Fetching data' : ''} />
            <div className="dashboard-container">
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="dashboard-title">Purchasing Dashboard</h1>
                        <div className="dashboard-subtitle">
                            Live snapshot of purchase order activity and supplier performance.
                        </div>
                    </div>
                    {!showFilters && (
                        <>
                            {/* Desktop Filter Button */}
                            <div className="dashboard-header-filter-btn" style={{ position: 'relative', zIndex: 1002, marginLeft: 'auto', display: window.innerWidth > 600 ? 'block' : 'none' }}>
                                <button
                                    className="btn-primary"
                                    style={{ zIndex: 1003, position: 'relative', touchAction: 'manipulation' }}
                                    onClick={() => setShowFilters(true)}
                                >Filter</button>
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
                    <div style={{ position: 'relative', zIndex: 1001, pointerEvents: 'auto' }}>
                        <div className="dashboard-panel-title-filter">Filters</div>
                        <div className="dashboardFilterClose">
                            <button style={{ zIndex: 1002, position: 'relative', touchAction: 'manipulation' }} onClick={() => setShowFilters(false)}>Hide</button>
                        </div>
                    </div>
                    <div className="dashboard-filters">
                        <div className="filter-item">
                            <label className="filter-label">Supplier</label>
                            <PortalSelect
                                isMulti
                                options={suppliers}
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
                                options={buyers}
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
                                    setAppliedDateFrom(dateFrom);
                                    setAppliedDateTo(dateTo);
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
                                    setAppliedDateFrom('');
                                    setAppliedDateTo('');
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
                        { label: 'Purchase Price Variance (PPV)', color: null },
                        { label: 'POs Placed', color: 'blue' },
                    ].map((card, idx) => {
                        const stat = stats.find(s => s.label === card.label);
                        let valueElem;
                        if (card.label === 'Purchase Price Variance (PPV)' && stat) {
                            valueElem = (
                                <span className="dashboard-card-value" style={{ color: stat.color === '#38c172' ? '#38c172' : stat.color === 'red' ? 'red' : undefined }}>
                                    {stat.value}
                                </span>
                            );
                        } else {
                            valueElem = (
                                <span className="dashboard-card-value">{stat ? stat.value : 'Loading...'}</span>
                            );
                        }
                        return (
                            <div
                                key={card.label}
                                className={`dashboard-card${card.color === 'blue' ? ' dashboard-card-blue' : card.color === '#38c172' ? ' dashboard-card-green' : ''}`}
                            >
                                <span className="dashboard-card-label">{card.label}</span>
                                {valueElem}
                            </div>
                        );
                    })}
                </div>

                <div className="dashboard-row">
                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">Spend By Supplier</div>
                        <div className="dashboard-bar-chart">
                            <SpendBySupplier
                                suppliers={appliedSuppliers}
                                buyers={appliedBuyers}
                                dateFrom={appliedDateFrom}
                                dateTo={appliedDateTo}
                            />
                        </div>
                    </div>

                    <div className="dashboard-panel">
                        <div className="dashboard-panel-title">On-Time vs. Late Deliveries</div>
                        <div className="dashboard-doughnut-chart">
                            <OnTimeLateDelivery
                                suppliers={appliedSuppliers}
                                buyers={appliedBuyers}
                                dateFrom={appliedDateFrom}
                                dateTo={appliedDateTo}
                            />
                        </div>
                    </div>
                </div>

                <div className="dashboard-table-panel">
                    <div className="dashboard-panel-title">Top 10 Open Purchase Orders</div>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>PO NUMBER</th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort('SupplierName')}
                                >
                                    SUPPLIER NAME
                                    {sortConfig.key === 'SupplierName' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort('OrderEntryDate')}
                                >
                                    ORDER DATE
                                    {sortConfig.key === 'OrderEntryDate' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort('BuyerName')}
                                >
                                    BUYER
                                    {sortConfig.key === 'BuyerName' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort('POValue')}
                                >
                                    PO VALUE
                                    {sortConfig.key === 'POValue' && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                                </th>
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
                                sortedPurchases
                                    .slice(0, 10)
                                    .map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.PONumber ?? ""}</td>
                                            <td>{row.SupplierName ?? ""}</td>
                                            <td>{row.OrderEntryDate ?? ""}</td>
                                            <td>{row.BuyerName ?? ""}</td>
                                            <td>{row.POValue ? `$${Number(row.POValue).toFixed(2)}` : ""}</td>
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

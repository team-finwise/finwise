import { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  fetchTransactions,
  fetchTransactionSummary,
  createTransaction,
  deleteTransaction,
  seedSampleTransactions,
  resetAllTransactions,
  importBankStatement,
  parseBankSms,
  seedBankPassbook,
} from '../lib/api';
import { formatRupee } from '../lib/formatters';

const CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Education',
  'Healthcare',
  'Entertainment',
  'Subscriptions',
  'Debt',
  'Savings',
  'Salary',
  'Freelance',
  'Investments',
  'Other',
];

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash'];

const TYPE_CONFIG = {
  expense: { label: 'Expense', badgeClass: 'badge-red', sign: '-', color: 'var(--red)' },
  income: { label: 'Income', badgeClass: 'badge-green', sign: '+', color: 'var(--green)' },
  savings: { label: 'Savings', badgeClass: 'badge-blue', sign: '+', color: 'var(--accent)' },
  debt: { label: 'Debt EMI', badgeClass: 'badge-amber', sign: '-', color: 'var(--amber)' },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    category: 'Food',
    amount: '',
    type: 'expense',
    payment_method: 'UPI',
    notes: '',
  });

  // Import Statement Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('csv'); // 'csv' | 'sms' | 'presets'
  const [csvText, setCsvText] = useState('');
  const [smsText, setSmsText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [txList, txSummary] = await Promise.all([
        fetchTransactions(),
        fetchTransactionSummary(),
      ]);
      setTransactions(txList);
      setSummary(txSummary);
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend. Please ensure the Python server is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSeedData() {
    try {
      setLoading(true);
      await seedSampleTransactions();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetData() {
    if (window.confirm('Are you sure you want to delete all transactions?')) {
      try {
        setLoading(true);
        await resetAllTransactions();
        await loadData();
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this transaction?')) {
      try {
        await deleteTransaction(id);
        await loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  }

  async function handleCreateTransaction(e) {
    e.preventDefault();
    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      await createTransaction({
        date: formData.date,
        description: formData.description.trim(),
        category: formData.category,
        amount: amt,
        type: formData.type,
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || null,
      });

      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        category: 'Food',
        amount: '',
        type: 'expense',
        payment_method: 'UPI',
        notes: '',
      });
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  }

  // Handle Bank CSV File Upload
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result || '');
      setImportError('');
      setImportMessage(`Loaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsText(file);
  }

  async function handleImportCSV() {
    if (!csvText.trim()) {
      setImportError('Please select a CSV file or paste bank statement content.');
      return;
    }
    setImportLoading(true);
    setImportError('');
    setImportMessage('');
    try {
      const res = await importBankStatement(csvText);
      setImportMessage(res.message);
      setTimeout(() => {
        setShowImportModal(false);
        setCsvText('');
        loadData();
      }, 1200);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportSMS() {
    if (!smsText.trim()) {
      setImportError('Please paste at least one bank transaction SMS message.');
      return;
    }
    setImportLoading(true);
    setImportError('');
    setImportMessage('');
    try {
      const res = await parseBankSms(smsText);
      setImportMessage(res.message);
      setTimeout(() => {
        setShowImportModal(false);
        setSmsText('');
        loadData();
      }, 1200);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  async function handleLoadBankPreset(bank) {
    setImportLoading(true);
    setImportError('');
    setImportMessage('');
    try {
      const res = await seedBankPassbook(bank);
      setImportMessage(res.message);
      setTimeout(() => {
        setShowImportModal(false);
        loadData();
      }, 1200);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !search ||
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchCat = categoryFilter === 'all' || tx.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchType && matchCat;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  function exportCSV() {
    if (!filteredTransactions.length) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Date,Description,Category,Type,Payment Method,Amount,Notes'];
    const rows = filteredTransactions.map((tx) =>
      `"${tx.date}","${tx.description.replace(/"/g, '""')}","${tx.category}","${tx.type}","${tx.payment_method || ''}",${tx.amount},"${(tx.notes || '').replace(/"/g, '""')}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finwise_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout
      title="Transaction Tracking"
      subtitle="Track personal finances, import bank statements, and parse UPI & bank SMS alerts"
    >
      {/* Top Metric Cards */}
      <section style={{ marginBottom: 24 }}>
        <div className="grid-4">
          <MetricCard
            label="Total Inflow"
            value={summary ? formatRupee(summary.total_income) : '₹0'}
            sub="Salaries and earnings"
            gradient="mint"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />

          <MetricCard
            label="Total Outflow"
            value={summary ? formatRupee(summary.total_expense + summary.total_debt) : '₹0'}
            sub="Living expenses & debt EMI"
            gradient="peach"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            }
          />

          <MetricCard
            label="Net Cash Flow"
            value={summary ? formatRupee(Math.abs(summary.net_cash_flow)) : '₹0'}
            sub={summary && summary.net_cash_flow >= 0 ? 'Surplus funds' : 'Net shortfall'}
            gradient={summary && summary.net_cash_flow >= 0 ? 'mint' : undefined}
            status={summary && summary.net_cash_flow >= 0 ? undefined : 'red'}
            badge={summary && summary.net_cash_flow >= 0 ? 'Surplus' : 'Deficit'}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />

          <MetricCard
            label="Total Transactions"
            value={summary ? summary.total_count.toString() : '0'}
            sub={`${filteredTransactions.length} matching current filter`}
            gradient="sand"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Action and Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left search & filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1, minWidth: 280 }}>
            <div className="input-wrapper" style={{ minWidth: 220, flex: 1 }}>
              <span className="input-prefix" style={{ left: 10, top: 9 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="form-input has-prefix"
                placeholder="Search merchant, narration, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>

            {/* Category selector */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '8px 12px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Type tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-raised)', padding: 3, borderRadius: 'var(--radius)', gap: 2 }}>
              {['all', 'expense', 'income', 'savings', 'debt'].map((t) => (
                <button
                  key={t}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    background: typeFilter === t ? 'var(--bg-surface)' : 'transparent',
                    color: typeFilter === t ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: typeFilter === t ? 'var(--shadow-sm)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'capitalize',
                  }}
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowImportModal(true);
                setImportError('');
                setImportMessage('');
              }}
              title="Import actual bank statements or paste SMS"
              style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 11l3 3-3 3" />
              </svg>
              Import Bank Statement
            </button>

            <button className="btn btn-secondary" onClick={exportCSV} title="Export CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>

            {transactions.length === 0 ? (
              <button className="btn btn-secondary" onClick={handleSeedData}>
                Seed Demo Data
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handleResetData}
                style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }}
                title="Clear all transactions"
              >
                Clear
              </button>
            )}

            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card" style={{ backgroundColor: 'var(--red-muted)', borderColor: 'var(--red-border)', marginBottom: 20 }}>
          <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {/* Transactions Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <SkeletonLoader lines={6} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--bg-raised)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              No Transactions Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {transactions.length === 0
                ? 'Your transaction register is empty. You can import your bank statement, paste SMS alerts, or load sample passbook data.'
                : 'No transactions match your search and filter criteria.'}
            </p>
            {transactions.length === 0 && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
                  Import Bank Statement (CSV / SMS)
                </button>
                <button className="btn btn-secondary" onClick={handleSeedData}>
                  Load Demo Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description / Bank Narration</th>
                  <th>Category</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.expense;
                  const isBankTx = tx.notes && (tx.notes.startsWith('Bank Narration:') || tx.notes.startsWith('Bank Passbook:') || tx.notes.startsWith('SMS:'));

                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} className="num">
                        {tx.date}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
                        {isBankTx ? (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                            {tx.notes.replace(/^(Bank Narration: |Bank Passbook: |SMS: )/, '')}
                          </div>
                        ) : tx.notes ? (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{tx.notes}</div>
                        ) : null}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: 'var(--bg-raised)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {tx.payment_method || 'UPI'}
                      </td>
                      <td>
                        <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                      </td>
                      <td
                        className="text-right num"
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: cfg.color,
                        }}
                      >
                        {cfg.sign} {formatRupee(tx.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            border: 'none',
                          }}
                          onClick={() => handleDelete(tx.id)}
                          title="Delete Transaction"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Import Bank Statement */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 580,
              boxShadow: 'var(--shadow-lg)',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import Bank Transactions
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Upload actual bank statements or paste raw SMS/UPI notifications
                </p>
              </div>
              <button
                className="btn"
                style={{ padding: 4, background: 'transparent', color: 'var(--text-muted)' }}
                onClick={() => setShowImportModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Tab switchers */}
            <div style={{ display: 'flex', background: 'var(--bg-raised)', padding: 3, borderRadius: 'var(--radius)', marginBottom: 18 }}>
              {[
                { id: 'csv', label: 'Upload Bank CSV' },
                { id: 'sms', label: 'Paste Bank SMS' },
                { id: 'presets', label: 'Sample Bank Passbook' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className="btn"
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: '8px 0',
                    background: importTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                    color: importTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: importTab === tab.id ? 'var(--shadow-sm)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onClick={() => {
                    setImportTab(tab.id);
                    setImportError('');
                    setImportMessage('');
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications */}
            {importError && (
              <div style={{ padding: '8px 12px', background: 'var(--red-muted)', color: 'var(--red)', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 14 }}>
                {importError}
              </div>
            )}
            {importMessage && (
              <div style={{ padding: '8px 12px', background: 'var(--green-muted)', color: 'var(--green-hover)', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 14, fontWeight: 600 }}>
                ✓ {importMessage}
              </div>
            )}

            {/* Tab 1: CSV Upload */}
            {importTab === 'csv' && (
              <div>
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 24,
                    textAlign: 'center',
                    marginBottom: 16,
                    backgroundColor: 'var(--bg-base)',
                    cursor: 'pointer',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <div style={{ color: 'var(--accent)', marginBottom: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    Click to select your Bank Statement CSV file
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Supports HDFC, SBI, ICICI, Axis, Kotak, and standard CSV exports
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Or paste CSV statement rows directly:
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Date,Narration,Withdrawal,Deposit,Balance&#10;12/09/2026,UPI/428192384/SWIGGY/Paytm,450.00,,45200.00&#10;01/09/2026,NEFT-TECH CORP SALARY,,65000.00,110200.00"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleImportCSV} disabled={importLoading}>
                    {importLoading ? 'Importing...' : 'Parse & Import CSV'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: SMS Paste */}
            {importTab === 'sms' && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Paste any number of bank SMS alerts or UPI notifications. The engine will automatically detect amounts, dates, merchants, and categories.
                </p>
                <div className="form-group">
                  <textarea
                    className="form-input"
                    rows={6}
                    placeholder="Dear SBI User, A/C ...8491 debited by Rs 450.00 on 14-Sep-26 via UPI to SWIGGY. Ref 4293819.&#10;&#10;HDFC Bank: Rs 65,000.00 credited to A/c ...0124 on 01-Sep-26 by TECH CORP SALARY.&#10;&#10;Axis Bank: Rs 12,000.00 debited for APARTMENT RENT on 02-Sep-26."
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    style={{ fontFamily: 'sans-serif', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleImportSMS} disabled={importLoading}>
                    {importLoading ? 'Extracting...' : 'Extract & Save SMS Alerts'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Presets */}
            {importTab === 'presets' && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Want to test real bank transactions immediately? Load an authentic passbook statement showing actual cryptic bank narrations and UPI IDs.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    className="card"
                    style={{
                      border: '1px solid var(--border)',
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        HDFC Bank Salary Account Passbook
                      </h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        13 real-world transactions with NEFT salary, UPI Swiggy/Zepto/Uber, Loan EMI, and Zerodha SIP.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: '8px 14px' }}
                      onClick={() => handleLoadBankPreset('hdfc')}
                      disabled={importLoading}
                    >
                      Load HDFC
                    </button>
                  </div>

                  <div
                    className="card"
                    style={{
                      border: '1px solid var(--border)',
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        SBI Savings Account Passbook
                      </h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        13 transactions with Blinkit grocery, Delhi Metro smart card, SBI education loan EMI, and UTI MF SIP.
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: 12, padding: '8px 14px' }}
                      onClick={() => handleLoadBankPreset('sbi')}
                      disabled={importLoading}
                    >
                      Load SBI
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Manual Transaction */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              boxShadow: 'var(--shadow-lg)',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Add New Transaction
              </h3>
              <button
                className="btn"
                style={{ padding: 4, background: 'transparent', color: 'var(--text-muted)' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransaction}>
              {formError && (
                <div style={{ padding: '8px 12px', background: 'var(--red-muted)', color: 'var(--red)', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 16 }}>
                  {formError}
                </div>
              )}

              {/* Type toggle */}
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {['expense', 'income', 'savings', 'debt'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: '8px 0',
                        textTransform: 'capitalize',
                        background: formData.type === t ? 'var(--accent)' : 'var(--bg-raised)',
                        color: formData.type === t ? '#fff' : 'var(--text-secondary)',
                        borderColor: formData.type === t ? 'var(--accent)' : 'var(--border)',
                      }}
                      onClick={() => setFormData({ ...formData, type: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-amount">
                  Amount (INR) <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">₹</span>
                  <input
                    id="tx-amount"
                    type="number"
                    step="1"
                    min="1"
                    required
                    className="form-input has-prefix num"
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-desc">
                  Description / Payee <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  id="tx-desc"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Swiggy, Apartment Rent, Tech Salary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Category & Date Grid */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tx-category">Category</label>
                  <select
                    id="tx-category"
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tx-date">Date</label>
                  <input
                    id="tx-date"
                    type="date"
                    required
                    className="form-input num"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-method">Payment Method</label>
                <select
                  id="tx-method"
                  className="form-input"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-notes">Notes (Optional)</label>
                <input
                  id="tx-notes"
                  type="text"
                  className="form-input"
                  placeholder="Additional context, invoice tag..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

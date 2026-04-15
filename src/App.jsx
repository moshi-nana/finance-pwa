import { useState } from 'react'
import { LayoutDashboard, Plus, History, Settings, Wallet, RefreshCw } from 'lucide-react'
import SummaryCards from './components/SummaryCards'
import ChartCard from './components/ChartCard'
import TransactionForm from './components/TransactionForm'
import TransactionHistory from './components/TransactionHistory'
import SettingsPage from './components/SettingsPage'
import { ToastProvider, useToast } from './components/Toast'
import { useFinance } from './hooks/useFinance'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add', label: 'Tambah', icon: Plus },
  { id: 'history', label: 'Riwayat', icon: History },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

function FinanceApp() {
  const [page, setPage] = useState('dashboard')
  const toast = useToast()
  const {
    transactions, settings, saveSettings,
    syncing, syncStatus, syncFromGist, syncToGist,
    addTransaction, deleteTransaction, importTransactions, editTransaction,
    totalBalance, dailyIncome, dailyExpense,
    getDailyChartData, getWeeklyChartData, getMonthlyChartData,
  } = useFinance()

  const handleAdd = async (tx) => {
    await addTransaction(tx)
    toast('Transaksi berhasil disimpan! 🎉')
    setPage('dashboard')
  }

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    toast('Transaksi dihapus', 'info')
  }

  const handleEdit = async (id, changes) => {
    await editTransaction(id, changes)
    toast('Transaksi berhasil diperbarui ✏️')
  }

  const handleImport = async (data) => {
    const count = await importTransactions(data)
    if (count > 0) toast(`${count} transaksi berhasil diimpor 📥`)
    else toast('Tidak ada transaksi baru (duplikat diabaikan)', 'info')
  }

  const handleSaveSettings = (s) => {
    saveSettings(s)
    toast('Pengaturan disimpan ✅')
  }

  const handleSyncTo = async () => {
    await syncToGist()
    toast('Data berhasil diunggah ke GitHub Gist ☁️')
  }

  const handleSyncFrom = async () => {
    await syncFromGist()
    toast('Data berhasil disinkronkan dari GitHub Gist 🔄')
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <>
            <SummaryCards
              balance={totalBalance}
              income={dailyIncome}
              expense={dailyExpense}
            />
            <ChartCard
              getDailyData={getDailyChartData}
              getWeeklyData={getWeeklyChartData}
              getMonthlyData={getMonthlyChartData}
            />
            <TransactionHistory
              transactions={transactions.slice(0, 5)}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </>
        )
      case 'add':
        return <TransactionForm onAdd={handleAdd} />
      case 'history':
        return (
          <TransactionHistory
            transactions={transactions}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            onSave={handleSaveSettings}
            onSyncFrom={handleSyncFrom}
            onSyncTo={handleSyncTo}
            syncing={syncing}
            syncStatus={syncStatus}
            transactions={transactions}
            onImport={handleImport}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="desktop-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ display: 'none' }} id="desktop-sidebar">
        <div className="sidebar-logo">
          <div className="header-logo-icon">
            <Wallet size={18} color="#39ff14" />
          </div>
          <div>
            <div className="header-title">FinanceApp</div>
            <div className="header-subtitle">Pencatatan Keuangan</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {PAGES.map(p => (
            <button
              key={p.id}
              id={`sidebar-nav-${p.id}`}
              className={`sidebar-nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => setPage(p.id)}
            >
              <p.icon size={18} />
              {p.label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
          {settings.token && (
            <button
              className="sync-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSyncFrom}
              disabled={syncing}
            >
              {syncing ? <span className="spinner" /> : <RefreshCw size={14} />}
              Sinkronisasi
            </button>
          )}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
            {settings.gistId ? `🟢 Terhubung ke Gist` : '⚪ Offline Mode'}
          </div>
        </div>
      </aside>

      {/* Responsive Wrapper */}
      <div className="app-container" id="main-wrapper">
        {/* Mobile Header */}
        <header className="header">
          <div className="header-logo">
            <div className="header-logo-icon">
              <Wallet size={18} color="#39ff14" />
            </div>
            <div>
              <div className="header-title">FinanceApp</div>
              <div className="header-subtitle">
                {settings.gistId ? '🟢 Sinkronisasi aktif' : '⚪ Penyimpanan lokal'}
              </div>
            </div>
          </div>
          <div className="header-right">
            {settings.token && (
              <button
                id="btn-quick-sync"
                className="icon-btn"
                onClick={handleSyncFrom}
                disabled={syncing}
                title="Sinkronisasi"
              >
                {syncing ? <span className="spinner" /> : <RefreshCw size={16} />}
              </button>
            )}
            <button
              id="btn-goto-settings"
              className="icon-btn"
              onClick={() => setPage('settings')}
              title="Pengaturan"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {renderPage()}
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="bottom-nav">
          {PAGES.map(p => (
            <button
              key={p.id}
              id={`nav-${p.id}`}
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => setPage(p.id)}
            >
              <p.icon size={22} />
              <span>{p.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// Desktop sidebar visibility via CSS
const style = document.createElement('style')
style.textContent = `
  @media (min-width: 768px) {
    #desktop-sidebar { display: flex !important; }
    #main-wrapper { max-width: 100% !important; }
  }
`
document.head.appendChild(style)

export default function App() {
  return (
    <ToastProvider>
      <FinanceApp />
    </ToastProvider>
  )
}

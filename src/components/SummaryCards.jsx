import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'

const IDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(v)

export default function SummaryCards({ balance, income, expense }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className="summary-grid">
      {/* Balance */}
      <div className="glass-card summary-card balance">
        <div className="card-label">
          <Wallet size={14} />
          Total Saldo
        </div>
        <div className="card-amount">{IDR(balance)}</div>
        <div className="card-sub">{today}</div>
      </div>

      {/* Daily Income */}
      <div className="glass-card summary-card income">
        <div className="card-label">
          <TrendingUp size={14} />
          Pemasukan Hari Ini
        </div>
        <div className="card-amount">{IDR(income)}</div>
        <div className="card-sub">Total masuk hari ini</div>
      </div>

      {/* Daily Expense */}
      <div className="glass-card summary-card expense">
        <div className="card-label">
          <TrendingDown size={14} />
          Pengeluaran Hari Ini
        </div>
        <div className="card-amount">{IDR(expense)}</div>
        <div className="card-sub">Total keluar hari ini</div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, Clock, Tag, FileText, Plus, Sparkles } from 'lucide-react'
import { detectCategory } from '../utils/categoryDetector'

const CATEGORIES_INCOME = ['Gaji', 'Freelance', 'Investasi', 'Bisnis', 'Hadiah', 'Lainnya']
const CATEGORIES_EXPENSE = ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lainnya']

export default function TransactionForm({ onAdd }) {
  const [type, setType] = useState('income')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES_INCOME[0])
  const [desc, setDesc] = useState('')
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [autoDetected, setAutoDetected] = useState(null) // { category, matched }

  // Helper to format date for <input type="datetime-local">
  const toLocalISO = (d) => {
    const offset = d.getTimezoneOffset() * 60000
    const local = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
  }

  // Update waktu setiap detik (hanya jika mode auto)
  useEffect(() => {
    if (isManual) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [isManual])

  // Initialize manualDate when switching to manual
  useEffect(() => {
    if (isManual && !manualDate) {
      setManualDate(toLocalISO(new Date()))
    }
  }, [isManual, manualDate])

  const formatTime = (d) =>
    d.toLocaleString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    })

  const handleAmount = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setAmount(raw)
  }

  const handleTitle = (e) => {
    const val = e.target.value
    setTitle(val)
    const result = detectCategory(val)
    if (result) {
      const cats = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE
      if (cats.includes(result.category)) {
        setCategory(result.category)
        setAutoDetected(result)
      } else {
        setAutoDetected(null)
      }
    } else {
      setAutoDetected(null)
    }
  }

  const formatDisplay = (v) =>
    v ? new Intl.NumberFormat('id-ID').format(v) : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setLoading(true)

    try {
      const timestamp = isManual && manualDate 
        ? new Date(manualDate).toISOString() 
        : new Date().toISOString()

      await onAdd({
        type,
        amount: Number(amount),
        category,
        title: title || category,
        description: desc,
        timestamp
      })
      setTitle('')
      setAmount('')
      setDesc('')
      setAutoDetected(null)
    } catch (err) {
      console.error('Error saving transaction:', err)
      alert('Gagal menyimpan transaksi. Periksa kembali input Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card form-card">
      <div className="section-header">
        <h2 className="section-title">Tambah Transaksi</h2>
      </div>

      <form onSubmit={handleSubmit} id="transaction-form">
        {/* Type selector */}
        <div className="type-selector">
          <button
            type="button"
            id="btn-type-income"
            className={`type-btn income ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            <TrendingUp size={16} />
            Pemasukan
          </button>
          <button
            type="button"
            id="btn-type-expense"
            className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            <TrendingDown size={16} />
            Pengeluaran
          </button>
        </div>

        <div className="form-grid">
          {/* Date-Time Section */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                Tanggal & Waktu
              </label>
              <div className="chart-toggle" style={{ padding: 2 }}>
                <button
                  type="button"
                  className={`toggle-btn ${!isManual ? 'active' : ''}`}
                  onClick={() => setIsManual(false)}
                  style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                >
                  Auto
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${isManual ? 'active' : ''}`}
                  onClick={() => setIsManual(true)}
                  style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                >
                  Manual
                </button>
              </div>
            </div>
            
            {isManual ? (
              <input
                type="datetime-local"
                className="form-input"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            ) : (
              <div className="date-display">
                <Calendar size={14} />
                {formatTime(now)}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="input-title" className="form-label">Judul Transaksi</label>
            <input
              id="input-title"
              type="text"
              className="form-input"
              placeholder="Contoh: Gaji Bulan April, Isi Bensin..."
              value={title}
              onChange={handleTitle}
              required
            />
            {autoDetected && (
              <div className="auto-detect-badge">
                <Sparkles size={11} />
                Kategori terdeteksi: <strong>{autoDetected.category}</strong>
                <span className="auto-detect-keyword">&quot;{autoDetected.matched}&quot;</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="input-amount" className="form-label">Jumlah (Rp)</label>
            <input
              id="input-amount"
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="Contoh: 500.000"
              value={formatDisplay(amount)}
              onChange={handleAmount}
              required
            />
          </div>

          <div className="form-row">
            {/* Category */}
            <div className="form-group">
              <label htmlFor="input-category" className="form-label">
                <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
                Kategori
              </label>
              <select
                id="input-category"
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {(type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="input-desc" className="form-label">
                <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                Keterangan
              </label>
              <input
                id="input-desc"
                type="text"
                className="form-input"
                placeholder="Opsional..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-transaction"
            className="submit-btn"
            disabled={loading || !amount || !title}
          >
            {loading ? <span className="spinner" /> : <Plus size={18} />}
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </div>
  )
}

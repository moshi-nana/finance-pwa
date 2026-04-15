import { useState } from 'react'
import { TrendingUp, TrendingDown, Trash2, Receipt, Pencil, X, Check } from 'lucide-react'
import { detectCategory } from '../utils/categoryDetector'

const CATEGORIES_INCOME  = ['Gaji', 'Freelance', 'Investasi', 'Bisnis', 'Hadiah', 'Lainnya']
const CATEGORIES_EXPENSE = ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lainnya']

const IDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(v)

const formatDateTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Helper for datetime-local input value
const toLocalISO = (iso) => {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

const formatDisplay = (v) =>
  v ? new Intl.NumberFormat('id-ID').format(v) : ''

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ tx, onSave, onClose }) {
  const [type, setType]           = useState(tx.type)
  const [title, setTitle]         = useState(tx.title || tx.description || '')
  const [amount, setAmount]       = useState(String(tx.amount))
  const [category, setCategory]   = useState(tx.category)
  const [desc, setDesc]           = useState(tx.description || '')
  const [dateVal, setDateVal]     = useState(toLocalISO(tx.timestamp))
  const [autoDetected, setAuto]   = useState(null)

  const cats = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE

  const handleTypeChange = (t) => {
    setType(t)
    // reset category if old category is not in new list
    const list = t === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE
    if (!list.includes(category)) setCategory(list[0])
  }

  const handleTitle = (e) => {
    const val = e.target.value
    setTitle(val)
    const result = detectCategory(val)
    if (result && cats.includes(result.category)) {
      setCategory(result.category)
      setAuto(result)
    } else {
      setAuto(null)
    }
  }

  const handleAmount = (e) => {
    setAmount(e.target.value.replace(/\D/g, ''))
  }

  const handleSave = () => {
    if (!title || !amount || Number(amount) <= 0) return
    onSave({
      type,
      title,
      amount: Number(amount),
      category,
      description: desc,
      timestamp: new Date(dateVal).toISOString(),
    })
  }

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <span className="edit-modal-title">Edit Transaksi</span>
          <button className="edit-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="type-selector" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`type-btn income ${type === 'income' ? 'active' : ''}`}
            onClick={() => handleTypeChange('income')}
          >
            <TrendingUp size={14} /> Pemasukan
          </button>
          <button
            type="button"
            className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => handleTypeChange('expense')}
          >
            <TrendingDown size={14} /> Pengeluaran
          </button>
        </div>

        <div className="form-grid">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={handleTitle}
              placeholder="Judul transaksi..."
            />
            {autoDetected && (
              <div className="auto-detect-badge" style={{ fontSize: '0.68rem' }}>
                ✨ Kategori: <strong>{autoDetected.category}</strong>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              value={formatDisplay(amount)}
              onChange={handleAmount}
              placeholder="0"
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input
              type="text"
              className="form-input"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Opsional..."
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Tanggal & Waktu</label>
            <input
              type="datetime-local"
              className="form-input"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="edit-modal-actions">
          <button className="sync-btn" onClick={onClose}>
            <X size={14} /> Batal
          </button>
          <button
            className="submit-btn"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={!title || !amount || Number(amount) <= 0}
          >
            <Check size={16} /> Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TransactionHistory({ transactions, onDelete, onEdit }) {
  const [editingTx, setEditingTx] = useState(null)

  const handleSaveEdit = async (changes) => {
    await onEdit(editingTx.id, changes)
    setEditingTx(null)
  }

  return (
    <>
      <div className="glass-card history-card">
        <div className="section-header" style={{ padding: '16px 20px 0' }}>
          <h2 className="section-title">Riwayat Transaksi</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {transactions.length} transaksi
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <Receipt />
            <p>Belum ada transaksi. Tambahkan transaksi pertama Anda!</p>
          </div>
        ) : (
          <ul className="history-list">
            {transactions.map((tx) => (
              <li key={tx.id} className="history-item">
                <div className={`history-icon ${tx.type}`}>
                  {tx.type === 'income'
                    ? <TrendingUp size={16} />
                    : <TrendingDown size={16} />}
                </div>

                <div className="history-info">
                  <div className="history-desc">{tx.title || tx.description}</div>
                  <div className="history-meta">
                    {tx.category} · {formatDateTime(tx.timestamp)}
                    {tx.description && (
                      <span style={{ display: 'block', marginTop: 1, opacity: 0.7 }}>
                        {tx.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`history-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}{IDR(tx.amount)}
                </div>

                <button
                  className="history-edit-btn"
                  onClick={() => setEditingTx(tx)}
                  title="Edit transaksi"
                  aria-label="Edit transaksi"
                >
                  <Pencil size={13} />
                </button>

                <button
                  className="history-delete-btn"
                  onClick={() => onDelete(tx.id)}
                  title="Hapus transaksi"
                  aria-label="Hapus transaksi"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingTx && (
        <EditModal
          tx={editingTx}
          onSave={handleSaveEdit}
          onClose={() => setEditingTx(null)}
        />
      )}
    </>
  )
}

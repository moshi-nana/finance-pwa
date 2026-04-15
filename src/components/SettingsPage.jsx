import { useState, useEffect, useRef } from 'react'
import { Github, RefreshCw, CheckCircle, XCircle, Save, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react'
import { verifyToken } from '../services/gistService'

// ── CSV export helper ──
function exportCSV(transactions) {
  if (transactions.length === 0) return
  const header = 'ID,Tipe,Jumlah,Kategori,Keterangan,Tanggal & Waktu'
  const rows = transactions.map(tx => {
    const date = new Date(tx.timestamp).toLocaleString('id-ID')
    const desc = `"${(tx.description || '').replace(/"/g, '""')}"`
    return [tx.id, tx.type, tx.amount, tx.category, desc, `"${date}"`].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-')
  a.href = url
  a.download = `financeapp-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV import helper ──
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  // Skip header row
  const dataLines = lines.slice(1)
  const result = []
  for (const line of dataLines) {
    // Simple CSV parse: split on comma but respect quoted fields
    const cols = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())

    const [id, type, amountStr, category, description] = cols
    const amount = parseFloat(amountStr)
    if (!id || !type || isNaN(amount)) continue
    result.push({
      id: id || crypto.randomUUID(),
      type,
      amount,
      category: category || '',
      description: description || '',
      timestamp: new Date().toISOString(), // fallback; CSV col 6 is locale string, hard to re-parse
    })
  }
  return result
}

export default function SettingsPage({
  settings, onSave,
  onSyncFrom, onSyncTo,
  syncing, syncStatus,
  transactions, onImport,
}) {
  const [token, setToken] = useState(settings.token || '')
  const [gistId, setGistId] = useState(settings.gistId || '')
  const [verifying, setVerifying] = useState(false)
  const [username, setUsername] = useState('')
  const [tokenValid, setTokenValid] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setToken(settings.token || '')
    setGistId(settings.gistId || '')
  }, [settings])

  const handleVerify = async () => {
    if (!token) return
    setVerifying(true)
    try {
      const user = await verifyToken(token)
      setUsername(user.login)
      setTokenValid(true)
    } catch {
      setTokenValid(false)
      setUsername('')
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = () => onSave({ token, gistId })

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result)
        if (parsed.length === 0) {
          alert('Tidak ada data valid yang ditemukan di file CSV ini.')
          return
        }
        if (onImport) onImport(parsed)
      } catch {
        alert('Gagal membaca file CSV.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="main-content">
      {/* ── Sync Section ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <h2 className="section-title">Sinkronisasi GitHub Gist</h2>
          <Github size={18} color="var(--text-muted)" />
        </div>

        <div className="settings-info">
          <strong>🔄 Cara kerja sinkronisasi:</strong>
          <ol style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Buka <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">GitHub → Settings → Personal Access Tokens <ExternalLink size={10} /></a></li>
            <li>Buat token baru dengan izin <strong>gist</strong> saja</li>
            <li>Paste token di bawah ini, lalu klik Verifikasi &amp; Simpan</li>
            <li>Pertama kali simpan akan membuat Gist baru otomatis</li>
            <li>Di perangkat lain, masukkan token + Gist ID yang sama</li>
          </ol>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="settings-token" className="form-label">
              GitHub Personal Access Token
            </label>
            <input
              id="settings-token"
              type="password"
              className="form-input"
              placeholder="ghp_xxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={e => { setToken(e.target.value); setTokenValid(null) }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="settings-gist-id" className="form-label">
              Gist ID (kosongkan jika membuat baru)
            </label>
            <input
              id="settings-gist-id"
              type="text"
              className="form-input"
              placeholder="auto-diisi setelah simpan pertama"
              value={gistId}
              onChange={e => setGistId(e.target.value)}
            />
          </div>

          {tokenValid === true && (
            <div className="settings-status connected">
              <CheckCircle size={14} />
              Terhubung sebagai: <strong>@{username}</strong>
            </div>
          )}
          {tokenValid === false && (
            <div className="settings-status disconnected">
              <XCircle size={14} />
              Token tidak valid, coba lagi
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              id="btn-verify-token"
              className="sync-btn"
              onClick={handleVerify}
              disabled={verifying || !token}
            >
              {verifying ? <span className="spinner" /> : <CheckCircle size={14} />}
              Verifikasi
            </button>

            <button
              id="btn-save-settings"
              className="submit-btn"
              style={{ flex: 1, minWidth: 120 }}
              onClick={handleSave}
              disabled={!token}
            >
              <Save size={16} />
              Simpan Pengaturan
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
            <p className="form-label" style={{ marginBottom: 10 }}>Sinkronisasi Manual</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                id="btn-push-gist"
                className="sync-btn"
                onClick={onSyncTo}
                disabled={syncing || !settings.token}
                title="Upload data lokal ke Gist"
              >
                {syncing && syncStatus === 'syncing' ? <span className="spinner" /> : <RefreshCw size={14} />}
                Push ke Gist
              </button>
              <button
                id="btn-pull-gist"
                className="sync-btn"
                onClick={onSyncFrom}
                disabled={syncing || !settings.token || !settings.gistId}
                title="Download data dari Gist"
              >
                {syncing && syncStatus === 'syncing' ? <span className="spinner" /> : <RefreshCw size={14} />}
                Pull dari Gist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Import / Export CSV ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <h2 className="section-title">Import &amp; Export Data</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CSV</span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Ekspor semua transaksi ke file <strong>.csv</strong> (kompatibel dengan Excel &amp; Google Sheets), atau impor data dari file CSV yang pernah diekspor.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Export / Download */}
          <button
            id="btn-export-csv"
            className="csv-icon-btn export"
            onClick={() => exportCSV(transactions)}
            disabled={transactions.length === 0}
            title={`Ekspor ${transactions.length} transaksi ke CSV`}
            aria-label="Ekspor data ke CSV"
          >
            <ArrowDown size={20} />
          </button>

          {/* Import / Upload */}
          <button
            id="btn-import-csv"
            className="csv-icon-btn import"
            onClick={() => fileInputRef.current?.click()}
            title="Impor transaksi dari file CSV"
            aria-label="Impor data dari CSV"
          >
            <ArrowUp size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleImportCSV}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <span style={{ display: 'block' }}><ArrowDown size={10} style={{ display: 'inline', marginRight: 4 }} />Download CSV ({transactions.length} transaksi)</span>
            <span style={{ display: 'block' }}><ArrowUp size={10} style={{ display: 'inline', marginRight: 4 }} />Upload &amp; impor dari CSV</span>
          </div>
        </div>
      </div>
    </div>
  )
}

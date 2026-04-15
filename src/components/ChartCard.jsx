import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function ChartCard({ getDailyData, getWeeklyData, getMonthlyData }) {
  const [mode, setMode] = useState('daily')
  const [data, setData] = useState([])

  useEffect(() => {
    if (mode === 'daily') setData(getDailyData())
    else if (mode === 'weekly') setData(getWeeklyData())
    else setData(getMonthlyData())
  }, [mode, getDailyData, getWeeklyData, getMonthlyData])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'rgba(15, 15, 26, 0.95)',
        border: '1px solid rgba(57, 255, 20, 0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '0.78rem',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="glass-card chart-card">
      <div className="section-header">
        <h2 className="section-title">Grafik Keuangan</h2>
        <div className="chart-toggle">
          {['daily', 'weekly', 'monthly'].map(m => (
            <button
              key={m}
              id={`toggle-${m}`}
              className={`toggle-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'daily' ? 'Harian' : m === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="income"
              name="Pemasukan"
              stroke="#39ff14"
              strokeWidth={2.5}
              dot={{ fill: '#39ff14', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#39ff14' }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Pengeluaran"
              stroke="#ff4757"
              strokeWidth={2.5}
              dot={{ fill: '#ff4757', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#ff4757' }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo Total"
              stroke="#0a84ff"
              strokeWidth={2.5}
              dot={{ fill: '#0a84ff', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#0a84ff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#39ff14' }} />
          <span>Pemasukan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ff4757' }} />
          <span>Pengeluaran</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#0a84ff' }} />
          <span>Saldo Total</span>
        </div>
      </div>
    </div>
  )
}

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

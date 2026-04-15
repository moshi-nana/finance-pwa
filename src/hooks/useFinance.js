import { useState, useEffect, useCallback } from 'react'
import { fetchGist, saveToGist } from '../services/gistService'

const STORAGE_KEY = 'financeapp_transactions'
const SETTINGS_KEY = 'financeapp_settings'

export function useFinance() {
  const [transactions, setTransactions] = useState([])
  const [settings, setSettings] = useState({ token: '', gistId: '' })
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | success | error

  // Load local data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setTransactions(JSON.parse(saved)) } catch {}
    }
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        const s = JSON.parse(savedSettings)
        setSettings(s)
      } catch {}
    }
  }, [])

  // Persist to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  // Save settings
  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
  }, [])

  // Sync FROM gist (download)
  const syncFromGist = useCallback(async () => {
    if (!settings.token || !settings.gistId) return
    setSyncing(true)
    setSyncStatus('syncing')
    try {
      const data = await fetchGist(settings.token, settings.gistId)
      setTransactions(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSyncStatus('success')
    } catch (e) {
      console.error(e)
      setSyncStatus('error')
    } finally {
      setSyncing(false)
    }
  }, [settings])

  // Sync TO gist (upload) – returns new gist ID if first time
  const syncToGist = useCallback(async (txList) => {
    if (!settings.token) return null
    setSyncing(true)
    setSyncStatus('syncing')
    try {
      const newId = await saveToGist(settings.token, settings.gistId, txList)
      if (!settings.gistId) {
        const updated = { ...settings, gistId: newId }
        setSettings(updated)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      }
      setSyncStatus('success')
      return newId
    } catch (e) {
      console.error(e)
      setSyncStatus('error')
      return null
    } finally {
      setSyncing(false)
    }
  }, [settings])

  // Add transaction
  const addTransaction = useCallback(async (tx) => {
    const newTx = {
      ...tx,
      id: (window.crypto && window.crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      timestamp: tx.timestamp || new Date().toISOString(),
    }
    const updated = [newTx, ...transactions]
    setTransactions(updated)
    if (settings.token) {
      await syncToGist(updated)
    }
    return newTx
  }, [transactions, settings, syncToGist])

  // Import transactions
  const importTransactions = useCallback(async (newTxList) => {
    // Unique check to avoid duplicates if importing same file
    const existingIds = new Set(transactions.map(t => t.id))
    const uniqueNew = newTxList.filter(t => !existingIds.has(t.id))
    
    if (uniqueNew.length === 0) return 0
    
    const updated = [...uniqueNew, ...transactions].sort((a,b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
    
    setTransactions(updated)
    if (settings.token) {
      await syncToGist(updated)
    }
    return uniqueNew.length
  }, [transactions, settings, syncToGist])

  // Delete transaction
  const deleteTransaction = useCallback(async (id) => {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    if (settings.token) {
      await syncToGist(updated)
    }
  }, [transactions, settings, syncToGist])

  // Edit transaction
  const editTransaction = useCallback(async (id, changes) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...changes } : t)
    setTransactions(updated)
    if (settings.token) {
      await syncToGist(updated)
    }
  }, [transactions, settings, syncToGist])

  // ── Computed values ──
  const today = new Date().toDateString()

  const totalBalance = transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount
  }, 0)

  const dailyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.timestamp).toDateString() === today)
    .reduce((sum, t) => sum + t.amount, 0)

  const dailyExpense = transactions
    .filter(t => t.type === 'expense' && new Date(t.timestamp).toDateString() === today)
    .reduce((sum, t) => sum + t.amount, 0)

  // ── Chart data helpers ──
  const getDailyChartData = useCallback(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.timestamp).toDateString() === key)
        .reduce((s, t) => s + t.amount, 0)
      const expense = transactions
        .filter(t => t.type === 'expense' && new Date(t.timestamp).toDateString() === key)
        .reduce((s, t) => s + t.amount, 0)
      const endOfDay = new Date(d)
      endOfDay.setHours(23, 59, 59, 999)
      const balance = transactions
        .filter(t => new Date(t.timestamp) <= endOfDay)
        .reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)

      days.push({ label, income, expense, balance })
    }
    return days
  }, [transactions])

  const getWeeklyChartData = useCallback(() => {
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const end = new Date()
      end.setDate(end.getDate() - i * 7)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      const label = `W${8 - i}`
      const income = transactions
        .filter(t => {
          const d = new Date(t.timestamp)
          return t.type === 'income' && d >= start && d <= end
        })
        .reduce((s, t) => s + t.amount, 0)
      const expense = transactions
        .filter(t => {
          const d = new Date(t.timestamp)
          return t.type === 'expense' && d >= start && d <= end
        })
        .reduce((s, t) => s + t.amount, 0)
      const endOfWeek = new Date(end)
      endOfWeek.setHours(23, 59, 59, 999)
      const balance = transactions
        .filter(t => new Date(t.timestamp) <= endOfWeek)
        .reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)

      weeks.push({ label, income, expense, balance })
    }
    return weeks
  }, [transactions])

  const getMonthlyChartData = useCallback(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = d.toLocaleDateString('id-ID', { month: 'short' })
      const income = transactions
        .filter(t => {
          const td = new Date(t.timestamp)
          return t.type === 'income' && td.getFullYear() === year && td.getMonth() === month
        })
        .reduce((s, t) => s + t.amount, 0)
      const expense = transactions
        .filter(t => {
          const td = new Date(t.timestamp)
          return t.type === 'expense' && td.getFullYear() === year && td.getMonth() === month
        })
        .reduce((s, t) => s + t.amount, 0)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
      const balance = transactions
        .filter(t => new Date(t.timestamp) <= endOfMonth)
        .reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)

      months.push({ label, income, expense, balance })
    }
    return months
  }, [transactions])

  return {
    transactions,
    settings,
    saveSettings,
    syncing,
    syncStatus,
    syncFromGist,
    syncToGist: () => syncToGist(transactions),
    addTransaction,
    importTransactions,
    deleteTransaction,
    editTransaction,
    totalBalance,
    dailyIncome,
    dailyExpense,
    getDailyChartData,
    getWeeklyChartData,
    getMonthlyChartData,
  }
}

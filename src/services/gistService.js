/**
 * GitHub Gist Service
 * Menyimpan & mengambil data transaksi dari GitHub Gist
 * agar bisa diakses di semua perangkat secara seamless.
 */

const GIST_FILENAME = 'financeapp-data.json'
const API_BASE = 'https://api.github.com'

export async function fetchGist(token, gistId) {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`Gist fetch gagal: ${res.status}`)
  const data = await res.json()
  const content = data.files[GIST_FILENAME]?.content
  if (!content) return []
  return JSON.parse(content)
}

export async function saveToGist(token, gistId, transactions) {
  const body = {
    description: 'FinanceApp – Data Transaksi',
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(transactions, null, 2),
      },
    },
  }

  let res
  if (gistId) {
    // UPDATE existing gist
    res = await fetch(`${API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } else {
    // CREATE new gist
    res = await fetch(`${API_BASE}/gists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, public: false }),
    })
  }

  if (!res.ok) throw new Error(`Gist save gagal: ${res.status}`)
  const data = await res.json()
  return data.id
}

export async function verifyToken(token) {
  const res = await fetch(`${API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error('Token tidak valid')
  return await res.json()
}

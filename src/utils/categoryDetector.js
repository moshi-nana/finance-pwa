/**
 * Auto Category Detector
 * Maps keywords → category for both income & expense transactions.
 * Keywords are Indonesian-first, case-insensitive, partial-match.
 */

const RULES = [
  // ── EXPENSE ──────────────────────────────────────────────────────
  {
    category: 'Transport',
    keywords: [
      'bensin', 'bahan bakar', 'bbm', 'solar', 'pertamax', 'pertalite',
      'spbu', 'shell', 'vivo', 'bp', 'parkir', 'tol', 'ojek', 'gojek',
      'grab', 'angkot', 'bus', 'kereta', 'taxi', 'taksi', 'uber',
      'transjakarta', 'motor', 'mobil', 'bensin motor', 'isi bensin',
      'krl', 'mrt', 'lrt', 'damri', 'travel', 'tiket pesawat', 'pesawat',
    ],
  },
  {
    category: 'Makanan',
    keywords: [
      'makan', 'minum', 'nasi', 'ayam', 'bakso', 'warteg', 'warung',
      'restoran', 'resto', 'cafe', 'kafe', 'kopi', 'teh', 'air minum',
      'galon', 'snack', 'jajan', 'sarapan', 'boba', 'pizza', 'burger',
      'mie', 'mi', 'soto', 'sushi', 'indomie', 'gorengan', 'martabak',
      'es krim', 'cemilan', 'kfc', 'mcd', 'mcdonalds', 'geprek', 'pecel',
      'gudeg', 'rendang', 'sate', 'gado gado', 'nasi goreng', 'makan siang',
      'makan malam', 'sarapan pagi', 'lunch', 'dinner', 'breakfast',
      'minuman', 'juice', 'jus', 'smoothie', 'tea', 'coffee',
    ],
  },
  {
    category: 'Belanja',
    keywords: [
      'belanja', 'supermarket', 'indomaret', 'alfamart', 'alfamidi',
      'tokopedia', 'shopee', 'lazada', 'tiktok shop', 'toko', 'baju',
      'celana', 'sepatu', 'tas', 'beli', 'pakaian', 'fashion', 'online shop',
      'hypermart', 'carrefour', 'giant', 'hero', 'lottemart',
      'elektronik', 'gadget', 'hp baru', 'laptop', 'aksesoris',
    ],
  },
  {
    category: 'Tagihan',
    keywords: [
      'listrik', 'pln', 'token listrik', 'pdam', 'air pdam', 'ledeng',
      'internet', 'wifi', 'indihome', 'telkom', 'firstmedia', 'myrepublic',
      'pulsa', 'paket data', 'tagihan', 'cicilan', 'kredit', 'angsuran',
      'iuran', 'bulanan', 'sewa', 'kontrak', 'kos', 'kontrakan',
      'gas', 'elpiji', 'lpg', 'bpjs', 'asuransi', 'premi',
    ],
  },
  {
    category: 'Kesehatan',
    keywords: [
      'dokter', 'rumah sakit', 'rs ', ' rs', 'puskesmas', 'klinik',
      'obat', 'apotek', 'apotik', 'vitamin', 'suplemen', 'berobat',
      'cek up', 'check up', 'laboratorium', 'lab ', 'masker', 'kesehatan',
      'fisioterapi', 'gigi', 'dokter gigi', 'optik', 'kacamata',
    ],
  },
  {
    category: 'Hiburan',
    keywords: [
      'film', 'bioskop', 'netflix', 'spotify', 'disney', 'youtube premium',
      'game', 'gaming', 'steam', 'liburan', 'wisata', 'hotel', 'villa',
      'gym', 'olahraga', 'futsal', 'badminton', 'konser', 'nonton',
      'streaming', 'langganan', 'subscription', 'karaoke', 'bowling',
    ],
  },

  // ── INCOME ───────────────────────────────────────────────────────
  {
    category: 'Gaji',
    keywords: [
      'gaji', 'salary', 'upah', 'honorarium', 'thr', 'bonus',
      'rapel', 'slip gaji', 'payroll',
    ],
  },
  {
    category: 'Freelance',
    keywords: [
      'freelance', 'project', 'proyek', 'jasa', 'kerja sambilan',
      'fee', 'komisi', 'honorarium desain', 'payment project',
    ],
  },
  {
    category: 'Investasi',
    keywords: [
      'investasi', 'dividen', 'saham', 'reksa dana', 'reksadana',
      'bunga deposito', 'obligasi', 'return', 'profit investasi',
      'yield', 'p2p lending', 'crypto', 'bitcoin',
    ],
  },
  {
    category: 'Bisnis',
    keywords: [
      'bisnis', 'usaha', 'dagang', 'jualan', 'dagangan', 'omzet',
      'penjualan', 'orderan', 'hasil jual', 'transfer pelanggan',
    ],
  },
  {
    category: 'Hadiah',
    keywords: [
      'hadiah', 'kado', 'gift', 'reward', 'cashback', 'refund',
      'kembalian', 'voucher', 'promo', 'lucky draw', 'arisan',
    ],
  },
]

/**
 * Detects category from a transaction title/keyword string.
 * @param {string} text - The title/description to check
 * @returns {{ category: string, matched: string } | null}
 */
export function detectCategory(text) {
  if (!text || text.trim().length < 2) return null
  const lower = text.toLowerCase()

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return { category: rule.category, matched: kw }
      }
    }
  }
  return null
}

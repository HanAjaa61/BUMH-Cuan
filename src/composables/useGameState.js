// src/composables/useGameState.js
import { reactive, computed } from 'vue'

// ─────────────────────────────────────────
// 10 Soal bisnis
// ─────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    price: 5000,
    question: 'Apa yang dimaksud dengan modal kerja (working capital) dalam bisnis?',
  },
  {
    id: 2,
    price: 8000,
    question: 'Jelaskan apa itu BEP (Break Even Point) dan mengapa penting bagi bisnis?',
  },
  {
    id: 3,
    price: 12000,
    question: 'Apa perbedaan antara laba kotor (gross profit) dan laba bersih (net profit)?',
  },
  {
    id: 4,
    price: 18000,
    question: 'Jelaskan konsep diversifikasi produk dan manfaatnya bagi perusahaan!',
  },
  {
    id: 5,
    price: 25000,
    question: 'Apa yang dimaksud dengan analisis SWOT dan bagaimana cara menggunakannya dalam strategi bisnis?',
  },
  {
    id: 6,
    price: 35000,
    question: 'Jelaskan perbedaan antara pemasaran B2B (Business to Business) dan B2C (Business to Consumer)!',
  },
  {
    id: 7,
    price: 45000,
    question: 'Apa itu arus kas (cash flow) dan mengapa manajemen arus kas penting bagi kelangsungan bisnis?',
  },
  {
    id: 8,
    price: 60000,
    question: 'Jelaskan konsep ekonomi skala (economies of scale) dan bagaimana hal itu menguntungkan perusahaan besar?',
  },
  {
    id: 9,
    price: 75000,
    question: 'Apa yang dimaksud dengan strategi penetapan harga penetrasi pasar (market penetration pricing) dan kapan sebaiknya digunakan?',
  },
  {
    id: 10,
    price: 100000,
    question: 'Jelaskan perbedaan antara pemimpin pasar (market leader), penantang pasar (market challenger), dan pengikut pasar (market follower)!',
  },
]

// ─────────────────────────────────────────
// Upgrade tiers — mulai dari 1000 (income awal 500)
// ─────────────────────────────────────────
const UPGRADE_TIERS = [
  { label: 'Pemula',        incomePerClick: 500,   price: 0,      description: 'Klik biasa' },
  { label: 'Basic Hustle',  incomePerClick: 1000,  price: 5000,   description: '+1000/klik' },
  { label: 'Side Hustle',   incomePerClick: 3000,  price: 15000,  description: '+3000/klik' },
  { label: 'Reseller Pro',  incomePerClick: 6000,  price: 35000,  description: '+6000/klik' },
  { label: 'Dropship King', incomePerClick: 12000, price: 70000,  description: '+12000/klik' },
  { label: 'BUMH Investor', incomePerClick: 25000, price: 130000, description: '+25000/klik' },
]

const INITIAL_TIME = 600 // 10 menit dalam detik
const BONUS_TIME_PER_CORRECT = 120 // +2 menit per jawaban benar

// ─────────────────────────────────────────
// Reactive state
// ─────────────────────────────────────────
const state = reactive({
  money: 0,
  timeLeft: INITIAL_TIME,
  isRunning: false,
  isGameOver: false,
  isWin: false,

  upgradeLevel: 0,
  incomePerClick: UPGRADE_TIERS[0].incomePerClick,

  questions: QUESTIONS.map(q => ({
    ...q,
    status: 'locked',
    userAnswer: '',
    isLoading: false,
    feedback: null,
  })),

  totalClicks: 0,
  groqApiKey: '',
})

// ─────────────────────────────────────────
// Computed
// ─────────────────────────────────────────
const nextUpgrade = computed(() => {
  const next = state.upgradeLevel + 1
  return next < UPGRADE_TIERS.length ? UPGRADE_TIERS[next] : null
})

const currentUpgrade = computed(() => UPGRADE_TIERS[state.upgradeLevel])

const allQuestionsAnswered = computed(() =>
  state.questions.every(q => q.status === 'answered')
)

const winCondition = computed(() =>
  state.money >= 100000 && allQuestionsAnswered.value
)

// ─────────────────────────────────────────
// Actions
// ─────────────────────────────────────────
function startGame() {
  state.money = 0
  state.timeLeft = INITIAL_TIME
  state.isRunning = true
  state.isGameOver = false
  state.isWin = false
  state.upgradeLevel = 0
  state.incomePerClick = UPGRADE_TIERS[0].incomePerClick
  state.totalClicks = 0
  state.questions = QUESTIONS.map(q => ({
    ...q,
    status: 'locked',
    userAnswer: '',
    isLoading: false,
    feedback: null,
  }))
}

function clickCuan() {
  if (!state.isRunning) return
  state.money += state.incomePerClick
  state.totalClicks++
  checkWin()
}

function buyUpgrade() {
  const next = nextUpgrade.value
  if (!next) return
  if (state.money < next.price) return
  state.money -= next.price
  state.upgradeLevel++
  state.incomePerClick = UPGRADE_TIERS[state.upgradeLevel].incomePerClick
}

function buyQuestion(questionId) {
  const q = state.questions.find(q => q.id === questionId)
  if (!q || q.status !== 'locked') return
  if (state.money < q.price) return
  state.money -= q.price
  q.status = 'unlocked'
  q.feedback = null
}

function tickTimer() {
  if (!state.isRunning) return
  if (state.timeLeft > 0) {
    state.timeLeft--
  } else {
    state.isRunning = false
    state.isGameOver = true
  }
}

function checkWin() {
  if (winCondition.value) {
    state.isRunning = false
    state.isWin = true
  }
}

// ─────────────────────────────────────────
// Groq AI grading
// ─────────────────────────────────────────
async function submitAnswer(questionId) {
  const q = state.questions.find(q => q.id === questionId)
  if (!q || q.status !== 'unlocked') return
  if (!q.userAnswer.trim()) return

  if (!state.groqApiKey) {
    q.feedback = { type: 'error', message: 'Masukkan Groq API Key terlebih dahulu!' }
    return
  }

  q.isLoading = true
  q.feedback = null

  try {
    const result = await gradeWithGroq(q.question, q.userAnswer, state.groqApiKey)

    if (result === 'BENAR') {
      q.status = 'answered'
      q.feedback = { type: 'correct', message: `✅ BENAR! Soal selesai! +2 menit bonus waktu! ⏱` }
      // +2 menit bonus waktu
      state.timeLeft = Math.min(state.timeLeft + BONUS_TIME_PER_CORRECT, 3600)
      checkWin()
    } else {
      q.status = 'locked'
      q.userAnswer = ''
      q.feedback = { type: 'wrong', message: '❌ SALAH! Soal dikunci lagi. Beli ulang untuk mencoba.' }
    }
  } catch (err) {
    q.feedback = { type: 'error', message: `Error: ${err.message}` }
  } finally {
    q.isLoading = false
  }
}

// ─────────────────────────────────────────
// Groq API
// ─────────────────────────────────────────
async function gradeWithGroq(question, answer, apiKey) {
  const systemPrompt = `Kamu adalah penilai jawaban soal bisnis.
Tugasmu HANYA membalas dengan satu kata: "BENAR" atau "SALAH".
Nilai jawaban berdasarkan MAKNA dan PEMAHAMAN, bukan kata per kata yang tepat.
Jika jawaban menunjukkan pemahaman konsep yang benar meskipun tidak sempurna, jawab BENAR.
Jika jawaban salah, tidak relevan, atau tidak menunjukkan pemahaman, jawab SALAH.
JANGAN tambahkan kata lain selain BENAR atau SALAH.`

  const userPrompt = `Soal: ${question}
Jawaban mahasiswa: ${answer}
Apakah jawaban ini BENAR atau SALAH?`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 10,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Groq API error')
  }

  const data = await response.json()
  const reply = data.choices[0]?.message?.content?.trim().toUpperCase()

  if (reply?.includes('BENAR')) return 'BENAR'
  if (reply?.includes('SALAH')) return 'SALAH'
  return 'SALAH'
}

// ─────────────────────────────────────────
// Export
// ─────────────────────────────────────────
export function useGameState() {
  return {
    state,
    nextUpgrade,
    currentUpgrade,
    allQuestionsAnswered,
    winCondition,
    UPGRADE_TIERS,
    startGame,
    clickCuan,
    buyUpgrade,
    buyQuestion,
    submitAnswer,
    tickTimer,
  }
}
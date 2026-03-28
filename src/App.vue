<template>
  <div class="app">

    <!-- ══════════════════════════════════
         SCREEN: START
    ══════════════════════════════════ -->
    <div v-if="screen === 'start'" class="screen screen--start">
      <div class="start-card">
        <div class="logo-badge">BUMH</div>
        <h1 class="game-title">CUAN<span class="title-accent">!</span></h1>
        <p class="subtitle">Click. Upgrade. Jawab Soal. Menang.</p>

        <div class="api-input-group">
          <label>Groq API Key <span class="optional">(untuk fitur soal)</span></label>
          <input
            v-model="state.groqApiKey"
            type="password"
            placeholder="gsk_xxxx..."
            class="api-input"
          />
          <a href="https://console.groq.com" target="_blank" class="api-link">Dapatkan API Key gratis →</a>
        </div>

        <div class="win-rules">
          <div class="rule-item">💰 Kumpulkan Rp 100.000</div>
          <div class="rule-item">📚 Jawab semua 10 soal bisnis</div>
          <div class="rule-item">⏱ Waktu 7 menit (+30 detik tiap jawaban benar)</div>
        </div>

        <button class="btn btn--start" @click="handleStart">
          🚀 MULAI GAME
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════
         SCREEN: GAME OVER
    ══════════════════════════════════ -->
    <div v-else-if="screen === 'gameover'" class="screen screen--gameover">
      <div class="result-card result-card--lose">
        <div class="result-emoji">💸</div>
        <h2>WAKTU HABIS!</h2>
        <p class="result-sub">Uang kamu terlalu sedikit untuk BUMH...</p>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">Uang Terkumpul</span>
            <span class="stat-value">Rp {{ formatMoney(state.money) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Klik</span>
            <span class="stat-value">{{ state.totalClicks }}x</span>
          </div>
          <div class="stat">
            <span class="stat-label">Soal Selesai</span>
            <span class="stat-value">{{ answeredCount }}/10</span>
          </div>
        </div>
        <button class="btn btn--retry" @click="handleStart">🔄 COBA LAGI</button>
      </div>
    </div>

    <!-- ══════════════════════════════════
         SCREEN: WIN
    ══════════════════════════════════ -->
    <div v-else-if="screen === 'win'" class="screen screen--win">
      <div class="result-card result-card--win">
        <div class="result-emoji win-emoji">🏆</div>
        <h2>SELAMAT!</h2>
        <p class="result-sub">Kamu adalah BUMH CUAN sejati! 🎉</p>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">Uang Final</span>
            <span class="stat-value gold">Rp {{ formatMoney(state.money) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Klik</span>
            <span class="stat-value">{{ state.totalClicks }}x</span>
          </div>
          <div class="stat">
            <span class="stat-label">Soal Selesai</span>
            <span class="stat-value gold">{{ answeredCount }}/10</span>
          </div>
        </div>
        <button class="btn btn--start" @click="handleStart">🔄 MAIN LAGI</button>
      </div>
    </div>

    <!-- ══════════════════════════════════
         SCREEN: PLAYING
    ══════════════════════════════════ -->
    <div v-else-if="screen === 'playing'" class="game-layout">

      <!-- ── HUD Bar ── -->
      <header class="hud">
        <div class="hud-money">
          <span class="hud-label">UANG</span>
          <span class="hud-value money-value">Rp {{ formatMoney(state.money) }}</span>
        </div>

        <div class="hud-center">
          <div class="timer" :class="{ 'timer--urgent': state.timeLeft <= 60 }">
            <svg viewBox="0 0 36 36" class="timer-ring">
              <path
                class="timer-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="timer-fill"
                :stroke-dasharray="`${Math.min(100, (state.timeLeft / 420) * 100)}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="timer-number">{{ formatTime(state.timeLeft) }}</span>
          </div>
        </div>

        <div class="hud-upgrade-info">
          <span class="hud-label">LEVEL</span>
          <span class="hud-value">{{ currentUpgrade.label }}</span>
        </div>
      </header>

      <!-- ── Main Content ── -->
      <main class="game-main">

        <!-- Phaser Canvas Column -->
        <section class="phaser-col">
          <div ref="phaserContainer" class="phaser-container"></div>

          <!-- Progress Bar uang -->
          <div class="money-progress-wrap">
            <div class="money-progress-label">
              <span>Target: Rp 100.000</span>
              <span>{{ Math.min(100, Math.floor((state.money / 100000) * 100)) }}%</span>
            </div>
            <div class="money-progress-bar">
              <div
                class="money-progress-fill"
                :style="{ width: `${Math.min(100, (state.money / 100000) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Progress soal -->
          <div class="quiz-progress-wrap">
            <div class="money-progress-label">
              <span>📚 Soal Selesai</span>
              <span>{{ answeredCount }}/10</span>
            </div>
            <div class="money-progress-bar">
              <div
                class="quiz-progress-fill"
                :style="{ width: `${(answeredCount / 10) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Upgrade Panel -->
          <div class="upgrade-panel">
            <h3 class="panel-title">⚡ UPGRADE KLIK</h3>
            <div class="upgrade-current">
              <span>{{ currentUpgrade.label }}</span>
              <span class="income-badge">+Rp{{ formatMoney(state.incomePerClick) }}/klik</span>
            </div>
            <button
              v-if="nextUpgrade"
              class="btn btn--upgrade"
              :class="{ 'btn--disabled': state.money < nextUpgrade.price }"
              :disabled="state.money < nextUpgrade.price"
              @click="handleBuyUpgrade"
            >
              <span>Upgrade → {{ nextUpgrade.label }}</span>
              <span class="upgrade-price">Rp {{ formatMoney(nextUpgrade.price) }}</span>
            </button>
            <div v-else class="upgrade-maxed">
              🏅 UPGRADE MAKSIMAL
            </div>
          </div>
        </section>

        <!-- Quiz Column -->
        <section class="quiz-col">
          <h3 class="panel-title">📚 SOAL BISNIS</h3>
          <p class="quiz-subtitle">Jawab benar = +30 detik bonus waktu! ⏱</p>

          <div class="questions-list">
            <div
              v-for="q in state.questions"
              :key="q.id"
              class="question-card"
              :class="`question-card--${q.status}`"
            >
              <div class="question-header">
                <div class="question-meta">
                  <span class="q-number">Soal #{{ q.id }}</span>
                  <span class="q-badge" :class="`badge--${q.status}`">
                    {{ q.status === 'locked' ? '🔒 Terkunci' : q.status === 'unlocked' ? '📝 Terbuka' : '✅ Selesai' }}
                  </span>
                </div>
                <span v-if="q.status === 'locked'" class="q-price">Rp {{ formatMoney(q.price) }}</span>
              </div>

              <p class="question-text">{{ q.question }}</p>

              <button
                v-if="q.status === 'locked'"
                class="btn btn--buy"
                :class="{ 'btn--disabled': state.money < q.price }"
                :disabled="state.money < q.price"
                @click="buyQuestion(q.id)"
              >
                🛒 Beli Soal
              </button>

              <div v-else-if="q.status === 'unlocked'" class="answer-area">
                <textarea
                  v-model="q.userAnswer"
                  placeholder="Tulis jawabanmu di sini..."
                  class="answer-input"
                  rows="3"
                  :disabled="q.isLoading"
                ></textarea>
                <button
                  class="btn btn--submit"
                  :class="{ 'btn--loading': q.isLoading }"
                  :disabled="q.isLoading || !q.userAnswer.trim()"
                  @click="handleSubmitAnswer(q.id)"
                >
                  {{ q.isLoading ? '⏳ Menilai...' : '📤 Kirim Jawaban' }}
                </button>
              </div>

              <div v-else-if="q.status === 'answered'" class="answered-badge">
                ✅ Jawaban diterima!
              </div>

              <div
                v-if="q.feedback"
                class="feedback"
                :class="`feedback--${q.feedback.type}`"
              >
                {{ q.feedback.message }}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import Phaser from 'phaser'
import GameScene from './scenes/GameScene.js'
import { useGameState } from './composables/useGameState.js'

const {
  state,
  nextUpgrade,
  currentUpgrade,
  startGame,
  clickCuan,
  buyUpgrade,
  buyQuestion,
  submitAnswer,
  tickTimer,
} = useGameState()

// ─── Screen state ───
const screen = computed(() => {
  if (state.isWin) return 'win'
  if (state.isGameOver) return 'gameover'
  if (state.isRunning) return 'playing'
  return 'start'
})

// ─── Jumlah soal selesai ───
const answeredCount = computed(() =>
  state.questions.filter(q => q.status === 'answered').length
)

// ─── Format rupiah ───
function formatMoney(n) {
  return Number(n).toLocaleString('id-ID')
}

// ─── Format detik → MM:SS ───
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Phaser ───
const phaserContainer = ref(null)
let phaserGame = null
let gameScene = null
let timerInterval = null

function initPhaser() {
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
    gameScene = null
  }

  const scene = new GameScene()
  scene.onClickCallback = clickCuan

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    width: 340,
    height: 340,
    transparent: true,
    parent: phaserContainer.value,
    scene: scene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  })

  phaserGame.events.once('ready', () => {
    gameScene = phaserGame.scene.getScene('GameScene')
  })
}

function startTimer() {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    tickTimer()
    if (state.isGameOver) {
      clearInterval(timerInterval)
      gameScene?.showGameOver()
    }
  }, 1000)
}

function handleStart() {
  startGame()
  setTimeout(() => {
    if (phaserContainer.value) {
      initPhaser()
      startTimer()
    }
  }, 50)
}

// ─── Upgrade + SFX ───
function handleBuyUpgrade() {
  buyUpgrade()
  setTimeout(() => {
    if (gameScene) {
      gameScene.updateIncomeDisplay(state.incomePerClick)
      gameScene.playUpgradeSFX()
    }
  }, 50)
}

// ─── Submit jawaban + SFX ───
async function handleSubmitAnswer(questionId) {
  const qBefore = state.questions.find(q => q.id === questionId)
  const statusBefore = qBefore?.status

  await submitAnswer(questionId)

  setTimeout(() => {
    if (!gameScene) return
    const qAfter = state.questions.find(q => q.id === questionId)
    if (qAfter?.status === 'answered' && statusBefore !== 'answered') {
      gameScene.playCorrectSFX()
    } else if (qAfter?.feedback?.type === 'wrong') {
      gameScene.playWrongSFX()
    }
  }, 150)
}

watch(() => state.isWin, (val) => {
  if (val) {
    clearInterval(timerInterval)
    gameScene?.showWin()
  }
})

onUnmounted(() => {
  clearInterval(timerInterval)
  phaserGame?.destroy(true)
})
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold: #ffd700;
  --gold-dark: #e6b800;
  --purple-dark: #0a0a1a;
  --purple-mid: #1a0a2e;
  --purple-light: #2d1b5e;
  --green: #00ff99;
  --red: #ff4444;
  --orange: #ff6b35;
  --text: #e8e8ff;
  --text-dim: #8888aa;
  --card-bg: rgba(255,255,255,0.04);
  --card-border: rgba(255,255,255,0.08);
  --radius: 16px;
  --radius-sm: 10px;
}

body {
  font-family: 'Space Grotesk', sans-serif;
  background: var(--purple-dark);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Screens ── */
.screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
}

.start-card, .result-card {
  background: linear-gradient(135deg, rgba(26,10,46,0.95), rgba(45,27,94,0.95));
  border: 1px solid var(--card-border);
  border-radius: 24px;
  padding: 40px 36px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.1);
}

.logo-badge {
  display: inline-block;
  background: var(--gold);
  color: var(--purple-dark);
  font-family: 'Bebas Neue', cursive;
  font-size: 14px;
  letter-spacing: 4px;
  padding: 4px 16px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.game-title {
  font-family: 'Bebas Neue', cursive;
  font-size: 80px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 0 40px rgba(255,215,0,0.4);
  margin-bottom: 8px;
}
.title-accent { color: var(--orange); }
.subtitle { color: var(--text-dim); font-size: 14px; margin-bottom: 28px; }

.api-input-group { text-align: left; margin-bottom: 24px; }
.api-input-group label { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
.optional { font-weight: 400; color: #666; }
.api-input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--text);
  font-family: monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.api-input:focus { border-color: var(--gold); }
.api-link { display: block; margin-top: 6px; font-size: 12px; color: var(--gold); text-decoration: none; opacity: 0.8; }
.api-link:hover { opacity: 1; }

.win-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
  text-align: left;
  background: rgba(255,215,0,0.05);
  border: 1px solid rgba(255,215,0,0.15);
  border-radius: var(--radius-sm);
  padding: 16px;
}
.rule-item { font-size: 14px; color: var(--text-dim); }

.result-card--lose { border-color: rgba(255,68,68,0.3); }
.result-card--win  { border-color: rgba(255,215,0,0.4); box-shadow: 0 0 60px rgba(255,215,0,0.15); }

.result-emoji { font-size: 64px; margin-bottom: 12px; }
.win-emoji { animation: bounce 0.6s ease infinite alternate; }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }

.result-card h2 { font-family: 'Bebas Neue'; font-size: 48px; color: var(--gold); margin-bottom: 8px; }
.result-sub { color: var(--text-dim); font-size: 14px; margin-bottom: 24px; }

.result-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
.stat {
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius-sm);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label { font-size: 11px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 14px; font-weight: 700; color: var(--text); }
.stat-value.gold { color: var(--gold); }

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 15px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  padding: 12px 24px;
}
.btn--start {
  width: 100%;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--purple-dark);
  font-size: 18px;
  padding: 16px;
  border-radius: var(--radius);
  letter-spacing: 1px;
  box-shadow: 0 8px 24px rgba(255,215,0,0.3);
}
.btn--start:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,215,0,0.4); }
.btn--start:active { transform: translateY(0); }
.btn--retry {
  width: 100%;
  background: rgba(255,255,255,0.1);
  color: var(--text);
  border: 1px solid var(--card-border);
  font-size: 16px;
  padding: 14px;
  border-radius: var(--radius);
}
.btn--retry:hover { background: rgba(255,255,255,0.15); }
.btn--upgrade {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1e3a5f, #2d5a8e);
  color: white;
  border: 1px solid rgba(100,180,255,0.3);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
}
.btn--upgrade:hover:not(:disabled) { background: linear-gradient(135deg, #2d5a8e, #3d7ab0); transform: translateY(-1px); }
.btn--buy {
  width: 100%;
  background: linear-gradient(135deg, var(--purple-light), #3d1a6e);
  color: var(--gold);
  border: 1px solid rgba(255,215,0,0.2);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.btn--buy:hover:not(:disabled) { background: linear-gradient(135deg, #3d1a6e, #4d2a8e); }
.btn--submit {
  width: 100%;
  background: linear-gradient(135deg, #1a5e3a, #2d8e5a);
  color: white;
  border: 1px solid rgba(0,255,153,0.2);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  margin-top: 8px;
}
.btn--submit:hover:not(:disabled) { background: linear-gradient(135deg, #2d8e5a, #3dae7a); }
.btn--disabled, .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
.btn--loading { opacity: 0.7; cursor: wait; }

/* ── Game Layout ── */
.game-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

/* ── HUD ── */
.hud {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 10px 20px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--card-border);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
}
.hud-money { display: flex; flex-direction: column; gap: 2px; }
.hud-upgrade-info { display: flex; flex-direction: column; gap: 2px; text-align: right; }
.hud-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); font-weight: 600; }
.hud-value { font-size: 16px; font-weight: 700; }
.money-value { color: var(--gold); font-family: 'Bebas Neue'; font-size: 22px; }

/* ── Timer ── */
.hud-center { display: flex; justify-content: center; }
.timer { position: relative; width: 64px; height: 64px; }
.timer-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.timer-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 3; }
.timer-fill {
  fill: none;
  stroke: var(--gold);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s linear;
}
.timer--urgent .timer-fill { stroke: var(--red); animation: pulse-red 0.5s infinite alternate; }
@keyframes pulse-red { from { opacity: 1; } to { opacity: 0.4; } }
.timer-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Bebas Neue';
  font-size: 16px;
  color: var(--text);
  letter-spacing: 1px;
}
.timer--urgent .timer-number { color: var(--red); }

/* ── Game Main ── */
.game-main {
  display: grid;
  grid-template-columns: 370px 1fr;
  gap: 20px;
  flex: 1;
  overflow: hidden;
  padding: 12px 0;
}

/* ── Phaser Col ── */
.phaser-col { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.phaser-container {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  overflow: hidden;
  flex-shrink: 0;
  height: 340px;
}
.phaser-container canvas { display: block !important; }

/* Progress bars */
.money-progress-wrap, .quiz-progress-wrap {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}
.money-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 6px;
}
.money-progress-bar {
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  height: 7px;
  overflow: hidden;
}
.money-progress-fill {
  background: linear-gradient(90deg, var(--gold-dark), var(--gold), #ffe566);
  height: 100%;
  border-radius: 20px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(255,215,0,0.4);
}
.quiz-progress-fill {
  background: linear-gradient(90deg, #00cc7a, var(--green));
  height: 100%;
  border-radius: 20px;
  transition: width 0.4s ease;
  box-shadow: 0 0 8px rgba(0,255,153,0.3);
}

/* Upgrade Panel */
.upgrade-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 14px;
}
.panel-title { font-family: 'Bebas Neue'; font-size: 18px; letter-spacing: 1px; color: var(--gold); margin-bottom: 10px; }
.upgrade-current { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
.income-badge {
  background: rgba(255,215,0,0.15);
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255,215,0,0.25);
}
.upgrade-price { font-size: 13px; color: var(--gold); font-weight: 700; }
.upgrade-maxed {
  text-align: center;
  padding: 10px;
  color: var(--gold);
  font-weight: 700;
  font-size: 14px;
  background: rgba(255,215,0,0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255,215,0,0.2);
}

/* ── Quiz Col ── */
.quiz-col {
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.quiz-subtitle { font-size: 13px; color: var(--green); margin-top: -4px; margin-bottom: 4px; font-weight: 600; }
.questions-list { display: flex; flex-direction: column; gap: 8px; }

.question-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 12px 14px;
  transition: border-color 0.2s;
}
.question-card--unlocked { border-color: rgba(100,180,255,0.3); }
.question-card--answered { border-color: rgba(0,255,153,0.3); background: rgba(0,255,153,0.03); }

.question-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.question-meta { display: flex; align-items: center; gap: 8px; }
.q-number { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
.q-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge--locked   { background: rgba(255,255,255,0.06); color: var(--text-dim); }
.badge--unlocked { background: rgba(100,180,255,0.15); color: #64b4ff; }
.badge--answered { background: rgba(0,255,153,0.15);   color: var(--green); }
.q-price { font-size: 12px; color: var(--gold); font-weight: 700; }

.question-text { font-size: 13px; color: var(--text); line-height: 1.5; margin-bottom: 10px; }

.answer-area { display: flex; flex-direction: column; gap: 6px; }
.answer-input {
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.answer-input:focus { border-color: rgba(100,180,255,0.5); }
.answer-input:disabled { opacity: 0.5; cursor: not-allowed; }

.answered-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--green);
  font-weight: 700;
  padding: 7px 12px;
  background: rgba(0,255,153,0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0,255,153,0.2);
}

.feedback {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
}
.feedback--correct { background: rgba(0,255,153,0.1);  color: var(--green);  border: 1px solid rgba(0,255,153,0.25); }
.feedback--wrong   { background: rgba(255,68,68,0.1);   color: var(--red);    border: 1px solid rgba(255,68,68,0.25); }
.feedback--error   { background: rgba(255,107,53,0.1);  color: var(--orange); border: 1px solid rgba(255,107,53,0.25); }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

@media (max-width: 768px) {
  .game-main { grid-template-columns: 1fr; overflow-y: auto; }
  .phaser-container { height: 280px; }
  .quiz-col { overflow-y: visible; }
  .hud-upgrade-info { display: none; }
}
</style>
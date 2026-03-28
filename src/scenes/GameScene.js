// src/scenes/GameScene.js
// Phaser 3 Scene — animasi klik, partikel uang, efek visual + SFX Web Audio API

// ─────────────────────────────────────────
// AudioManager — semua SFX dibuat programatik (tanpa file eksternal)
// ─────────────────────────────────────────
class AudioManager {
  constructor() {
    this.ctx = null
    this.bgGain = null
    this.bgLoopTimeout = null
    this.enabled = true
    this._init()
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      this.enabled = false
      console.warn('Web Audio API tidak tersedia:', e)
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  _playTone({ type = 'sine', freq = 440, gain = 0.6, duration = 0.15, startFreq, endFreq, delay = 0 }) {
    if (!this.enabled || !this.ctx) return
    this._resume()
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gainNode = this.ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(this.ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(startFreq || freq, t)
    if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, t + duration)
    gainNode.gain.setValueAtTime(0, t)
    gainNode.gain.linearRampToValueAtTime(gain, t + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  _playNoise({ gain = 0.5, duration = 0.1, filterFreq = 1000, delay = 0 }) {
    if (!this.enabled || !this.ctx) return
    this._resume()
    const t = this.ctx.currentTime + delay
    const bufferSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = filterFreq
    const gainNode = this.ctx.createGain()
    gainNode.gain.setValueAtTime(gain, t)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.ctx.destination)
    source.start(t)
    source.stop(t + duration + 0.05)
  }

  // SFX: Klik Cuan — koin "ting" ceria, pitch naik saat combo
  playCuanClick(combo = 0) {
    if (!this.enabled) return
    this._resume()
    const baseFreq = 880 + Math.min(combo * 40, 600)
    this._playTone({ type: 'sine',     freq: baseFreq,       gain: 0.55, duration: 0.12 })
    this._playTone({ type: 'triangle', freq: baseFreq * 2,   gain: 0.25, duration: 0.08 })
    this._playNoise({                                         gain: 0.25, duration: 0.04, filterFreq: 3000 })
    this._playTone({ type: 'sine',     freq: baseFreq * 1.5, gain: 0.30, duration: 0.08, delay: 0.04 })
  }

  // SFX: Upgrade berhasil — fanfare naik
  playUpgrade() {
    if (!this.enabled) return
    this._resume()
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      this._playTone({ type: 'square',   freq,        gain: 0.45, duration: 0.12, delay: i * 0.08 })
      this._playTone({ type: 'sine',     freq: freq * 2, gain: 0.20, duration: 0.10, delay: i * 0.08 })
    })
    this._playNoise({ gain: 0.40, duration: 0.18, filterFreq: 6000, delay: 0.28 })
  }

  // SFX: Jawaban BENAR — fanfare sukses
  playCorrectAnswer() {
    if (!this.enabled) return
    this._resume()
    const chord = [
      { freq: 523.25, delay: 0    },
      { freq: 659.25, delay: 0.06 },
      { freq: 783.99, delay: 0.12 },
      { freq: 1046.5, delay: 0.18 },
      { freq: 1318.5, delay: 0.24 },
    ]
    chord.forEach(({ freq, delay }) => {
      this._playTone({ type: 'sine',     freq,           gain: 0.50, duration: 0.25, delay })
      this._playTone({ type: 'triangle', freq: freq * 1.5, gain: 0.20, duration: 0.15, delay })
    })
    this._playTone({ type: 'sine', startFreq: 2000, endFreq: 2500, gain: 0.30, duration: 0.35, delay: 0.1 })
    this._playNoise({ gain: 0.25, duration: 0.3, filterFreq: 8000, delay: 0.05 })
  }

  // SFX: Jawaban SALAH — turun dramatis
  playWrongAnswer() {
    if (!this.enabled) return
    this._resume()
    this._playTone({ type: 'sawtooth', startFreq: 400, endFreq: 180, gain: 0.55, duration: 0.35 })
    this._playTone({ type: 'square',   freq: 150,                    gain: 0.40, duration: 0.20, delay: 0.1 })
    this._playNoise({ gain: 0.45, duration: 0.12, filterFreq: 200, delay: 0    })
    this._playNoise({ gain: 0.35, duration: 0.10, filterFreq: 300, delay: 0.08 })
  }

  // SFX: WIN — kemenangan meriah
  playWin() {
    if (!this.enabled) return
    this._resume()
    const melody = [
      { freq: 523.25, delay: 0,    dur: 0.15 },
      { freq: 659.25, delay: 0.12, dur: 0.15 },
      { freq: 783.99, delay: 0.24, dur: 0.15 },
      { freq: 1046.5, delay: 0.36, dur: 0.30 },
      { freq: 880,    delay: 0.60, dur: 0.15 },
      { freq: 1046.5, delay: 0.72, dur: 0.15 },
      { freq: 1318.5, delay: 0.84, dur: 0.50 },
    ]
    melody.forEach(({ freq, delay, dur }) => {
      this._playTone({ type: 'square', freq,        gain: 0.50, duration: dur,        delay })
      this._playTone({ type: 'sine',   freq: freq * 2, gain: 0.20, duration: dur * 0.8, delay })
    })
    ;[0, 0.36, 0.84].forEach(delay => {
      this._playNoise({ gain: 0.45, duration: 0.2, filterFreq: 7000, delay })
    })
  }

  // SFX: GAME OVER — turun sedih
  playGameOver() {
    if (!this.enabled) return
    this._resume()
    const notes = [
      { freq: 440,    delay: 0    },
      { freq: 392,    delay: 0.18 },
      { freq: 349.23, delay: 0.36 },
      { freq: 261.63, delay: 0.54 },
    ]
    notes.forEach(({ freq, delay }) => {
      this._playTone({ type: 'sawtooth', freq,           gain: 0.50, duration: 0.20, delay })
      this._playTone({ type: 'sine',     freq: freq * 0.5, gain: 0.30, duration: 0.25, delay })
    })
    this._playNoise({ gain: 0.35, duration: 0.6, filterFreq: 400, delay: 0.5 })
  }

  // BGM: loop ambient elektronik — volume dinaikkan
  startBGM() {
    if (!this.enabled || !this.ctx) return
    this._resume()
    this.stopBGM()
    this.bgGain = this.ctx.createGain()
    this.bgGain.gain.value = 0.22   // naik dari 0.06 → 0.22
    this.bgGain.connect(this.ctx.destination)
    this._scheduleBGM()
  }

  _scheduleBGM() {
    if (!this.bgGain || !this.enabled || !this.ctx) return
    const bpm = 128
    const beat = 60 / bpm
    const bars = 8
    const totalBeats = bars * 4
    const bassNotes = [65.41, 73.42, 65.41, 55.00]

    for (let i = 0; i < totalBeats; i++) {
      const t = this.ctx.currentTime + i * beat
      const freq = bassNotes[i % bassNotes.length]

      // Bass kick
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.connect(g)
      g.connect(this.bgGain)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq * 2, t)
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1)
      g.gain.setValueAtTime(0.85, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.8)
      osc.start(t)
      osc.stop(t + beat)

      // Hi-hat setiap beat ganjil
      if (i % 2 === 1) {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04)
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1
        const src = this.ctx.createBufferSource()
        src.buffer = buffer
        const filt = this.ctx.createBiquadFilter()
        filt.type = 'highpass'
        filt.frequency.value = 8000
        const hg = this.ctx.createGain()
        hg.gain.setValueAtTime(0.65, t)
        hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
        src.connect(filt)
        filt.connect(hg)
        hg.connect(this.bgGain)
        src.start(t)
        src.stop(t + 0.05)
      }

      // Chord arpegio tiap 4 beat
      if (i % 4 === 0) {
        const chordFreqs = [261.63, 329.63, 392.00]
        chordFreqs.forEach((cf, ci) => {
          const co = this.ctx.createOscillator()
          const cg = this.ctx.createGain()
          co.connect(cg)
          cg.connect(this.bgGain)
          co.type = 'triangle'
          co.frequency.value = cf
          cg.gain.setValueAtTime(0, t + ci * 0.04)
          cg.gain.linearRampToValueAtTime(0.45, t + ci * 0.04 + 0.02)
          cg.gain.exponentialRampToValueAtTime(0.0001, t + beat * 3.5)
          co.start(t + ci * 0.04)
          co.stop(t + beat * 4)
        })
      }
    }

    const loopDuration = totalBeats * beat * 1000
    this.bgLoopTimeout = setTimeout(() => this._scheduleBGM(), loopDuration - 200)
  }

  stopBGM() {
    clearTimeout(this.bgLoopTimeout)
    if (this.bgGain && this.ctx) {
      try {
        this.bgGain.gain.setValueAtTime(this.bgGain.gain.value, this.ctx.currentTime)
        this.bgGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3)
      } catch (e) { /* silent */ }
      this.bgGain = null
    }
  }

  destroy() {
    this.stopBGM()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

// Singleton AudioManager — dibuat sekali, dipakai ulang
let audioManager = null
function getAudioManager() {
  if (!audioManager) audioManager = new AudioManager()
  return audioManager
}

// ─────────────────────────────────────────
// GameScene
// ─────────────────────────────────────────
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.onClickCallback = null
    this.isActive = false
    this.coinGroup = null
    this.bgParticles = []
    this.multiplierText = null
    this.incomePerClick = 1000
    this.clickCount = 0
    this.comboTimer = null
    this.combo = 0
    this.audio = null
  }

  preload() {
    this._createCoinTexture()
    this._createSparkTexture()
    this._createBgTexture()
  }

  create() {
    const { width, height } = this.scale

    // Inisialisasi AudioManager
    this.audio = getAudioManager()

    // Background gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1)
    bg.fillRect(0, 0, width, height)

    // Grid pattern subtle
    const grid = this.add.graphics()
    grid.lineStyle(1, 0x1e1e3f, 0.4)
    for (let x = 0; x < width; x += 40) {
      grid.moveTo(x, 0)
      grid.lineTo(x, height)
    }
    for (let y = 0; y < height; y += 40) {
      grid.moveTo(0, y)
      grid.lineTo(width, y)
    }
    grid.strokePath()

    // Floating background orbs
    this._createBackgroundOrbs()

    // Coin group untuk animasi flying coins
    this.coinGroup = this.add.group()

    // Tombol utama CLICK CUAN
    this._createClickButton()

    // Multiplier display
    this.multiplierText = this.add.text(width / 2, height - 30, `+Rp${this.incomePerClick.toLocaleString('id-ID')}/klik`, {
      fontFamily: 'Space Grotesk',
      fontSize: '16px',
      color: '#ffd700',
      alpha: 0.8,
    }).setOrigin(0.5)

    // Combo text (tersembunyi awal)
    this.comboText = this.add.text(width / 2, 30, '', {
      fontFamily: 'Bebas Neue',
      fontSize: '28px',
      color: '#ff6b35',
    }).setOrigin(0.5).setAlpha(0)

    this.isActive = true

    // Mulai BGM saat scene dibuat
    this.audio.startBGM()
  }

  _createClickButton() {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    this.btnContainer = this.add.container(cx, cy)

    // Shadow / glow
    const glow = this.add.graphics()
    glow.fillStyle(0xffd700, 0.15)
    glow.fillCircle(0, 0, 85)
    this.btnContainer.add(glow)

    // Outer ring
    const ring = this.add.graphics()
    ring.lineStyle(3, 0xffd700, 0.6)
    ring.strokeCircle(0, 0, 72)
    this.btnContainer.add(ring)

    // Main button circle
    const btn = this.add.graphics()
    btn.fillStyle(0xffd700, 1)
    btn.fillCircle(0, 0, 60)
    this.btnContainer.add(btn)

    // Inner shadow
    const inner = this.add.graphics()
    inner.fillStyle(0xe6b800, 1)
    inner.fillCircle(5, 5, 55)
    this.btnContainer.add(inner)

    // Icon uang
    const icon = this.add.text(0, -8, '💰', {
      fontSize: '36px',
    }).setOrigin(0.5)
    this.btnContainer.add(icon)

    const label = this.add.text(0, 22, 'CUAN!', {
      fontFamily: 'Bebas Neue',
      fontSize: '18px',
      color: '#1a0a2e',
    }).setOrigin(0.5)
    this.btnContainer.add(label)

    // Hit area (circle transparan untuk input)
    const hitArea = this.add.circle(cx, cy, 65, 0xffffff, 0)
    hitArea.setInteractive({ useHandCursor: true })

    hitArea.on('pointerdown', () => this._handleClick())
    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: this.btnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 })
      glow.clear()
      glow.fillStyle(0xffd700, 0.25)
      glow.fillCircle(0, 0, 85)
    })
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: this.btnContainer, scaleX: 1, scaleY: 1, duration: 150 })
      glow.clear()
      glow.fillStyle(0xffd700, 0.15)
      glow.fillCircle(0, 0, 85)
    })

    this.hitArea = hitArea

    // Animasi idle — pulse
    this.tweens.add({
      targets: ring,
      alpha: { from: 0.6, to: 0.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    })
  }

  _handleClick() {
    if (!this.isActive) return

    const { width, height } = this.scale

    // Animasi tekan
    this.tweens.add({
      targets: this.btnContainer,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: 60,
      yoyo: true,
    })

    // Terbangkan koin
    this._spawnFloatingMoney(width / 2, height / 2)

    // Spark burst
    this._spawnSparks(width / 2, height / 2)

    // Combo system
    this._handleCombo()

    // SFX Klik Cuan
    this.audio.playCuanClick(this.combo)

    // Panggil Vue callback
    if (this.onClickCallback) this.onClickCallback()
  }

  _spawnFloatingMoney(x, y) {
    const texts = [
      `+${(this.incomePerClick).toLocaleString('id-ID')}`,
      '💵', '💰', '🤑',
    ]
    const text = texts[Math.floor(Math.random() * texts.length)]

    const floatText = this.add.text(
      x + Phaser.Math.Between(-50, 50),
      y,
      text,
      {
        fontFamily: 'Bebas Neue',
        fontSize: `${Phaser.Math.Between(18, 28)}px`,
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5)

    this.tweens.add({
      targets: floatText,
      y: y - Phaser.Math.Between(80, 140),
      x: floatText.x + Phaser.Math.Between(-40, 40),
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 900,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    })
  }

  _spawnSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const speed = Phaser.Math.Between(60, 120)
      const spark = this.add.image(x, y, 'spark').setScale(0.6).setTint(0xffd700)

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      })
    }
  }

  _handleCombo() {
    this.combo++
    clearTimeout(this.comboTimer)

    this.comboTimer = setTimeout(() => {
      this.combo = 0
      this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 })
    }, 1500)

    if (this.combo >= 5) {
      const msg = this.combo >= 15 ? `🔥 COMBO x${this.combo}!! GILA!` :
                  this.combo >= 10 ? `⚡ COMBO x${this.combo}!` :
                  `COMBO x${this.combo}`
      this.comboText.setText(msg)
      this.comboText.setAlpha(1)
      this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true })
    }
  }

  _createBackgroundOrbs() {
    const { width, height } = this.scale
    const colors = [0x6600ff, 0x0066ff, 0xff6600, 0x00ff99]

    for (let i = 0; i < 4; i++) {
      const orb = this.add.graphics()
      orb.fillStyle(colors[i % colors.length], 0.07)
      orb.fillCircle(0, 0, Phaser.Math.Between(60, 120))
      orb.x = Phaser.Math.Between(0, width)
      orb.y = Phaser.Math.Between(0, height)
      this.bgParticles.push(orb)

      this.tweens.add({
        targets: orb,
        x: orb.x + Phaser.Math.Between(-60, 60),
        y: orb.y + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  _createCoinTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0xffd700)
    g.fillCircle(12, 12, 12)
    g.fillStyle(0xe6b800)
    g.fillCircle(12, 14, 10)
    g.generateTexture('coin', 24, 24)
    g.destroy()
  }

  _createSparkTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0xffffff)
    g.fillRect(0, 3, 12, 2)
    g.fillRect(5, 0, 2, 8)
    g.generateTexture('spark', 12, 8)
    g.destroy()
  }

  _createBgTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0x1a1a2e)
    g.fillRect(0, 0, 1, 1)
    g.generateTexture('bg', 1, 1)
    g.destroy()
  }

  // Dipanggil Vue saat upgrade
  updateIncomeDisplay(income) {
    this.incomePerClick = income
    if (this.multiplierText) {
      this.multiplierText.setText(`+Rp${income.toLocaleString('id-ID')}/klik`)
      this.tweens.add({
        targets: this.multiplierText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
      })
    }
  }

  // Dipanggil Vue: SFX upgrade
  playUpgradeSFX() {
    this.audio?.playUpgrade()
  }

  // Dipanggil Vue: SFX jawaban benar
  playCorrectSFX() {
    this.audio?.playCorrectAnswer()
  }

  // Dipanggil Vue: SFX jawaban salah
  playWrongSFX() {
    this.audio?.playWrongAnswer()
  }

  showGameOver() {
    this.isActive = false
    const { width, height } = this.scale
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0)
    overlay.fillRect(0, 0, width, height)
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 500 })
    this.hitArea?.disableInteractive()

    // Stop BGM + SFX game over
    this.audio?.stopBGM()
    this.audio?.playGameOver()
  }

  showWin() {
    this.isActive = false
    const { width, height } = this.scale

    // Rain of coins
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 100, () => {
        const coin = this.add.text(
          Phaser.Math.Between(0, width), -20,
          ['💰', '💵', '🤑'][Math.floor(Math.random() * 3)],
          { fontSize: '28px' }
        )
        this.tweens.add({
          targets: coin,
          y: height + 40,
          x: coin.x + Phaser.Math.Between(-80, 80),
          duration: Phaser.Math.Between(1500, 3000),
          ease: 'Power1',
          onComplete: () => coin.destroy(),
        })
      })
    }

    this.hitArea?.disableInteractive()

    // Stop BGM + SFX win
    this.audio?.stopBGM()
    this.audio?.playWin()
  }
}
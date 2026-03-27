// src/scenes/GameScene.js
// Phaser 3 Scene — menangani animasi klik, partikel uang, dan efek visual

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.onClickCallback = null   // dipanggil Vue saat klik valid
    this.isActive = false
    this.coinGroup = null
    this.bgParticles = []
    this.multiplierText = null
    this.incomePerClick = 1000
    this.clickCount = 0
    this.comboTimer = null
    this.combo = 0
  }

  preload() {
    // Buat asset programatik (tanpa file eksternal)
    this._createCoinTexture()
    this._createSparkTexture()
    this._createBgTexture()
  }

  create() {
    const { width, height } = this.scale

    // Background gradient menggunakan graphics
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
  }

  // ─── Dibuat tombol klik dengan Phaser Graphics ───
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

    // Icon uang (Rp text)
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

  // ─── Texture programatik ───
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

  // ─── Dipanggil Vue saat upgrade ───
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

  // ─── Game over / win visual ───
  showGameOver() {
    this.isActive = false
    const { width, height } = this.scale
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0)
    overlay.fillRect(0, 0, width, height)
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 500 })

    this.hitArea?.disableInteractive()
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
  }
}
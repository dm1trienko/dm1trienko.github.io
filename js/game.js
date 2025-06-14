class MiniRunner {
  constructor(canvasId, startBtnId) {
    this.canvas = document.getElementById(canvasId)
    this.btn = document.getElementById(startBtnId)
    if (!this.canvas || !this.btn) return
    this.ctx = this.canvas.getContext('2d')
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())
    this.bindEvents()
    this.reset()
  }

  bindEvents() {
    this.btn.addEventListener('click', () => this.start())
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.jump()
    })
    this.canvas.addEventListener('mousedown', () => this.jump())
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.jump()
    })
  }

  resizeCanvas() {
    const ratio = 3
    const width = this.canvas.parentElement.clientWidth
    this.canvas.width = width
    this.canvas.height = width / ratio
  }

  reset() {
    const h = this.canvas.height
    this.player = { x: 50, y: h - 40, w: 30, h: 30, vy: 0, grounded: true }
    this.obstacles = []
    this.spawnTimer = 0
    this.running = false
    this.score = 0
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ru'
    const text =
      lang === 'en'
        ? this.btn.dataset.startEn || this.btn.dataset.start || 'Start'
        : this.btn.dataset.start || 'Старт'
    this.btn.textContent = text
  }

  start() {
    if (this.running) return
    this.reset()
    this.running = true
    this.lastTime = performance.now()
    requestAnimationFrame((t) => this.loop(t))
  }

  jump() {
    if (this.player.grounded) {
      this.player.vy = -12
      this.player.grounded = false
    }
  }

  loop(t) {
    const dt = (t - this.lastTime) / 16
    this.lastTime = t
    this.update(dt)
    this.draw()
    if (this.running) requestAnimationFrame((n) => this.loop(n))
  }

  update(dt) {
    const c = this.canvas
    this.player.vy += 0.6 * dt
    this.player.y += this.player.vy * dt
    if (this.player.y >= c.height - this.player.h - 10) {
      this.player.y = c.height - this.player.h - 10
      this.player.vy = 0
      this.player.grounded = true
    }

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnObstacle()
      this.spawnTimer = 60 + Math.random() * 40
    }

    this.obstacles.forEach((o) => {
      o.x -= 4 * dt
    })
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > 0)

    for (const o of this.obstacles) {
      if (this.collide(this.player, o)) {
        this.running = false
        const lang = document.documentElement.lang === 'en' ? 'en' : 'ru'
        const text =
          lang === 'en'
            ? this.btn.dataset.restartEn || this.btn.dataset.restart || 'Restart'
            : this.btn.dataset.restart || 'Заново'
        this.btn.textContent = text
      }
    }

    if (this.running) this.score += dt
  }

  collide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    )
  }

  spawnObstacle() {
    const h = 20 + Math.random() * 20
    const w = 10 + Math.random() * 10
    const typeIndex = Math.floor(Math.random() * 3)
    const types = ['rect', 'circle', 'triangle']
    const type = types[typeIndex]
    const obstacle = {
      x: this.canvas.width,
      y: this.canvas.height - h - 10,
      w,
      h,
      type,
    }
    if (type === 'circle') {
      obstacle.r = Math.min(w, h) / 2
    }
    this.obstacles.push(obstacle)
  }

  draw() {
    const { ctx, canvas } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#362f2d'
    ctx.beginPath()
    ctx.arc(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      this.player.w / 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    // eyes
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(
      this.player.x + this.player.w * 0.35,
      this.player.y + this.player.h * 0.4,
      this.player.w * 0.07,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.beginPath()
    ctx.arc(
      this.player.x + this.player.w * 0.65,
      this.player.y + this.player.h * 0.4,
      this.player.w * 0.07,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.beginPath()
    ctx.arc(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h * 0.65,
      this.player.w * 0.25,
      0,
      Math.PI
    )
    ctx.stroke()

    ctx.fillStyle = '#bfa181'
    this.obstacles.forEach((o) => {
      if (o.type === 'circle') {
        ctx.beginPath()
        ctx.arc(o.x + o.r, o.y + o.r, o.r, 0, Math.PI * 2)
        ctx.fill()
      } else if (o.type === 'triangle') {
        ctx.beginPath()
        ctx.moveTo(o.x, o.y + o.h)
        ctx.lineTo(o.x + o.w / 2, o.y)
        ctx.lineTo(o.x + o.w, o.y + o.h)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillRect(o.x, o.y, o.w, o.h)
      }
    })

    ctx.fillStyle = '#362f2d'
    ctx.font = '14px sans-serif'
    ctx.fillText(`Score: ${Math.floor(this.score)}`, 10, 20)

    if (!this.running && this.score > 0) {
      ctx.fillStyle = '#544d4b'
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2)
      ctx.textAlign = 'start'
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new MiniRunner('game-canvas', 'game-start'))

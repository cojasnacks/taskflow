import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.18

  // Background
  ctx.fillStyle = '#5344B7'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, r)
  ctx.fill()

  // Bars
  const pad = size * 0.2
  const w1 = size * 0.18
  const gap = size * 0.07
  const barH = size * 0.55
  const y = size * 0.22

  ctx.fillStyle = 'white'
  ctx.globalAlpha = 1
  ctx.fillRect(pad, y + (barH * 0.1), w1, barH * 0.9)
  ctx.globalAlpha = 0.75
  ctx.fillRect(pad + w1 + gap, y, w1, barH * 0.65)
  ctx.globalAlpha = 0.5
  ctx.fillRect(pad + (w1 + gap) * 2, y + (barH * 0.25), w1, barH * 0.75)

  writeFileSync(`public/icon-${size}.png`, canvas.toBuffer('image/png'))
  console.log(`icon-${size}.png generated`)
}

generateIcon(192)
generateIcon(512)

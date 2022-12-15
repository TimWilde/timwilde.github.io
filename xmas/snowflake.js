const canvas = document.getElementById('card')
const gfx = canvas.getContext('2d')

const debug = () => {
   gfx.strokeStyle = '#fff'
   gfx.lineWidth = 1
   gfx.beginPath()
   gfx.strokeRect(0, 0, 150, 235)
}

const minY = 135
const maxY = 235
const maxX = 150
const branches = 6
const arms = 2 + Math.floor(Math.random() * 3.9)

const rotate = (v, theta) => {
   const thetaRads = (Math.PI / 180) * theta
   const cosTheta = Math.cos(thetaRads)
   const sinTheta = Math.sin(thetaRads)

   return {
      x: v.x * cosTheta - v.y * sinTheta,
      y: v.y * cosTheta + v.x * sinTheta
   }
}

const baseX = canvas.width / 2
const baseY = canvas.height / 2
const scale = 1.0

const tree = () => {
   gfx.beginPath()
   gfx.strokeStyle = '#fff'
   gfx.lineWidth = 4

   const spacing = (maxY - minY) / arms
   const length = (maxX / 2) + Math.random() * (maxX / 2)
   const angle = (Math.random() * 90) - 45

   const armData = []

   for (let i = 0; i < arms; i++) {
      const pos = (minY + i * spacing)
      const armLength = (maxX * 0.6) - (length / (pos * 0.025))
      const start = { x: 0, y: 0 }
      const end = rotate({ x: armLength, y: 0 }, angle)

      if (i === (arms - 1)) {
         armData.push({
            x1: start.x,
            y1: pos,
            x2: start.x,
            y2: (maxY - minY)
         })

         armData.push({
            x1: -60,
            y1: (maxY - minY),
            x2: 60,
            y2: (maxY - minY)
         })
      }

      armData.push({
         x1: start.x,
         y1: pos + start.y,
         x2: end.x,
         y2: pos + end.y
      })

      armData.push({
         x1: start.x,
         y1: pos + start.y,
         x2: -end.x,
         y2: pos + end.y
      })
   }

   let minDrawX = Infinity
   let maxDrawX = 0
   let minDrawY = Infinity
   let maxDrawY = 0

   for (let index = 0; index < branches; index++) {
      for (const arm of armData) {
         const begin = rotate({ x: arm.x1, y: arm.y1 }, index * (360 / branches))
         const end = rotate({ x: arm.x2, y: arm.y2 }, index * (360 / branches))

         gfx.beginPath()
         gfx.moveTo((baseX + begin.x) * scale, (baseY + begin.y) * scale)
         gfx.lineTo((baseX + end.x) * scale, (baseY + end.y) * scale)
         gfx.stroke()

         minDrawX = Math.min(minDrawX, Math.min(begin.x, end.x))
         maxDrawX = Math.max(maxDrawX, Math.max(begin.x, end.x))
         minDrawY = Math.min(minDrawY, Math.min(begin.y, end.y))
         maxDrawY = Math.max(maxDrawY, Math.max(begin.y, end.y))
      }
   }

   gfx.lineWidth = 1
   gfx.strokeStyle = '#f0f'
   gfx.beginPath()
   gfx.rect(baseX + minDrawX, baseY + minDrawY, (maxDrawX - minDrawX), (maxDrawY - minDrawY))
   gfx.stroke()
}

gfx.strokeStyle = '#f0f'
tree()
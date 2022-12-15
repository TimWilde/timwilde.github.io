const canvas = document.getElementById('card')
const gfx = canvas.getContext('2d')
gfx.width = canvas.width
gfx.height = canvas.height
gfx.lineWidth = 3
gfx.lineJoin = 'round'

const aspect = canvas.height / canvas.width
const canvasWidth = Math.min(canvas.width, window.innerWidth - 2)
canvas.style.width = canvasWidth + 'px';
canvas.style.height = (canvasWidth * aspect) + 'px';

let debug = false
let isPlaying = false

let rotating = true
let rotationStep = 0.1

const seed = Math.floor(Math.random() * 8) + 3
const seedStep = 360 / (seed * Math.PI)

canvas.title = `${seed} x ${seedStep}`

const image = new Image()
image.src = 'merry-christmas.png'

const width = canvas.width
const height = canvas.height
const field_of_view = 45
const view_plane_distance = (width / 2) / (Math.tan((field_of_view / 2) * (Math.PI / 180)))

const maxSpawned = 200
const maxSettled = maxSpawned * 20
const flakeSize = 5

let snowFlakes = []
let flakeSpeed = 0.5
let buffer = []
let tick = 0

const camera = {
   translation: {
      x: 0,
      y: -180,
      z: -1100
   },
   rotation: {
      x: 40,
      y: 0,
      z: 0
   }
}

const viewport = {
   w: width,
   h: height,
   d: view_plane_distance
}

const trunk = {
   translation: { x: 0, y: 0, z: 0 },
   rotation: { x: 0, y: 0, z: 0 },
   polys: [
      [{ x: -20, y: 0, z: -20 }, { x: 20, y: 0, z: -20 }, { x: 20, y: 100, z: -20 }],
      [{ x: 20, y: 100, z: -20 }, { x: -20, y: 100, z: -20 }, { x: -20, y: 0, z: -20 }],
      [{ x: -20, y: 0, z: -20 }, { x: -20, y: 100, z: -20 }, { x: -20, y: 100, z: 20 }],
      [{ x: -20, y: 0, z: -20 }, { x: -20, y: 100, z: 20 }, { x: -20, y: 0, z: 20 }],
      [{ x: -20, y: 0, z: 20 }, { x: 20, y: 100, z: 20 }, { x: 20, y: 0, z: 20 }],
      [{ x: -20, y: 0, z: 20 }, { x: -20, y: 100, z: 20 }, { x: 20, y: 100, z: 20 }],
      [{ x: 20, y: 100, z: 20 }, { x: 20, y: 100, z: -20 }, { x: 20, y: 0, z: -20 }],
      [{ x: 20, y: 0, z: 20 }, { x: 20, y: 100, z: 20 }, { x: 20, y: 0, z: -20 }],
   ],
   color: {
      line: '#CD7F32',
      fill: '#222'
   }
}

const tree = {
   translation: { x: 0, y: 0, z: 0 },
   rotation: { x: 0, y: 0, z: 0 },
   polys: [
      [{ x: 0, y: 400, z: 0 }, { x: -50, y: 100, z: -100 }, { x: 50, y: 100, z: -100 }],
      [{ x: 0, y: 400, z: 0 }, { x: 50, y: 100, z: -100 }, { x: 100, y: 100, z: -50 }],
      [{ x: 0, y: 400, z: 0 }, { x: 100, y: 100, z: -50 }, { x: 100, y: 100, z: 50 }],
      [{ x: 0, y: 400, z: 0 }, { x: -50, y: 100, z: 100 }, { x: -100, y: 100, z: 50 }],
      [{ x: 0, y: 400, z: 0 }, { x: 50, y: 100, z: 100 }, { x: -50, y: 100, z: 100 }],
      [{ x: 0, y: 400, z: 0 }, { x: -100, y: 100, z: -50 }, { x: -50, y: 100, z: -100 }],
      [{ x: 0, y: 400, z: 0 }, { x: -100, y: 100, z: 50 }, { x: -100, y: 100, z: -50 }],
      [{ x: 0, y: 400, z: 0 }, { x: 100, y: 100, z: 50 }, { x: 50, y: 100, z: 100 }]
   ],
   color: {
      line: '#2c4',
      fill: '#222'
   }
}

const present = {
   translation: { x: 0, y: 0, z: 65 },
   rotation: { x: 0, y: 30, z: 0 },
   polys: [
      [{ x: -25, y: 50, z: -25 }, { x: 25, y: 50, z: -25 }, { x: 25, y: 0, z: -25 }],
      [{ x: -25, y: 0, z: -25 }, { x: -25, y: 50, z: -25 }, { x: 25, y: 0, z: -25 }],
      [{ x: 25, y: 50, z: -25 }, { x: 25, y: 50, z: 25 }, { x: 25, y: 0, z: -25 }],
      [{ x: 25, y: 0, z: -25 }, { x: 25, y: 50, z: 25 }, { x: 25, y: 0, z: 25 }],
      [{ x: -25, y: 50, z: 25 }, { x: -25, y: 50, z: -25 }, { x: -25, y: 0, z: -25 }],
      [{ x: -25, y: 50, z: 25 }, { x: -25, y: 0, z: -25 }, { x: -25, y: 0, z: 25 }],
      [{ x: 25, y: 50, z: 25 }, { x: -25, y: 50, z: 25 }, { x: 25, y: 0, z: 25 }],
      [{ x: 25, y: 0, z: 25 }, { x: -25, y: 0, z: 25 }, { x: -25, y: 50, z: 25 }],
      [{ x: -25, y: 50, z: -25 }, { x: -25, y: 50, z: 25 }, { x: 25, y: 50, z: -25 }],
      [{ x: -25, y: 50, z: 25 }, { x: 25, y: 50, z: 25 }, { x: 25, y: 50, z: -25 }]
   ],
   color: {
      line: '#f00',
      fill: '#222'
   }
}

const degToRad = degrees => (Math.PI / 180) * degrees

const rotateX = (v, theta) => {
   const thetaRads = degToRad(theta)
   const sinTheta = Math.sin(thetaRads)
   const cosTheta = Math.cos(thetaRads)

   return {
      x: v.x,
      y: v.y * cosTheta - v.z * sinTheta,
      z: v.z * cosTheta + v.y * sinTheta
   }
}

const rotateY = (v, theta) => {
   const thetaRads = degToRad(theta)
   const sinTheta = Math.sin(thetaRads)
   const cosTheta = Math.cos(thetaRads)

   return {
      x: v.x * cosTheta + v.z * sinTheta,
      y: v.y,
      z: v.z * cosTheta - v.x * sinTheta
   }
}

const rotateZ = (v, theta) => {
   const thetaRads = degToRad(theta)
   const sinTheta = Math.sin(thetaRads)
   const cosTheta = Math.cos(thetaRads)

   return {
      x: v.x * cosTheta - v.y * sinTheta,
      y: v.y * cosTheta + v.x * sinTheta,
      z: v.z
   }
}

const rotate = (v, vec) => {
   return rotateX(rotateY(rotateZ(v, vec.z), vec.y), vec.x)
}

const translate = (v, vec) => {
   return {
      x: v.x + vec.x,
      y: v.y + vec.y,
      z: v.z + vec.z
   }
}

const invert = vert => ({ x: -vert.x, y: -vert.y, z: -vert.z })

const cross = (vertA, vertB) => {
   return {
      x: (vertA.y * vertB.z) - (vertA.z * vertB.y),
      y: (vertA.z * vertB.x) - (vertA.x * vertB.z),
      z: (vertA.x * vertB.y) - (vertA.y * vertB.x)
   }
}

const dot = (vertA, vertB) => {
   return vertA.x * vertB.x +
      vertA.y * vertB.y +
      vertA.z * vertB.z
}

const normal = poly => {
   const a = {
      x: poly[0].x - poly[1].x,
      y: poly[0].y - poly[1].y,
      z: poly[0].z - poly[1].z
   }

   const b = {
      x: poly[0].x - poly[2].x,
      y: poly[0].y - poly[2].y,
      z: poly[0].z - poly[2].z
   }

   return cross(a, b)
}

const unitize = vert => {
   const magnitude =
      Math.sqrt(vert.x * vert.x +
         vert.y * vert.y +
         vert.z * vert.z)

   return {
      x: vert.x / magnitude,
      y: vert.y / magnitude,
      z: vert.z / magnitude
   }
}

const applyVert = (vert, rotation, translation) => {
   const worldSpace = translate(rotate(vert, rotation), translation)
   const cameraSpace = translate(rotate(worldSpace, invert(camera.rotation)), invert(camera.translation))
   return cameraSpace
}

const applyPoly = (polys, rotation, translation) =>
   polys.map(p => p.map(v => applyVert(v, rotation, translation)))

const projectVertex = vert => {
   return {
      x: (width / 2) + (((vert.x * viewport.d) / vert.z) * canvas.width) / viewport.w,
      y: height - (((vert.y * viewport.d) / vert.z) * canvas.height) / viewport.h
   }
}

const project2D = (input) => {
   return input.map(x => projectVertex(x))
}

const renderSnow = () => {
   const paintSnow = ({ x, y, size }) => {
      gfx.fillStyle = '#fff'
      gfx.beginPath()
      gfx.ellipse(x, y, size, size, 0, 0, 2 * Math.PI)
      gfx.fill()
   }

   const snow2D = (minY, maxY) => {
      const angle = Math.random() * 360
      const sin = Math.abs(Math.sin(angle / seedStep)) * 200
      const randomFlake = () => {
         const flake = {
            x: 135 + Math.random() * sin,
            y: maxY,
            z: 0,
         }

         return { ...rotateY(flake, angle), settled: false }
      }

      if (snowFlakes.length < maxSpawned && (Math.random() * 20 > 19)) {
         snowFlakes.push(randomFlake())
      }

      for (flake of snowFlakes) {
         if (flake.settled === false)
            flake.y -= flakeSpeed

         if (flake.y <= minY && !flake.settled) {
            flake.y = minY
            flake.settled = true
            snowFlakes.push(randomFlake())
            if (snowFlakes.length >= maxSettled)
               snowFlakes = snowFlakes.slice(1)
         }
      }
   }

   const sizeFromDistance = z => {
      const minX = 0
      const maxX = 2.5 * width

      return flakeSize - ((flakeSize) * ((z - minX) / (maxX - minX)))
   }

   snow2D(0, height)

   for (flake of snowFlakes) {
      const q = applyVert(flake, tree.rotation, tree.translation)
      const { x, y } = projectVertex(q)
      const size = sizeFromDistance(q.z)

      buffer.push({
         distance: q.z,
         data: { x, y, size },
         paint: paintSnow
      })
   }
}

const polyDistance = poly => (poly[0].z + poly[1].z + poly[2].z) / 3

const renderModel = ({ polys, rotation, translation, color }) => {
   const paintPoly = (poly2D, { line, fill }) => {
      gfx.fillStyle = fill
      gfx.strokeStyle = line
      gfx.beginPath()
      gfx.moveTo(poly2D[0].x, poly2D[0].y)
      gfx.lineTo(poly2D[1].x, poly2D[1].y)
      gfx.lineTo(poly2D[2].x, poly2D[2].y)
      gfx.closePath()
      gfx.fill()
      gfx.stroke()
   }

   const applied = applyPoly(polys, rotation, translation)

   for (poly of applied) {
      const polyNormal = unitize(normal(poly))
      const camAngle = unitize({
         x: camera.position - poly[0].x,
         y: camera.position - poly[0].y,
         z: camera.position - poly[0].z
      })
      const angle = dot(polyNormal, camAngle)

      if (angle > 0) continue

      buffer.push({
         distance: polyDistance(poly),
         data: project2D(poly),
         paint: paintPoly,
         color: color
      })
   }
}

const paintBuffer = () => {
   const paintDebug = () => {
      gfx.strokeStyle = 'red'
      gfx.beginPath()
      gfx.moveTo(width / 2, 0)
      gfx.lineTo(width / 2, height)
      gfx.stroke()

      gfx.beginPath()
      gfx.moveTo(0, height / 2)
      gfx.lineTo(width, height / 2)
      gfx.stroke()
   }

   buffer.sort((a, b) => b.distance - a.distance)

   gfx.clearRect(0, 0, width, height)

   if (debug) paintDebug()
   buffer.forEach(x => x.paint(x.data, x.color))
}

const renderGradient = () => {
   const paintGradient = () => {
      const gradient = gfx.createLinearGradient(0, height - 100, 0, height)
      gradient.addColorStop(0, 'rgba(34,34,34,0)')
      gradient.addColorStop(1, 'rgba(34,34,34,192)')
      gfx.fillStyle = gradient
      gfx.fillRect(0, height - 100, width, height)
   }

   buffer.push({
      distance: 1,
      data: {},
      paint: paintGradient,
      color: {}
   })
}

const renderMessage = () => {
   const paintMessage = () => {
      for (i = 0; i < image.width; i += 2) {
         const offset = Math.sin((i + tick) / 25) * 5
         const x = (width / 2) - (image.width / 2) + i
         const y = 30 + offset
         gfx.drawImage(image, i, 0, 2, image.height, x, y, 2, image.height)
      }
   }

   buffer.push({
      distance: 0,
      data: {},
      paint: paintMessage,
      color: {}
   })
}

const drawFrame = () => {
   buffer = []
   tick += 1

   renderSnow()
   renderModel(tree)
   renderModel(trunk)
   renderModel(present)
   renderGradient()
   renderMessage()

   paintBuffer()

   if (rotating) {
      tree.rotation.y += rotationStep
      trunk.rotation.y += rotationStep
      present.rotation.y += rotationStep
      present.translation = rotateY(present.translation, rotationStep)
   }

   if (isPlaying)
      window.requestAnimationFrame(drawFrame)
}

const music = document.querySelector('audio')

music.addEventListener('play', function() {
   isPlaying = true
   drawFrame()
})

music.addEventListener('pause', function() {
   isPlaying = false
})

document.addEventListener('keydown', e => {
   if (e.key === 'd') debug = !debug
   if (e.key === 'ArrowLeft') rotationStep = Math.max(-5, rotationStep - 0.1)
   if (e.key === 'ArrowRight') rotationStep = Math.min(5, rotationStep + 0.1)
   if (e.key === 'ArrowDown') flakeSpeed = Math.min(5, flakeSpeed + 0.1)
   if (e.key === 'ArrowUp') flakeSpeed = Math.max(0.5, flakeSpeed - 0.1)
   if (e.key === 'r') {
      rotating = true
      rotationStep = 0.1
      flakeSpeed = 0.5
   }
})

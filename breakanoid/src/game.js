import { MouseInput, Sound, ParticleEngine, Scoring, Logic, Level } from './actors.js'
import { Build } from './builder.js'

const difficulty = {
   easy: [265, 1],
   medium: [480, 5],
   hard: [575, 7],
}

class GameEngine {
   constructor(canvasId) {
      this.context = document.getElementById(canvasId).getContext('2d')
      this.context.imageSmoothingEnabled = false

      this.debug = document.getElementById('debug')
      this.fps = document.getElementById('fps')

      this.visualDebug = false

      this.running = true
      this.minFps = Infinity
      this.maxFps = 0
      this.simulationFrame = 0

      this.lastTime = 0;
      this.lastTimestamp = 0;
      this.accumulator = 0;
      this.simulatedFps = 180;
      this.step = 1 / this.simulatedFps;

      this.actors = new Set
      this.levelPieces = new Set
      this.signalListeners = new Map
      this.balls = new Set
   }

   init() {
      this.addActor(new Scoring('score'))
      this.addActor(new ParticleEngine)
      this.sound = this.addActor(new Sound)
      this.mouse = this.addActor(new MouseInput)
      this.level = this.addActor(new Level('level-1'))
      this.player = this.addActor(Build.Player(this, this.mouse, difficulty.easy))
      this.balls.add(this.addActor(Build.Ball(this, () => this.levelPieces.size > 0)))
      this.addActor(new Logic('lives'))
   }

   addActor(actor) {
      this.actors.add(actor)
      actor.connect(this)
      return actor
   }

   removeActor(actor) {
      this.actors.delete(actor)
      this.signalListeners.delete(actor)
      this.balls.delete(actor)
   }

   addLevelPiece(actor) {
      this.levelPieces.add(actor)
      return this.addActor(actor)
   }

   removeLevelPiece(actor) {
      this.levelPieces.delete(actor)
      this.removeActor(actor)
   }

   registerForSignals(actor, traitName) {
      if (traitName) {
         if (!this.signalListeners.has(actor))
            this.signalListeners.set(actor, new Set)

         this.signalListeners.get(actor).add(traitName)
      }
   }

   broadcast(trait, actor) {
      this.signalListeners.forEach((traits, a) => {
         if (a !== actor && traits.has(trait.constructor.name))
            a.signal(trait, actor)
      })
   }

   message(msg) {
      this.actors.forEach(actor => actor.message(msg))
   }

   simulate(timestamp) {
      if (this.lastTime) {
         this.accumulator += (timestamp - this.lastTime) / 1000

         while (this.accumulator > this.step) {
            this.actors.forEach(actor => actor.tick(this.step, this.actors))
            this.accumulator -= this.step
            this.simulationFrame += 1
         }
      }

      this.lastTime = timestamp
   }

   repaint(timestamp) {
      this.context.fillStyle = this.visualDebug ? 'rgba(0,0,64,0.1)' : '#004'
      this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height)

      this.actors.forEach(actor => actor.draw(this.context))

      const frames = 1000 / (timestamp - this.lastTimestamp)
      this.lastTimestamp = timestamp

      if (timestamp > 5000) {
         this.maxFps = Math.max(this.maxFps, frames)
         this.minFps = Math.min(this.minFps, frames)
      }

      this.fps.innerText = Math.ceil(this.minFps) + ' < ' + Math.ceil(frames) + ' < ' + Math.ceil(this.maxFps)
   }

   run(timestamp = 0) {
      if (this.running) {
         this.simulate(timestamp)
         this.repaint(timestamp)
      }

      requestAnimationFrame(timestamp => this.run(timestamp))
   }

   pause() {
      this.running = !this.running
   }
}

window.engine = new GameEngine('screen')

document.getElementById('play').addEventListener('click', event => {
   event.preventDefault()

   const overlay = document.getElementById('starter')
   document.getElementById('body').removeChild(overlay)

   engine.init()
   engine.sound.playNextTrack()
   engine.run()
}, true)

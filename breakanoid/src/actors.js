import { Vector, Bounds } from './maths.js'
import { Build } from './builder.js'
import {
   AlphaFade, Bounces, ControlledBy, Destructable, Ephemeral, GameOver, Floaty,
   HasMass, MouseClick, Moves, OutOfBounds, PredicatedOn, StopMusic, Transparency,
   VelocityBoost
} from './traits.js';

export class Actor {
   constructor(name, xPos, yPos, width, height) {
      this.name = name || this.constructor.name
      this.width = width
      this.height = height
      this.position = new Vector(xPos, yPos)

      this.bounds = new Bounds(this)
      this.traits = []
      this.decorations = []
      this.lifeTime = 0
   }

   tick(timeDelta, otherActors) {
      this.lifeTime += timeDelta
      this.traits.forEach(trait => trait.update(this, timeDelta, otherActors))
   }

   draw(context) {
      this.decorations.forEach(decoration => decoration.draw(context, this))
   }

   addTrait(trait) {
      this.traits.push(trait)
   }

   removeTrait(traitName) {
      const traitsToRemove = this.traits.filter(trait => trait.constructor.name === traitName)
      traitsToRemove.forEach(trait => {
         const index = this.traits.indexOf(trait)
         if (index >= 0)
            this.traits.splice(index, 1)
      })
   }

   addDecoration(decoration) {
      this.decorations.push(decoration)
   }

   registerForSignals(traitName) {
      if (traitName === null) return
      this.game.registerForSignals(this, traitName)
   }

   // Receive notification from trait affecting actor
   signal(trait, actor) {
      this.traits.forEach(t => t.signal(trait, this, actor))
   }

   connect(game) {
      this.game = game
      this.traits.forEach(trait => trait.init(this))
   }

   broadcast(trait) {
      this.game.broadcast(trait, this)
   }

   // Receive a text commands. Mainly for Sound
   message(msg) { }
}

export class MouseInput extends Actor {
   constructor() {
      super("mouse", 0, 0)

      this.lastX = 0
      this.lastY = 0
      this.velocity = new Vector(0, 0)

      this.touches = []

      window.addEventListener('mousemove', event => this.moveHandler(event), true)
      window.addEventListener('mousedown', event => this.clickHandler(event), true)
      window.addEventListener('mouseup', event => this.clickHandler(event), true)

      window.addEventListener('touchmove', evant => this.touchMoveHandler(event), false)
      window.addEventListener('touchstart', evant => this.touchStartHandler(event), false)
      window.addEventListener('touchend', event => this.touchEndHandler(event), false)
   }

   tick(timeDelta, otherActors) {
      if ((this.position.x > 0 && this.position.y > 0) &&
         (this.lastX > 0 && this.lastY > 0)) {
         this.velocity.x = this.position.x - this.lastX
         this.velocity.y = this.position.y - this.lastY
      }

      this.lastX = this.position.x
      this.lastY = this.position.y
   }

   touchStartHandler(event) {
      this.pressed = true
      this.broadcast(new MouseClick(0, 0))
   }

   touchEndHandler(event) {
      this.pressed = false
   }

   touchMoveHandler(event) {
      if (event.targetTouches.length > 0) {
         this.position.x = event.targetTouches[0].pageX
         this.position.y = event.targetTouches[0].pageY
      }
   }

   moveHandler(event) {
      this.position.x = event.clientX
      this.position.y = event.clientY
   }

   clickHandler(event) {
      this.pressed = event.type === "mousedown" && event.buttons === 1
      if (this.pressed)
         this.broadcast(new MouseClick(this.position.x, this.position.y, this.pressed))
   }
}

export class Player extends Actor {
   constructor(xPos, yPos) {
      super('Player', xPos, yPos, 50, 6)
   }

   draw(context) {
      context.fillStyle = 'red'

      context.beginPath()
      context.arc(this.position.x + this.height / 2,
         this.position.y + this.height / 2,
         this.height / 2, 0, Math.PI * 2, true)
      context.fill()

      context.arc(this.bounds.right - this.height / 2,
         this.position.y + this.height / 2,
         this.height / 2, 0, Math.PI * 2, true)
      context.fill()

      context.fillStyle = '#fff'
      context.fillRect(this.position.x + this.height / 2, this.position.y, this.width - this.height, this.height)

      super.draw(context)
   }
}

export class Floor extends Actor {
   constructor(xPos, yPos, width = 100, height = 5) {
      super('Floor', xPos, yPos, width, height)
   }

   draw(context) {
      context.fillStyle = 'brown'
      context.fillRect(this.position.x, this.position.y, this.width, this.height)

      super.draw(context)
   }
}

export class Ball extends Actor {
   constructor(xPos, yPos) {
      super('Ball', xPos, yPos, 5, 5)
   }

   draw(context) {
      context.fillStyle = '#fff'
      context.beginPath()
      context.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, 2.5, 0, Math.PI * 2, true);
      context.fill()

      super.draw(context)
   }
}

export class Sound extends Actor {
   constructor() {
      super("Sound", 0, 0)

      this.mute = false
      this.playSfx = true
      this.playMusic = true
      this.trackPosition = 0

      this.trackList = [
         "RoccoW_-_04_-_SwingJeDing.mp3",
         "RoccoW_-_08_-_Sweet_Self_Satisfaction.mp3",
         "RoccoW_-_07_-_Fuck_Sidechain_Compression_on_Gameboy.mp3"
      ]

      this.sound = {
         Bounces: "Bounce",
         VelocityBoost: "Jump",
         Destructable: "Score",
         OutOfBounds: "Fail",
         PredicatedOn: "LevelComplete",
         GameOver: "GameOver"
      }

      this.musicPlayer = new Audio
      this.musicPlayer.addEventListener('ended', event => this.playNextTrack())
   }

   connect(game) {
      super.connect(game)
      this.registerForSignals(Bounces.name)
      this.registerForSignals(VelocityBoost.name)
      this.registerForSignals(Destructable.name)
      this.registerForSignals(OutOfBounds.name)
      this.registerForSignals(PredicatedOn.name)
      this.registerForSignals(StopMusic.name)
      this.registerForSignals(GameOver.name)
   }

   playSound(name) {
      const sound = document.getElementById(this.sound[name]).cloneNode(true)
      sound.volume = 0.8
      sound.play()
   }

   playNextTrack() {
      if (this.mute || !this.playMusic) return

      this.musicPlayer.src = this.trackList[this.trackPosition++ % this.trackList.length]
      this.musicPlayer.play()
   }

   stopMusic() {
      this.musicPlayer.pause()
   }

   signal(trait, actor) {
      if (this.mute || !this.playSfx) return

      switch (trait.constructor) {
         case StopMusic:
            this.stopMusic()
            break

         default:
            const soundToPlay = trait.constructor.name
            if (this.sound.hasOwnProperty(soundToPlay))
               this.playSound(soundToPlay)
      }
   }

   message(msg) {
      switch (msg) {
         case "mute:sfx":
            this.playSfx = !this.playSfx
            break

         case "mute:music":
            this.playMusic = !this.playMusic
            if (this.playMusic)
               this.musicPlayer.play()
            else
               this.stopMusic()
            break

         case "mute":
            this.mute = !this.mute
            if (this.mute)
               this.stopMusic()
            else
               this.musicPlayer.play()
            break

         case "next":
            this.playNextTrack()
            break
      }
   }
}

export class Brick extends Actor {
   constructor(xPos, yPos, color = '#0f0') {
      super("brick", xPos, yPos, 16, 8)
      this.color = color
   }

   draw(context) {
      context.fillStyle = this.color
      context.fillRect(this.position.x, this.position.y, this.width, this.height)
   }
}

export class Particle extends Actor {
   constructor(actor) {
      super("particle", actor.position.x, actor.position.y, 2, 2)

      this.color = actor.color || '#fff'

      this.xOffset = parseInt((Math.random() * actor.width))
      this.yOffset = parseInt((Math.random() * actor.height))
   }

   draw(context) {
      context.fillStyle = this.color
      context.fillRect((this.position.x + this.xOffset), this.position.y + this.yOffset, this.width, this.height)
   }

   registerForSignals() { }
}

export class ParticleEngine extends Actor {
   constructor() {
      super("ParticleEngine", 0, 0)
   }

   connect(game) {
      super.connect(game)
      this.registerForSignals(Destructable.name)
      this.registerForSignals(PredicatedOn.name)
      this.registerForSignals(OutOfBounds.name)
   }

   signal(trait, actor) {
      switch (trait.constructor) {
         case Destructable:
            if (actor instanceof Brick) {
               for (let i = 0; i < parseInt(Math.random() * 5); i++) {
                  const particle = new Particle(actor)
                  particle.addTrait(new Ephemeral(2))
                  particle.addTrait(new Transparency(1))
                  particle.addTrait(new AlphaFade(2))
                  particle.addTrait(new Moves(parseInt((Math.random() * actor.width) - actor.width / 2), parseInt(Math.random() * -20), true))
                  particle.addTrait(new HasMass(5))

                  this.game.addActor(particle)
               }
            }
            break

         case OutOfBounds:
         case PredicatedOn:
            if (actor instanceof Ball) {
               for (let i = 0; i < 30; i++) {
                  const particle = new Particle(actor)
                  particle.addTrait(new Ephemeral(5))
                  particle.addTrait(new Transparency(1))
                  particle.addTrait(new AlphaFade(5))
                  particle.addTrait(new Moves(parseInt((Math.random() * 100) - 50), parseInt(Math.random() * -200), true))
                  particle.addTrait(new HasMass(10))

                  this.game.addActor(particle)
               }
            }
            break
      }
   }
}

export class ParticleFountain extends Actor {
   constructor() {
      super("ParticleFountain", 150, 150, 10, 10)
   }

   tick(timeDelta, otherActors) {
      super.tick(timeDelta, otherActors)

      if (parseInt((this.lifeTime * 1000).toFixed(0) % 10) == 0) {
         const particle = new Particle(this)
         particle.addTrait(new Ephemeral(4))
         particle.addTrait(new Transparency(1))
         particle.addTrait(new AlphaFade(4))
         particle.addTrait(new Moves(20, -50, true))
         particle.addTrait(new HasMass(5))

         this.game.addActor(particle)
      }
   }
}

export class Scoring extends Actor {
   constructor(scoreId) {
      super("Scoring", 0, 0, 0, 0)

      this.scoreElement = document.getElementById(scoreId)
      this.multiplier = 1

      this.score = 0
   }

   connect(game) {
      super.connect(game)
      this.registerForSignals(Destructable.name)
      this.registerForSignals(VelocityBoost.name)
      this.registerForSignals(OutOfBounds.name)
   }

   draw(context) {
      this.scoreElement.innerText = this.score
   }

   signal(trait, actor) {
      super.signal(trait, actor)

      switch (trait.constructor) {
         case Destructable:
            if (actor instanceof Brick) {
               const points = 5 * this.multiplier++
               this.score += points

               const reward = new Text(points, actor.position.x, actor.position.y, '#aaf')
               reward.addTrait(new Ephemeral(2))
               reward.addTrait(new Moves(0, -10, true))

               this.game.addActor(reward)

               if (this.multiplier % 5 === 0) {
                  const multiscore = new Text(this.multiplier + 'x COMBO', this.game.player.position.x, this.game.player.position.y)
                  multiscore.addTrait(new Ephemeral(3))
                  multiscore.addTrait(new Moves(0, -20, true))
                  multiscore.addTrait(new Transparency(0.5))
                  multiscore.addTrait(new AlphaFade(3))

                  this.game.addActor(multiscore)

                  const comboScore = this.multiplier * 10
                  this.score += comboScore

                  const comboPoints = new Text(comboScore, actor.position.x, actor.position.y, '#c64')
                  comboPoints.addTrait(new Ephemeral(3))
                  comboPoints.addTrait(new Moves(0, -10, true))

                  this.game.addActor(comboPoints)
               }
            }
            break

         case VelocityBoost:
            if (actor instanceof Player) {
               this.multiplier = 1
            }
            break

         case OutOfBounds:
            if (actor instanceof Ball) {
               this.multiplier = 1
            }
            break
      }
   }
}

export class Logic extends Actor {
   constructor(livesId) {
      super('Logic')
      this.lives = 3
      this.livesElement = document.getElementById(livesId)
   }

   connect(game) {
      this.game = game
      this.registerForSignals(OutOfBounds.name)
      this.registerForSignals(MouseClick.name)
      this.registerForSignals(PredicatedOn.name)
   }

   draw(context) {
      this.livesElement.innerText = this.lives
   }

   signal(trait, actor) {
      switch (trait.constructor) {
         case OutOfBounds:
            if (actor instanceof Ball) {
               this.game.removeActor(actor)
               this.game.balls.delete(actor)
               if (this.game.balls.size <= 0)
                  this.lives -= 1

               if (this.lives > 0)
                  this.game.balls.add(this.game.addActor(Build.Ball(this.game, () => this.game.levelPieces.size > 0)))
               else {
                  this.broadcast(new StopMusic)
                  const gameOver = new Text("Game Over!", 0, 0, '#ccc', 3)
                  gameOver.addTrait(new Floaty(this.game.context.canvas.width / 2, this.game.context.canvas.height / 2, 1, 5, 50, 30))
                  this.game.addActor(gameOver)
                  this.broadcast(new GameOver)
               }
            }
            break

         case MouseClick:
            this.game.balls.forEach(ball => ball.removeTrait(ControlledBy.name))
            break

         case PredicatedOn:
            if (actor instanceof Ball && this.game.levelPieces.size === 0) {
               this.broadcast(new StopMusic)

               const complete = new Text('Level Complete!', 0, 0, 'yellow', 3)
               complete.addTrait(new Floaty(this.game.context.canvas.width / 2,
                  this.game.context.canvas.height / 2,
                  1, 5, 50, 30))

               this.game.addActor(complete)
            }
            break
      }
   }
}

export class Text extends Actor {
   constructor(text, xPos, yPos, color = '#fff', scale = 1) {
      super("Reward", parseInt(xPos), parseInt(yPos))
      this.text = text
      this.color = color
      this.height = scale * 8
      this.width = this.height
      this.fontSize = `${this.height}px mini`
   }

   draw(context) {
      super.draw(context)

      context.font = this.fontSize
      this.width = context.measureText(this.text).width
      context.fillStyle = this.color
      context.fillText(this.text, this.position.x, this.position.y)
   }

   registerForSignals() { }
}

export class Level extends Actor {
   constructor(levelName) {
      super("Level", 0, 0, 0, 0)
      this.levelName = levelName
   }

   async connect(game) {
      this.game = game

      await fetch(`./src/${this.levelName}.json`)
         .then(response => response.json())
         .then(json => this.level = json)

      this.level.field.forEach((row, rowIndex) => {
         row.forEach((column, columnIndex) => {
            if (column > 0) {
               game.addLevelPiece(Build.Brick(columnIndex * 16,
                  rowIndex * 8,
                  this.level.colours[column - 1]))
            }
         })
      })
   }
}
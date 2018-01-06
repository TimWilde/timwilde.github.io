import Vector from './maths.js'

export class Trait {
   // Set up actor for this trait
   init(actor) {
      this.host = actor
   }

   // Simulate next step for this trait
   update(actor, timeDelta, actors) { }

   // Receive information about other events
   signal(trait, thisActor, otherActor) { }

   // Broadcast an event
   alert() {
      this.host.broadcast(this)
   }
}

export class ConstrainedXMotion extends Trait {
   constructor(min, max) {
      super()
      this.min = min
      this.max = max
   }

   update(actor, timeDelta, actors) {
      if (actor.position.x < this.min)
         actor.position.x = this.min

      if (actor.bounds.right > this.max)
         actor.position.x = this.max - actor.width
   }
}

export class ControlledBy extends Trait {
   constructor(controller) {
      super()
      this.controller = controller
      this.xVelocity = 0
   }

   update(actor, timeDelta, actors) {
      this.xVelocity /= 3
      actor.position.x += this.xVelocity

      if (Math.abs(this.controller.velocity.x) > 1)
         this.xVelocity = this.controller.velocity.x
   }
}

export class Moves extends Trait {
   constructor(initialX, initialY, moving = false) {
      super()
      this.xVel = initialX
      this.yVel = initialY
      this.moving = moving
   }

   init(actor) {
      super.init(actor)
      actor.moving = this.moving
      actor.velocity = new Vector(this.xVel, this.yVel)
      actor.registerForSignals(MouseClick.name)
      actor.registerForSignals(VelocityBoost.name)
   }

   signal(trait, actor) {
      switch (trait.constructor) {
         case MouseClick:
            if (!actor.moving) {
               actor.lifeTime = 0
               actor.velocity = new Vector(0, 0)
               actor.moving = true
            }
            break

         case VelocityBoost:
            if (actor.moving)
               this.update(actor, this.host.game.step)
            break
      }
   }

   update(actor, timeDelta, actors) {
      if (actor.moving) {
         this.host.position.x += this.host.velocity.x * timeDelta
         this.host.position.y += this.host.velocity.y * timeDelta
      }
   }
}

export class Bounces extends Trait {
   constructor(maxX, maxY, options) {
      super()

      this.maxX = maxX
      this.maxY = maxY

      this.options = {
         left: true,
         right: true,
         top: true,
         bottom: true
      }

      if (options)
         Object.assign(this.options, options)
   }

   update(actor, timeDelta, actors) {
      if (actor.bounds.left < 0) {
         if (this.options.left) {
            actor.position.x = 0
            actor.velocity.x = -actor.velocity.x
            if (actor.moving)
               this.alert()
         } else {
            actor.broadcast(new OutOfBounds)
         }
      }

      if (actor.bounds.right > this.maxX) {
         if (this.options.right) {
            actor.position.x = this.maxX - actor.width
            actor.velocity.x = -actor.velocity.x
            if (actor.moving)
               this.alert()
         } else {
            actor.broadcast(new OutOfBounds)
         }
      }

      if (actor.bounds.top < 0) {
         if (this.options.top) {
            actor.position.y = 0
            actor.velocity.y = -actor.velocity.y
            if (actor.moving)
               this.alert()
         } else {
            actor.broadcast(new OutOfBounds)
         }
      }

      if (actor.bounds.bottom > this.maxY) {
         if (this.options.bottom) {
            actor.position.y = this.maxY - actor.height
            actor.velocity.y = -actor.velocity.y
            if (actor.moving)
               this.alert()
         } else {
            actor.broadcast(new OutOfBounds)
         }
      }
   }
}

export class VelocityBoost extends Trait {
   constructor(velocity, lifeTime = 5) {
      super()
      this.velocity = Math.abs(velocity)
      this.lifeTime = Math.abs(lifeTime)
   }

   signal(trait, thisActor, otherActor) {
      if (trait instanceof Collision && otherActor.mass) {
         const velocitySign = Math.sign(otherActor.velocity.y)
         const absoluteVelocity = Math.abs(otherActor.velocity.y)

         if (absoluteVelocity > this.velocity) {
            const velocityDifference = this.velocity - absoluteVelocity

            otherActor.velocity.y = velocitySign * (absoluteVelocity + (velocityDifference * .75))
         } else {
            otherActor.velocity.y = velocitySign * this.velocity
         }

         otherActor.lifeTime = this.lifeTime

         this.alert()
      }
   }
}

export class Solid extends Trait {
   init(actor) {
      actor.isSolid = true
   }
}

export class HasMass extends Trait {
   constructor(mass = 10) {
      super()
      this.mass = mass
      this.newtonsPerSecond = 9.8
   }

   init(actor) {
      actor.mass = this.mass
   }

   update(actor, timeDelta, actors) {
      if (actor.mass) {
         const effectiveGravity = this.newtonsPerSecond * actor.lifeTime
         const acceleration = effectiveGravity * actor.mass

         actor.velocity.y += acceleration * timeDelta
      }
   }
}

export class Collision extends Trait {
   update(actor, timeDelta, actors) {
      const collidedActors = [...actors].filter(a => a !== actor && a.isSolid && a.bounds.overlap(actor.bounds))

      if (collidedActors.length > 0) {
         collidedActors.forEach(collidee => {
            const rightCollision = actor.bounds.right > collidee.bounds.left && actor.bounds.left < collidee.bounds.left
            const leftCollision = actor.bounds.left < collidee.bounds.right && actor.bounds.right > collidee.bounds.right
            const bottomCollision = actor.bounds.bottom > collidee.bounds.top && actor.bounds.top < collidee.bounds.top
            const topCollision = actor.bounds.top < collidee.bounds.bottom && actor.bounds.bottom > collidee.bounds.bottom

            if (rightCollision) { // bounce left
               actor.velocity.x = -(Math.abs(actor.velocity.x))
            } else if (leftCollision) { // bounce right
               actor.velocity.x = Math.abs(actor.velocity.x)
            }

            if (topCollision) { // bounce down
               actor.velocity.y = Math.abs(actor.velocity.y)
            } else if (bottomCollision) { // bounce up
               actor.velocity.y = -(Math.abs(actor.velocity.y))
            }

            collidee.signal(this, actor)
         })
      }
   }
}

export class Destructable extends Trait {
   constructor(hits = 1) {
      super()
      this.hits = hits
   }

   init(actor) {
      super.init(actor)
      actor.hits = this.hits
   }

   signal(trait, actor) {
      if (trait instanceof Collision) {
         actor.hits -= 1
         if (actor.hits <= 0) {
            actor.game.removeLevelPiece(actor)
            this.alert()
         }
      }
   }
}

export class Directional extends Trait {
   signal(trait, thisActor, otherActor) {
      if (trait instanceof Collision) {
         const direction = Math.abs(thisActor.width / 2)
         const sign = Math.sign(otherActor.velocity.x) || (Math.random() * 5) - 2.5

         if (Math.abs(otherActor.velocity.x) < 80)
            otherActor.velocity.x += sign * (direction / 2)
      }
   }
}

export class CyclicColors extends Trait {
   constructor(colors, timer = 250) {
      super()
      this.colors = colors
      this.timer = timer
   }

   init(actor) {
      actor.color = this.colors[0]
   }

   update(actor, timeDelta, actors) {
      const step = parseInt((actor.lifeTime * 1000) / this.timer)
      actor.color = this.colors[(step) % this.colors.length]
   }
}

export class MouseClick extends Trait {
   constructor(xPos, yPos, pressed) {
      super()

      this.position = new Vector(xPos, yPos)
      this.pressed = pressed
   }
}

export class Ephemeral extends Trait {
   constructor(time) {
      super()
      this.time = time
   }

   update(actor) {
      if (actor.lifeTime >= this.time)
         actor.game.removeLevelPiece(actor)
   }
}

export class AlphaFade extends Trait {
   constructor(seconds = 2, alpha = 1.0) {
      super()
      this.seconds = seconds
      this.alpha = alpha
   }

   init(actor) {
      actor.alpha = actor.alpha || this.alpha
      actor.originalAlpha = actor.alpha || this.alpha
   }

   update(actor) {
      actor.alpha = actor.lifeTime < this.seconds ? ((this.seconds - actor.lifeTime) / this.seconds * actor.originalAlpha) : 0.0
   }
}

export class Transparency extends Trait {
   constructor(alpha = 1.0) {
      super()
      this.alpha = alpha
   }

   init(actor) {
      actor.alpha = this.alpha
      const originalDraw = actor.draw
      actor.draw = context => {
         context.save()
         context.globalAlpha = actor.alpha
         originalDraw.apply(actor, [context])
         context.restore()
      }
   }
}

export class PredicatedOn extends Trait {
   constructor(predicate) {
      super()
      this.predicate = predicate
   }

   update(actor, timeDelta, actors) {
      if (this.predicate() === false) {
         actor.game.removeLevelPiece(actor)
         this.alert()
      }
   }
}

export class OutOfBounds extends Trait { }
export class StopMusic extends Trait { }
export class GameOver extends Trait { }

export class Floaty extends Trait {
   constructor(x, y, xFrequency = 1, yFrequency = 5, xMagnitude = 10, yMagnitude = 10) {
      super()

      this.position = new Vector(x, y)
      this.frequency = new Vector(xFrequency, yFrequency)
      this.magnitude = new Vector(xMagnitude, yMagnitude)
   }

   update(actor, timeDelta) {
      actor.position.x = parseInt(this.position.x + (Math.sin(actor.lifeTime * this.frequency.x) * this.magnitude.x) - (actor.width / 2))
      actor.position.y = parseInt(this.position.y + (Math.sin(actor.lifeTime * this.frequency.y) * this.magnitude.y) - (actor.height / 2))
   }
}
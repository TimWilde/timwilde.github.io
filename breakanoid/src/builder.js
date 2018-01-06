import { Player, Ball, Brick } from './actors.js'
import {
   Solid, ControlledBy, ConstrainedXMotion, VelocityBoost, Directional,
   Collision, Bounces, HasMass, Moves, PredicatedOn, Destructable
} from './traits.js'

export class Build {
   static Player(game, input, difficulty) {
      const player = new Player(game.context.canvas.width / 2, game.context.canvas.height - 10)
      player.addTrait(new Solid)
      player.addTrait(new ControlledBy(input))
      player.addTrait(new ConstrainedXMotion(0, game.context.canvas.width))
      player.addTrait(new VelocityBoost(...difficulty))
      player.addTrait(new Directional)

      return player
   }

   static Ball(game, predicate) {
      const ball = new Ball(game.player.bounds.left + (game.player.width / 2), game.player.bounds.top - 5)
      ball.addTrait(new Collision)
      ball.addTrait(new Bounces(game.context.canvas.width, game.context.canvas.height, { bottom: false }))
      ball.addTrait(new HasMass)
      ball.addTrait(new Moves(0, 0))
      ball.addTrait(new PredicatedOn(predicate))
      ball.addTrait(new ControlledBy(game.mouse))

      return ball
   }

   static Brick(x, y, colour) {
      const brick = new Brick(x, y, colour || '#0f0')
      brick.addTrait(new Solid)
      brick.addTrait(new Destructable)
      brick.addTrait(new Directional)

      return brick
   }
}
import { GameOfLife } from "./GameEngine.js";

const bootstrap_game = () => {
   const game_engine = new GameOfLife('world', 'pause', 5)

   // Walker
   game_engine.setCell(11,8)
   game_engine.setCell(12,9)
   game_engine.setCell(10,10)
   game_engine.setCell(11,10)
   game_engine.setCell(12,10)

   // Blinker
   game_engine.setCell(30, 10)
   game_engine.setCell(31, 10)
   game_engine.setCell(32, 10)

   game_engine.run()
}

window.onload = bootstrap_game;
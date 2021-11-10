class GameOfLife {
   #context = undefined
   #lastFrame = 0
   #millisecondsPerFrame = 1000
   #running = false
   #grid = new Array(80*60)
   #next = new Array(80*60)
   #clickEffect = 1

   constructor(canvasId, buttonId, fps = 1) {
      const canvas = document.getElementById(canvasId)

      this.#context = canvas.getContext('2d')
      this.#context.imageSmoothingEnabled = false
      this.#context.imageSmoothingQuality = 'low'

      this.#millisecondsPerFrame = 1000 / fps

      this.#grid.fill(0,0,80*60)
      this.#next.fill(0,0,80*60)

      canvas.onmousedown = this.#clickHandler
      canvas.onmousemove = this.#drawHandler

      document.getElementById(buttonId).onclick = this.#toggle
   }

   #toggle = e => {
      this.#running = !this.#running
   }

   #gridPositionFromCursorPosition = e => {
      return [Math.trunc(e.offsetX / 10), Math.trunc(e.offsetY / 10)]
   }

   #clickHandler = e => {
      const [x, y] = this.#gridPositionFromCursorPosition(e)
      this.#clickEffect = this.#getCell(x, y) === 1 ? 0 : 1

      this.#grid[x + (y*80)] = this.#clickEffect
   }

   #drawHandler = e => {
      if(e.buttons > 0) {
         const [x, y] = this.#gridPositionFromCursorPosition(e)

         if(this.#clickEffect === 1)
            this.setCell(x, y)
         else
            this.clearCell(x, y)
      }
   }

   #getCell = (x, y) => {
      if(x < 0 || x > 79 || y < 0 || y > 59) return 0

      return this.#grid[x + (y*80)] === 1 ? 1 : 0
   }

   #liveNeighboursOfCellAt = (x, y) => {
      return ( this.#getCell(x-1, y-1) +
               this.#getCell(x, y-1) +
               this.#getCell(x+1, y-1) +
               this.#getCell(x-1, y) +
               this.#getCell(x+1, y) +
               this.#getCell(x-1, y+1) +
               this.#getCell(x, y+1) +
               this.#getCell(x+1, y+1)
      )
   }

   #calculateframe = () => {
      if(this.#running === false) return

      this.#next.fill(0,0,80*60)

      for(let x = 0; x < 80; x++)
         for(let y = 0; y < 60; y++)
         {
            let neighbours = this.#liveNeighboursOfCellAt(x, y)

            // Survival
            if(neighbours >=2 &&
               neighbours <= 3)
               this.#next[x+(y*80)] = this.#getCell(x, y) === 1 ? 1 : 0

            // Birth
            if(neighbours === 3)
               this.#next[x+(y*80)] = 1
         }

      this.#grid = this.#next.slice()
   }

   #drawCell = (x, y, isAlive) => {
      this.#context.fillStyle = isAlive ? '#000' : '#eee'
      this.#context.beginPath()
      this.#context.arc(5+x*10, 5+y*10, 4.25, 0, Math.PI * 2)
      this.#context.fill()
   }

   #drawGrid = () => {
      this.#context.fillStyle = '#fff'
      this.#context.fillRect(0,0,800,600)

      for(let x = 0; x < 80; x++){
         for(let y = 0; y < 60; y++){
            const isAlive = this.#grid[x + (y*80)] === 1
            this.#drawCell(x,y,isAlive)
         }
      }
   }

   #tick = timestamp => {
      const currentFrame = Math.trunc(timestamp / this.#millisecondsPerFrame)

      if(currentFrame > this.#lastFrame) {
         this.#lastFrame = currentFrame
         this.#calculateframe()
         this.#drawGrid()
      }

      requestAnimationFrame(this.#tick)
   }

   setCell = (x, y) => {
      this.#grid[x + (y*80)] = 1
   }

   clearCell = (x, y) => {
      this.#grid[x + (y*80)] = 0
   }

   run = () => {
      this.#drawGrid()
      requestAnimationFrame(this.#tick)
   }
}

export { GameOfLife }
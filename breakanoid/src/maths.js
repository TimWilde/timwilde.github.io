export class Vector {
   constructor(xPos, yPos) {
      this.x = xPos
      this.y = yPos
   }
}

export class Bounds {
   constructor(rectangle) {
      this.rectangle = rectangle
   }

   get left() {
      return this.rectangle.position.x
   }

   get right() {
      return this.rectangle.position.x + this.rectangle.width
   }

   get top() {
      return this.rectangle.position.y
   }

   get bottom() {
      return this.rectangle.position.y + this.rectangle.height
   }

   overlap(bounds) {
      return this.left < bounds.right &&
         this.right > bounds.left &&
         this.top < bounds.bottom &&
         this.bottom > bounds.top
   }
}

export default Vector
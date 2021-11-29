---
layout: page
title: Projects
---
## [Conway's Game of Life](/game-of-life/)
![Game of Life screenshot](/public/img/game-of-life.png){:.right}
I was talking about writing games recently, and Conway's Game of Life came up. As I'd never attempted to build it before, I thought I'd give it a go, and this is the result.

Like Breakanoid, it's a pretty simple canvas-based implementation. The cells can be clicked to activate or deactivate them and clicking and dragging will allow the state of multiple cells to be set quickly.

Once the pattern is set, hit the `Play / Pause` button and watch as Conway's rules take effect. It can be quite mesmerizing.

It's pretty simple, with the majority of the code to do with rendering. Have a look at [the code](https://github.com/TimWilde/timwilde.github.io/tree/master/game-of-life)

---

## [Breakanoid](/breakanoid/)
![Breakanoid Screenshot](/public/img/breakanoid_small.png){:.right}
Built during a quiet Christmas break in 2018, I created a tiny (and completely unoptimised) game engine in JavaScript as a way to get up to speed with some of the EcmaScript 6 features. 

Rather than the usual contrived 'Hello World' examples, I decided to build a break-out clone: [Breakanoid](/breakanoid)!

[Blog post]({% post_url 2018-01-06-Javascript-the-new-parts %}), [Source code](https://github.com/TimWilde/timwilde.github.io/tree/master/breakanoid)

---

## [Estimator](/estimator)
![Estimator Screenshot](/public/img/estimator.png){:.right}
After working in a Web Agency environment for quite a few years I found that, more often than not, estimates for work were required before having the full picture. I prefer a bit more structure than just a finger in the air (or elsewhere) to get to a number so I put together [Estimator](/estimator) - a little tool to help derive estimates for projects.

---

## [3D Engine](/3d/)
![3D Engine Screenshot](/public/img/3d-engine.png){:.right}
_Way back_ in the mid to late nineties, before 3D accelerator cards were even a thing, I used to dabble in 3D graphics inspired by [the Demoscene](https://en.wikipedia.org/wiki/Demoscene). Using Borland Turbo Pascal 7 and embedded Assembler, for the bits that just needed pure speed, I built a few simple demos which, sadly, never saw the light of day. 

I decided to see how much I could remember by building a tiny [3D engine](/3d/) from scratch, in JavaScript, without using any 3D libraries - all the maths by hand and nothing more than a 2D canvas.

[Source code](https://github.com/TimWilde/timwilde.github.io/tree/master/3d)
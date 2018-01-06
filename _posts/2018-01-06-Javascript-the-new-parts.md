---
layout: post
title: Javascript, the new parts
---
As things were quiet over the Christmas period I decided to have a look at some of the recent [additions to Javascript](http://es6-features.org). Rather than just putting together a few little "Hello World" snippets of code to play with the new features, I decided I wanted to build something useful. Well, sort of useful...

I decided the world needed another Break Out clone!

![Breakanoid Screenshot](/public/img/breakanoid.png){:.center}

## Breakanoid
[Breakanoid](/breakanoid/) is a retro-style brick breaker game with some awesome chip tune music and sound effects; all written in client-side javascript using as many of the new features as I could _sensibly_ include.

Some of those features include:

 - [Javascript Modules](http://es6-features.org/#ValueExportImport)
 - No semicolons ([controversial](https://hackernoon.com/an-open-letter-to-javascript-leaders-regarding-no-semicolons-82cec422d67d), for sure)
 - [Async and Await with Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
 - [Expression bodies](http://es6-features.org/#ExpressionBodies) and [Statement bodies](http://es6-features.org/#StatementBodies) rather than anonymous functions
 - [Classes](http://es6-features.org/#ClassDefinition) instead of functions and prototypes
 - [Sets](http://es6-features.org/#SetDataStructure) and [Maps](http://es6-features.org/#MapDataStructure) instead of arrays and objects

As everything is [loaded through a module script tag](https://matthewphillips.info/posts/loading-app-with-script-module), that means that currently Breakanoid will only [work in a few browsers](https://caniuse.com/#search=modules), which, surprisingly, doesn't include FireFox. The latest version of Chrome is a safe bet.

It's not quite finished (there's only one playable level at the moment) but it is quite fun. The code isn't optimised, so there is the occasional slowdown when garbage collection kicks in, but I have a plan for that and I'll be improving the code in the future.

While I wrote the code, the sounds, music and the font are from various sources, which can be found in the [credits](/breakanoid/CREDITS).

So go and [play the game](/breakanoid/), or poke around in [the code](https://github.com/TimWilde/timwilde.github.io/blob/master/breakanoid). Let me know what you think below.
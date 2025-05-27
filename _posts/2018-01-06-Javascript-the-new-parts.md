---
layout: post
title: JavaScript, the new parts
tags:
  - JavaScript
  - Client-Side
  - Game
  - Engine
  - Ecmascript
date: 2018-01-06
---
As things were quiet over the Christmas period I decided to catch up with some of the recent [additions to JavaScript](http://es6-features.org). Rather than just putting together a few little "Hello World" snippets of code to play with the new features, I decided I wanted to build something useful. Well, sort of useful...

<!--more-->

I decided the world needed another Break Out clone!

![Breakanoid Screenshot](/public/img/breakanoid.png){:.center}

## Breakanoid
[Breakanoid](/breakanoid/) is a retro-style brick breaker game with some awesome chip tune music and sound effects; all written in client-side JavaScript using as many of the new features as I could _sensibly_ include.

Some of the things I experimented with in this code include:

 - [JavaScript Modules](http://es6-features.org/#ValueExportImport)
 - No semicolons ([controversial](https://hackernoon.com/an-open-letter-to-javascript-leaders-regarding-no-semicolons-82cec422d67d), for sure... oh, and no empty parens when calling constructors)
 - The [Spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator) and [Rest](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) operators
 - [Expression bodies](http://es6-features.org/#ExpressionBodies) and [Statement bodies](http://es6-features.org/#StatementBodies) rather than anonymous functions
 - [Classes](http://es6-features.org/#ClassDefinition) instead of functions and prototypes
 - [Sets](http://es6-features.org/#SetDataStructure) and [Maps](http://es6-features.org/#MapDataStructure) instead of arrays and objects
 - The [HTML audio element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)

As everything is [loaded through a module script tag](https://matthewphillips.info/posts/loading-app-with-script-module) this means that, currently, Breakanoid will only [work in a few browsers](https://caniuse.com/#search=modules), which, surprisingly, doesn't include FireFox. The latest version of Chrome is a safe bet. Apart from the sound, it works reasonably well on mobile devices, too.

It's not quite finished (there's only one playable level at the moment) but it is quite fun. The code isn't optimised, so there is the occasional slowdown when garbage collection kicks in, but I have a plan for that and I'll be improving the code in the future.

While I wrote the code, the sounds, music, and the fonts are from various sources, which can be found in the [credits](https://github.com/TimWilde/timwilde.github.io/blob/master/breakanoid/CREDITS.md).

So go and [play the game](/breakanoid/), or poke around in [the code](https://github.com/TimWilde/timwilde.github.io/blob/master/breakanoid). Let me know what you think below.
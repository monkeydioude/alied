Alied
=====

Draw patterns.

From [Twitter @aemkei, I'm fascinated by this simple formula to create bit fields that look like alien art](https://twitter.com/twitter.com/aemkei/status/1378106731386040322?s=19).

Usage: install [index.html](index.html) on a web server.

## URL Options ##

- `f={opName}`: displays a preregistered formula by its name. Try with `op1` to `op15`, or `anim1` for instance.
- `code={expression}`:  an expression that returns either 0 to draw a white cell, or another number that draws a black cell. See Expression below.
- `cs={positive integer}`: cell size, default to 4.
- `v.{variable name}={value}`: the value is either a single integer, or an integer range of the form `{start}..{end}`.
- `anim=true`: starts the pattern animation, if possible. See Animation below.
- `delay={milliseconds}`: set the animation delay.
- `debug=true`: prints debug statements in the console.

## Expression ##

`x` and `y` are reserved variables, they are automatically filled with the current position on the canvas in the drawing loop.

All other variables must be lowercase and have only one letter.

The aliases for special URL characters allows to type expression in the browser location bar in a more readable way:
- A : `&`: __A__mpersand for __A__ND operator.
- D : `/`: __D__ivide operator.
- M : `%`: __M__odulo operator.
- P : `+`: __P__lus operator.

Example: `x & y * ((x*y) / y & a)` → `x A y * ((x*y) D y A a)`

## Animation ##

For an animation to start, at least one variable with a range greater than 1 must be defined.

### Examples ###

- `https://localhost/alied/?f=op15`
-  `https://localhost/alied/?code=((x%20^%20y)%20M%20a%20)%20A%20((x%20^%20y)%20M%20b)&v.a=51..109v.b=19&anim=true&delay=500`
  Same `https://localhost/alied/?code=((x ^ y) M a) A ((x ^ y) M b)&v.a=51..109v.b=19&anim=true&delay=500`
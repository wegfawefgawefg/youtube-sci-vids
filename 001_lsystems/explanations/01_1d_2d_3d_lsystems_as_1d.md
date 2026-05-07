# 1D, 2D, 3D L-Systems, And Reduction To 1D

## 1D String L-System

The simplest L-system is a parallel string rewrite system.

It has:

1. An alphabet: the allowed symbols.
2. An axiom: the starting string.
3. A rule set: replacement rules for symbols.
4. A clock: each generation applies rules to all symbols at once.

Example:

```text
alphabet: {A, B}
axiom: A
rules:
  A -> AB
  B -> BA
```

Generation by generation:

```text
0: A
1: AB
2: ABBA
3: ABBABAAB
4: ABBABAABBAABABBA
```

No symbol looks at the symbol before it or after it in this basic version. Each `A` becomes `AB`. Each `B` becomes `BA`. All replacements are decided from the old generation, then committed together.

That "together" is the important difference from normal sequential text editing. If generation 1 is `AB`, the `A` and `B` are both rewritten from `AB`; the newly created `B` inside `AB` does not get rewritten until the next generation.

## 1D Storage Versus 2D Rendering

Many famous L-system images are still 1D string L-systems internally.

Example turtle alphabet:

```text
F = move forward and draw
+ = turn left
- = turn right
[ = push current turtle state
] = pop previous turtle state
```

A rule like this:

```text
F -> F[+F]F[-F]F
```

still rewrites a 1D string. The string just happens to be interpreted by a 2D drawing machine after rewriting.

So:

```text
rewriting dimension: 1D string
rendering dimension: 2D turtle path
```

For 3D turtle rendering, the storage can still be a 1D string. The renderer gains more commands:

```text
+ / - = yaw left/right
& / ^ = pitch down/up
\ / / = roll left/right
|     = turn around
```

Now the same kind of string can describe a 3D branching plant. The rewrite engine is not 3D. The interpretation is 3D.

## A Genuinely 2D L-System

A genuinely 2D L-system rewrites local pieces of a 2D structure.

Imagine a grid:

```text
A B B A
B A A B
A A B B
```

A 2D local rule could look at a cell and its neighbors, then produce a new cell, tile, patch, or sub-grid.

For example, with a 2x2 block rule:

```text
AA -> A
AB -> C
BA -> D
BB -> B
```

That is not standard single-symbol D0L anymore. The rule is looking at local structure. It is closer to array rewriting, cellular automata, or graph rewriting.

## Pair Encoding: Turning Local 1D Context Into Symbols

The script sketch says:

```text
ABBA becomes
AB, BB, BA
```

This is the key trick. A string can represent overlapping neighborhoods.

Take the original string:

```text
A B B A
```

List every adjacent pair:

```text
AB
BB
BA
```

Now name each pair as a new symbol:

```text
AB -> C
BB -> D
BA -> E
```

Then:

```text
ABBA
```

becomes:

```text
C D E
```

The new string is still 1D, but each symbol carries more information than before. `C` does not mean "one old cell." It means "the old pair AB."

## The General Block Encoding

For an alphabet `S`, if each cell has `k` possible states, then:

```text
|S| = k
```

A block of length `n` has:

```text
k^n
```

possible values.

So a local neighborhood can always be given a new symbol name.

If the original alphabet is:

```text
S = {0, 1}
```

then all length-3 neighborhoods are:

```text
000
001
010
011
100
101
110
111
```

Name them:

```text
N000, N001, N010, N011, N100, N101, N110, N111
```

Now a context-dependent update can be represented as a context-free rewrite over a bigger alphabet, as long as the encoding and decoding stages preserve overlap correctly.

That last phrase is important: preserving overlap is the hard part. The middle bit of `N011` and the left bit of `N110` refer to shared original cells. A correct encoding must not let adjacent block symbols disagree about shared cells.

## 2D Grid To 1D String

Any finite 2D grid can be flattened into a 1D string.

Example:

```text
A B B A
B A A B
A A B B
```

Flatten row by row and add row separators:

```text
ABBA|BAAB|AABB
```

The separator matters. Without it, the end of one row would appear adjacent to the start of the next row:

```text
ABBA BAAB
   ^ false adjacency between row end and next row start
```

To update a cell in a 2D Moore neighborhood, the rule needs these 9 values:

```text
top-left     top     top-right
left         center  right
bottom-left  bottom  bottom-right
```

If the grid width is fixed, each of those positions has a known offset in the flattened string.

For width `W`, the offsets around a center cell are:

```text
-W-1   -W   -W+1
-1      0   +1
+W-1   +W   +W+1
```

So a 2D local update can be encoded as a 1D string update with longer-range context.

## 3D Grid To 1D String

A finite 3D grid can also be flattened.

One possible order:

```text
z layer 0, row 0
z layer 0, row 1
...
z layer 1, row 0
z layer 1, row 1
...
```

Use row and layer separators:

```text
layer0row0|layer0row1||layer1row0|layer1row1
```

For a 3D Moore neighborhood with radius 1, the rule sees:

```text
3 x 3 x 3 = 27 cells
```

If the grid has width `W` and height `H`, a step in `z` changes the flattened index by:

```text
W * H
```

So the 27 neighbor offsets are combinations of:

```text
dx in {-1, 0, +1}
dy in {-1, 0, +1}
dz in {-1, 0, +1}

flat offset = dx + dy * W + dz * W * H
```

That means a 3D local rewrite can be represented by a 1D string with even longer context.

## What Gets Preserved

The reduction to 1D preserves the information needed to compute the next generation.

It does not preserve visual intuition.

A 2D grid flattened into a string still has 2D adjacency, but the adjacency is now hidden in index arithmetic and separators.

That is the "RISC versus CISC" point from the script:

```text
native 2D rule:
  simple visual neighborhood, more structured substrate

flattened 1D rule:
  simple storage substrate, more complicated rule/context encoding
```

The same system can be made 1D, but the cost is paid in alphabet size, context size, bookkeeping, and uglier rules.


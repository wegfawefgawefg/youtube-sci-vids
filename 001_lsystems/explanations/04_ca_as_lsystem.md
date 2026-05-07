# How A Cellular Automaton Can Be Represented As An L-System

## Start With A Cellular Automaton

Use a 1D binary radius-1 CA.

The current state is a string:

```text
0010110
```

Each cell updates from three old cells:

```text
left, center, right
```

The local rule is:

```text
f(left, center, right) -> next_center
```

A full rule table has 8 rows:

```text
111 -> y111
110 -> y110
101 -> y101
100 -> y100
011 -> y011
010 -> y010
001 -> y001
000 -> y000
```

Each `y` is either `0` or `1`.

## Use Context-Sensitive L-System Notation

A context-sensitive L-system rule can say:

```text
left < center > right -> replacement
```

This means:

```text
rewrite center when it has this left context and this right context
```

So every CA table row becomes one L-system production:

```text
1 < 1 > 1 -> y111
1 < 1 > 0 -> y110
1 < 0 > 1 -> y101
1 < 0 > 0 -> y100
0 < 1 > 1 -> y011
0 < 1 > 0 -> y010
0 < 0 > 1 -> y001
0 < 0 > 0 -> y000
```

The L-system axiom is the CA row:

```text
0010110
```

One L-system generation equals one CA time step.

## Why This Works

At generation `t`, every symbol is still one CA cell.

For each cell:

1. Look at the old left neighbor.
2. Look at the old center value.
3. Look at the old right neighbor.
4. Find the matching context-sensitive production.
5. Replace the center symbol with the next cell value.

Because L-system productions are applied in parallel, all cells update from the old configuration, not from partially updated neighbors.

That is exactly the CA update rule.

## Example: Rule 90

Rule 90 is:

```text
next = left xor right
```

The center cell does not matter.

Truth table:

```text
left right -> next
0    0     -> 0
0    1     -> 1
1    0     -> 1
1    1     -> 0
```

Expanded to radius-1 CA neighborhoods:

```text
111 -> 0
110 -> 1
101 -> 0
100 -> 1
011 -> 1
010 -> 0
001 -> 1
000 -> 0
```

As context-sensitive L-system productions:

```text
1 < 1 > 1 -> 0
1 < 1 > 0 -> 1
1 < 0 > 1 -> 0
1 < 0 > 0 -> 1
0 < 1 > 1 -> 1
0 < 1 > 0 -> 0
0 < 0 > 1 -> 1
0 < 0 > 0 -> 0
```

Starting with:

```text
0001000
```

and using fixed zero boundary cells:

```text
0001000
0010100
0100010
1010101
```

The triangular pattern is the usual Rule 90 behavior.

## Boundary Conditions

A finite CA needs a boundary convention.

Common choices:

```text
fixed zero:
  cells outside the string are 0

fixed one:
  cells outside the string are 1

cyclic:
  the right edge wraps to the left edge

growing background:
  add boundary cells each generation
```

In L-system form, fixed boundaries can be represented with marker symbols:

```text
L 0 0 1 0 0 R
```

where `L` and `R` are not normal cells.

Rules near the edge can use those markers as context:

```text
L < 0 > 0 -> ...
0 < 0 > R -> ...
```

For cyclic boundaries, the structure is better thought of as a ring rather than a plain string.

## A Pure Context-Free Encoding Is More Awkward

The clean encoding uses context-sensitive productions.

If you only allow context-free rules like:

```text
A -> replacement
```

then a symbol cannot directly inspect neighbors.

You can still simulate CA behavior, but you need auxiliary symbols and phases.

The rough idea:

1. Encode overlapping neighborhoods as symbols, such as `N001`, `N010`, `N101`.
2. Rewrite each neighborhood symbol to the next center value.
3. Rebuild the next layer of overlapping neighborhoods.

The hard part is step 3. Adjacent neighborhood symbols overlap, so they must agree about shared cells.

Example:

```text
N001 followed by N010
```

is valid because:

```text
001 shifted one step overlaps 010
```

but:

```text
N001 followed by N111
```

is invalid because the overlapping old cells disagree.

That bookkeeping is why the context-sensitive version is the natural explanation.

## 2D CA As L-System

For a 2D CA, the local rule is:

```text
f(3x3 neighborhood) -> next_center
```

There are two clean options:

1. Use a 2D array L-system or graph L-system directly.
2. Flatten the grid into a string and use long-range context.

Flattened example:

```text
row0|row1|row2
```

If the row width is `W`, the 3x3 neighborhood positions have flattened offsets:

```text
-W-1   -W   -W+1
-1      0   +1
+W-1   +W   +W+1
```

So a 2D CA can be represented by a 1D L-system with enough context to see those offsets.

The rule is still local in 2D space, but it becomes nonlocal-looking in the flattened string.

## Summary

A cellular automaton is an L-system-style object when viewed as synchronized local rewriting.

The direct translation is:

```text
CA cell states        -> L-system alphabet
CA initial condition  -> L-system axiom
CA rule table         -> context-sensitive productions
CA time step          -> L-system generation
CA parallel update    -> L-system parallel rewrite
```

So the script line "a CA is an output encoding for an L-system" is workable if stated carefully:

```text
a CA can be encoded as a context-sensitive L-system over cell-state symbols
```


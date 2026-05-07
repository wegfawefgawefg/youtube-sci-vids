# Cellular Automata: Table Rules, Sum Rules, And Rule Size

## A CA Rule Is A Function

A cellular automaton updates every cell by applying the same local function.

For a 1D radius-1 binary CA, the function is:

```text
f(left, center, right) -> next_center
```

Each input is either `0` or `1`.

There are 3 input cells, so there are:

```text
2^3 = 8
```

possible input neighborhoods.

The full rule table has one output for each neighborhood:

```text
111 -> ?
110 -> ?
101 -> ?
100 -> ?
011 -> ?
010 -> ?
001 -> ?
000 -> ?
```

Each `?` can be `0` or `1`, so there are:

```text
2^8 = 256
```

possible elementary binary radius-1 CA rules.

## General Full Table Size

Let:

```text
k = number of possible cell states
n = number of cells in the neighborhood
```

Then the number of possible input neighborhoods is:

```text
k^n
```

The full table needs:

```text
k^n table rows
```

Each row chooses one of `k` outputs, so the number of possible full-table rules is:

```text
k^(k^n)
```

Example: binary 2D Moore neighborhood.

```text
k = 2
n = 9
table rows = 2^9 = 512
possible rules = 2^512
```

This is the "the table gets splayed out and that is lame" point from the script.

The table is maximally general, but it is also maximally verbose.

## Sum Rules

A sum rule does not care about the exact arrangement of the neighborhood.

It only cares about:

```text
sum of cell values in the neighborhood
```

For a binary 9-cell neighborhood, the sum can be:

```text
0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

That is only:

```text
10 cases
```

instead of:

```text
512 cases
```

So a sum rule compresses the table by merging many arrangements into one case.

Example:

```text
if sum is 3, output 1
otherwise output 0
```

This treats all neighborhoods with exactly three live cells as equivalent.

## Why Sum Rules Look Natural

Many physical and biological effects are local aggregations.

Examples:

```text
heat diffusion: average nearby temperatures
chemical reaction: concentration around a point
crowding: number of occupied neighbor sites
plant growth: nearby light, space, nutrients, signals
```

A table rule asks:

```text
which exact pattern is around me?
```

A sum rule asks:

```text
how much stuff is around me?
```

That second question matches many natural systems better.

## Totalistic Rules

A totalistic rule depends on the total sum of all `n` cells in the neighborhood, including the center.

If each cell has values:

```text
0, 1, ..., k-1
```

then the smallest sum is:

```text
0
```

and the largest sum is:

```text
n * (k - 1)
```

So the number of possible sums is:

```text
n * (k - 1) + 1
```

A totalistic rule table therefore has:

```text
n * (k - 1) + 1 cases
```

For binary 2D Moore:

```text
n = 9
k = 2
cases = 9 * (2 - 1) + 1 = 10
```

## Outer-Totalistic Rules

An outer-totalistic rule keeps the center cell separate and sums only the surrounding cells.

This is how Life-like rules are usually described.

For a binary 3x3 neighborhood:

```text
center = 0 or 1
neighbor sum = 0 through 8
```

So the cases are:

```text
2 * 9 = 18
```

Example, Conway's Game of Life:

```text
if center is 1 and neighbor sum is 2 or 3: output 1
if center is 0 and neighbor sum is 3: output 1
otherwise: output 0
```

Life is not using all 512 binary neighborhood patterns separately. It compresses them into 18 center/sum cases.

## Table Consumption Ranking

Define "table consumption" as:

```text
how many independent cases must be specified before the rule can be expanded into a full lookup table
```

For a binary 2D Moore neighborhood:

```text
k = 2
n = 9
full table rows = 512
```

Ranked from smallest to largest:

| Rule type | Independent cases | Binary 1D radius 1 | Binary 2D Moore | What it forgets |
|---|---:|---:|---:|---|
| Constant | 1 | 1 | 1 | Everything |
| Center-only | k | 2 | 2 | All neighbors |
| Totalistic sum | n*(k-1)+1 | 4 | 10 | Arrangement |
| Additive/linear | n+1 coefficients | 4 | 10 | Nonlinear interactions |
| Outer-totalistic | k*((n-1)*(k-1)+1) | 6 | 18 | Neighbor arrangement |
| Isotropic full local | symmetry orbits | 6 for 1D reflection | 102 for 2D D4 symmetry | Rotations/reflections |
| Full lookup table | k^n | 8 | 512 | Nothing |

Notes:

- The additive/linear row is not a table case count in the same sense. It is a compact formula count: bias plus one coefficient per neighbor. It can generate a full table, but its possible behaviors are much more restricted than arbitrary totalistic rules.
- "Isotropic" means rotated and reflected versions of a pattern are treated as the same case. In 2D square grids, this uses the 8 symmetries of the square.
- Full lookup tables are the most expressive local rules, but also the least compressed.

## Rule Counts From Case Counts

If a compressed rule has `c` independent cases and each case chooses one of `k` outputs, then it describes:

```text
k^c
```

possible rules.

For binary 2D Moore:

```text
constant:          2^1
center-only:       2^2
totalistic:        2^10
outer-totalistic:  2^18
isotropic:         2^102
full table:        2^512
```

That is the ranking the script is reaching for: different rule languages consume different fractions of the full table.

## Equivalence Classes

A sum rule creates equivalence classes over neighborhoods.

Two neighborhoods are equivalent if the rule cannot tell them apart.

For totalistic binary rules:

```text
neighborhood A equivalent to neighborhood B
if sum(A) = sum(B)
```

For isotropic rules:

```text
neighborhood A equivalent to neighborhood B
if A can be rotated or reflected into B
```

For center-only rules:

```text
neighborhood A equivalent to neighborhood B
if center(A) = center(B)
```

The full table has the smallest equivalence classes:

```text
only identical neighborhoods are equivalent
```

So every compact rule language is also a claim about what distinctions do not matter.

## Sources And Anchors

- Wolfram, "Numbers of cellular automaton rules": `https://www.wolframscience.com/nks/notes-3-2--numbers-of-cellular-automaton-rules/`
- Wolfram Language documentation, `CellularAutomaton`: `https://reference.wolfram.com/language/ref/CellularAutomaton.html`


# Parameterized L-Systems

## Basic Idea

A normal L-system symbol is just a tag:

```text
A
B
F
Leaf
Bud
```

A parameterized L-system symbol is a tag with values attached:

```text
A(1.0)
Bud(age=3, energy=0.42)
Segment(length=0.8, radius=0.03)
```

The tag says what kind of thing it is.

The parameters say what state that thing carries.

## Normal Rule Versus Parameterized Rule

Normal:

```text
A -> AB
```

Parameterized:

```text
A(x) -> B(x * 0.5) B(x * 0.5)
```

Start:

```text
A(1.0)
```

Generation 1:

```text
B(0.5) B(0.5)
```

The rewrite is still symbolic, but it now evaluates numeric expressions while rewriting.

## Guarded Rules

Parameterized rules can have conditions.

Example:

```text
A(x) : x > 0.1  -> F(x) [ + A(x * 0.6) ] [ - A(x * 0.4) ]
A(x) : x <= 0.1 -> F(x)
```

Read it step by step:

1. If the current module is `A(x)`, inspect `x`.
2. If `x > 0.1`, use the first rule.
3. If `x <= 0.1`, use the second rule.
4. Compute the replacement values.
5. Apply all chosen replacements in parallel.

Start:

```text
A(1.0)
```

Generation 1:

```text
F(1.0) [ + A(0.6) ] [ - A(0.4) ]
```

Generation 2:

```text
F(1.0)
[ + F(0.6) [ + A(0.36) ] [ - A(0.24) ] ]
[ - F(0.4) [ + A(0.24) ] [ - A(0.16) ] ]
```

The string grows like a branching structure, while the numbers shrink according to the rule.

## Plant-Like Example

Use modules:

```text
Stem(length, radius)
Bud(age, energy)
Leaf(size)
```

Rules:

```text
Bud(age, energy) : age < 5
  -> Bud(age + 1, energy)

Bud(age, energy) : age >= 5 && energy > 0.2
  -> Stem(energy * 0.7, energy * 0.08)
     [ + Bud(0, energy * 0.3) ]
     [ - Bud(0, energy * 0.2) ]

Bud(age, energy) : age >= 5 && energy <= 0.2
  -> Leaf(energy)
```

What this means:

1. Young buds wait and age.
2. Old high-energy buds make stems and new buds.
3. Old low-energy buds terminate into leaves.

This is expressive enough to feel biological because every symbol has local state.

## Why It Can Feel Too Expressive

The script complains that parameterized L-systems are "too expressive."

That is a fair instinct.

Once a rule can contain arbitrary real-valued functions, conditions, random choices, and state variables, the system starts to feel less like a clean mathematical toy and more like a small programming language.

For example:

```text
Bud(age, energy, hormone, light, water, damage, species_id, memory)
```

with rules like:

```text
if light > 0.6 and water > 0.4 and hormone < threshold(species_id)
```

is still technically an L-system style model, but the interesting behavior may now be inside the parameter functions rather than inside the rewrite structure.

That is the tradeoff:

```text
fewer parameters:
  cleaner math, less control

more parameters:
  richer models, easier to hide arbitrary computation
```

## Numeric-Only L-System

The script wants to get the letters out and try a "pure number L-system."

Example:

```text
f(x) -> [f(x * 0.6), f(x * 0.4)]
```

Start:

```text
[1.0]
```

Generation 1:

```text
[0.6, 0.4]
```

Generation 2:

```text
[0.36, 0.24, 0.24, 0.16]
```

Generation 3:

```text
[0.216, 0.144, 0.144, 0.096, 0.144, 0.096, 0.096, 0.064]
```

Each output number is a product of choices made along a path.

If the path contains:

```text
a copies of 0.6
b copies of 0.4
```

then the value is:

```text
x0 * 0.6^a * 0.4^b
```

and:

```text
a + b = generation number
```

So the same numeric values repeat when different paths have the same counts.

Example at generation 2:

```text
0.6 * 0.4 = 0.24
0.4 * 0.6 = 0.24
```

That is why the middle values collide.

## Why Early Choices Matter More

If the values are rendered as a path, earlier branching decisions can affect larger-scale shape because they decide where whole subtrees or subpaths go.

Even if later multiplications use the same numbers, their visual effect may be nested inside an already chosen branch.

This creates the "earlier applications matter more" feeling from the script:

```text
early choice:
  controls a large chunk of future structure

late choice:
  controls detail inside an already placed chunk
```

That is one reason fractals show self-similar hierarchy.

## Parameterized Visual Material To Generate

Useful still images:

1. A plain symbol rewrite:

```text
A -> AB -> ABBA -> ABBABAAB
```

2. A parameterized branch rewrite:

```text
A(1.0)
-> F(1.0)[+A(0.6)][-A(0.4)]
```

3. A numeric-only generation tree where each edge multiplies by `0.6` or `0.4`.

4. A plot of generation index versus numeric value for the pure number system.

5. A rendered turtle tree with branch length controlled by the parameter.

Useful short animations:

1. Text expands generation by generation.
2. A branch grows while parameter labels shrink.
3. A slider changes `(0.6, 0.4)` into `(a, b)` and the resulting point/path cloud updates.
4. A comparison of:

```text
symbolic L-system
parameterized L-system
numeric-only L-system
```

## Implementation Notes For The Future Playground

The playground should separate three layers:

```text
rewrite engine:
  takes a current sequence/tree and produces the next one

interpretation:
  maps the sequence/tree into geometry

renderer:
  draws points, lines, meshes, or OBJ output
```

For scanning parameter space, the important controls are:

```text
branch factors
generation depth
angle mapping
scale mapping
pruning threshold
render mode: points, polyline, tubes, mesh
projection mode: 2D, 3D, 4D-to-3D
```

Python is likely fast enough for early 2D exploration if the generation depth is modest and geometry is vectorized. For dense real-time 3D scanning, C++/SDL/OpenGL, Rust/wgpu, or a browser WebGL tool will scale better.

The clean first target is a local browser playground:

```text
HTML/JS + Canvas2D or WebGL
```

because parameter sliders and immediate video capture are simple.


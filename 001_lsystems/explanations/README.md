# L-Systems Explanation Notes

These notes expand the rough beats in `../script.txt` into clearer supporting material for video `001`.

The shared ChatGPT conversation at `https://chatgpt.com/share/69fadd81-ab70-83a4-a8aa-bbf576ce35d6` was reachable, but the readable page content exposed only the login/sidebar shell, not the conversation. These docs therefore use the local script and the requested outline as the source of truth.

## Files

- `01_1d_2d_3d_lsystems_as_1d.md`: what 1D, 2D, and 3D L-systems can mean, and how higher-dimensional local rewriting can be encoded back into a 1D string.
- `02_lsystems_as_rewriting_umbrella.md`: why L-systems are a good entry point for talking about graph transformations, regular languages, cellular automata, and compiler-like rewriting.
- `03_ca_table_sum_equivalence.md`: how CA rule tables relate to compact sum/totalistic rules, with rule classes ranked by table consumption.
- `04_ca_as_lsystem.md`: a step-by-step encoding of cellular automata as context-sensitive L-systems.
- `05_parameterized_lsystems.md`: parametric L-systems, guarded rules, numeric-only variants, and visual material ideas.
- `06_relevant_books.md`: books and references worth mining for the video.

The companion live scanners are in `../playground/` and `../playground_3d/`.

## Working Distinctions

In the script, "2D L-system" and "3D L-system" can mean two different things:

1. A normal 1D string L-system whose symbols are interpreted by a 2D or 3D turtle renderer.
2. A genuinely 2D or 3D rewriting substrate, such as a grid, array, graph, mesh, or cellular layer.

Both are useful for the video. The first is how many fractal/tree demos work. The second is what connects L-systems to cellular automata, graph rewriting, and development-like local transformations.

# 001 L-Systems

Working material for the L-systems video.

## Files

- `script.txt`: rough script draft and idea dump.
- `explanations/`: no-steps-skipped supporting explanations for the main script beats.
- `playground/`: static real-time scanner for the pure-number L-system idea.
- `playground_3d/`: static Three.js scanner that turns the pure-number system into a live tapered-branch mesh with sine-folded and product rule modes, plus OBJ export.
- `playground_surface/`: live coherent numeric subdivision surface using real `uv` grid adjacency.
- `surface_generator/`: Python OBJ generator for the coherent subdivision surface.
- `generated/`: generated OBJ assets.

## 2D Playground

Open this file in a browser:

```text
playground/index.html
```

It visualizes:

```text
f(x) -> [f(a*x), f(b*x)]
```

with live controls for depth, multipliers, branch angle, turn bias, pruning, render mode, and parameter scanning.

## 3D Mesh Playground

Run a local server from this folder or the repo root, then open:

```text
playground_3d/index.html
```

The 3D version imports Three.js ES modules from a CDN, so it should be served over `http://localhost` instead of opened as a raw file. If the page shows `0` vertices and `0` faces, the module did not load; use the local server URL and check the status badge in the upper-left of the viewport.

Default rule mode:

```text
x -> a*x*Sx, b*x*Sy
Sx = .44 + .56*abs(sin(freq*x + phase))
```

It generates a single mesh from tapered branch segments and can export the current mesh as:

```text
number-lsystem-mesh.obj
```

## Coherent Surface Playground

Run the local server, then open:

```text
playground_surface/index.html
```

This is the corrected topology from the original chat idea:

```text
patch -> four child patches
```

The surface is sampled on a coherent `(u, v)` grid. Adjacent mesh faces connect actual neighboring samples, not arbitrary binary-address list neighbors.

## Surface OBJ Generator

Generate the default OBJ:

```text
python3 surface_generator/generate_numeric_subdivision_surface_fixed.py --n 180 --out generated/numeric_subdivision_surface_fixed.obj
```

Default output:

```text
vertices = 32761
quad_faces = 32400
```

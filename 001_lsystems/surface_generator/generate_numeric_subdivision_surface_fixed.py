from pathlib import Path
import argparse
import math


def height(u, v, octaves=9, amp0=0.55, decay=0.52):
    z = 0.0
    amp = amp0
    freq = 1.0

    for _ in range(octaves):
        z += amp * math.sin(freq * math.pi * (u + 0.35 * math.sin(2 * math.pi * v)))
        z += amp * 0.55 * math.cos(freq * math.pi * (v - 0.25 * math.sin(2 * math.pi * u)))
        z += amp * 0.35 * math.sin(freq * math.pi * (u + v))
        amp *= decay
        freq *= 2.0

    return z


def warp(u, v, warp_amount=1.0):
    x = (u - 0.5) * 5.0
    y = (v - 0.5) * 5.0

    r = math.sqrt(x * x + y * y)
    theta = warp_amount * 0.45 * math.sin(1.2 * r)
    ct, st = math.cos(theta), math.sin(theta)

    x2 = ct * x - st * y
    y2 = st * x + ct * y

    x2 += warp_amount * 0.25 * math.sin(2.0 * math.pi * v)
    y2 += warp_amount * 0.25 * math.sin(2.0 * math.pi * u)

    return x2, y2


def idx(i, j, n):
    return j * (n + 1) + i + 1


def write_obj(path, n, octaves, amp0, decay, warp_amount, z_scale):
    vertices = []

    for j in range(n + 1):
        v = j / n
        for i in range(n + 1):
            u = i / n
            x, y = warp(u, v, warp_amount)
            z = z_scale * height(u, v, octaves, amp0, decay)
            vertices.append((x, y, z))

    with open(path, "w", encoding="utf-8") as f:
        f.write("# Coherent numeric subdivision surface\n")
        f.write("# Connectivity follows uv-grid adjacency, not binary leaf order.\n")
        f.write("o numeric_subdivision_surface_fixed\n")

        for x, y, z in vertices:
            f.write(f"v {x:.8f} {y:.8f} {z:.8f}\n")

        for j in range(n):
            for i in range(n):
                a = idx(i, j, n)
                b = idx(i + 1, j, n)
                c = idx(i + 1, j + 1, n)
                d = idx(i, j + 1, n)
                f.write(f"f {a} {b} {c} {d}\n")

    return len(vertices), n * n


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=180, help="grid resolution; quad faces = n*n")
    parser.add_argument("--octaves", type=int, default=9)
    parser.add_argument("--amp", type=float, default=0.55)
    parser.add_argument("--decay", type=float, default=0.52)
    parser.add_argument("--warp", type=float, default=1.0)
    parser.add_argument("--z-scale", type=float, default=1.0)
    parser.add_argument("--out", type=Path, default=Path("numeric_subdivision_surface_fixed.obj"))
    args = parser.parse_args()

    vertices, faces = write_obj(
        args.out,
        max(2, args.n),
        max(1, args.octaves),
        args.amp,
        args.decay,
        args.warp,
        args.z_scale,
    )

    print(f"Wrote {args.out}")
    print(f"vertices={vertices}")
    print(f"quad_faces={faces}")


if __name__ == "__main__":
    main()


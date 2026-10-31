# 9.7.12. Texture Instructions

This section describes PTX instructions for accessing textures and samplers. PTX supports the following operations on texture and sampler descriptors:

- Static initialization of texture and sampler descriptors.
- Module-scope and per-entry scope definitions of texture and sampler descriptors.
- Ability to query fields within texture and sampler descriptors.

## 9.7.12.1. Texturing Modes

For working with textures and samplers, PTX has two modes of operation. In the unified mode, texture and sampler information is accessed through a single `.texref` handle. In the independent mode, texture and sampler information each have their own handle, allowing them to be defined separately and combined at the site of usage in the program.

The advantage of unified mode is that it allows 256 samplers per kernel (128 for architectures prior to `sm_3x`), with the restriction that they correspond 1-to-1 with the 256 possible textures per kernel (128 for architectures prior to `sm_3x`). The advantage of independent mode is that textures and samplers can be mixed and matched, but the number of samplers is greatly restricted to 32 per kernel (16 for architectures prior to `sm_3x`).

Table 40 summarizes the number of textures, samplers and surfaces available in different texturing modes.

**Table 40** Texture, sampler and surface limits

| Texturing mode | Resource | `sm_1x`, `sm_2x` | `sm_3x+` |
|---|---|---|---|
| Unified mode | Textures | 128 | 256 |
| Unified mode | Samplers | 128 | 256 |
| Unified mode | Surfaces | 8 | 16 |
| Independent mode | Textures | 128 | 256 |
| Independent mode | Samplers | 16 | 32 |
| Independent mode | Surfaces | 8 | 16 |

The texturing mode is selected using `.target` options `texmode_unified` and `texmode_independent`. A PTX module may declare only one texturing mode. If no texturing mode is declared, the module is assumed to use unified mode.

Example: calculate an element's power contribution as element's power/total number of elements.

```ptx
.target texmode_independent
.global .samplerref tsamp1 = { addr_mode_0 = clamp_to_border,
                               filter_mode = nearest
                             };
...
.entry compute_power
  ( .param .texref tex1 )
{
  txq.width.b32  r6, [tex1]; // get tex1's width
  txq.height.b32 r5, [tex1]; // get tex1's height
  tex.2d.v4.f32.f32  {r1,r2,r3,r4}, [tex1, tsamp1, {f1,f2}];
  mul.u32 r5, r5, r6;
  add.f32 r1, r1, r2;
  add.f32 r3, r3, r4;
  add.f32 r1, r1, r3;
  cvt.f32.u32 r5, r5;
  div.f32 r1, r1, r5;
}
```

## 9.7.12.2. Mipmaps

A mipmap is a sequence of textures, each of which is a progressively lower resolution representation of the same image. The height and width of each image, or level of detail (LOD), in the mipmap is a power of two smaller than the previous level. Mipmaps are used in graphics applications to improve rendering speed and reduce aliasing artifacts. For example, a high-resolution mipmap image is used for objects that are close to the user; lower-resolution images are used as the object appears farther away. Mipmap filtering modes are provided when switching between two levels of detail (LODs) in order to avoid abrupt changes in visual fidelity.

Example: If the texture has a basic size of 256 by 256 pixels, then the associated mipmap set may contain a series of eight images, each one-fourth the total area of the previous one: 128x128 pixels, 64x64, 32x32, 16x16, 8x8, 4x4, 2x2, 1x1 (a single pixel). If, for example, a scene is rendering this texture in a space of 40x40 pixels, then either a scaled up version of the 32x32 (without trilinear interpolation) or an interpolation of the 64x64 and the 32x32 mipmaps (with trilinear interpolation) would be used.

The total number of LODs in a complete mipmap pyramid is calculated through the following equation:

```ptx
numLODs = 1 + floor(log2(max(w, h, d)))
```

The finest LOD is called the base level and is the 0th level. The next (coarser) level is the 1st level, and so on. The coarsest level is the level of size (1 x 1 x 1). Each successively smaller mipmap level has half the {width, height, depth} of the previous level, but if this half value is a fractional value, it's rounded down to the next largest integer. Essentially, the size of a mipmap level can be specified as:

```ptx
max(1, floor(w_b / 2^i)) x
max(1, floor(h_b / 2^i)) x
max(1, floor(d_b / 2^i))
```

where `i` is the ith level beyond the 0th level (the base level). And `w_b`, `h_b` and `d_b` are the width, height and depth of the base level respectively.

**PTX support for mipmaps**

The PTX `tex` instruction supports three modes for specifying the LOD: base, level, and gradient. In base mode, the instruction always picks level 0. In level mode, an additional argument is provided to specify the LOD to fetch from. In gradmode, two floating-point vector arguments provide partials (e.g., {ds/dx, dt/dx} and {ds/dy, dt/dy} for a 2d texture), which the `tex` instruction uses to compute the LOD.

These instructions provide access to texture memory.

- [`tex`](tex.md)
- [`tld4`](tld4.md)
- [`txq`](txq.md)

## Pages

- [9.7.12.3. Texture Instructions: tex](tex.md) — Perform a texture memory lookup, including texture arrays, cubemaps, multi-sample textures and mipmap LOD modes.
- [9.7.12.4. Texture Instructions: tld4](tld4.md) — Fetch the 4-texel bilerp footprint of one texture component.
- [9.7.12.5. Texture Instructions: txq](txq.md) — Query texture and sampler attributes.
- [9.7.12.6. Texture Instructions: istypep](istypep.md) — Query whether a register points to an opaque variable of a given type.

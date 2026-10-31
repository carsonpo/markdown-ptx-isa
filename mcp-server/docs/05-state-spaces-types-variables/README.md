# 5. State Spaces, Types, and Variables

While the specific resources available in a given target GPU will vary, the kinds of resources will be common across platforms, and these resources are abstracted in PTX through state spaces and data types. This chapter covers the PTX state spaces (register, special register, constant, global, local, parameter, shared and texture), the fundamental and packed data types including the alternate floating-point formats, the opaque texture/sampler/surface types, variable declarations and attributes, and the tensor model used by the bulk tensor copy instructions (dimensions, access modes, swizzling and tensor-maps).

## Pages

- [5. State Spaces, Types, and Variables · 5.1. State Spaces](01-state-spaces.md) — chapter intro and the register, special-register, constant, global, local, parameter, shared and texture state spaces, including kernel and device function parameters and the `.ptr` attribute
- [5.2. Types](02-types.md) — fundamental types, sub-word restrictions, alternate floating-point formats (bf16, e4m3, e5m2, tf32, e2m1, e2m3, e3m2, ue8m0, ue4m3, ue5m3), fixed-point and packed data types
- [5.3. Texture Sampler and Surface Types](03-texture-sampler-surface-types.md) — the opaque `.texref`, `.samplerref` and `.surfref` types, their properties, sampler properties, channel data types and channel orders
- [5.4. Variables](04-variables.md) — variable declarations, vectors, arrays, initializers, alignment, parameterized names, variable attributes and the `.attribute` directive
- [5.5. Tensors](05-tensors.md) — tensor dimensions, sizes and formats (including sub-byte types), tiled mode, `tile::scatter4`/`tile::gather4`, im2col, `im2col::w`, `im2col_no_offs::w`, `im2col::w::128` and interleave layouts
- [5.5.7. Swizzling Modes · 5.5.8. Tensor-map](06-tensor-swizzling-and-tensormap.md) — the 32B/64B/96B/128B swizzling patterns with their atomicity sub-modes, and the tensor-map object

# 9.7.20.2. SIMD Video Instructions

The SIMD video instructions operate on pairs of 16-bit values and quads of 8-bit values.

The SIMD video instructions are:

- `vadd2`, `vadd4`
- `vsub2`, `vsub4`
- `vavrg2`, `vavrg4`
- `vabsdiff2`, `vabsdiff4`
- `vmin2`, `vmin4`
- `vmax2`, `vmax4`
- `vset2`, `vset4`

PTX includes SIMD video instructions for operation on pairs of 16-bit values and quads of 8-bit values. The SIMD video instructions execute the following stages:

- Form input vectors by extracting and sign- or zero-extending byte or half-word values from the source operands, to form pairs of signed 17-bit values.
- Perform a SIMD arithmetic operation on the input pairs.
- Optionally clamp the result to the appropriate signed or unsigned range, as determinted by the destination type.
- Optionally perform one of the following:
  - perform a second SIMD merge operation, or
  - apply a scalar accumulate operation to reduce the intermediate SIMD results to a single scalar.

The general format of dual half-word SIMD video instructions is as follows:

```ptx
// 2-way SIMD operation, with second SIMD merge or accumulate
vop2.dtype.atype.btype{.sat}{.add}  d{.mask}, a{.asel}, b{.bsel}, c;

.dtype = .atype = .btype = { .u32, .s32 };
.mask  = { .h0, .h1, .h10 };
.asel  = .bsel = { .hxy, where x,y are from { 0, 1, 2, 3 } };
```

The general format of quad byte SIMD video instructions is as follows:

```ptx
// 4-way SIMD operation, with second SIMD merge or accumulate
vop4.dtype.atype.btype{.sat}{.add}  d{.mask}, a{.asel}, b{.bsel}, c;

.dtype = .atype = .btype = { .u32, .s32 };
.mask  = { .b0,
           .b1, .b10
           .b2, .b20, .b21, .b210,
           .b3, .b30, .b31, .b310, .b32, .b320, .b321, .b3210 };
.asel = .bsel = .bxyzw, where x,y,z,w are from { 0, ..., 7 };
```

The source and destination operands are all 32-bit registers. The type of each operand (`.u32` or `.s32`) is specified in the instruction type; all combinations of `dtype`, `atype`, and `btype` are valid. Using the `atype`/`btype` and `asel`/`bsel` specifiers, the input values are extracted and sign- or zero-extended internally to `.s33` values. The primary operation is then performed to produce an `.s34` intermediate result. The sign of the intermediate result depends on `dtype`.

The intermediate result is optionally clamped to the range of the destination type (signed or unsigned), taking into account the subword destination size in the case of optional data merging.

## Pages

- [9.7.20.2.1. SIMD Video Instructions: vadd2, vsub2, vavrg2, vabsdiff2, vmin2, vmax2](vadd2-vsub2-vavrg2-vabsdiff2-vmin2-vmax2.md) — dual half-word SIMD addition, subtraction, average, absolute difference, minimum and maximum.
- [9.7.20.2.2. SIMD Video Instructions: vset2](vset2.md) — dual half-word SIMD comparison.
- [9.7.20.2.3. SIMD Video Instructions: vadd4, vsub4, vavrg4, vabsdiff4, vmin4, vmax4](vadd4-vsub4-vavrg4-vabsdiff4-vmin4-vmax4.md) — quad byte SIMD addition, subtraction, average, absolute difference, minimum and maximum.
- [9.7.20.2.4. SIMD Video Instructions: vset4](vset4.md) — quad byte SIMD comparison.

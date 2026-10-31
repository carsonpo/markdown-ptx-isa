# 9.7.7. Comparison and Selection Instructions

The comparison select instructions are:

- `set`
- `setp`
- `selp`
- `slct`

As with single-precision floating-point instructions, the `set`, `setp`, and `slct` instructions support subnormal numbers for `sm_20` and higher targets and flush single-precision subnormal inputs to sign-preserving zero for `sm_1x` targets. The optional `.ftz` modifier provides backward compatibility with `sm_1x` targets by flushing subnormal inputs and results to sign-preserving zero regardless of the target architecture.

## Pages

- [9.7.7.1. Comparison and Selection Instructions: set](set.md) — Compare two values and write a 1.0f / 0xffffffff style result, including the new packed `.u8x4`, `.s8x4`, `.u16x2`, `.s16x2` SIMD forms.
- [9.7.7.2. Comparison and Selection Instructions: setp](setp.md) — Compare two values and write the result (and its complement) to predicate registers.
- [9.7.7.3. Comparison and Selection Instructions: selp](selp.md) — Select between two source operands based on a predicate.
- [9.7.7.4. Comparison and Selection Instructions: slct](slct.md) — Select between two source operands based on the sign of a third `.s32` or `.f32` operand.

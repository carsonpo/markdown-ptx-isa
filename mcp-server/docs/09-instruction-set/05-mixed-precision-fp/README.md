# 9.7.5. Mixed Precision Floating-Point Instructions

Mixed precision floating-point instructions operate on data with varied floating point precision. Before executing the specified operation, operands with different precision needs to be converted such that all the instruction operands can be represented with a consistent floating-point precision. The register variable to be used for holding a particular operand depends upon the combination of the instruction types. Refer [Fundamental Types](../../05-state-spaces-types-variables/02-types.md) and [Alternate Floating-Point Data Formats](../../05-state-spaces-types-variables/02-types.md) for more details around exact register operand to be used for a given data type.

The mixed precision floating point instructions are:

- `add`
- `sub`
- `fma`
- `mul`

Mixed precision `add`, `sub`, `fma` support saturation of results to the range [0.0, 1.0], with NaN being flushed to positive zero.

## Pages

- [9.7.5.1. Mixed Precision Floating Point Instructions: add](add.md) — Add with up-conversion of `.f16`/`.bf16` inputs to `.f32`, or packed `.f16x2`/`.bf16x2`/`.f32x2` forms.
- [9.7.5.2. Mixed Precision Floating Point Instructions: sub](sub.md) — Subtract with up-conversion of `.f16`/`.bf16` inputs to `.f32`, or packed `.f16x2`/`.bf16x2`/`.f32x2` forms.
- [9.7.5.3. Mixed Precision Floating Point Instructions: fma](fma.md) — Fused multiply-add with `.f16`/`.bf16` multiplicands and `.f32` accumulate, or packed `.f32x2` forms.
- [9.7.5.4. Mixed Precision Floating Point Instructions: mul](mul.md) — Packed multiply converting between `.f16x2`, `.bf16x2` and `.f32x2` (new in PTX ISA 9.4).

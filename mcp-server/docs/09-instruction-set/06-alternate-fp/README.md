# 9.7.6. Alternate Floating-Point Instructions

Alternate floating-point instructions operate on FP8, FP6, FP4 data types. The register variable to be used for such instruction varies depending upon the data type. Refer [Packed Floating Point Data Types](../../05-state-spaces-types-variables/02-types.md) for details on the supported data types and their register representations.

The alternate floating-point instructions are:

- `add`
- `sub`
- `mul`
- `fma`

## Pages

- [9.7.6.1. Alternate Floating Point Instructions: add](add.md) — SIMD addition of four packed FP8/FP6/FP4/UE8M0 values with an FP8x4 operand, producing an FP8x4 result.
- [9.7.6.2. Alternate Floating Point Instructions: sub](sub.md) — SIMD subtraction of an FP8x4 operand from four packed FP8/FP6/FP4/UE8M0 values, producing an FP8x4 result.
- [9.7.6.3. Alternate Floating Point Instructions: mul](mul.md) — SIMD multiplication of two packed four-element FP8/FP6/FP4/UE8M0 operands, producing an FP8x4 result.
- [9.7.6.4. Alternate Floating Point Instructions: fma](fma.md) — SIMD fused multiply-add of packed FP8/FP6/FP4/UE8M0 operands with an FP8x4 addend, producing an FP8x4 result.

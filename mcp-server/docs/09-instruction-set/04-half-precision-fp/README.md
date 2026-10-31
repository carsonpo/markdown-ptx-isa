# 9.7.4. Half Precision Floating-Point Instructions

Half precision floating-point instructions operate on `.f16` and `.f16x2` register operands. The half precision floating-point instructions are:

- `add`
- `sub`
- `mul`
- `fma`
- `neg`
- `abs`
- `min`
- `max`
- `tanh`
- `ex2`

Half-precision `add`, `sub`, `mul`, and `fma` support saturation of results to the range [0.0, 1.0], with NaNs being flushed to positive zero. Half-precision instructions return an unspecified NaN.

## Pages

- [9.7.4.1. Half Precision Floating Point Instructions: add](add.md) — Add two `.f16`, `.f16x2`, `.bf16` or `.bf16x2` values.
- [9.7.4.2. Half Precision Floating Point Instructions: sub](sub.md) — Subtract two `.f16`, `.f16x2`, `.bf16` or `.bf16x2` values.
- [9.7.4.3. Half Precision Floating Point Instructions: mul](mul.md) — Multiply two `.f16`, `.f16x2`, `.bf16` or `.bf16x2` values.
- [9.7.4.4. Half Precision Floating Point Instructions: fma](fma.md) — Fused multiply-add on half-precision values, with optional `.relu` and `.oob` modifiers.
- [9.7.4.5. Half Precision Floating Point Instructions: neg](neg.md) — Arithmetic negate of a half-precision value.
- [9.7.4.6. Half Precision Floating Point Instructions: abs](abs.md) — Absolute value of a half-precision value.
- [9.7.4.7. Half Precision Floating Point Instructions: min](min.md) — Minimum of two half-precision values, with optional `.NaN` and `.xorsign.abs` modifiers.
- [9.7.4.8. Half Precision Floating Point Instructions: max](max.md) — Maximum of two half-precision values, with optional `.NaN` and `.xorsign.abs` modifiers.
- [9.7.4.9. Half Precision Floating Point Instructions: tanh](tanh.md) — Approximate hyperbolic tangent of a half-precision value.
- [9.7.4.10. Half Precision Floating Point Instructions: ex2](ex2.md) — Approximate base-2 exponential of a half-precision value.

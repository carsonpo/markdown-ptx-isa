# 9.7.3. Floating-Point Instructions

Floating-point instructions operate on `.f32` and `.f64` register operands and constant immediate values. The floating-point instructions are:

- `testp`
- `copysign`
- `add`
- `sub`
- `mul`
- `fma`
- `mad`
- `div`
- `abs`
- `neg`
- `min`
- `max`
- `rcp`
- `sqrt`
- `rsqrt`
- `sin`
- `cos`
- `lg2`
- `ex2`
- `tanh`

Instructions that support rounding modifiers are IEEE-754 compliant. Double-precision instructions support subnormal inputs and results. Single-precision instructions support subnormal inputs and results by default for `sm_20` and subsequent targets, and flush subnormal inputs and results to sign-preserving zero for `sm_1x` targets. The optional `.ftz` modifier on single-precision instructions provides backward compatibility with `sm_1x` targets by flushing subnormal inputs and results to sign-preserving zero regardless of the target architecture.

Single-precision `add`, `sub`, `mul`, and `mad` support saturation of results to the range [0.0, 1.0], with NaNs being flushed to positive zero. NaN payloads are supported for double-precision instructions (except for `rcp.approx.ftz.f64` and `rsqrt.approx.ftz.f64`, which maps input NaNs to a canonical NaN). Single-precision instructions return an unspecified NaN. Note that future implementations may support NaN payloads for single-precision instructions, so PTX programs should not rely on the specific single-precision NaNs being generated.

Table 29 summarizes floating-point instructions in PTX.

**Table 29** Summary of Floating-Point Instructions

| Instruction | `.rn` | `.rz` | `.rm` | `.rp` | `.ftz` | `.sat` | Notes |
|---|---|---|---|---|---|---|---|
| `{add,sub,mul}.rnd.f32` | x | x | x | x | x | x | If no rounding modifier is specified, default is `.rn` and instructions may be folded into a multiply-add. |
| `{add,sub,mul}.rnd.f64` | x | x | x | x | n/a | n/a | If no rounding modifier is specified, default is `.rn` and instructions may be folded into a multiply-add. |
| `mad.f32` | n/a | n/a | n/a | n/a | x | x | `.target sm_1x` No rounding modifier. |
| `{mad,fma}.rnd.f32` | x | x | x | x | x | x | `.target sm_20` or higher. `mad.f32` and `fma.f32` are the same. |
| `{mad,fma}.rnd.f64` | x | x | x | x | n/a | n/a | `mad.f64` and `fma.f64` are the same. |
| `div.full.f32` | n/a | n/a | n/a | n/a | x | n/a | No rounding modifier. |
| `{div,rcp,sqrt}.approx.f32` | n/a | n/a | n/a | n/a | x | n/a | n/a |
| `rcp.approx.ftz.f64` | n/a | n/a | n/a | n/a | x | n/a | `.target sm_20` or higher |
| `{div,rcp,sqrt}.rnd.f32` | x | x | x | x | x | n/a | `.target sm_20` or higher |
| `{div,rcp,sqrt}.rnd.f64` | x | x | x | x | n/a | n/a | `.target sm_20` or higher |
| `{abs,neg,min,max}.f32` | n/a | n/a | n/a | n/a | x | n/a | |
| `{abs,neg,min,max}.f64` | n/a | n/a | n/a | n/a | n/a | n/a | |
| `rsqrt.approx.f32` | n/a | n/a | n/a | n/a | x | n/a | |
| `rsqrt.approx.f64` | n/a | n/a | n/a | n/a | n/a | n/a | |
| `rsqrt.approx.ftz.f64` | n/a | n/a | n/a | n/a | x | n/a | `.target sm_20` or higher |
| `{sin,cos,lg2,ex2}.approx.f32` | n/a | n/a | n/a | n/a | x | n/a | |
| `tanh.approx.f32` | n/a | n/a | n/a | n/a | n/a | n/a | `.target sm_75` or higher |

## Pages

- [testp](testp.md) — Test floating-point property.
- [copysign](copysign.md) — Copy sign of one input to another.
- [add](add.md) — Add two values.
- [sub](sub.md) — Subtract one value from another.
- [mul](mul.md) — Multiply two values.
- [fma](fma.md) — Fused multiply-add.
- [mad](mad.md) — Multiply two values and add a third value.
- [div](div.md) — Divide one value by another.
- [abs](abs.md) — Absolute value.
- [neg](neg.md) — Arithmetic negate.
- [min](min.md) — Find the minimum of two values.
- [max](max.md) — Find the maximum of two values.
- [rcp](rcp.md) — Take the reciprocal of a value.
- [rcp.approx.ftz.f64](rcp-approx-ftz-f64.md) — Compute a fast, gross approximation to the reciprocal of a double-precision value.
- [sqrt](sqrt.md) — Take the square root of a value.
- [rsqrt](rsqrt.md) — Take the reciprocal of the square root of a value.
- [rsqrt.approx.ftz.f64](rsqrt-approx-ftz-f64.md) — Compute an approximation of the reciprocal square root of a double-precision value.
- [sin](sin.md) — Find the sine of a value.
- [cos](cos.md) — Find the cosine of a value.
- [lg2](lg2.md) — Find the base-2 logarithm of a value.
- [ex2](ex2.md) — Find the base-2 exponential of a value.
- [tanh](tanh.md) — Find the hyperbolic tangent of a value.

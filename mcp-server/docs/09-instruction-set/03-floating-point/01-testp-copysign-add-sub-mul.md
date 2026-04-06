# 9.7.3. Floating-Point Instructions

Floating-point instructions operate on `.f32` and `.f64` register operands and constant immediate values. The floating-point instructions are:

- testp
- copysign
- add
- sub
- mul
- fma
- mad
- div
- abs
- neg
- min
- max
- rcp
- sqrt
- rsqrt
- sin
- cos
- lg2
- ex2
- tanh

Instructions that support rounding modifiers are IEEE-754 compliant. Double-precision instructions support subnormal inputs and results. Single-precision instructions support subnormal inputs and results by default for sm_20 and subsequent targets, and flush subnormal inputs and results to sign-preserving zero for sm_1x targets. The optional `.ftz` modifier on single-precision instructions provides backward compatibility with sm_1x targets by flushing subnormal inputs and results to sign-preserving zero regardless of the target architecture.

Single-precision `add`, `sub`, `mul`, and `mad` support saturation of results to the range [0.0, 1.0], with NaNs being flushed to positive zero. NaN payloads are supported for double-precision instructions (except for `rcp.approx.ftz.f64` and `rsqrt.approx.ftz.f64`, which maps input NaNs to a canonical NaN). Single-precision instructions return an unspecified NaN. Note that future implementations may support NaN payloads for single-precision instructions, so PTX programs should not rely on the specific single-precision NaNs being generated.

Table 29 summarizes floating-point instructions in PTX.

**Table 29. Summary of Floating-Point Instructions**

| Instruction                      | .rn | .rz | .rm | .rp | .ftz | .sat | Notes |
|----------------------------------|-----|-----|-----|-----|------|------|-------|
| {add,sub,mul}.rnd.f32            | x   | x   | x   | x   | x    | x    | If no rounding modifier is specified, default is .rn and instructions may be folded into a multiply-add. |
| {add,sub,mul}.rnd.f64            | x   | x   | x   | x   | n/a  | n/a  | If no rounding modifier is specified, default is .rn and instructions may be folded into a multiply-add. |
| mad.f32                          | n/a | n/a | n/a | n/a | x    | x    | .target sm_1x. No rounding modifier. |
| {mad,fma}.rnd.f32                | x   | x   | x   | x   | x    | x    | .target sm_20 or higher. mad.f32 and fma.f32 are the same. |
| {mad,fma}.rnd.f64                | x   | x   | x   | x   | n/a  | n/a  | mad.f64 and fma.f64 are the same. |
| div.full.f32                     | n/a | n/a | n/a | n/a | x    | n/a  | No rounding modifier. |
| {div,rcp,sqrt}.approx.f32        | n/a | n/a | n/a | n/a | x    | n/a  | |
| rcp.approx.ftz.f64               | n/a | n/a | n/a | n/a | x    | n/a  | .target sm_20 or higher |
| {div,rcp,sqrt}.rnd.f32           | x   | x   | x   | x   | x    | n/a  | .target sm_20 or higher |
| {div,rcp,sqrt}.rnd.f64           | x   | x   | x   | x   | n/a  | n/a  | .target sm_20 or higher |
| {abs,neg,min,max}.f32            | n/a | n/a | n/a | n/a | x    | n/a  | |
| {abs,neg,min,max}.f64            | n/a | n/a | n/a | n/a | n/a  | n/a  | |
| rsqrt.approx.f32                 | n/a | n/a | n/a | n/a | x    | n/a  | |
| rsqrt.approx.f64                 | n/a | n/a | n/a | n/a | n/a  | n/a  | |
| rsqrt.approx.ftz.f64             | n/a | n/a | n/a | n/a | x    | n/a  | .target sm_20 or higher |
| {sin,cos,lg2,ex2}.approx.f32     | n/a | n/a | n/a | n/a | x    | n/a  | |
| tanh.approx.f32                  | n/a | n/a | n/a | n/a | n/a  | n/a  | .target sm_75 or higher |

## 9.7.3.1. Floating Point Instructions: testp

**testp**

Test floating-point property.

**Syntax**

```
testp.op.type  p, a;  // result is .pred

.op   = { .finite, .infinite,
          .number, .notanumber,
          .normal, .subnormal };
.type = { .f32, .f64 };
```

**Description**

`testp` tests common properties of floating-point numbers and returns a predicate value of 1 if True and 0 if False.

- `testp.finite` — True if the input is not infinite or NaN
- `testp.infinite` — True if the input is positive or negative infinity
- `testp.number` — True if the input is not NaN
- `testp.notanumber` — True if the input is NaN
- `testp.normal` — True if the input is a normal number (not NaN, not infinity)
- `testp.subnormal` — True if the input is a subnormal number (not NaN, not infinity)

As a special case, positive and negative zero are considered normal numbers.

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

Requires sm_20 or higher.

**Examples**

```ptx
testp.notanumber.f32  isnan, f0;
testp.infinite.f64    p, X;
```

## 9.7.3.2. Floating Point Instructions: copysign

**copysign**

Copy sign of one input to another.

**Syntax**

```
copysign.type  d, a, b;

.type = { .f32, .f64 };
```

**Description**

Copy sign bit of a into value of b, and return the result as d.

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

Requires sm_20 or higher.

**Examples**

```ptx
copysign.f32  x, y, z;
copysign.f64  A, B, C;
```

## 9.7.3.3. Floating Point Instructions: add

**add**

Add two values.

**Syntax**

```
add{.rnd}{.ftz}{.sat}.f32  d, a, b;
add{.rnd}{.ftz}.f32x2      d, a, b;
add{.rnd}.f64              d, a, b;

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Performs addition and writes the resulting value into a destination register.

For `.f32x2` instruction type, forms input vectors of single precision (`.f32`) values from source operands. Single precision (`.f32`) operands are then added in parallel to produce `.f32x2` result in destination.

For `.f32x2` instruction type, operands d, a and b have `.b64` type.

**Semantics**

```ptx
if (type == f32 || type == f64) {
    d = a + b;
} else if (type == f32x2) {
    fA[0] = a[0:31];
    fA[1] = a[32:63];
    fB[0] = b[0:31];
    fB[1] = b[32:63];
    for (i = 0; i < 2; i++) {
        d[i] = fA[i] + fB[i];
    }
}
```

**Notes**

Rounding modifiers:

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

The default value of rounding modifier is `.rn`. Note that an `add` instruction with an explicit rounding modifier is treated conservatively by the code optimizer. An `add` instruction with no rounding modifier defaults to round-to-nearest-even and may be optimized aggressively by the code optimizer. In particular, mul/add sequences with no rounding modifiers may be optimized to use fused-multiply-add instructions on the target device.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `add.ftz.f32`, `add.ftz.f32x2` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `add.f64` supports subnormal numbers. `add.f32` flushes subnormal inputs and results to sign-preserving zero.

Saturation modifier:

`add.sat.f32` clamps the result to [0.0, 1.0]. NaN results are flushed to +0.0f.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`add.f32x2` introduced in PTX ISA version 8.6.

**Target ISA Notes**

`add.f32` supported on all target architectures.

`add.f64` requires sm_13 or higher.

Rounding modifiers have the following target requirements:

- `.rn`, `.rz`: available for all targets
- `.rm`, `.rp` for `add.f64`: requires sm_13 or higher.
- `.rm`, `.rp` for `add.f32`: requires sm_20 or higher.

`add.f32x2` requires sm_100 or higher.

**Examples**

```ptx
@p  add.rz.ftz.f32  f1,f2,f3;
add.rp.ftz.f32x2    d, a, b;
```

## 9.7.3.4. Floating Point Instructions: sub

**sub**

Subtract one value from another.

**Syntax**

```
sub{.rnd}{.ftz}{.sat}.f32  d, a, b;
sub{.rnd}{.ftz}.f32x2      d, a, b;
sub{.rnd}.f64              d, a, b;

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Performs subtraction and writes the resulting value into a destination register.

For `.f32x2` instruction type, forms input vectors of single precision (`.f32`) values from source operands. Single precision (`.f32`) operands are then subtracted in parallel to produce `.f32x2` result in destination.

For `.f32x2` instruction type, operands d, a and b have `.b64` type.

**Semantics**

```ptx
if (type == f32 || type == f64) {
    d = a - b;
} else if (type == f32x2) {
    fA[0] = a[0:31];
    fA[1] = a[32:63];
    fB[0] = b[0:31];
    fB[1] = b[32:63];
    for (i = 0; i < 2; i++) {
        d[i] = fA[i] - fB[i];
    }
}
```

**Notes**

Rounding modifiers:

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

The default value of rounding modifier is `.rn`. Note that a `sub` instruction with an explicit rounding modifier is treated conservatively by the code optimizer. A `sub` instruction with no rounding modifier defaults to round-to-nearest-even and may be optimized aggressively by the code optimizer. In particular, mul/sub sequences with no rounding modifiers may be optimized to use fused-multiply-add instructions on the target device.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `sub.ftz.f32`, `sub.ftz.f32x2` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `sub.f64` supports subnormal numbers. `sub.f32` flushes subnormal inputs and results to sign-preserving zero.

Saturation modifier:

`sub.sat.f32` clamps the result to [0.0, 1.0]. NaN results are flushed to +0.0f.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`sub.f32x2` introduced in PTX ISA version 8.6.

**Target ISA Notes**

`sub.f32` supported on all target architectures.

`sub.f64` requires sm_13 or higher.

Rounding modifiers have the following target requirements:

- `.rn`, `.rz`: available for all targets
- `.rm`, `.rp` for `sub.f64`: requires sm_13 or higher.
- `.rm`, `.rp` for `sub.f32`: requires sm_20 or higher.

`sub.f32x2` requires sm_100 or higher.

**Examples**

```ptx
sub.f32 c,a,b;
sub.rn.ftz.f32  f1,f2,f3;
```

## 9.7.3.5. Floating Point Instructions: mul

**mul**

Multiply two values.

**Syntax**

```
mul{.rnd}{.ftz}{.sat}.f32  d, a, b;
mul{.rnd}{.ftz}.f32x2      d, a, b;
mul{.rnd}.f64              d, a, b;

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Compute the product of two values.

For `.f32x2` instruction type, forms input vectors of single precision (`.f32`) values from source operands. Single precision (`.f32`) operands are then multiplied in parallel to produce `.f32x2` result in destination.

For `.f32x2` instruction type, operands d, a and b have `.b64` type.

**Semantics**

```ptx
if (type == f32 || type == f64) {
    d = a * b;
} else if (type == f32x2) {
    fA[0] = a[0:31];
    fA[1] = a[32:63];
    fB[0] = b[0:31];
    fB[1] = b[32:63];
    for (i = 0; i < 2; i++) {
        d[i] = fA[i] * fB[i];
    }
}
```

**Notes**

For floating-point multiplication, all operands must be the same size.

Rounding modifiers:

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

The default value of rounding modifier is `.rn`. Note that a `mul` instruction with an explicit rounding modifier is treated conservatively by the code optimizer. A `mul` instruction with no rounding modifier defaults to round-to-nearest-even and may be optimized aggressively by the code optimizer. In particular, mul/add and mul/sub sequences with no rounding modifiers may be optimized to use fused-multiply-add instructions on the target device.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `mul.ftz.f32`, `mul.ftz.f32x2` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `mul.f64` supports subnormal numbers. `mul.f32` flushes subnormal inputs and results to sign-preserving zero.

Saturation modifier:

`mul.sat.f32` clamps the result to [0.0, 1.0]. NaN results are flushed to +0.0f.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`mul.f32x2` introduced in PTX ISA version 8.6.

**Target ISA Notes**

`mul.f32` supported on all target architectures.

`mul.f64` requires sm_13 or higher.

Rounding modifiers have the following target requirements:

- `.rn`, `.rz`: available for all targets
- `.rm`, `.rp` for `mul.f64`: requires sm_13 or higher.
- `.rm`, `.rp` for `mul.f32`: requires sm_20 or higher.

`mul.f32x2` requires sm_100 or higher.

**Examples**

```ptx
mul.ftz.f32 circumf,radius,pi  // a single-precision multiply
```

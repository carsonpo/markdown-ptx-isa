## 9.7.3.11. Floating Point Instructions: min

**min**

Find the minimum of given values.

**Syntax**

```
min{.ftz}{.NaN}{.xorsign.abs}.f32  d, a, b;
min{.ftz}{.NaN}{.abs}.f32          d, a, b, c;
min.f64                            d, a, b;
```

**Description**

Store the minimum of a, b and optionally c in d.

If `.NaN` modifier is specified, then the result is canonical NaN if any of the inputs is NaN.

If `.abs` modifier is specified, the magnitude of destination operand d is the minimum of absolute values of both input arguments.

If `.xorsign` modifier is specified, the sign bit of destination d is equal to the XOR of the sign bits of both inputs a and b. The `.xorsign` qualifier cannot be specified for three inputs operation.

Qualifier `.xorsign` requires qualifier `.abs` to be specified. In such cases, `.xorsign` considers the sign bit of both inputs before applying `.abs` operation.

If the result of `min` is NaN then the `.xorsign` and `.abs` modifiers will be ignored.

**Semantics**

```ptx
def min_num (z, x, y) {
    if (isNaN(x) && isNaN(y))
        z = NaN;
    else if (isNaN(x))
        z = y;
    else if (isNaN(y))
        z = x;
    else
        // note: -0.0 < +0.0 here
        z = (x < y) ? x : y;
    return z;
}

def min_nan (z, x, y) {
    if (isNaN(x) || isNaN(y))
        z = NaN;
    else
        // note: -0.0 < +0.0 here
        z = (x < y) ? x : y;
    return z;
}

def two_inputs_min (z, x, y) {
    if (.NaN)
        z = min_nan(z, x, y);
    else
        z = min_num(z, x, y);
    return z;
}

if (.xorsign && !isPresent(c)) {
    xorsign = getSignBit(a) ^ getSignBit(b);
}
if (.abs) {
    a = |a|;
    b = |b|;
    if (isPresent(c)) {
        c = |c|;
    }
}

d = two_inputs_min(d, a, b)
if (isPresent(c)) {
    d = two_inputs_min(d, d, c)
}
if (.xorsign && !isPresent(c) && !isNaN(d)) {
    setSignBit(d, xorsign);
}
```

**Notes**

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `min.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `min.f64` supports subnormal numbers. `min.f32` flushes subnormal inputs and results to sign-preserving zero.

If values of both inputs are 0.0, then +0.0 > -0.0.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`min.NaN` introduced in PTX ISA version 7.0.

`min.xorsign.abs` introduced in PTX ISA version 7.2.

`min` with three input arguments introduced in PTX ISA version 8.8.

**Target ISA Notes**

`min.f32` supported on all target architectures.

`min.f64` requires sm_13 or higher.

`min.NaN` requires sm_80 or higher.

`min.xorsign.abs` requires sm_86 or higher.

`min` with three input arguments requires sm_100 or higher.

**Examples**

```ptx
@p  min.ftz.f32  z,z,x;
    min.f64      a,b,c;
    // fp32 min with .NaN
    min.NaN.f32  f0,f1,f2;
    // fp32 min with .xorsign.abs
    min.xorsign.abs.f32 Rd, Ra, Rb;
```

## 9.7.3.12. Floating Point Instructions: max

**max**

Find the maximum of given values.

**Syntax**

```
max{.ftz}{.NaN}{.xorsign.abs}.f32  d, a, b;
max{.ftz}{.NaN}{.abs}.f32          d, a, b, c;
max.f64                            d, a, b;
```

**Description**

Store the maximum of a, b and optionally c in d.

If `.NaN` modifier is specified, the result is canonical NaN if any of the inputs is NaN.

If `.abs` modifier is specified, the magnitude of destination operand d is the maximum of absolute values of the input arguments.

If `.xorsign` modifier is specified, the sign bit of destination d is equal to the XOR of the sign bits of the inputs: a and b. The `.xorsign` qualifier cannot be specified for three inputs operation.

Qualifier `.xorsign` requires qualifier `.abs` to be specified. In such cases, `.xorsign` considers the sign bit of both inputs before applying `.abs` operation.

If the result of `max` is NaN then the `.xorsign` and `.abs` modifiers will be ignored.

**Semantics**

```ptx
def max_num (z, x, y) {
    if (isNaN(x) && isNaN(y))
        z = NaN;
    else if (isNaN(x))
        z = y;
    else if (isNaN(y))
        z = x;
    else
        // note: +0.0 > -0.0 here
        z = (x > y) ? x : y;
    return z;
}

def max_nan (z, x, y) {
    if (isNaN(x) || isNaN(y))
        z = NaN;
    else
        // note: +0.0 > -0.0 here
        z = (x > y) ? x : y;
    return z;
}

def two_inputs_max (z, x, y) {
    if (.NaN)
        z = max_nan(z, x, y);
    else
        z = max_num(z, x, y);
    return z;
}

if (.xorsign && !isPresent(c)) {
    xorsign = getSignBit(a) ^ getSignBit(b);
}
if (.abs) {
    a = |a|;
    b = |b|;
    if (isPresent(c)) {
        c = |c|;
    }
}

d = two_inputs_max (d, a, b)
if (isPresent(c)) {
    d = two_inputs_max (d, d, c)
}

if (.xorsign && !isPresent(c) !isNaN(d)) {
    setSignBit(d, xorsign);
}
```

**Notes**

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `max.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `max.f64` supports subnormal numbers. `max.f32` flushes subnormal inputs and results to sign-preserving zero.

If values of both inputs are 0.0, then +0.0 > -0.0.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`max.NaN` introduced in PTX ISA version 7.0.

`max.xorsign.abs` introduced in PTX ISA version 7.2.

`max` with three input arguments introduced in PTX ISA version 8.8.

**Target ISA Notes**

`max.f32` supported on all target architectures.

`max.f64` requires sm_13 or higher.

`max.NaN` requires sm_80 or higher.

`max.xorsign.abs` requires sm_86 or higher.

`max` with three input arguments requires sm_100 or higher.

**Examples**

```ptx
max.ftz.f32  f0,f1,f2;
max.f64      a,b,c;
// fp32 max with .NaN
max.NaN.f32  f0,f1,f2;
// fp32 max with .xorsign.abs
max.xorsign.abs.f32 Rd, Ra, Rb;
```

## 9.7.3.13. Floating Point Instructions: rcp

**rcp**

Take the reciprocal of a value.

**Syntax**

```
rcp.approx{.ftz}.f32  d, a;  // fast, approximate reciprocal
rcp.rnd{.ftz}.f32     d, a;  // IEEE 754 compliant rounding
rcp.rnd.f64           d, a;  // IEEE 754 compliant rounding

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Compute 1/a, store result in d.

**Semantics**

```ptx
d = 1 / a;
```

**Notes**

Fast, approximate single-precision reciprocal:

`rcp.approx.f32` implements a fast approximation to reciprocal. The maximum ulp error is 1 across the full range of inputs.

| Input | Result |
|-------|--------|
| -Inf  | -0.0   |
| -0.0  | -Inf   |
| +0.0  | +Inf   |
| +Inf  | +0.0   |
| NaN   | NaN    |

Reciprocal with IEEE 754 compliant rounding:

Rounding modifiers (no default):

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `rcp.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `rcp.f64` supports subnormal numbers. `rcp.f32` flushes subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`rcp.f32` and `rcp.f64` introduced in PTX ISA version 1.0. `rcp.rn.f64` and explicit modifiers `.approx` and `.ftz` were introduced in PTX ISA version 1.4. General rounding modifiers were added in PTX ISA version 2.0.

For PTX ISA version 1.4 and later, one of `.approx` or `.rnd` is required.

For PTX ISA versions 1.0 through 1.3, `rcp.f32` defaults to `rcp.approx.ftz.f32`, and `rcp.f64` defaults to `rcp.rn.f64`.

**Target ISA Notes**

`rcp.approx.f32` supported on all target architectures.

`rcp.rnd.f32` requires sm_20 or higher.

`rcp.rn.f64` requires sm_13 or higher, or `.target map_f64_to_f32`.

`rcp.{rz,rm,rp}.f64` requires sm_20 or higher.

**Examples**

```ptx
rcp.approx.ftz.f32  ri,r;
rcp.rn.ftz.f32      xi,x;
rcp.rn.f64          xi,x;
```

## 9.7.3.14. Floating Point Instructions: rcp.approx.ftz.f64

**rcp.approx.ftz.f64**

Compute a fast, gross approximation to the reciprocal of a value.

**Syntax**

```
rcp.approx.ftz.f64  d, a;
```

**Description**

Compute a fast, gross approximation to the reciprocal as follows:

- extract the most-significant 32 bits of `.f64` operand a in 1.11.20 IEEE floating-point format (i.e., ignore the least-significant 32 bits of a),
- compute an approximate `.f64` reciprocal of this value using the most-significant 20 bits of the mantissa of operand a,
- place the resulting 32-bits in 1.11.20 IEEE floating-point format in the most-significant 32-bits of destination d, and
- zero the least significant 32 mantissa bits of `.f64` destination d.

**Semantics**

```ptx
tmp = a[63:32]; // upper word of a, 1.11.20 format
d[63:32] = 1.0 / tmp;
d[31:0] = 0x00000000;
```

**Notes**

`rcp.approx.ftz.f64` implements a fast, gross approximation to reciprocal.

| Input a[63:32] | Result d[63:32] |
|----------------|-----------------|
| -Inf           | -0.0            |
| -subnormal     | -Inf            |
| -0.0           | -Inf            |
| +0.0           | +Inf            |
| +subnormal     | +Inf            |
| +Inf           | +0.0            |
| NaN            | NaN             |

Input NaNs map to a canonical NaN with encoding `0x7fffffff00000000`.

Subnormal inputs and results are flushed to sign-preserving zero.

**PTX ISA Notes**

`rcp.approx.ftz.f64` introduced in PTX ISA version 2.1.

**Target ISA Notes**

`rcp.approx.ftz.f64` requires sm_20 or higher.

**Examples**

```ptx
rcp.approx.ftz.f64  xi,x;
```

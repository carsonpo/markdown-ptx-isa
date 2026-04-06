## 9.7.3.15. Floating Point Instructions: sqrt

**sqrt**

Take the square root of a value.

**Syntax**

```
sqrt.approx{.ftz}.f32  d, a; // fast, approximate square root
sqrt.rnd{.ftz}.f32     d, a; // IEEE 754 compliant rounding
sqrt.rnd.f64           d, a; // IEEE 754 compliant rounding

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Compute sqrt(a) and store the result in d.

**Semantics**

```ptx
d = sqrt(a);
```

**Notes**

`sqrt.approx.f32` implements a fast approximation to square root. The maximum relative error over the entire positive finite floating-point range is 2-23.

For various corner-case inputs, results of `sqrt` instruction are shown in below table:

| Input    | Result |
|----------|--------|
| -Inf     | NaN    |
| -normal  | NaN    |
| -0.0     | -0.0   |
| +0.0     | +0.0   |
| +Inf     | +Inf   |
| NaN      | NaN    |

Square root with IEEE 754 compliant rounding:

Rounding modifiers (no default):

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `sqrt.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `sqrt.f64` supports subnormal numbers. `sqrt.f32` flushes subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`sqrt.f32` and `sqrt.f64` introduced in PTX ISA version 1.0. `sqrt.rn.f64` and explicit modifiers `.approx` and `.ftz` were introduced in PTX ISA version 1.4. General rounding modifiers were added in PTX ISA version 2.0.

For PTX ISA version 1.4 and later, one of `.approx` or `.rnd` is required.

For PTX ISA versions 1.0 through 1.3, `sqrt.f32` defaults to `sqrt.approx.ftz.f32`, and `sqrt.f64` defaults to `sqrt.rn.f64`.

**Target ISA Notes**

`sqrt.approx.f32` supported on all target architectures.

`sqrt.rnd.f32` requires sm_20 or higher.

`sqrt.rn.f64` requires sm_13 or higher, or `.target map_f64_to_f32`.

`sqrt.{rz,rm,rp}.f64` requires sm_20 or higher.

**Examples**

```ptx
sqrt.approx.ftz.f32  r,x;
sqrt.rn.ftz.f32      r,x;
sqrt.rn.f64          r,x;
```

## 9.7.3.16. Floating Point Instructions: rsqrt

**rsqrt**

Take the reciprocal of the square root of a value.

**Syntax**

```
rsqrt.approx{.ftz}.f32  d, a;
rsqrt.approx.f64        d, a;
```

**Description**

Compute 1/sqrt(a) and store the result in d.

**Semantics**

```ptx
d = 1/sqrt(a);
```

**Notes**

`rsqrt.approx` implements an approximation to the reciprocal square root.

| Input    | Result |
|----------|--------|
| -Inf     | NaN    |
| -normal  | NaN    |
| -0.0     | -Inf   |
| +0.0     | +Inf   |
| +Inf     | +0.0   |
| NaN      | NaN    |

The maximum relative error for `rsqrt.f32` over the entire positive finite floating-point range is 2-22.9.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `rsqrt.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `rsqrt.f64` supports subnormal numbers. `rsqrt.f32` flushes subnormal inputs and results to sign-preserving zero.

Note that `rsqrt.approx.f64` is emulated in software and are relatively slow.

**PTX ISA Notes**

`rsqrt.f32` and `rsqrt.f64` were introduced in PTX ISA version 1.0. Explicit modifiers `.approx` and `.ftz` were introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, the `.approx` modifier is required.

For PTX ISA versions 1.0 through 1.3, `rsqrt.f32` defaults to `rsqrt.approx.ftz.f32`, and `rsqrt.f64` defaults to `rsqrt.approx.f64`.

**Target ISA Notes**

`rsqrt.f32` supported on all target architectures.

`rsqrt.f64` requires sm_13 or higher.

**Examples**

```ptx
rsqrt.approx.ftz.f32  isr, x;
rsqrt.approx.f64      ISR, X;
```

## 9.7.3.17. Floating Point Instructions: rsqrt.approx.ftz.f64

**rsqrt.approx.ftz.f64**

Compute an approximation of the square root reciprocal of a value.

**Syntax**

```
rsqrt.approx.ftz.f64 d, a;
```

**Description**

Compute a double-precision (`.f64`) approximation of the square root reciprocal of a value. The least significant 32 bits of the double-precision (`.f64`) destination d are all zeros.

**Semantics**

```ptx
tmp = a[63:32]; // upper word of a, 1.11.20 format
d[63:32] = 1.0 / sqrt(tmp);
d[31:0] = 0x00000000;
```

**Notes**

`rsqrt.approx.ftz.f64` implements a fast approximation of the square root reciprocal of a value.

| Input       | Result |
|-------------|--------|
| -Inf        | NaN    |
| -subnormal  | -Inf   |
| -0.0        | -Inf   |
| +0.0        | +Inf   |
| +subnormal  | +Inf   |
| +Inf        | +0.0   |
| NaN         | NaN    |

Input NaNs map to a canonical NaN with encoding `0x7fffffff00000000`.

Subnormal inputs and results are flushed to sign-preserving zero.

**PTX ISA Notes**

`rsqrt.approx.ftz.f64` introduced in PTX ISA version 4.0.

**Target ISA Notes**

`rsqrt.approx.ftz.f64` requires sm_20 or higher.

**Examples**

```ptx
rsqrt.approx.ftz.f64 xi,x;
```

## 9.7.3.18. Floating Point Instructions: sin

**sin**

Find the sine of a value.

**Syntax**

```
sin.approx{.ftz}.f32  d, a;
```

**Description**

Find the sine of the angle a (in radians).

**Semantics**

```ptx
d = sin(a);
```

**Notes**

`sin.approx.f32` implements a fast approximation to sine.

| Input | Result |
|-------|--------|
| -Inf  | NaN    |
| -0.0  | -0.0   |
| +0.0  | +0.0   |
| +Inf  | NaN    |
| NaN   | NaN    |

The maximum absolute error over input range is as follows:

| Range              | Error    |
|--------------------|----------|
| [-2pi .. 2pi]      | 2-20.5   |
| [-100pi .. +100pi] | 2-14.7   |

Outside of the range [-100pi .. +100pi], only best effort is provided. There are no defined error guarantees.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `sin.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: Subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`sin.f32` introduced in PTX ISA version 1.0. Explicit modifiers `.approx` and `.ftz` introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, the `.approx` modifier is required.

For PTX ISA versions 1.0 through 1.3, `sin.f32` defaults to `sin.approx.ftz.f32`.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
sin.approx.ftz.f32  sa, a;
```

## 9.7.3.19. Floating Point Instructions: cos

**cos**

Find the cosine of a value.

**Syntax**

```
cos.approx{.ftz}.f32  d, a;
```

**Description**

Find the cosine of the angle a (in radians).

**Semantics**

```ptx
d = cos(a);
```

**Notes**

`cos.approx.f32` implements a fast approximation to cosine.

| Input | Result |
|-------|--------|
| -Inf  | NaN    |
| -0.0  | +1.0   |
| +0.0  | +1.0   |
| +Inf  | NaN    |
| NaN   | NaN    |

The maximum absolute error over input range is as follows:

| Range              | Error    |
|--------------------|----------|
| [-2pi .. 2pi]      | 2-20.5   |
| [-100pi .. +100pi] | 2-14.7   |

Outside of the range [-100pi .. +100pi], only best effort is provided. There are no defined error guarantees.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `cos.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: Subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`cos.f32` introduced in PTX ISA version 1.0. Explicit modifiers `.approx` and `.ftz` introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, the `.approx` modifier is required.

For PTX ISA versions 1.0 through 1.3, `cos.f32` defaults to `cos.approx.ftz.f32`.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
cos.approx.ftz.f32  ca, a;
```

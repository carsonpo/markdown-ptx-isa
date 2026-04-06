## 9.7.3.20. Floating Point Instructions: lg2

**lg2**

Find the base-2 logarithm of a value.

**Syntax**

```
lg2.approx{.ftz}.f32  d, a;
```

**Description**

Determine the log2 of a.

**Semantics**

```ptx
d = log(a) / log(2);
```

**Notes**

`lg2.approx.f32` implements a fast approximation to log2(a).

| Input    | Result |
|----------|--------|
| -Inf     | NaN    |
| -normal  | NaN    |
| -0.0     | -Inf   |
| +0.0     | -Inf   |
| +Inf     | +Inf   |
| NaN      | NaN    |

The maximum absolute error is 2-22 when the input operand is in the range (0.5, 2). For positive finite inputs outside of this interval, maximum relative error is 2-22.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `lg2.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: Subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`lg2.f32` introduced in PTX ISA version 1.0. Explicit modifiers `.approx` and `.ftz` introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, the `.approx` modifier is required.

For PTX ISA versions 1.0 through 1.3, `lg2.f32` defaults to `lg2.approx.ftz.f32`.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
lg2.approx.ftz.f32  la, a;
```

## 9.7.3.21. Floating Point Instructions: ex2

**ex2**

Find the base-2 exponential of a value.

**Syntax**

```
ex2.approx{.ftz}.f32  d, a;
```

**Description**

Raise 2 to the power a.

**Semantics**

```ptx
d = 2 ^ a;
```

**Notes**

`ex2.approx.f32` implements a fast approximation to 2a.

| Input | Result |
|-------|--------|
| -Inf  | +0.0   |
| -0.0  | +1.0   |
| +0.0  | +1.0   |
| +Inf  | +Inf   |
| NaN   | NaN    |

The maximum ulp error is 2 ulp from correctly rounded result across the full range of inputs.

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `ex2.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: Subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`ex2.f32` introduced in PTX ISA version 1.0. Explicit modifiers `.approx` and `.ftz` introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, the `.approx` modifier is required.

For PTX ISA versions 1.0 through 1.3, `ex2.f32` defaults to `ex2.approx.ftz.f32`.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
ex2.approx.ftz.f32  xa, a;
```

## 9.7.3.22. Floating Point Instructions: tanh

**tanh**

Find the hyperbolic tangent of a value (in radians).

**Syntax**

```
tanh.approx.f32 d, a;
```

**Description**

Take hyperbolic tangent value of a.

The operands d and a are of type `.f32`.

**Semantics**

```ptx
d = tanh(a);
```

**Notes**

`tanh.approx.f32` implements a fast approximation to FP32 hyperbolic-tangent.

Results of `tanh` for various corner-case inputs are as follows:

| Input | Result |
|-------|--------|
| -Inf  | -1.0   |
| -0.0  | -0.0   |
| +0.0  | +0.0   |
| +Inf  | 1.0    |
| NaN   | NaN    |

The maximum relative error over the entire floating point range is 2-11. The subnormal numbers are supported.

> **Note:** The subnormal inputs gets passed through to the output since the value of tanh(x) for small values of x is approximately the same as x.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

**Target ISA Notes**

Requires sm_75 or higher.

**Examples**

```ptx
tanh.approx.f32 ta, a;
```

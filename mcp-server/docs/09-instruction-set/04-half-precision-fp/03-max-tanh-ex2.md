## 9.7.4.8. Half Precision Floating Point Instructions: max

**max**

Find the maximum of two values.

**Syntax**

```
max{.ftz}{.NaN}{.xorsign.abs}.f16      d, a, b;
max{.ftz}{.NaN}{.xorsign.abs}.f16x2    d, a, b;
max{.NaN}{.xorsign.abs}.bf16           d, a, b;
max{.NaN}{.xorsign.abs}.bf16x2         d, a, b;
```

**Description**

Store the maximum of a and b in d.

For `.f16x2` and `.bf16x2` instruction types, input vectors are formed with half-word values from source operands. Half-word operands are then processed in parallel to store `.f16x2` or `.bf16x2` result in destination.

For `.f16` instruction type, operands d and a have `.f16` or `.b16` type. For `.f16x2` instruction type, operands d and a have `.f16x2` or `.b32` type. For `.bf16` instruction type, operands d and a have `.b16` type. For `.bf16x2` instruction type, operands d and a have `.b32` type.

If `.NaN` modifier is specified, the result is canonical NaN if either of the inputs is NaN.

If `.abs` modifier is specified, the magnitude of destination operand d is the maximum of absolute values of both the input arguments.

If `.xorsign` modifier is specified, the sign bit of destination d is equal to the XOR of the sign bits of both the inputs.

Modifiers `.abs` and `.xorsign` must be specified together and `.xorsign` considers the sign bit of both inputs before applying `.abs` operation.

If the result of `max` is NaN then the `.xorsign` and `.abs` modifiers will be ignored.

**Semantics**

```ptx
if (type == f16 || type == bf16) {
    if (.xorsign) {
        xorsign = getSignBit(a) ^ getSignBit(b);
        if (.abs) {
            a = |a|;
            b = |b|;
        }
    }
    if (isNaN(a) && isNaN(b))              d = NaN;
    if (.NaN && (isNaN(a) || isNaN(b)))    d = NaN;
    else if (isNaN(a))                     d = b;
    else if (isNaN(b))                     d = a;
    else                                   d = (a > b) ? a : b;
    if (.xorsign && !isNaN(d)) {
         setSignBit(d, xorsign);
    }
} else if (type == f16x2 || type == bf16x2) {
    fA[0] = a[0:15];
    fA[1] = a[16:31];
    fB[0] = b[0:15];
    fB[1] = b[16:31];
    for (i = 0; i < 2; i++) {
        if (.xorsign) {
            xorsign = getSignBit(fA[i]) ^ getSignBit(fB[i]);
            if (.abs) {
                fA[i] = |fA[i]|;
                fB[i] = |fB[i]|;
            }
        }
        if (isNaN(fA[i]) && isNaN(fB[i]))              d[i] = NaN;
        if (.NaN && (isNaN(fA[i]) || isNaN(fB[i])))    d[i] = NaN;
        else if (isNaN(fA[i]))                         d[i] = fB[i];
        else if (isNaN(fB[i]))                         d[i] = fA[i];
        else                                           d[i] = (fA[i] > fB[i]) ? fA[i] : fB[i];
        if (.xorsign && !isNaN(fA[i])) {
            setSignBit(d[i], xorsign);
        }
    }
}
```

**Notes**

Subnormal numbers: By default, subnormal numbers are supported. `max.ftz.{f16, f16x2}` flushes subnormal inputs and results to sign-preserving zero.

If values of both inputs are 0.0, then +0.0 > -0.0.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

`max.xorsign.abs` introduced in PTX ISA version 7.2.

**Target ISA Notes**

Requires sm_80 or higher.

`max.xorsign.abs` support requires sm_86 or higher.

**Examples**

```ptx
max.ftz.f16       h0,h1,h2;
max.f16x2         b0,b1,b2;
// SIMD fp16 max with NaN
max.NaN.f16x2     b0,b1,b2;
// scalar f16 max with xorsign.abs
max.xorsign.abs.f16 Rd, Ra, Rb;
max.bf16          h0, h1, h2;
// scalar bf16 max and NaN
max.NaN.bf16x2    b0, b1, b2;
// SIMD bf16 max with xorsign.abs
max.xorsign.abs.bf16x2 Rd, Ra, Rb;
```

## 9.7.4.9. Half Precision Floating Point Instructions: tanh

**tanh**

Find the hyperbolic tangent of a value (in radians).

**Syntax**

```
tanh.approx.type d, a;

.type = {.f16, .f16x2, .bf16, .bf16x2}
```

**Description**

Take hyperbolic tangent value of a.

The type of operands d and a are as specified by `.type`.

For `.f16x2` or `.bf16x2` instruction type, each of the half-word operands are operated in parallel and the results are packed appropriately into a `.f16x2` or `.bf16x2`.

**Semantics**

```ptx
if (.type == .f16 || .type == .bf16) {
  d = tanh(a)
} else if (.type == .f16x2 || .type == .bf16x2) {
  fA[0] = a[0:15];
  fA[1] = a[16:31];
  d[0] = tanh(fA[0])
  d[1] = tanh(fA[1])
}
```

**Notes**

`tanh.approx.{f16, f16x2, bf16, bf16x2}` implements an approximate hyperbolic tangent in the target format.

Results of `tanh` for various corner-case inputs are as follows:

| Input | Result |
|-------|--------|
| -Inf  | -1.0   |
| -0.0  | -0.0   |
| +0.0  | +0.0   |
| +Inf  | 1.0    |
| NaN   | NaN    |

The maximum absolute error for `.f16` type is 2-10.987. The maximum absolute error for `.bf16` type is 2-8.

The subnormal numbers are supported.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

`tanh.approx.{bf16/bf16x2}` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_75 or higher.

`tanh.approx.{bf16/bf16x2}` requires sm_90 or higher.

**Examples**

```ptx
tanh.approx.f16    h1, h0;
tanh.approx.f16x2  hd1, hd0;
tanh.approx.bf16   b1, b0;
tanh.approx.bf16x2 hb1, hb0;
```

## 9.7.4.10. Half Precision Floating Point Instructions: ex2

**ex2**

Find the base-2 exponent of input.

**Syntax**

```
ex2.approx.atype     d, a;
ex2.approx.ftz.btype d, a;

.atype = { .f16,  .f16x2}
.btype = { .bf16, .bf16x2}
```

**Description**

Raise 2 to the power a.

The type of operands d and a are as specified by `.type`.

For `.f16x2` or `.bf16x2` instruction type, each of the half-word operands are operated in parallel and the results are packed appropriately into a `.f16x2` or `.bf16x2`.

**Semantics**

```ptx
if (.type == .f16 || .type == .bf16) {
  d = 2 ^ a
} else if (.type == .f16x2 || .type == .bf16x2) {
  fA[0] = a[0:15];
  fA[1] = a[16:31];
  d[0] = 2 ^ fA[0]
  d[1] = 2 ^ fA[1]
}
```

**Notes**

`ex2.approx.{f16, f16x2, bf16, bf16x2}` implement a fast approximation to 2a.

For the `.f16` type, subnormal inputs are supported. `ex2.approx.ftz.bf16` flushes subnormal inputs and results to sign-preserving zero.

Results of `ex2.approx.ftz.bf16` for various corner-case inputs are as follows:

| Input       | Result |
|-------------|--------|
| -Inf        | +0.0   |
| -subnormal  | +1.0   |
| -0.0        | +1.0   |
| +0.0        | +1.0   |
| +subnormal  | +1.0   |
| +Inf        | +Inf   |
| NaN         | NaN    |

Results of `ex2.approx.f16` for various corner-case inputs are as follows:

| Input | Result |
|-------|--------|
| -Inf  | +0.0   |
| -0.0  | +1.0   |
| +0.0  | +1.0   |
| +Inf  | +Inf   |
| NaN   | NaN    |

The maximum relative error for `.f16` type is 2-9.9. The maximum relative error for `.bf16` type is 2-7.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

`ex2.approx.ftz.{bf16/bf16x2}` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_75 or higher.

`ex2.approx.ftz.{bf16/bf16x2}` requires sm_90 or higher.

**Examples**

```ptx
ex2.approx.f16         h1, h0;
ex2.approx.f16x2       hd1, hd0;
ex2.approx.ftz.bf16    b1, b2;
ex2.approx.ftz.bf16x2  hb1, hb2;
```

## 9.7.3.6. Floating Point Instructions: fma

**fma**

Fused multiply-add.

**Syntax**

```
fma.rnd{.ftz}{.sat}.f32  d, a, b, c;
fma.rnd{.ftz}.f32x2      d, a, b, c;
fma.rnd.f64              d, a, b, c;

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Performs a fused multiply-add with no loss of precision in the intermediate product and addition.

For `.f32x2` instruction type, forms input vectors of single precision (`.f32`) values from source operands. Single precision (`.f32`) operands are then operated in parallel to produce `.f32x2` result in destination.

For `.f32x2` instruction type, operands d, a, b and c have `.b64` type.

**Semantics**

```ptx
if (type == f32 || type == f64) {
    d = a * b + c;
} else if (type == f32x2) {
    fA[0] = a[0:31];
    fA[1] = a[32:63];
    fB[0] = b[0:31];
    fB[1] = b[32:63];
    fC[0] = c[0:31];
    fC[1] = c[32:63];
    for (i = 0; i < 2; i++) {
        d[i] = fA[i] * fB[i] + fC[i];
    }
}
```

**Notes**

`fma.f32` computes the product of a and b to infinite precision and then adds c to this product, again in infinite precision. The resulting value is then rounded to single precision using the rounding mode specified by `.rnd`.

`fma.f64` computes the product of a and b to infinite precision and then adds c to this product, again in infinite precision. The resulting value is then rounded to double precision using the rounding mode specified by `.rnd`.

`fma.f64` is the same as `mad.f64`.

Rounding modifiers (no default):

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `fma.ftz.f32`, `fma.ftz.f32x2` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `fma.f64` supports subnormal numbers. `fma.f32` is unimplemented for sm_1x targets.

Saturation:

`fma.sat.f32` clamps the result to [0.0, 1.0]. NaN results are flushed to +0.0f.

**PTX ISA Notes**

`fma.f64` introduced in PTX ISA version 1.4.

`fma.f32` introduced in PTX ISA version 2.0.

`fma.f32x2` introduced in PTX ISA version 8.6.

**Target ISA Notes**

`fma.f32` requires sm_20 or higher.

`fma.f64` requires sm_13 or higher.

`fma.f32x2` requires sm_100 or higher.

**Examples**

```ptx
    fma.rn.ftz.f32  w,x,y,z;
@p  fma.rn.f64      d,a,b,c;
    fma.rp.ftz.f32x2 p,q,r,s;
```

## 9.7.3.7. Floating Point Instructions: mad

**mad**

Multiply two values and add a third value.

**Syntax**

```
mad{.ftz}{.sat}.f32      d, a, b, c;    // .target sm_1x
mad.rnd{.ftz}{.sat}.f32  d, a, b, c;    // .target sm_20
mad.rnd.f64              d, a, b, c;    // .target sm_13 and higher

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Multiplies two values and adds a third, and then writes the resulting value into a destination register.

**Semantics**

```ptx
d = a*b + c;
```

**Notes**

For `.target sm_20` and higher:

`mad.f32` computes the product of a and b to infinite precision and then adds c to this product, again in infinite precision. The resulting value is then rounded to single precision using the rounding mode specified by `.rnd`.

`mad.f64` computes the product of a and b to infinite precision and then adds c to this product, again in infinite precision. The resulting value is then rounded to double precision using the rounding mode specified by `.rnd`.

`mad.{f32,f64}` is the same as `fma.{f32,f64}`.

For `.target sm_1x`:

`mad.f32` computes the product of a and b at double precision, and then the mantissa is truncated to 23 bits, but the exponent is preserved. Note that this is different from computing the product with `mul`, where the mantissa can be rounded and the exponent will be clamped. The exception for `mad.f32` is when c = +/-0.0, `mad.f32` is identical to the result computed using separate `mul` and `add` instructions. When JIT-compiled for SM 2.0 devices, `mad.f32` is implemented as a fused multiply-add (i.e., `fma.rn.ftz.f32`). In this case, `mad.f32` can produce slightly different numeric results and backward compatibility is not guaranteed in this case.

`mad.f64` computes the product of a and b to infinite precision and then adds c to this product, again in infinite precision. The resulting value is then rounded to double precision using the rounding mode specified by `.rnd`. Unlike `mad.f32`, the treatment of subnormal inputs and output follows IEEE 754 standard.

`mad.f64` is the same as `fma.f64`.

Rounding modifiers (no default):

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `mad.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `mad.f64` supports subnormal numbers. `mad.f32` flushes subnormal inputs and results to sign-preserving zero.

Saturation modifier:

`mad.sat.f32` clamps the result to [0.0, 1.0]. NaN results are flushed to +0.0f.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

In PTX ISA versions 1.4 and later, a rounding modifier is required for `mad.f64`.

Legacy `mad.f64` instructions having no rounding modifier will map to `mad.rn.f64`.

In PTX ISA versions 2.0 and later, a rounding modifier is required for `mad.f32` for sm_20 and higher targets.

**Errata**

`mad.f32` requires a rounding modifier for sm_20 and higher targets. However for PTX ISA version 3.0 and earlier, ptxas does not enforce this requirement and `mad.f32` silently defaults to `mad.rn.f32`. For PTX ISA version 3.1, ptxas generates a warning and defaults to `mad.rn.f32`, and in subsequent releases ptxas will enforce the requirement for PTX ISA version 3.2 and later.

**Target ISA Notes**

`mad.f32` supported on all target architectures.

`mad.f64` requires sm_13 or higher.

Rounding modifiers have the following target requirements:

- `.rn`, `.rz`, `.rm`, `.rp` for `mad.f64`: requires sm_13 or higher.
- `.rn`, `.rz`, `.rm`, `.rp` for `mad.f32`: requires sm_20 or higher.

**Examples**

```ptx
@p  mad.f32  d,a,b,c;
```

## 9.7.3.8. Floating Point Instructions: div

**div**

Divide one value by another.

**Syntax**

```
div.approx{.ftz}.f32  d, a, b;  // fast, approximate divide
div.full{.ftz}.f32    d, a, b;  // full-range approximate divide
div.rnd{.ftz}.f32     d, a, b;  // IEEE 754 compliant rounding
div.rnd.f64           d, a, b;  // IEEE 754 compliant rounding

.rnd = { .rn, .rz, .rm, .rp };
```

**Description**

Divides a by b, stores result in d.

**Semantics**

```ptx
d = a / b;
```

**Notes**

Fast, approximate single-precision divides:

`div.approx.f32` implements a fast approximation to divide, computed as `d = a * (1/b)`. For |b| in [2-126, 2126], the maximum ulp error is 2. For 2126 < |b| < 2128, if a is infinity, `div.approx.f32` returns NaN, otherwise it returns a sign-preserving zero.

`div.full.f32` implements a relatively fast, full-range approximation that scales operands to achieve better accuracy, but is not fully IEEE 754 compliant and does not support rounding modifiers. The maximum ulp error is 2 across the full range of inputs.

Divide with IEEE 754 compliant rounding:

Rounding modifiers (no default):

- `.rn` — mantissa LSB rounds to nearest even
- `.rz` — mantissa LSB rounds towards zero
- `.rm` — mantissa LSB rounds towards negative infinity
- `.rp` — mantissa LSB rounds towards positive infinity

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `div.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `div.f64` supports subnormal numbers. `div.f32` flushes subnormal inputs and results to sign-preserving zero.

**PTX ISA Notes**

`div.f32` and `div.f64` introduced in PTX ISA version 1.0.

Explicit modifiers `.approx`, `.full`, `.ftz`, and rounding introduced in PTX ISA version 1.4.

For PTX ISA version 1.4 and later, one of `.approx`, `.full`, or `.rnd` is required.

For PTX ISA versions 1.0 through 1.3, `div.f32` defaults to `div.approx.ftz.f32`, and `div.f64` defaults to `div.rn.f64`.

**Target ISA Notes**

`div.approx.f32` and `div.full.f32` supported on all target architectures.

`div.rnd.f32` requires sm_20 or higher.

`div.rn.f64` requires sm_13 or higher, or `.target map_f64_to_f32`.

`div.{rz,rm,rp}.f64` requires sm_20 or higher.

**Examples**

```ptx
div.approx.ftz.f32  diam,circum,3.14159;
div.full.ftz.f32    x, y, z;
div.rn.f64          xd, yd, zd;
```

## 9.7.3.9. Floating Point Instructions: abs

**abs**

Absolute value.

**Syntax**

```
abs{.ftz}.f32  d, a;
abs.f64        d, a;
```

**Description**

Take the absolute value of a and store the result in d.

**Semantics**

```ptx
d = |a|;
```

**Notes**

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `abs.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `abs.f64` supports subnormal numbers. `abs.f32` flushes subnormal inputs and results to sign-preserving zero.

For `abs.f32`, NaN input yields unspecified NaN. For `abs.f64`, NaN input is passed through unchanged. Future implementations may comply with the IEEE 754 standard by preserving payload and modifying only the sign bit.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

`abs.f32` supported on all target architectures.

`abs.f64` requires sm_13 or higher.

**Examples**

```ptx
abs.ftz.f32  x,f0;
```

## 9.7.3.10. Floating Point Instructions: neg

**neg**

Arithmetic negate.

**Syntax**

```
neg{.ftz}.f32  d, a;
neg.f64        d, a;
```

**Description**

Negate the sign of a and store the result in d.

**Semantics**

```ptx
d = -a;
```

**Notes**

Subnormal numbers:

- sm_20+: By default, subnormal numbers are supported. `neg.ftz.f32` flushes subnormal inputs and results to sign-preserving zero.
- sm_1x: `neg.f64` supports subnormal numbers. `neg.f32` flushes subnormal inputs and results to sign-preserving zero.

NaN inputs yield an unspecified NaN. Future implementations may comply with the IEEE 754 standard by preserving payload and modifying only the sign bit.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

`neg.f32` supported on all target architectures.

`neg.f64` requires sm_13 or higher.

**Examples**

```ptx
neg.ftz.f32  x,f0;
```

## 9.7.1.7. Integer Arithmetic Instructions: sad

**sad**

Sum of absolute differences.

**Syntax**

```
sad.type  d, a, b, c;

.type = { .u16, .u32, .u64,
          .s16, .s32, .s64 };
```

**Description**

Adds the absolute value of a-b to c and writes the resulting value into d.

**Semantics**

```ptx
d = c + ((a<b) ? b-a : a-b);
```

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
sad.s32  d,a,b,c;
sad.u32  d,a,b,d;  // running sum
```

## 9.7.1.8. Integer Arithmetic Instructions: div

**div**

Divide one value by another.

**Syntax**

```
div.type  d, a, b;

.type = { .u16, .u32, .u64,
          .s16, .s32, .s64 };
```

**Description**

Divides a by b, stores result in d.

**Semantics**

```ptx
d = a / b;
```

**Notes**

Division by zero yields an unspecified, machine-specific value.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
div.s32  b,n,i;
```

## 9.7.1.9. Integer Arithmetic Instructions: rem

**rem**

The remainder of integer division.

**Syntax**

```
rem.type  d, a, b;

.type = { .u16, .u32, .u64,
          .s16, .s32, .s64 };
```

**Description**

Divides a by b, store the remainder in d.

**Semantics**

```ptx
d = a % b;
```

**Notes**

The behavior for negative numbers is machine-dependent and depends on whether divide rounds towards zero or negative infinity.

Division by zero yields an unspecified, machine-specific value.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
rem.s32  x,x,8;    // x = x%8;
```

## 9.7.1.10. Integer Arithmetic Instructions: abs

**abs**

Absolute value.

**Syntax**

```
abs.type  d, a;

.type = { .s16, .s32, .s64 };
```

**Description**

Take the absolute value of a and store it in d.

**Semantics**

```ptx
d = |a|;
```

**Notes**

Only for signed integers.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
abs.s32  r0,a;
```

## 9.7.1.11. Integer Arithmetic Instructions: neg

**neg**

Arithmetic negate.

**Syntax**

```
neg.type  d, a;

.type = { .s8x4, .s16, .s32, .s64 };
```

**Description**

Negate the sign of a and store the result in d.

For `.s8x4` instruction types, forms input vectors by quarter word values from source operands. Quarter-word operands are then negated in parallel to produce `.s8x4` result in destination.

Operands d and a have the same type as the instruction type. For instruction type `.s8x4`, operands d and a have type `.b32`.

**Semantics**

```ptx
if (type == s8x4) {
    iA[0] = a[0:7];
    iA[1] = a[8:15];
    iA[2] = a[16:23];
    iA[3] = a[24:31];
    for (i = 0; i < 4; i++) {
         d[i] = -iA[i];
    }
} else {
    d = -a;
}
```

**Notes**

Only for signed integers.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`neg.s8x4` introduced in PTX ISA version 9.2.

**Target ISA Notes**

Supported on all target architectures.

`neg.s8x4` is supported on following family-specific architectures:

- sm_120f or higher in the same family

**Examples**

```ptx
neg.s32  r0,a;
neg.s8x4 p, q, r;
```

## 9.7.1.12. Integer Arithmetic Instructions: min

**min**

Find the minimum of two values.

**Syntax**

```
min.type1         d, a, b;
min{.relu}.type2  d, a, b;

.type1 = { .u16, .u32, .u64,
           .u16x2, .u8x4, .s16, .s64 };
.type2 = { .s16x2, .s32, .s8x4 };
```

**Description**

Store the minimum of a and b in d.

For `.u16x2`, `.s16x2` instruction types, forms input vectors by half word values from source operands. Half-word operands are then processed in parallel to produce `.u16x2`, `.s16x2` result in destination.

For `.u8x4`, `.s8x4` instruction types, input vectors are formed with quarter-word values from source operands. Quarter-word operands are then processed in parallel to store `.u8x4`, `.s8x4` result in destination.

Operands d, a and b have the same type as the instruction type. For instruction types `.u16x2`, `.s16x2`, `.u8x4`, `.s8x4`, operands d, a and b have type `.b32`.

**Semantics**

```ptx
if (type == u16x2 || type == s16x2) {
    iA[0] = a[0:15];
    iA[1] = a[16:31];
    iB[0] = b[0:15];
    iB[1] = b[16:31];
    for (i = 0; i < 2; i++) {
         d[i] = (iA[i] < iB[i]) ? iA[i] : iB[i];
    }
} else if (type == u8x4 || type == s8x4) {
    iA[0] = a[0:7];
    iA[1] = a[8:15];
    iA[2] = a[16:23];
    iA[3] = a[24:31];
    iB[0] = b[0:7];
    iB[1] = b[8:15];
    iB[2] = b[16:23];
    iB[3] = b[24:31];
    for (i = 0; i < 4; i++) {
         d[i] = (iA[i] < iB[i]) ? iA[i] : iB[i];
    }
} else {
    d = (a < b) ? a : b; // Integer (signed and unsigned)
}
```

**Notes**

Signed and unsigned differ.

Saturation modifier: `min.relu.{s8x4, s16x2, s32}` clamps the result to 0 if negative.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`min.u16x2`, `min{.relu}.s16x2` and `min.relu.s32` introduced in PTX ISA version 8.0.

`min.u8x4`, `min{.relu}.s8x4` introduced in PTX ISA version 9.2.

**Target ISA Notes**

Supported on all target architectures.

`min.u16x2`, `min{.relu}.s16x2` and `min.relu.s32` require sm_90 or higher.

`min.u8x4`, `min{.relu}.s8x4` are supported on following family-specific architectures:

- sm_120f or higher in the same family

**Examples**

```ptx
    min.s32  r0,a,b;
@p  min.u16  h,i,j;
    min.s16x2.relu u,v,w;
    min.u8x4 p, q, r;
```

## 9.7.1.13. Integer Arithmetic Instructions: max

**max**

Find the maximum of two values.

**Syntax**

```
max.type1         d, a, b;
max{.relu}.type2  d, a, b;

.type1 = { .u16, .u32, .u64,
           .u16x2, .u8x4, .s16, .s64 };
.type2 = { .s16x2, .s32, .s8x4 };
```

**Description**

Store the maximum of a and b in d.

For `.u16x2`, `.s16x2` instruction types, forms input vectors by half word values from source operands. Half-word operands are then processed in parallel to produce `.u16x2`, `.s16x2` result in destination.

For `.u8x4`, `.s8x4` instruction types, input vectors are formed with quarter-word values from source operands. Quarter-word operands are then processed in parallel to store `.u8x4`, `.s8x4` result in destination.

Operands d, a and b have the same type as the instruction type. For instruction types `.u16x2`, `.s16x2`, `.u8x4`, `.s8x4`, operands d, a and b have type `.b32`.

**Semantics**

```ptx
if (type == u16x2 || type == s16x2) {
    iA[0] = a[0:15];
    iA[1] = a[16:31];
    iB[0] = b[0:15];
    iB[1] = b[16:31];
    for (i = 0; i < 2; i++) {
         d[i] = (iA[i] > iB[i]) ? iA[i] : iB[i];
    }
} else if (type == u8x4 || type == s8x4) {
    iA[0] = a[0:7];
    iA[1] = a[8:15];
    iA[2] = a[16:23];
    iA[3] = a[24:31];
    iB[0] = b[0:7];
    iB[1] = b[8:15];
    iB[2] = b[16:23];
    iB[3] = b[24:31];
    for (i = 0; i < 4; i++) {
         d[i] = (iA[i] > iB[i]) ? iA[i] : iB[i];
    }
} else {
    d = (a > b) ? a : b; // Integer (signed and unsigned)
}
```

**Notes**

Signed and unsigned differ.

Saturation modifier: `max.relu.{s8x4, s16x2, s32}` clamps the result to 0 if negative.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`max.u16x2`, `max{.relu}.s16x2` and `max.relu.s32` introduced in PTX ISA version 8.0.

`max.u8x4`, `max{.relu}.s8x4` introduced in PTX ISA version 9.2.

**Target ISA Notes**

Supported on all target architectures.

`max.u16x2`, `max{.relu}.s16x2` and `max.relu.s32` require sm_90 or higher.

`max.u8x4`, `max{.relu}.s8x4` are supported on following family-specific architectures:

- sm_120f or higher in the same family

**Examples**

```ptx
max.u32  d,a,b;
max.s32  q,q,0;
max.relu.s16x2 t,t,u;
max.u8x4 p, q, r;
```

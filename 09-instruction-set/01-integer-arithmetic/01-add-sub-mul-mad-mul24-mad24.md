# 9.7.1. Integer Arithmetic Instructions

Integer arithmetic instructions operate on the integer types in register and constant immediate forms. The integer arithmetic instructions are:

- add
- sub
- mul
- mad
- mul24
- mad24
- sad
- div
- rem
- abs
- neg
- min
- max
- popc
- clz
- bfind
- fns
- brev
- bfe
- bfi
- bmsk
- szext
- dp4a
- dp2a

## 9.7.1.1. Integer Arithmetic Instructions: add

**add**

Add two values.

**Syntax**

```
add.type1        d, a, b;
add{.sat}.type2  d, a, b;

.type1 = { .u16, .u64,
           .s16, .s64 };

.type2 = { .u32, .u16x2, .u8x4,
           .s32, .s16x2, .s8x4 };
```

**Description**

Performs addition and writes the resulting value into a destination register.

For `.u16x2`, `.s16x2` instruction types, forms input vectors by half word values from source operands. Half-word operands are then added in parallel to produce `.u16x2`, `.s16x2` result in destination.

For `.u8x4`, `.s8x4` instruction types, forms input vectors by quarter word values from source operands. Quarter-word operands are then added in parallel to produce `.u8x4`, `.s8x4` result in destination.

Operands d, a and b have the same type as the instruction type. For instruction types `.u16x2`, `.s16x2`, `.u8x4`, `.s8x4`, operands d, a and b have type `.b32`.

**Semantics**

```ptx
if (type == u16x2 || type == s16x2) {
    iA[0] = a[0:15];
    iA[1] = a[16:31];
    iB[0] = b[0:15];
    iB[1] = b[16:31];
    for (i = 0; i < 2; i++) {
         d[i] = iA[i] + iB[i];
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
         d[i] = iA[i] + iB[i];
    }
} else {
    d = a + b;
}
```

**Notes**

Saturation modifier:

`.sat` limits result to MININT..MAXINT (no overflow) for the size and signedness of the operation. Applies only to `.u32`, `.s32`, `.u16x2`, `.s16x2`, `.u8x4`, `.s8x4` types.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`add.u16x2` and `add.s16x2` introduced in PTX ISA version 8.0.

`add{.sat}.u8x4`, `add{.sat}.s8x4`, `add.sat.u16x2`, `add.sat.s16x2` and `add.sat.u32` introduced in PTX ISA version 9.2.

**Target ISA Notes**

Supported on all target architectures.

`add.u16x2` and `add.s16x2` require sm_90 or higher.

`add{.sat}.u8x4`, `add{.sat}.s8x4`, `add.sat.u16x2`, `add.sat.s16x2` and `add.sat.u32` are supported on following family-specific architectures:

- sm_120f or higher in the same family

**Examples**

```ptx
@p  add.u32     x,y,z;
    add.sat.s32 c,c,1;
    add.u16x2   u,v,w;
    add.s8x4.sat p, q, r;
```

## 9.7.1.2. Integer Arithmetic Instructions: sub

**sub**

Subtract one value from another.

**Syntax**

```
sub.type1        d, a, b;
sub{.sat}.type2  d, a, b;

.type1 = { .u16, .u32, .u64,
           .s16, .s64 };

.type2 = { .s32, .u8x4, .s8x4 };
```

**Description**

Performs subtraction and writes the resulting value into a destination register.

For `.u8x4`, `.s8x4` instruction types, forms input vectors by quarter word values from source operands. Quarter-word operands are then subtracted in parallel to produce `.u8x4`, `.s8x4` result in destination.

For instruction types `.u8x4`, `.s8x4` operands d, a and b have type `.b32`.

**Semantics**

```ptx
if (type == u8x4 || type == s8x4) {
    iA[0] = a[0:7];
    iA[1] = a[8:15];
    iA[2] = a[16:23];
    iA[3] = a[24:31];
    iB[0] = b[0:7];
    iB[1] = b[8:15];
    iB[2] = b[16:23];
    iB[3] = b[24:31];
    for (i = 0; i < 4; i++) {
         d[i] = iA[i] - iB[i];
    }
} else {
    d = a - b;
}
```

**Notes**

Saturation modifier:

`.sat` limits result to MININT..MAXINT (no overflow) for the size and signedness of the operation. Applies only to `.s32`, `.u8x4`, `.s8x4` types.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

`sub.u8x4`, `sub.s8x4` introduced in PTX ISA version 9.2.

**Target ISA Notes**

Supported on all target architectures.

`sub.u8x4`, `sub.s8x4` are supported on following family-specific architectures:

- sm_120f or higher in the same family

**Examples**

```ptx
sub.s32 c,a,b;
sub.u8x4 p, q, r;
```

## 9.7.1.3. Integer Arithmetic Instructions: mul

**mul**

Multiply two values.

**Syntax**

```
mul.mode.type  d, a, b;

.mode = { .hi, .lo, .wide };
.type = { .u16, .u32, .u64,
          .s16, .s32, .s64 };
```

**Description**

Compute the product of two values.

**Semantics**

```ptx
t = a * b;
n = bitwidth of type;
d = t;            // for .wide
d = t<2n-1..n>;   // for .hi variant
d = t<n-1..0>;    // for .lo variant
```

**Notes**

The type of the operation represents the types of the a and b operands. If `.hi` or `.lo` is specified, then d is the same size as a and b, and either the upper or lower half of the result is written to the destination register. If `.wide` is specified, then d is twice as wide as a and b to receive the full result of the multiplication.

The `.wide` suffix is supported only for 16- and 32-bit integer types.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
mul.wide.s16 fa,fxs,fys;   // 16*16 bits yields 32 bits
mul.lo.s16 fa,fxs,fys;     // 16*16 bits, save only the low 16 bits
mul.wide.s32 z,x,y;        // 32*32 bits, creates 64 bit result
```

## 9.7.1.4. Integer Arithmetic Instructions: mad

**mad**

Multiply two values, optionally extract the high or low half of the intermediate result, and add a third value.

**Syntax**

```
mad.mode.type  d, a, b, c;
mad.hi.sat.s32 d, a, b, c;

.mode = { .hi, .lo, .wide };
.type = { .u16, .u32, .u64,
          .s16, .s32, .s64 };
```

**Description**

Multiplies two values, optionally extracts the high or low half of the intermediate result, and adds a third value. Writes the result into a destination register.

**Semantics**

```ptx
t = a * b;
n = bitwidth of type;
d = t + c;           // for .wide
d = t<2n-1..n> + c;  // for .hi variant
d = t<n-1..0> + c;   // for .lo variant
```

**Notes**

The type of the operation represents the types of the a and b operands. If `.hi` or `.lo` is specified, then d and c are the same size as a and b, and either the upper or lower half of the result is written to the destination register. If `.wide` is specified, then d and c are twice as wide as a and b to receive the result of the multiplication.

The `.wide` suffix is supported only for 16-bit and 32-bit integer types.

Saturation modifier:

`.sat` limits result to MININT..MAXINT (no overflow) for the size of the operation. Applies only to `.s32` type in `.hi` mode.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
@p  mad.lo.s32 d,a,b,c;
    mad.lo.s32 r,p,q,r;
```

## 9.7.1.5. Integer Arithmetic Instructions: mul24

**mul24**

Multiply two 24-bit integer values.

**Syntax**

```
mul24.mode.type  d, a, b;

.mode = { .hi, .lo };
.type = { .u32, .s32 };
```

**Description**

Compute the product of two 24-bit integer values held in 32-bit source registers, and return either the high or low 32-bits of the 48-bit result.

**Semantics**

```ptx
t = a * b;
d = t<47..16>;    // for .hi variant
d = t<31..0>;     // for .lo variant
```

**Notes**

Integer multiplication yields a result that is twice the size of the input operands, i.e., 48-bits.

`mul24.hi` performs a 24x24-bit multiply and returns the high 32 bits of the 48-bit result.

`mul24.lo` performs a 24x24-bit multiply and returns the low 32 bits of the 48-bit result.

All operands are of the same type and size.

`mul24.hi` may be less efficient on machines without hardware support for 24-bit multiply.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
mul24.lo.s32 d,a,b;   // low 32-bits of 24x24-bit signed multiply.
```

## 9.7.1.6. Integer Arithmetic Instructions: mad24

**mad24**

Multiply two 24-bit integer values and add a third value.

**Syntax**

```
mad24.mode.type  d, a, b, c;
mad24.hi.sat.s32 d, a, b, c;

.mode = { .hi, .lo };
.type = { .u32, .s32 };
```

**Description**

Compute the product of two 24-bit integer values held in 32-bit source registers, and add a third, 32-bit value to either the high or low 32-bits of the 48-bit result. Return either the high or low 32-bits of the 48-bit result.

**Semantics**

```ptx
t = a * b;
d = t<47..16> + c;   // for .hi variant
d = t<31..0> + c;    // for .lo variant
```

**Notes**

Integer multiplication yields a result that is twice the size of the input operands, i.e., 48-bits.

`mad24.hi` performs a 24x24-bit multiply and adds the high 32 bits of the 48-bit result to a third value.

`mad24.lo` performs a 24x24-bit multiply and adds the low 32 bits of the 48-bit result to a third value.

All operands are of the same type and size.

Saturation modifier:

`.sat` limits result of 32-bit signed addition to MININT..MAXINT (no overflow). Applies only to `.s32` type in `.hi` mode.

`mad24.hi` may be less efficient on machines without hardware support for 24-bit multiply.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
mad24.lo.s32 d,a,b,c;   // low 32-bits of 24x24-bit signed multiply.
```

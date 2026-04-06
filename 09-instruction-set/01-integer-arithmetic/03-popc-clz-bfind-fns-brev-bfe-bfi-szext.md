## 9.7.1.14. Integer Arithmetic Instructions: popc

**popc**

Population count.

**Syntax**

```
popc.type  d, a;

.type = { .b32, .b64 };
```

**Description**

Count the number of one bits in a and place the resulting population count in 32-bit destination register d. Operand a has the instruction type and destination d has type `.u32`.

**Semantics**

```ptx
.u32  d = 0;
while (a != 0) {
   if (a & 0x1)  d++;
   a = a >> 1;
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`popc` requires sm_20 or higher.

**Examples**

```ptx
popc.b32  d, a;
popc.b64  cnt, X;  // cnt is .u32
```

## 9.7.1.15. Integer Arithmetic Instructions: clz

**clz**

Count leading zeros.

**Syntax**

```
clz.type  d, a;

.type = { .b32, .b64 };
```

**Description**

Count the number of leading zeros in a starting with the most-significant bit and place the result in 32-bit destination register d. Operand a has the instruction type, and destination d has type `.u32`. For `.b32` type, the number of leading zeros is between 0 and 32, inclusively. For `.b64` type, the number of leading zeros is between 0 and 64, inclusively.

**Semantics**

```ptx
.u32  d = 0;
if (.type == .b32)   { max = 32; mask = 0x80000000; }
else                 { max = 64; mask = 0x8000000000000000; }

while (d < max && (a&mask == 0) ) {
    d++;
    a = a << 1;
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`clz` requires sm_20 or higher.

**Examples**

```ptx
clz.b32  d, a;
clz.b64  cnt, X;  // cnt is .u32
```

## 9.7.1.16. Integer Arithmetic Instructions: bfind

**bfind**

Find most significant non-sign bit.

**Syntax**

```
bfind.type           d, a;
bfind.shiftamt.type  d, a;

.type = { .u32, .u64,
          .s32, .s64 };
```

**Description**

Find the bit position of the most significant non-sign bit in a and place the result in d. Operand a has the instruction type, and destination d has type `.u32`. For unsigned integers, `bfind` returns the bit position of the most significant 1. For signed integers, `bfind` returns the bit position of the most significant 0 for negative inputs and the most significant 1 for non-negative inputs.

If `.shiftamt` is specified, `bfind` returns the shift amount needed to left-shift the found bit into the most-significant bit position.

`bfind` returns `0xffffffff` if no non-sign bit is found.

**Semantics**

```ptx
msb = (.type==.u32 || .type==.s32) ? 31 : 63;
// negate negative signed inputs
if ( (.type==.s32 || .type==.s64) && (a & (1<<msb)) ) {
    a = ~a;
}
.u32  d = 0xffffffff;
for (.s32 i=msb; i>=0; i--) {
    if (a & (1<<i))  { d = i; break; }
}
if (.shiftamt && d != 0xffffffff)  { d = msb - d; }
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`bfind` requires sm_20 or higher.

**Examples**

```ptx
bfind.u32  d, a;
bfind.shiftamt.s64  cnt, X;  // cnt is .u32
```

## 9.7.1.17. Integer Arithmetic Instructions: fns

**fns**

Find the n-th set bit.

**Syntax**

```
fns.b32 d, mask, base, offset;
```

**Description**

Given a 32-bit value `mask` and an integer value `base` (between 0 and 31), find the n-th (given by `offset`) set bit in `mask` from the base bit, and store the bit position in d. If not found, store `0xffffffff` in d.

Operand `mask` has a 32-bit type. Operand `base` has `.b32`, `.u32` or `.s32` type. Operand `offset` has `.s32` type. Destination d has type `.b32`.

Operand `base` must be <= 31, otherwise behavior is undefined.

**Semantics**

```ptx
d = 0xffffffff;
if (offset == 0) {
    if (mask[base] == 1) {
        d = base;
    }
} else {
    pos = base;
    count = |offset| - 1;
    inc = (offset > 0) ? 1 : -1;

    while ((pos >= 0) && (pos < 32)) {
        if (mask[pos] == 1) {
            if (count == 0) {
              d = pos;
              break;
           } else {
               count = count - 1;
           }
        }
        pos = pos + inc;
    }
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 6.0.

**Target ISA Notes**

`fns` requires sm_30 or higher.

**Examples**

```ptx
fns.b32 d, 0xaaaaaaaa, 3, 1;   // d = 3
fns.b32 d, 0xaaaaaaaa, 3, -1;  // d = 3
fns.b32 d, 0xaaaaaaaa, 2, 1;   // d = 3
fns.b32 d, 0xaaaaaaaa, 2, -1;  // d = 1
```

## 9.7.1.18. Integer Arithmetic Instructions: brev

**brev**

Bit reverse.

**Syntax**

```
brev.type  d, a;

.type = { .b32, .b64 };
```

**Description**

Perform bitwise reversal of input.

**Semantics**

```ptx
msb = (.type==.b32) ? 31 : 63;

for (i=0; i<=msb; i++) {
    d[i] = a[msb-i];
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`brev` requires sm_20 or higher.

**Examples**

```ptx
brev.b32  d, a;
```

## 9.7.1.19. Integer Arithmetic Instructions: bfe

**bfe**

Bit Field Extract.

**Syntax**

```
bfe.type  d, a, b, c;

.type = { .u32, .u64,
          .s32, .s64 };
```

**Description**

Extract bit field from a and place the zero or sign-extended result in d. Source b gives the bit field starting bit position, and source c gives the bit field length in bits.

Operands a and d have the same type as the instruction type. Operands b and c are type `.u32`, but are restricted to the 8-bit value range 0..255.

The sign bit of the extracted field is defined as:

- `.u32`, `.u64`: zero
- `.s32`, `.s64`: msb of input a if the extracted field extends beyond the msb of a; msb of extracted field, otherwise

If the bit field length is zero, the result is zero.

The destination d is padded with the sign bit of the extracted field. If the start position is beyond the msb of the input, the destination d is filled with the replicated sign bit of the extracted field.

**Semantics**

```ptx
msb = (.type==.u32 || .type==.s32) ? 31 : 63;
pos = b & 0xff;  // pos restricted to 0..255 range
len = c & 0xff;  // len restricted to 0..255 range

if (.type==.u32 || .type==.u64 || len==0)
    sbit = 0;
else
    sbit = a[min(pos+len-1,msb)];

d = 0;
for (i=0; i<=msb; i++) {
    d[i] = (i<len && pos+i<=msb) ? a[pos+i] : sbit;
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`bfe` requires sm_20 or higher.

**Examples**

```ptx
bfe.b32  d,a,start,len;
```

## 9.7.1.20. Integer Arithmetic Instructions: bfi

**bfi**

Bit Field Insert.

**Syntax**

```
bfi.type  f, a, b, c, d;

.type = { .b32, .b64 };
```

**Description**

Align and insert a bit field from a into b, and place the result in f. Source c gives the starting bit position for the insertion, and source d gives the bit field length in bits.

Operands a, b, and f have the same type as the instruction type. Operands c and d are type `.u32`, but are restricted to the 8-bit value range 0..255.

If the bit field length is zero, the result is b.

If the start position is beyond the msb of the input, the result is b.

**Semantics**

```ptx
msb = (.type==.b32) ? 31 : 63;
pos = c & 0xff;  // pos restricted to 0..255 range
len = d & 0xff;  // len restricted to 0..255 range

f = b;
for (i=0; i<len && pos+i<=msb; i++) {
    f[pos+i] = a[i];
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

**Target ISA Notes**

`bfi` requires sm_20 or higher.

**Examples**

```ptx
bfi.b32  d,a,b,start,len;
```

## 9.7.1.21. Integer Arithmetic Instructions: szext

**szext**

Sign-extend or Zero-extend.

**Syntax**

```
szext.mode.type  d, a, b;

.mode = { .clamp, .wrap };
.type = { .u32, .s32 };
```

**Description**

Sign-extends or zero-extends an N-bit value from operand a where N is specified in operand b. The resulting value is stored in the destination operand d.

For the `.s32` instruction type, the value in a is treated as an N-bit signed value and the most significant bit of this N-bit value is replicated up to bit 31. For the `.u32` instruction type, the value in a is treated as an N-bit unsigned number and is zero-extended to 32 bits. Operand b is an unsigned 32-bit value.

If the value of N is 0, then the result of `szext` is 0. If the value of N is 32 or higher, then the result of `szext` depends upon the value of the `.mode` qualifier as follows:

- If `.mode` is `.clamp`, then the result is the same as the source operand a.
- If `.mode` is `.wrap`, then the result is computed using the wrapped value of N.

**Semantics**

```ptx
b1        = b & 0x1f;
too_large = (b >= 32 && .mode == .clamp) ? true : false;
mask      = too_large ? 0 : (~0) << b1;
sign_pos  = (b1 - 1) & 0x1f;

if (b1 == 0 || too_large || .type != .s32) {
    sign_bit = false;
} else {
    sign_bit = (a >> sign_pos) & 1;
}
d = (a & ~mask) | (sign_bit ? mask | 0);
```

**PTX ISA Notes**

Introduced in PTX ISA version 7.6.

**Target ISA Notes**

`szext` requires sm_70 or higher.

**Examples**

```ptx
szext.clamp.s32 rd, ra, rb;
szext.wrap.u32  rd, 0xffffffff, 0; // Result is 0.
```

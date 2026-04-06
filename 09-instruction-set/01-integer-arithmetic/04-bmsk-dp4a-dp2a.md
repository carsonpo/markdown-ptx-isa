## 9.7.1.22. Integer Arithmetic Instructions: bmsk

**bmsk**

Bit Field Mask.

**Syntax**

```
bmsk.mode.b32  d, a, b;

.mode = { .clamp, .wrap };
```

**Description**

Generates a 32-bit mask starting from the bit position specified in operand a, and of the width specified in operand b. The generated bitmask is stored in the destination operand d.

The resulting bitmask is 0 in the following cases:

- When the value of a is 32 or higher and `.mode` is `.clamp`.
- When either the specified value of b or the wrapped value of b (when `.mode` is specified as `.wrap`) is 0.

**Semantics**

```ptx
a1    = a & 0x1f;
mask0 = (~0) << a1;
b1    = b & 0x1f;
sum   = a1 + b1;
mask1 = (~0) << sum;

sum-overflow          = sum >= 32 ? true : false;
bit-position-overflow = false;
bit-width-overflow    = false;

if (.mode == .clamp) {
    if (a >= 32) {
        bit-position-overflow = true;
        mask0 = 0;
    }
    if (b >= 32) {
        bit-width-overflow = true;
    }
}

if (sum-overflow || bit-position-overflow || bit-width-overflow) {
    mask1 = 0;
} else if (b1 == 0) {
    mask1 = ~0;
}
d = mask0 & ~mask1;
```

**Notes**

The bitmask width specified by operand b is limited to range 0..32 in `.clamp` mode and to range 0..31 in `.wrap` mode.

**PTX ISA Notes**

Introduced in PTX ISA version 7.6.

**Target ISA Notes**

`bmsk` requires sm_70 or higher.

**Examples**

```ptx
bmsk.clamp.b32  rd, ra, rb;
bmsk.wrap.b32   rd, 1, 2; // Creates a bitmask of 0x00000006.
```

## 9.7.1.23. Integer Arithmetic Instructions: dp4a

**dp4a**

Four-way byte dot product-accumulate.

**Syntax**

```
dp4a.atype.btype  d, a, b, c;

.atype = .btype = { .u32, .s32 };
```

**Description**

Four-way byte dot product which is accumulated in 32-bit result.

Operand a and b are 32-bit inputs which hold 4 byte inputs in packed form for dot product.

Operand c has type `.u32` if both `.atype` and `.btype` are `.u32` else operand c has type `.s32`.

**Semantics**

```ptx
d = c;

// Extract 4 bytes from a 32bit input and sign or zero extend
// based on input type.
Va = extractAndSignOrZeroExt_4(a, .atype);
Vb = extractAndSignOrZeroExt_4(b, .btype);

for (i = 0; i < 4; ++i) {
    d += Va[i] * Vb[i];
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 5.0.

**Target ISA Notes**

Requires sm_61 or higher.

**Examples**

```ptx
dp4a.u32.u32           d0, a0, b0, c0;
dp4a.u32.s32           d1, a1, b1, c1;
```

## 9.7.1.24. Integer Arithmetic Instructions: dp2a

**dp2a**

Two-way dot product-accumulate.

**Syntax**

```
dp2a.mode.atype.btype  d, a, b, c;

.atype = .btype = { .u32, .s32 };
.mode = { .lo, .hi };
```

**Description**

Two-way 16-bit to 8-bit dot product which is accumulated in 32-bit result.

Operand a and b are 32-bit inputs. Operand a holds two 16-bits inputs in packed form and operand b holds 4 byte inputs in packed form for dot product.

Depending on the `.mode` specified, either lower half or upper half of operand b will be used for dot product.

Operand c has type `.u32` if both `.atype` and `.btype` are `.u32` else operand c has type `.s32`.

**Semantics**

```ptx
d = c;
// Extract two 16-bit values from a 32-bit input and sign or zero extend
// based on input type.
Va = extractAndSignOrZeroExt_2(a, .atype);

// Extract four 8-bit values from a 32-bit input and sign or zer extend
// based on input type.
Vb = extractAndSignOrZeroExt_4(b, .btype);

b_select = (.mode == .lo) ? 0 : 2;

for (i = 0; i < 2; ++i) {
    d += Va[i] * Vb[b_select + i];
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 5.0.

**Target ISA Notes**

Requires sm_61 or higher.

**Examples**

```ptx
dp2a.lo.u32.u32           d0, a0, b0, c0;
dp2a.hi.u32.s32           d1, a1, b1, c1;
```

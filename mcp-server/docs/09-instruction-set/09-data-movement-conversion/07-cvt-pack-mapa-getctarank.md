## 9.7.9.22. Data Movement and Conversion Instructions: cvt.pack

### cvt.pack

Convert two integer values from one integer type to another and pack the results.

**Syntax**

```
cvt.pack.sat.convertType.abType  d, a, b;
    .convertType  = { .u16, .s16 }
    .abType       = { .s32 }

cvt.pack.sat.convertType.abType.cType  d, a, b, c;
    .convertType  = { .u2, .s2, .u4, .s4, .u8, .s8 }
    .abType       = { .s32 }
    .cType        = { .b32 }
```

**Description**

Convert two 32-bit integers a and b into specified type and pack the results into d.

Destination d is an unsigned 32-bit integer. Source operands a and b are integers of type `.abType` and the source operand c is an integer of type `.cType`.

The inputs a and b are converted to values of type specified by `.convertType` with saturation and the results after conversion are packed into lower bits of d.

If operand c is specified then remaining bits of d are copied from lower bits of c.

**Semantics**

```ptx
ta = a < MIN(convertType) ? MIN(convertType) : a;
ta = a > MAX(convertType) ? MAX(convertType) : a;
tb = b < MIN(convertType) ? MIN(convertType) : b;
tb = b > MAX(convertType) ? MAX(convertType) : b;

size = sizeInBits(convertType);
td = tb ;
for (i = size; i <= 2 * size - 1; i++) {
    td[i] = ta[i - size];
}

if (isU16(convertType) || isS16(convertType)) {
    d = td;
} else {
    for (i = 0; i < 2 * size; i++) {
        d[i] = td[i];
    }
    for (i = 2 * size; i <= 31; i++) {
        d[i] = c[i - 2 * size];
    }
}
```

`.sat` modifier limits the converted values to MIN(convertType)..MAX(convertedType) (no overflow) if the corresponding inputs are not in the range of datatype specified as `.convertType`.

**PTX ISA Notes**

Introduced in PTX ISA version 6.5.

**Target ISA Notes**

Requires sm_72 or higher.

Sub byte types (`.u4`/`.s4` and `.u2`/`.s2`) requires sm_75 or higher.

**Examples**

```ptx
cvt.pack.sat.s16.s32      %r1, %r2, %r3;           // 32-bit to 16-bit conversion
cvt.pack.sat.u8.s32.b32   %r4, %r5, %r6, 0;        // 32-bit to 8-bit conversion
cvt.pack.sat.u8.s32.b32   %r7, %r8, %r9, %r4;      // %r7 = { %r5, %r6, %r8, %r9 }
cvt.pack.sat.u4.s32.b32   %r10, %r12, %r13, %r14;  // 32-bit to 4-bit conversion
cvt.pack.sat.s2.s32.b32   %r15, %r16, %r17, %r18;  // 32-bits to 2-bit conversion
```

## 9.7.9.23. Data Movement and Conversion Instructions: mapa

### mapa

Map the address of the shared variable in the target CTA.

**Syntax**

```
mapa{.space}.type          d, a, b;

// Maps shared memory address in register a into CTA b.
mapa.shared::cluster.type  d, a, b;

// Maps shared memory variable into CTA b.
mapa.shared::cluster.type  d, sh, b;

// Maps shared memory variable into CTA b.
mapa.shared::cluster.type  d, sh + imm, b;

// Maps generic address in register a into CTA b.
mapa.type                  d, a, b;

.space = { .shared::cluster }
.type  = { .u32, .u64 }
```

**Description**

Get address in the CTA specified by operand b which corresponds to the address specified by operand a.

Instruction type `.type` indicates the type of the destination operand d and the source operand a.

When space is `.shared::cluster`, source a is either a shared memory variable or a register containing a valid shared memory address and register d contains a shared memory address. When the optional qualifier `.space` is not specified, both a and d are registers containing generic addresses pointing to shared memory.

b is a 32-bit integer operand representing the rank of the target CTA.

Destination register d will hold an address in CTA b corresponding to operand a.

**PTX ISA Notes**

Introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
mapa.shared::cluster.u64 d1, %reg1, cta;
mapa.shared::cluster.u32 d2, sh, 3;
mapa.u64                 d3, %reg2, cta;
```

## 9.7.9.24. Data Movement and Conversion Instructions: getctarank

### getctarank

Generate the CTA rank of the address.

**Syntax**

```
getctarank{.space}.type d, a;

// Get cta rank from source shared memory address in register a.
getctarank.shared::cluster.type d, a;

// Get cta rank from shared memory variable.
getctarank.shared::cluster.type d, var;

// Get cta rank from shared memory variable+offset.
getctarank.shared::cluster.type d, var + imm;

// Get cta rank from generic address of shared memory variable in register a.
getctarank.type d, a;

.space = { .shared::cluster }
.type  = { .u32, .u64 }
```

**Description**

Write the destination register d with the rank of the CTA which contains the address specified in operand a.

Instruction type `.type` indicates the type of source operand a.

When space is `.shared::cluster`, source a is either a shared memory variable or a register containing a valid shared memory address. When the optional qualifier `.space` is not specified, a is a register containing a generic addresses pointing to shared memory. Destination d is always a 32-bit register which holds the rank of the CTA.

**PTX ISA Notes**

Introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
getctarank.shared::cluster.u32 d1, addr;
getctarank.shared::cluster.u64 d2, sh + 4;
getctarank.u64                 d3, src;
```


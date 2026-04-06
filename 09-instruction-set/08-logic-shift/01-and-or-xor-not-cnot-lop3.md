# 9.7.8. Logic and Shift Instructions

The logic and shift instructions are fundamentally untyped, performing bit-wise operations on operands of any type, provided the operands are of the same size. This permits bit-wise operations on floating point values without having to define a union to access the bits. Instructions and, or, xor, and not also operate on predicates.

The logical shift instructions are:

- and
- or
- xor
- not
- cnot
- lop3
- shf
- shl
- shr

## 9.7.8.1. Logic and Shift Instructions: and

### and

Bitwise AND.

**Syntax**

```
and.type d, a, b;

.type = { .pred, .b16, .b32, .b64 };
```

**Description**

Compute the bit-wise and operation for the bits in a and b.

**Semantics**

```ptx
d = a & b;
```

**Notes**

The size of the operands must match, but not necessarily the type.

Allowed types include predicate registers.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
and.b32  x,q,r;
and.b32  sign,fpvalue,0x80000000;
```

## 9.7.8.2. Logic and Shift Instructions: or

### or

Biwise OR.

**Syntax**

```
or.type d, a, b;

.type = { .pred, .b16, .b32, .b64 };
```

**Description**

Compute the bit-wise or operation for the bits in a and b.

**Semantics**

```ptx
d = a | b;
```

**Notes**

The size of the operands must match, but not necessarily the type.

Allowed types include predicate registers.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
or.b32  mask mask,0x00010001
or.pred  p,q,r;
```

## 9.7.8.3. Logic and Shift Instructions: xor

### xor

Bitwise exclusive-OR (inequality).

**Syntax**

```
xor.type d, a, b;

.type = { .pred, .b16, .b32, .b64 };
```

**Description**

Compute the bit-wise exclusive-or operation for the bits in a and b.

**Semantics**

```ptx
d = a ^ b;
```

**Notes**

The size of the operands must match, but not necessarily the type.

Allowed types include predicate registers.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
xor.b32  d,q,r;
xor.b16  d,x,0x0001;
```

## 9.7.8.4. Logic and Shift Instructions: not

### not

Bitwise negation; one's complement.

**Syntax**

```
not.type d, a;

.type = { .pred, .b16, .b32, .b64 };
```

**Description**

Invert the bits in a.

**Semantics**

```ptx
d = ~a;
```

**Notes**

The size of the operands must match, but not necessarily the type.

Allowed types include predicates.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
not.b32  mask,mask;
not.pred  p,q;
```

## 9.7.8.5. Logic and Shift Instructions: cnot

### cnot

C/C++ style logical negation.

**Syntax**

```
cnot.type d, a;

.type = { .b16, .b32, .b64 };
```

**Description**

Compute the logical negation using C/C++ semantics.

**Semantics**

```ptx
d = (a==0) ? 1 : 0;
```

**Notes**

The size of the operands must match, but not necessarily the type.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
cnot.b32 d,a;
```

## 9.7.8.6. Logic and Shift Instructions: lop3

### lop3

Arbitrary logical operation on 3 inputs.

**Syntax**

```
lop3.b32 d, a, b, c, immLut;
lop3.BoolOp.b32 d|p, a, b, c, immLut, q;

.BoolOp   = { .or , .and };
```

**Description**

Compute bitwise logical operation on inputs a, b, c and store the result in destination d.

Optionally, `.BoolOp` can be specified to compute the predicate result p by performing a Boolean operation on the destination operand d with the predicate q in the following manner:

```
p = (d != 0) BoolOp q;
```

The sink symbol `_` may be used in place of the destination operand d when `.BoolOp` qualifier is specified.

The logical operation is defined by a look-up table which, for 3 inputs, can be represented as an 8-bit value specified by operand immLut as described below. immLut is an integer constant that can take values from 0 to 255, thereby allowing up to 256 distinct logical operations on inputs a, b, c.

For a logical operation F(a, b, c) the value of immLut can be computed by applying the same operation to three predefined constant values as follows:

```
ta = 0xF0;
tb = 0xCC;
tc = 0xAA;

immLut = F(ta, tb, tc);
```

Examples:

```
If F = (a & b & c);
immLut = 0xF0 & 0xCC & 0xAA = 0x80

If F = (a | b | c);
immLut = 0xF0 | 0xCC | 0xAA = 0xFE

If F = (a & b & ~c);
immLut = 0xF0 & 0xCC & (~0xAA) = 0x40

If F = ((a & b | c) ^ a);
immLut = (0xF0 & 0xCC | 0xAA) ^ 0xF0 = 0x1A
```

The following table illustrates computation of immLut for various logical operations:

| ta | tb | tc | Oper 0 (False) | Oper 1 (ta & tb & tc) | Oper 2 (ta & tb & ~tc) | … | Oper 254 (ta \| tb \| tc) | Oper 255 (True) |
|----|----|----|----------------|----------------------|------------------------|---|--------------------------|-----------------|
| 0  | 0  | 0  | 0              | 0                    | 0                      | … | 0                        | 1               |
| 0  | 0  | 1  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 0  | 1  | 0  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 0  | 1  | 1  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 1  | 0  | 0  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 1  | 0  | 1  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 1  | 1  | 0  | 0              | 0                    | 0                      | … | 1                        | 1               |
| 1  | 1  | 1  | 0              | 1                    | 0                      | … | 1                        | 1               |
| **immLut** | | | **0x0** | **0x80** | **0x40** | … | **0xFE** | **0xFF** |

**Semantics**

```ptx
F = GetFunctionFromTable(immLut); // returns the function corresponding to immLut value
d = F(a, b, c);
if (BoolOp specified) {
    p = (d != 0) BoolOp q;
}
```

**PTX ISA Notes**

Introduced in PTX ISA version 4.3.

Support for `.BoolOp` qualifier introduced in PTX ISA version 8.2.

**Target ISA Notes**

Requires sm_50 or higher.

Qualifier `.BoolOp` requires sm_70 or higher.

**Examples**

```ptx
lop3.b32       d, a, b, c, 0x40;
lop3.or.b32  d|p, a, b, c, 0x3f, q;
lop3.and.b32 _|p, a, b, c, 0x3f, q;
```

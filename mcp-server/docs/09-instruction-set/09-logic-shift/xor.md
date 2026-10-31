# 9.7.9.3. Logic and Shift Instructions: xor

**xor**

Bitwise exclusive-OR (inequality).

## Syntax

```ptx
xor.type d, a, b;

.type = { .pred, .b16, .b32, .b64 };
```

## Description

Compute the bit-wise exclusive-or operation for the bits in `a` and `b`.

## Semantics

```ptx
d = a ^ b;
```

## Notes

The size of the operands must match, but not necessarily the type.

Allowed types include predicate registers.

## PTX ISA Notes

Introduced in PTX ISA version 1.0.

## Target ISA Notes

Supported on all target architectures.

## Examples

```ptx
xor.b32  d,q,r;
xor.b16  d,x,0x0001;
```

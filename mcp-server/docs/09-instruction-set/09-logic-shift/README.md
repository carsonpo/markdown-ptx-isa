# 9.7.9. Logic and Shift Instructions

The logic and shift instructions are fundamentally untyped, performing bit-wise operations on operands of any type, provided the operands are of the same size. This permits bit-wise operations on floating point values without having to define a union to access the bits. Instructions `and`, `or`, `xor`, and `not` also operate on predicates.

The logical shift instructions are:

- `and`
- `or`
- `xor`
- `not`
- `cnot`
- `lop3`
- `shf`
- `shl`
- `shr`

## Pages

- [and](and.md) — Bitwise AND.
- [or](or.md) — Bitwise OR.
- [xor](xor.md) — Bitwise exclusive-OR (inequality).
- [not](not.md) — Bitwise negation; one's complement.
- [cnot](cnot.md) — C/C++ style logical negation.
- [lop3](lop3.md) — Arbitrary logical operation on 3 inputs, selected by an 8-bit look-up table.
- [shf](shf.md) — Funnel shift of a 64-bit value formed from two 32-bit operands.
- [shl](shl.md) — Shift bits left, zero-fill on right.
- [shr](shr.md) — Shift bits right, sign or zero-fill on left.

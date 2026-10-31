# 9.7.2. Extended-Precision Integer Arithmetic Instructions

Instructions `add.cc`, `addc`, `sub.cc`, `subc`, `mad.cc` and `madc` reference an implicitly specified condition code register (CC) having a single carry flag bit (CC.CF) holding carry-in/carry-out or borrow-in/borrow-out. These instructions support extended-precision integer addition, subtraction, and multiplication. No other instructions access the condition code, and there is no support for setting, clearing, or testing the condition code. The condition code register is not preserved across calls and is mainly intended for use in straight-line code sequences for computing extended-precision integer addition, subtraction, and multiplication.

The extended-precision arithmetic instructions are:

- `add.cc`, `addc`
- `sub.cc`, `subc`
- `mad.cc`, `madc`

## Pages

- [add.cc](add-cc.md) — Add two values with carry-out.
- [addc](addc.md) — Add two values with carry-in and optional carry-out.
- [sub.cc](sub-cc.md) — Subtract one value from another, with borrow-out.
- [subc](subc.md) — Subtract one value from another, with borrow-in and optional borrow-out.
- [mad.cc](mad-cc.md) — Multiply two values, extract high or low half of result, and add a third value with carry-out.
- [madc](madc.md) — Multiply two values, extract high or low half of result, and add a third value with carry-in and optional carry-out.

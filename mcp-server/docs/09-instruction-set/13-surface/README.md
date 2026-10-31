# 9.7.13. Surface Instructions

This section describes PTX instructions for accessing surfaces. PTX supports the following operations on surface descriptors:

- Static initialization of surface descriptors.
- Module-scope and per-entry scope definitions of surface descriptors.
- Ability to query fields within surface descriptors.

These instructions provide access to surface memory.

- [`suld`](suld.md)
- [`sust`](sust.md)
- [`sured`](sured.md)
- [`suq`](suq.md)

## Pages

- [9.7.13.1. Surface Instructions: suld](suld.md) — Unformatted load from surface memory, including surface arrays and out-of-bounds clamp modes.
- [9.7.13.2. Surface Instructions: sust](sust.md) — Unformatted or formatted store to surface memory.
- [9.7.13.3. Surface Instructions: sured](sured.md) — Reduction operation on surface memory with byte or sample addressing.
- [9.7.13.4. Surface Instructions: suq](suq.md) — Query a surface attribute.

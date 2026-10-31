# 9.7.1. Integer Arithmetic Instructions

Integer arithmetic instructions operate on the integer types in register and constant immediate forms. The integer arithmetic instructions are:

- `add`
- `sub`
- `mul`
- `mad`
- `clmad`
- `mul24`
- `mad24`
- `sad`
- `div`
- `rem`
- `abs`
- `neg`
- `min`
- `max`
- `popc`
- `clz`
- `bfind`
- `fns`
- `brev`
- `bfe`
- `bfi`
- `bmsk`
- `szext`
- `dp4a`
- `dp2a`

## Pages

- [9.7.1.1. Integer Arithmetic Instructions: add](add.md) — add two values, with optional saturation and packed `.u16x2`/`.s16x2`/`.u8x4`/`.s8x4` forms.
- [9.7.1.2. Integer Arithmetic Instructions: sub](sub.md) — subtract one value from another, with optional saturation and packed `.u8x4`/`.s8x4` forms.
- [9.7.1.3. Integer Arithmetic Instructions: mul](mul.md) — multiply two values, returning the high, low or full-width product.
- [9.7.1.4. Integer Arithmetic Instructions: mad](mad.md) — multiply two values, take the high or low half or full width, and add a third value.
- [9.7.1.5. Integer Arithmetic Instructions: clmad](clmad.md) — carryless 64-bit multiply and add, returning the high or low 64 bits.
- [9.7.1.6. Integer Arithmetic Instructions: mul24](mul24.md) — multiply two 24-bit integers held in 32-bit registers.
- [9.7.1.7. Integer Arithmetic Instructions: mad24](mad24.md) — multiply two 24-bit integers and add a third 32-bit value.
- [9.7.1.8. Integer Arithmetic Instructions: sad](sad.md) — sum of absolute differences.
- [9.7.1.9. Integer Arithmetic Instructions: div](div.md) — integer division.
- [9.7.1.10. Integer Arithmetic Instructions: rem](rem.md) — remainder of integer division.
- [9.7.1.11. Integer Arithmetic Instructions: abs](abs.md) — absolute value of a signed integer.
- [9.7.1.12. Integer Arithmetic Instructions: neg](neg.md) — arithmetic negate, including the packed `.s8x4` form.
- [9.7.1.13. Integer Arithmetic Instructions: min](min.md) — minimum of two values, with optional `.relu` and packed forms.
- [9.7.1.14. Integer Arithmetic Instructions: max](max.md) — maximum of two values, with optional `.relu` and packed forms.
- [9.7.1.15. Integer Arithmetic Instructions: popc](popc.md) — population count of one bits.
- [9.7.1.16. Integer Arithmetic Instructions: clz](clz.md) — count leading zeros.
- [9.7.1.17. Integer Arithmetic Instructions: bfind](bfind.md) — find the most significant non-sign bit, optionally as a shift amount.
- [9.7.1.18. Integer Arithmetic Instructions: fns](fns.md) — find the n-th set bit from a base position.
- [9.7.1.19. Integer Arithmetic Instructions: brev](brev.md) — bit reversal.
- [9.7.1.20. Integer Arithmetic Instructions: bfe](bfe.md) — bit field extract with zero or sign extension.
- [9.7.1.21. Integer Arithmetic Instructions: bfi](bfi.md) — bit field insert.
- [9.7.1.22. Integer Arithmetic Instructions: szext](szext.md) — sign-extend or zero-extend an N-bit value.
- [9.7.1.23. Integer Arithmetic Instructions: bmsk](bmsk.md) — generate a 32-bit bit field mask.
- [9.7.1.24. Integer Arithmetic Instructions: dp4a](dp4a.md) — four-way byte dot product-accumulate.
- [9.7.1.25. Integer Arithmetic Instructions: dp2a](dp2a.md) — two-way 16-bit to 8-bit dot product-accumulate.

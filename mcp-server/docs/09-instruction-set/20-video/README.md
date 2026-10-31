# 9.7.20. Video Instructions

All video instructions operate on 32-bit register operands. However, the video instructions may be classified as either scalar or SIMD based on whether their core operation applies to one or multiple values.

The video instructions are:

- `vadd`, `vadd2`, `vadd4`
- `vsub`, `vsub2`, `vsub4`
- `vmad`
- `vavrg2`, `vavrg4`
- `vabsdiff`, `vabsdiff2`, `vabsdiff4`
- `vmin`, `vmin2`, `vmin4`
- `vmax`, `vmax2`, `vmax4`
- `vshl`
- `vshr`
- `vset`, `vset2`, `vset4`

## Pages

- [9.7.20.1. Scalar Video Instructions](scalar/README.md) — scalar video instructions operating on one byte, half-word or word value per operand.
- [9.7.20.2. SIMD Video Instructions](simd/README.md) — SIMD video instructions operating on pairs of 16-bit values and quads of 8-bit values.

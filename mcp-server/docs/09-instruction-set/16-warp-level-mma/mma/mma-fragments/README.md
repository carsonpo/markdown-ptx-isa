# 9.7.16.5. Matrix Fragments for mma

Each warp executing an `mma` instruction holds the elements of the multiplicand matrices A and B and of the accumulator matrix C (or D) distributed across its threads as fragments. The pages below describe, for every supported `mma` shape, the fragment held by each thread, the layout figures, and the formulas that compute the row and column of each fragment element from `%laneid`.

## Pages

- [Matrix Fragments for mma.m8n8k4 with .f16 floating point type](m8n8k4-f16.md) — 9.7.16.5.1: four `.m8n8k4` MMA computations per warp with `.f16` multiplicands and `.f16`/`.f32` accumulators.
- [Matrix Fragments for mma.m8n8k4 with .f64 floating point type](m8n8k4-f64.md) — 9.7.16.5.2: single `.m8n8k4` MMA with `.f64` matrices.
- [Matrix Fragments for mma.m8n8k16](m8n8k16.md) — 9.7.16.5.3: `.s8`/`.u8` multiplicands with `.s32` accumulators.
- [Matrix Fragments for mma.m8n8k32](m8n8k32.md) — 9.7.16.5.4: `.s4`/`.u4` multiplicands with `.s32` accumulators.
- [Matrix Fragments for mma.m8n8k128](m8n8k128.md) — 9.7.16.5.5: `.b1` multiplicands with `.s32` accumulators.
- [Matrix Fragments for mma.m16n8k4](m16n8k4.md) — 9.7.16.5.6: `.tf32` and `.f64` matrices.
- [Matrix Fragments for mma.m16n8k8](m16n8k8.md) — 9.7.16.5.7: `.f16`/`.bf16`, `.tf32` and `.f64` matrices.
- [Matrix Fragments for mma.m16n8k16 with floating point type](m16n8k16-fp.md) — 9.7.16.5.8: `.f16`/`.bf16` multiplicands with `.f16`/`.f32` accumulators.
- [Matrix Fragments for mma.m16n8k16 with integer type](m16n8k16-int.md) — 9.7.16.5.9: `.s8`/`.u8` multiplicands with `.s32` accumulators.
- [Matrix Fragments for mma.m16n8k32](m16n8k32.md) — 9.7.16.5.10: `.s8`/`.u8`, `.s4`/`.u4` and 8-bit floating point multiplicands.
- [Matrix Fragments for mma.m16n8k64](m16n8k64.md) — 9.7.16.5.11: `.s4`/`.u4` and narrow floating point multiplicands.
- [Matrix Fragments for mma.m16n8k128](m16n8k128.md) — 9.7.16.5.12: `.b1` multiplicands with `.s32` accumulators.
- [Matrix Fragments for mma.m16n8k256](m16n8k256.md) — 9.7.16.5.13: `.b1` multiplicands with `.s32` accumulators.

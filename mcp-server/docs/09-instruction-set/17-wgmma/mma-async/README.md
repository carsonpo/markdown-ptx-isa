# 9.7.17.5. Asynchronous Warpgroup Level Matrix Multiply-Accumulate Operation using wgmma.mma_async instruction

This section describes warpgroup level `wgmma.mma_async` instruction and the organization of various matrices involved in this instruction.

## 9.7.17.5.1. Register Fragments and Shared Memory Matrix Layouts

The input matrix A of the warpgroup wide MMA operations can be either in registers or in the shared memory. The input matrix B of the warpgroup wide MMA operations must be in the shared memory. This section describes the layouts of register fragments and shared memory expected by the warpgroup MMA instructions.

When the matrices are in shared memory, their starting addresses must be aligned to 16 bytes.

### 9.7.17.5.1.1. Register Fragments

This section describes the organization of various matrices located in register operands of the `wgmma.mma_async` instruction.

## Pages

- [9.7.17.5.1.1.1. Matrix Fragments for wgmma.mma_async.m64nNk16](register-fragments-m64nNk16.md) — register fragments of A and D for the `.m64nNk16` shapes (`.f16`/`.bf16`).
- [9.7.17.5.1.1.2. Matrix Fragments for wgmma.mma_async.m64nNk8](register-fragments-m64nNk8.md) — register fragments of A and D for the `.m64nNk8` shapes (`.tf32`).
- [9.7.17.5.1.1.3. Matrix Fragments for wgmma.mma_async.m64nNk32](register-fragments-m64nNk32.md) — register fragments of A and D for the `.m64nNk32` shapes (`.u8`/`.s8`, `.e4m3`/`.e5m2`).
- [9.7.17.5.1.1.4. Matrix Fragments for wgmma.mma_async.m64nNk256](register-fragments-m64nNk256.md) — register fragments of A and D for the `.m64nNk256` shapes (`.b1`).
- [9.7.17.5.1.2. Shared Memory Matrix Layout](shared-memory-layout.md) — major-ness, swizzle atoms, leading/stride byte offsets and canonical layouts of shared memory matrices.
- [9.7.17.5.1.2.2. Matrix Descriptor Format](matrix-descriptor.md) — bit layout of the 64-bit shared memory matrix descriptor.
- [9.7.17.5.2. Asynchronous Multiply-and-Accumulate Instruction: wgmma.mma_async](wgmma-mma-async.md) — the `wgmma.mma_async` instruction.

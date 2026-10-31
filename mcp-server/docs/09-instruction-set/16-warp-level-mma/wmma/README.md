# 9.7.16.4. Matrix multiply-accumulate operation using wmma instructions

This section describes warp level `wmma.load`, `wmma.mma` and `wmma.store` instructions and the organization of various matrices involved in these instruction.

## Pages

- [9.7.16.4.1. Matrix Fragments for WMMA](wmma-fragments.md) — the per-thread register fragments for every supported data-type and shape, and the rules for manipulating fragment contents.
- [9.7.16.4.2. Matrix Storage for WMMA](wmma-storage.md) — row-major and column-major storage, address alignment and the default stride for each shape.
- [9.7.16.4.3. Warp-level Matrix Load Instruction: wmma.load](wmma-load.md) — collectively load a matrix from memory for WMMA.
- [9.7.16.4.4. Warp-level Matrix Store Instruction: wmma.store](wmma-store.md) — collectively store a matrix into memory for WMMA.
- [9.7.16.4.5. Warp-level Matrix Multiply-and-Accumulate Instruction: wmma.mma](wmma-mma.md) — perform a single matrix multiply-and-accumulate operation across a warp.

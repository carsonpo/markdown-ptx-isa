# 9.7.17.6. Asynchronous Warpgroup Level Multiply-and-Accumulate Operation using wgmma.mma_async.sp instruction

This section describes warp-level `wgmma.mma_async.sp` instruction with sparse matrix A. This variant of the `wgmma.mma_async` operation can be used when A is a structured sparse matrix with 50% zeros in each row distributed in a shape-specific granularity. For an MxNxK sparse `wgmma.mma_async.sp` operation, the MxK matrix A is packed into MxK/2 elements. For each K-wide row of matrix A, 50% elements are zeros and the remaining K/2 non-zero elements are packed in the operand representing matrix A. The mapping of these K/2 elements to the corresponding K-wide row is provided explicitly as metadata.

## Pages

- [9.7.17.6.1. Sparse matrix storage](sparse-storage.md) — sparsity granularity, metadata encoding and sparsity selector per shape and data type.
- [9.7.17.6.2. Matrix fragments for warpgroup-level multiply-accumulate operation with sparse matrix A](sparse-fragments.md) — register fragments of sparse matrix A and the metadata operand for `.m64nNk32`, `.m64nNk16` and `.m64nNk64`.
- [9.7.17.6.3. Asynchronous Multiply-and-Accumulate Instruction: wgmma.mma_async.sp](wgmma-mma-async-sp.md) — the `wgmma.mma_async.sp` instruction: syntax, description, notes and examples.

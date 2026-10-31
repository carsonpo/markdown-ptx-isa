# 9.7.16.6. Matrix multiply-accumulate operation using mma.sp instruction with sparse matrix A

This section describes warp-level `mma.sp{::ordered_metadata}` instruction with sparse matrix A. This variant of the mma operation can be used when A is a structured sparse matrix with 50% zeros in each row distributed in a shape-specific granularity. For an MxNxK sparse `mma.sp{::ordered_metadata}` operation, the MxK matrix A is packed into MxK/2 elements. For each K-wide row of matrix A, 50% elements are zeros and the remaining K/2 non-zero elements are packed in the operand representing matrix A. The mapping of these K/2 elements to the corresponding K-wide row is provided explicitly as metadata.

## Pages

- [9.7.16.6.1. Sparse matrix storage](sparse-storage.md) — sparsity granularities, metadata index encoding and sparsity selector rules for each shape and data type.
- [9.7.16.6.2. Matrix fragments for multiply-accumulate operation with sparse matrix A](sparse-fragments/README.md) — per-shape register fragment layouts for matrices A, B, C, D and the sparsity metadata.
- [9.7.16.6.3. Multiply-and-Accumulate Instruction: mma.sp / mma.sp::ordered_metadata](mma-sp.md) — syntax, description, notes and examples of the `mma.sp` and `mma.sp::ordered_metadata` instructions.

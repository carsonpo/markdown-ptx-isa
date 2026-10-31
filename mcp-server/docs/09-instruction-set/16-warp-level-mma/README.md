# 9.7.16. Warp Level Matrix Multiply-Accumulate Instructions

The matrix multiply and accumulate operation has the following form:

```
D = A * B + C
```

where D and C are called accumulators and may refer to the same matrix.

PTX provides two ways to perform matrix multiply-and-accumulate computation:

- Using `wmma` instructions:
  - This warp-level computation is performed collectively by all threads in the warp as follows:
    - Load matrices A, B and C from memory into registers using the `wmma.load` operation. When the operation completes, the destination registers in each thread hold a fragment of the loaded matrix.
    - Perform the matrix multiply and accumulate operation using the `wmma.mma` operation on the loaded matrices. When the operation completes, the destination registers in each thread hold a fragment of the result matrix returned by the `wmma.mma` operation.
    - Store result Matrix D back to memory using the `wmma.store` operation. Alternately, result matrix D can also be used as argument C for a subsequent `wmma.mma` operation.
  - The `wmma.load` and `wmma.store` instructions implicitly handle the organization of matrix elements when loading the input matrices from memory for the `wmma.mma` operation and when storing the result back to memory.
- Using `mma` instruction:
  - Similar to `wmma`, `mma` also requires computation to be performed collectively by all threads in the warp however distribution of matrix elements across different threads in warp needs to be done explicitly before invoking the `mma` operation. The `mma` instruction supports both dense as well as sparse matrix A. The sparse variant can be used when A is a structured sparse matrix as described in [Sparse matrix storage](mma-sp/sparse-storage.md).

## Pages

- [9.7.16.1. Matrix Shape](matrix-shapes.md) — the MxNxK shapes supported by `wmma` and `mma` for each multiplicand data-type, with the PTX ISA version that introduced each.
- [9.7.16.2. Matrix Data-types](matrix-datatypes.md) — the multiplicand and accumulator data-type combinations allowed in a matrix multiply-accumulate.
- [9.7.16.3. Block Scaling for mma.sync](block-scaling-mma-sync.md) — block-scaled `mma` with `.kind::mxf8f6f4`, `.kind::mxf4` and `.kind::mxf4nvf4`: scale matrix shapes, valid type combinations and the selector components.
- [9.7.16.4. Matrix multiply-accumulate operation using wmma instructions](wmma/README.md) — the `wmma.load`, `wmma.mma` and `wmma.store` instructions and the organization of their matrix fragments and storage.
- [9.7.16.5. Matrix multiply-accumulate operation using mma instruction](mma/README.md) — the `mma` instruction, its per-shape register fragments, and the `ldmatrix`, `stmatrix` and `movmatrix` helpers.
- [9.7.16.6. Matrix multiply-accumulate operation using mma.sp instruction](mma-sp/README.md) — the sparse `mma.sp` instruction, sparse matrix storage and its per-shape fragments.

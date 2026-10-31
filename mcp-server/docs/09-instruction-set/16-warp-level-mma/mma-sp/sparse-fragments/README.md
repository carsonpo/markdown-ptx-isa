# 9.7.16.6.2. Matrix fragments for multiply-accumulate operation with sparse matrix A

In this section we describe how the contents of thread registers are associated with fragments of various matrices and the sparsity metadata. The following conventions are used throughout this section:

- For matrix A, only the layout of a fragment is described in terms of register vector sizes and their association with the matrix data.
- For matrix B, when the combination of matrix dimension and the supported data type is not already covered in [Matrix multiply-accumulate operation using mma instruction](../../mma/README.md), a pictorial representation of matrix fragments is provided.
- For matrices C and D, since the matrix dimension - data type combination is the same for all supported shapes, and is already covered in [Matrix multiply-accumulate operation using mma instruction](../../mma/README.md), the pictorial representations of matrix fragments are not included in this section.
- For the metadata operand, pictorial representations of the association between indices of the elements of matrix A and the contents of the metadata operand are included. `Tk: [m..n]` present in cell `[x][y..z]` indicates that bits m through n (with m being higher) in the metadata operand of thread with `%laneid=k` contains the indices of the non-zero elements from the chunk `[x][y]..[x][z]` of matrix A.

## Pages

- [9.7.16.6.2.1. Matrix Fragments for sparse mma.m16n8k16 with .f16 and .bf16 types](m16n8k16-f16-bf16.md) — fragment and metadata layout for sparse `.m16n8k16` with `.f16`/`.bf16`.
- [9.7.16.6.2.2. Matrix Fragments for sparse mma.m16n8k32 with .f16 and .bf16 types](m16n8k32-f16-bf16.md) — fragment and metadata layout for sparse `.m16n8k32` with `.f16`/`.bf16`.
- [9.7.16.6.2.3. Matrix Fragments for sparse mma.m16n8k16 with .tf32 floating point type](m16n8k16-tf32.md) — fragment and metadata layout for sparse `.m16n8k16` with `.tf32`.
- [9.7.16.6.2.4. Matrix Fragments for sparse mma.m16n8k8 with .tf32 floating point type](m16n8k8-tf32.md) — fragment and metadata layout for sparse `.m16n8k8` with `.tf32`.
- [9.7.16.6.2.5. Matrix Fragments for sparse mma.m16n8k32 with .u8 / .s8 integer type](m16n8k32-u8-s8.md) — fragment and metadata layout for sparse `.m16n8k32` with `.u8`/`.s8`.
- [9.7.16.6.2.6. Matrix Fragments for sparse mma.m16n8k64 with .u8 / .s8 / .e4m3 / .e5m2 type](m16n8k64-u8-s8-e4m3-e5m2.md) — fragment and metadata layout for sparse `.m16n8k64` with `.u8`/`.s8`/`.e4m3`/`.e5m2`/`.e3m2`/`.e2m3`/`.e2m1`.
- [9.7.16.6.2.7. Matrix Fragments for sparse mma.m16n8k64 with .u4 / .s4 integer type](m16n8k64-u4-s4.md) — fragment and metadata layout for sparse `.m16n8k64` with `.u4`/`.s4`.
- [9.7.16.6.2.8. Matrix Fragments for sparse mma.m16n8k128 with .u4 / .s4 integer type](m16n8k128-u4-s4.md) — fragment and metadata layout for sparse `.m16n8k128` with `.u4`/`.s4`/`.e2m1`.

# 9.7.17.6.2. Matrix fragments for warpgroup-level multiply-accumulate operation with sparse matrix A

In this section we describe how the contents of thread registers are associated with fragments of A matrix and the sparsity metadata.

Each warp in the warpgroup provides sparsity information for 16 rows of matrix A. The following table shows the assignment of warps to rows of matrix A:

| Warp | Sparsity information for rows of matrix A |
|---|---|
| `%warpid % 4 = 3` | 48-63 |
| `%warpid % 4 = 2` | 32-47 |
| `%warpid % 4 = 1` | 16-31 |
| `%warpid % 4 = 0` | 0-15 |

The following conventions are used throughout this section:

- For matrix A, only the layout of a fragment is described in terms of register vector sizes and their association with the matrix data.
- For matrix D, since the matrix dimension - data type combination is the same for all supported shapes, and is already covered in [Asynchronous Warpgroup Level Matrix Multiply-Accumulate Operation using wgmma.mma_async instruction](../mma-async/README.md), the pictorial representations of matrix fragments are not included in this section.
- For the metadata operand, pictorial representations of the association between indices of the elements of matrix A and the contents of the metadata operand are included. `Tk: [m..n]` present in cell `[x][y..z]` indicates that bits m through n (with m being higher) in the metadata operand of thread with `%laneid=k` contains the indices of the non-zero elements from the chunk `[x][y]..[x][z]` of matrix A.

## 9.7.17.6.2.1. Matrix Fragments for sparse wgmma.mma_async.m64nNk32

A warpgroup executing sparse `wgmma.mma_async.m64nNk32` will compute an MMA operation of shape `.m64nNk32` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A, from shared memory is documented in [Shared Memory Matrix Layout](../mma-async/shared-memory-layout.md).

- Multiplicand A, from registers:

  | `.atype` | Fragments | Elements |
  |---|---|---|
  | `.f16` / `.bf16` | A vector expression containing four `.b32` registers, with each register containing two non-zero `.f16` /`.bf16` elements out of 4 consecutive elements from matrix A. | Non-zero elements: a0, a1, a2, a3, a4, a5, a6, a7. Mapping of the non-zero elements is as described in [Sparse matrix storage](sparse-storage.md) |

  The layout of the fragments held by different threads is shown in Figure 178.

  ![Sparse WGMMA .m64nNk32 fragment layout for matrix A with .f16/.bf16 type.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-wgmma-64N32-f16-bf16-A.png)

  **Figure 178** Sparse WGMMA .m64nNk32 fragment layout for matrix A with .f16/.bf16 type.

- Accumulator D:

  Matrix fragments for accumulator D are the same as in case of [Matrix Fragments for wgmma.mma_async.m64nNk32](../mma-async/register-fragments-m64nNk32.md) for the same `.dtype` format.

- Multiplicand B:

  Shared memory layout for Matrix B is documented in [Shared Memory Matrix Layout](../mma-async/shared-memory-layout.md).

- Metadata operand is a `.b32` register containing 16 2-bit vectors each storing the index of a non-zero element of a 4-wide chunk of matrix A.

  Figure 179 shows the mapping of the metadata bits to the elements of matrix A for a warp. In this figure, variable `i` represents the value of the sparsity selector operand.

  ![Sparse WGMMA .m64nNk32 metadata layout for .f16/.bf16 type.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-mma-metadata-16832-f16bf16.png)

  **Figure 179** Sparse WGMMA .m64nNk32 metadata layout for .f16/.bf16 type.

## 9.7.17.6.2.2. Matrix Fragments for sparse wgmma.mma_async.m64nNk16

A warpgroup executing sparse `wgmma.mma_async.m64nNk16` will compute an MMA operation of shape `.m64nNk16` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A, from shared memory is documented in [Shared Memory Matrix Layout](../mma-async/shared-memory-layout.md).

- Multiplicand A, from registers:

  | `.atype` | Fragments | Elements |
  |---|---|---|
  | `.tf32` | A vector expression containing four `.b32` registers, containing four non-zero `.tf32` elements out of eight consecutive elements from matrix A. | Non-zero elements: a0, a1, a2, a3. Mapping of the non-zero elements is as described in [Sparse matrix storage](sparse-storage.md) |

  The layout of the fragments held by different threads is shown in Figure 180.

  ![Sparse WGMMA .m64nNk16 fragment layout for matrix A with .tf32 type.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-wgmma-64N16-tf32-A.png)

  **Figure 180** Sparse WGMMA .m64nNk16 fragment layout for matrix A with .tf32 type.

- Accumulator D:

  Matrix fragments for accumulator D are the same as in case of [Matrix Fragments for wgmma.mma_async.m64nNk8](../mma-async/register-fragments-m64nNk8.md) for the same `.dtype` format.

- Multiplicand B:

  Shared memory layout for Matrix B is documented in [Shared Memory Matrix Layout](../mma-async/shared-memory-layout.md).

- Metadata operand is a `.b32` register containing eight 4-bit vectors each storing the index of a non-zero element of a 2-wide chunk of matrix A.

  Figure 181 shows the mapping of the metadata bits to the elements of matrix A for a warp. In this figure, variable `i` represents the value of the sparsity selector operand.

  ![Sparse WGMMA .m64nNk16 metadata layout for .tf32 type.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-mma-metadata-16816-tf32.png)

  **Figure 181** Sparse WGMMA .m64nNk16 metadata layout for .tf32 type.

## 9.7.17.6.2.3. Matrix Fragments for sparse wgmma.mma_async.m64nNk64

A warpgroup executing sparse `wgmma.mma_async.m64nNk64` will compute an MMA operation of shape `.m64nNk64` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A, from shared memory is documented in Matrix Fragments for sparse wgmma.mma_async.m64nNk64.

- Multiplicand A, from registers:

  | `.atype` | Fragments | Elements |
  |---|---|---|
  | `.e4m3` / `.e5m2` | A vector expression containing four `.b32` registers, with each register containing four non-zero `.e4m3` /`.e5m2` elements out of eight consecutive elements from matrix A. | Non-zero elements: a0, a1, a2, … , a15. Mapping of the non-zero elements is as described in [Sparse matrix storage](sparse-storage.md) |
  | `.s8` / `.u8` | A vector expression containing four `.b32` registers, with each register containing four non-zero `.s8` /`.u8` elements out of eight consecutive elements from matrix A. | Non-zero elements: a0, a1, a2, … , a15. Mapping of the non-zero elements is as described in [Sparse matrix storage](sparse-storage.md) |

  The layout of the fragments held by different threads is shown in Figure 182.

  ![Sparse WGMMA .m64nNk64 fragment layout for matrix A with .e4m3/ .e5m2/ .s8/ .u8 type.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-wgmma-64N64-e4m3-e5m2-s8-u8-A.png)

  **Figure 182** Sparse WGMMA .m64nNk64 fragment layout for matrix A with .e4m3/ .e5m2/ .s8/ .u8 type.

- Accumulator D:

  Matrix fragments for accumulator D are the same as in case of [Matrix Fragments for wgmma.mma_async.m64nNk32](../mma-async/register-fragments-m64nNk32.md) for the same `.dtype` format.

- Multiplicand B:

  Shared memory layout for Matrix B is documented in Matrix Fragments for sparse wgmma.mma_async.m64nNk64.

- Metadata operand is a `.b32` register containing 16 4-bit vectors each storing the indices of two non-zero elements of a 4-wide chunk of matrix A.

  Figure 183 shows the mapping of the metadata bits to the elements of columns 0–31 of matrix A.

  ![Sparse WGMMA .m64nNk64 metadata layout for .e4m3/ .e5m2/ .s8/ .u8 type for columns 0–31](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-mma-metadata-16864-u8s8-first32col.png)

  **Figure 183** Sparse WGMMA .m64nNk64 metadata layout for .e4m3/ .e5m2/ .s8/ .u8 type for columns 0–31

  Figure 184 shows the mapping of the metadata bits to the elements of columns 32–63 of matrix A.

  ![Sparse WGMMA .m64nNk64 metadata layout for .e4m3/ .e5m2/ .s8/ .u8 type for columns 32–63](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/sparse-mma-metadata-16864-u8s8-last32col.png)

  **Figure 184** Sparse WGMMA .m64nNk64 metadata layout for .e4m3/ .e5m2/ .s8/ .u8 type for columns 32–63

# 9.7.17.5.1.1.1. Matrix Fragments for wgmma.mma_async.m64nNk16

A warpgroup executing `wgmma.mma_async.m64nNk16` will compute an MMA operation of shape `.m64nNk16` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A in registers:

  | `.atype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.f16`/`.bf16` | A vector expression containing four `.f16x2` registers, with each register containing two `.f16`/ `.bf16` elements from matrix A. | a0, a1, a2, a3, a4, a5, a6, a7 |

  The layout of the fragments held by different threads is shown in Figure 151.

  ![WGMMA .m64nNk16 register fragment layout for matrix A.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N16-A.png)

  **Figure 151** WGMMA .m64nNk16 register fragment layout for matrix A.

- Accumulator D:

  | `.dtype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.f16` | A vector expression containing N/4 number of `.f16x2` registers, with each register containing two `.f16` elements from matrix D. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N = 8\*i where i = {1, 2, ... , 32} |
  | `.f32` | A vector expression containing N/2 number of `.f32` registers. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N = 8\*i where i = {1, 2, ... , 32} |

  The layout of the fragments held by different threads is shown in Figure 152.

  ![WGMMA .m64nNk16 register fragment layout for accumulator matrix D.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N16-D.png)

  **Figure 152** WGMMA .m64nNk16 register fragment layout for accumulator matrix D.

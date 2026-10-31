# 9.7.17.5.1.1.3. Matrix Fragments for wgmma.mma_async.m64nNk32

A warpgroup executing `wgmma.mma_async.m64nNk32` will compute an MMA operation of shape `.m64nNk32` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A in registers:

  | `.atype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.s8`/`.u8` | A vector expression containing four `.b32` registers, with each register containing four `.u8`/ `.s8` elements from matrix A. | a0, a1, a2, a3, … , a14, a15 |
  | `.e4m3`/ `.e5m2` | A vector expression containing four `.b32` registers, with each register containing four `.e4m3`/ `.e5m2` elements from matrix A. | a0, a1, a2, a3, … , a14, a15 |

  The layout of the fragments held by different threads is shown in Figure 155.

  ![WGMMA .m64nNk32 register fragment layout for matrix A.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N32-A.png)

  **Figure 155** WGMMA .m64nNk32 register fragment layout for matrix A.

- Accumulator D:

  | `.dtype` | Fragment | Elements (low to high) | Miscellaneous Information |
  |---|---|---|---|
  | `.s32` | A vector expression containing N/2 number of `.s32` registers. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N depends on `.dtype`, as described in the next column. | N = 8\*i where i = {1, 2, 3, 4}<br>= 16\*i where i = {3, 4, ..., 15, 16} |
  | `.f32` | A vector expression containing N/2 number of `.f32` registers. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N depends on `.dtype`, as described in the next column. | N = 8\*i where i = {1, 2, ... , 32} |
  | `.f16` | A vector expression containing N/4 number of `.f16x2` registers, with each register containing two `.f16` elements from matrix D. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N depends on `.dtype`, as described in the next column. | N = 8\*i where i = {1, 2, ... , 32} |

  The layout of the fragments held by different threads is shown in Figure 156.

  ![WGMMA .m64nNk32 register fragment layout for accumulator matrix D.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N32-D.png)

  **Figure 156** WGMMA .m64nNk32 register fragment layout for accumulator matrix D.

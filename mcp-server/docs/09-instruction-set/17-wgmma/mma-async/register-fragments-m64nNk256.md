# 9.7.17.5.1.1.4. Matrix Fragments for wgmma.mma_async.m64nNk256

A warpgroup executing `wgmma.mma_async.m64nNk256` will compute an MMA operation of shape `.m64nNk256` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A in registers:

  | `.atype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.b1` | A vector expression containing four `.b32` registers, with each register containing thirty two `.b1` elements from matrix A. | a0, a1, a2, …, a127 |

  The layout of the fragments held by different threads is shown in Figure 157.

  ![WGMMA .m64nNk256 register fragment layout for matrix A.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N256-A.png)

  **Figure 157** WGMMA .m64nNk256 register fragment layout for matrix A.

- Accumulator D:

  | `.dtype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.s32` | A vector expression containing N/2 number of `.s32` registers. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N = 8\*i where i = {1, 2, 3, 4}<br>= 16\*i where i = {3, 4, ..., 15, 16} |

  The layout of the fragments held by different threads is shown in Figure 158.

  ![WGMMA .m64nNk256 register fragment layout for accumulator matrix D.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N256-D.png)

  **Figure 158** WGMMA .m64nNk256 register fragment layout for accumulator matrix D.

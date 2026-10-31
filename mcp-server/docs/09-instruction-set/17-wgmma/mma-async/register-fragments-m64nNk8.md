# 9.7.17.5.1.1.2. Matrix Fragments for wgmma.mma_async.m64nNk8

A warpgroup executing `wgmma.mma_async.m64nNk8` will compute an MMA operation of shape `.m64nNk8` where N is a valid n dimension as listed in [Matrix Shape](../matrix-shapes.md).

Elements of the matrix are distributed across the threads in a warpgroup so each thread of the warpgroup holds a fragment of the matrix.

- Multiplicand A in registers:

  | `.atype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.tf32` | A vector expression containing four `.b32` registers containing four `.tf32` elements from matrix A. | a0, a1, a2, a3 |

  The layout of the fragments held by different threads is shown in Figure 153.

  ![WGMMA .m64nNk8 register fragment layout for matrix A.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N8-A.png)

  **Figure 153** WGMMA .m64nNk8 register fragment layout for matrix A.

- Accumulator D:

  | `.dtype` | Fragment | Elements (low to high) |
  |---|---|---|
  | `.f32` | A vector expression containing N/2 number of `.f32` registers. | d0, d1, d2, d3, …, dX, dY, dZ, dW<br>where X = N/2 - 4<br>Y = N/2 - 3<br>Z = N/2 - 2<br>W = N/2 - 1<br>N = 8\*i where i = {1, 2, ... , 32} |

  The layout of the fragments held by different threads is shown in Figure 154.

  ![WGMMA .m64nNk8 register fragment layout for accumulator matrix D.](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/wgmma-64N8-D.png)

  **Figure 154** WGMMA .m64nNk8 register fragment layout for accumulator matrix D.

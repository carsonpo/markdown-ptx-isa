# 9.7.18.10.6. Shared Memory Layout and Swizzling

If the bit Transpose A Matrix / Transpose B Matrix in the [Instruction descriptor](../instruction-descriptor.md) is 0, then K-major is used for matrix A / B respectively. If the bit Transpose A Matrix in the Instruction descriptor is 1 then M-major is used for matrix A. If the bit Transpose B Matrix in the Instruction descriptor is 1, then N-major is used for matrix B.

In a column-major default BLAS library such as cuBLAS, the matrices A and B with and without transpose can be classified as either K-Major or M-or-N-Major as shown in the following table:

| Matrix | Non-Transposed | Transposed |
|--------|----------------|------------|
| A | K-major | M-major |
| B | K-major | N-major |

To avoid confusion with A, B, row-major, col-major, transpose, and non-transpose, we will use MN-Major and K-Major throughout this section.

The matrices in the shared memory are made up of one or more "swizzle layout atom". The exact layout of these swizzle atoms depends on the swizzling mode, swizzle-atomicity, and the leading dimension. The layout of the swizzle are shown in Table 67

**Table 67** Layout for swizzle atoms

| Swizzling mode and Swizzle-Atomicity | Leading Dimension | Swizzle atom layout (128b element) |
|--------------------------------------|-------------------|------------------------------------|
| 128B Swizzling with 32B atomicity | M/N | 8x4 |
| 128B Swizzling with 32B atomicity | – | – |
| 128B Swizzling with 16B atomicity | M/N | 8x8 |
| 128B Swizzling with 16B atomicity | K | 8x8 |
| 64B Swizzling Mode | M/N | 4x8 |
| 64B Swizzling Mode | K | 8x4 |
| 32B Swizzling Mode | M/N | 2x8 |
| 32B Swizzling Mode | K | 8x2 |
| None | M/N | 1x8 |
| None | K | 8x1 |

The above shapes are for elements of size 128 bits. For smaller element sizes, the same shapes would get multiplied along the leading dimension by a factor of 128 / sizeof_bits(Element). For example, 128B MN major swizzle atom would have a shape of (8\*(128/32))x8 = 32x8 for `tf32` tensor core inputs.

Some example Layouts of MxK or KxN matrices with various swizzling modes, and are in units of 128b elements as shown by each colored cell as shown in Figure 225, Figure 226, Figure 227, Figure 228, Figure 229, Figure 230, Figure 231, Figure 232, Figure 233.

![MN major 128B swizzling with 32B atomicity](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-128B-32B-atom-mn.png)

**Figure 225** MN major 128B swizzling with 32B atomicity

![MN major 128B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-128B-mn.png)

**Figure 226** MN major 128B swizzling

![K major 128B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-128B-k.png)

**Figure 227** K major 128B swizzling

![MN major 64B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-64B-mn.png)

**Figure 228** MN major 64B swizzling

![K major 64B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-64B-k.png)

**Figure 229** K major 64B swizzling

![MN major 32B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-32B-mn.png)

**Figure 230** MN major 32B swizzling

![K major 32B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-32B-k.png)

**Figure 231** K major 32B swizzling

![MN major no-swizzling mode](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-no-swizzle-mn.png)

**Figure 232** MN major no-swizzling mode

![K major no-swizzling mode](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-no-swizzle-k.png)

**Figure 233** K major no-swizzling mode

Following are some of the examples of the 128B swizzling layout for `tf32` element type.

- K-Major: Figure 234

  ![K major](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-k.png)

  **Figure 234** K major

- MN-Major: Figure 235

  ![MN major](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-smem-layout-mn.png)

  **Figure 235** MN major

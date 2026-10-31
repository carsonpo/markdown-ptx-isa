# 9.7.18.10.8. Decompression of input matrices

The `tcgen05.mma` instructions with the following `.kind` qualifier:

- `.kind::f8f6f4`
- `.kind::mxf8f6f4`

supports decompression of pre-compressed input matrix B.

The values of the matrix B reside in a lookup table in the Tensor Memory and the input operand in the instruction points to a compressed matrix which contains the indices into the lookup table.

Figure 279 shows the layout of Lookup table stored in Tensor Memory.

![Layout of Lookup table in Tensor Memory](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompress-lut-b-layout.png)

**Figure 279** Layout of Lookup table in Tensor Memory

B matrix of shape NxK is compressed as shown in Figure 280.

![B matrix of NxK compressed for 8B LUT](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/decompress-lut-b-matrix.png)

**Figure 280** B matrix of NxK compressed for 8B LUT

Figure 281 shows how the compressed Matrix B is used in the matrix computation.

![Matrix B usage in computation](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/decompress-matrix-b-usage.png)

**Figure 281** Matrix B usage in computation

Figure 282 shows the GMEM and TMEM layouts of the lookup table. The GMEM layout shows 4 blocks of 128B such that each block contains 8 rows and 2 columns.

![GMEM and TMEM layout of look-up-table](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/gmem-tmem-layout-lut-b.png)

**Figure 282** GMEM and TMEM layout of look-up-table

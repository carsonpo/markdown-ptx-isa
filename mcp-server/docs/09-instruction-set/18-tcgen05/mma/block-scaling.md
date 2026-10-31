# 9.7.18.10.7. Block Scaling for tcgen05.mma

The `tcgen05.mma` instructions with the following `.kind` qualifier:

- `.kind::mxf8f6f4`
- `.kind::mxf4`
- `.kind::mxf4nvf4`

perform matrix multiplication with block scaling. This operation has the following form:

```ptx
(A * scale_A)  * (B * scale_B) + D
```

where `scale_A` and `scale_B` are matrices residing in Tensor Memory.

For a `scale_A` matrix of shape M x SFA_N, each row of matrix A is divided into SFA_N number of chunks and each chunk of a row is multiplied with the corresponding element in the SF_A of the same row.

Similarly, for a `scale_B` matrix of shape SFB_M x N, each column of matrix B is divided into the SFB_M number of chunks and each chunk of a column is multiplied with the corresponding element in the SF_B of the same column.

Scale factor for B matrix needs to be duplicated to all 32 lane partitions of tensor memory. But for the A matrix, the duplication is not necessary if the scales are copied into Tensor Memory via `tcgen05.st` on `sm_107f` architecture.

Figure 236 shows an example of `tcgen05.mma` with block scaling of `scale_vec::2X`.

![tcgen05.mma with block scaling of scale_vec::2X](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-block-scaling.png)

**Figure 236** tcgen05.mma with block scaling of scale_vec::2X

## 9.7.18.10.7.1. Valid combinations of scale_vectorsize with types and MMA-Kind

The shape of `scale_A` and `scale_B` matrices depend on the `.scale_vectorsize` as shown in Table 68.

**Table 68** Valid combinations of scale_vectorsize and shapes

| `.scale_vectorsize` | `.kind::*` | K | Shape of `scale_A` | Shape of `scale_B` |
|---------------------|------------|---|--------------------|--------------------|
| `.scale_vec::1X` | `.kind::mxf8f6f4` | All supported values of K | M x 1 | 1 x N |
| `.scale_vec::2X` | `.kind::mxf4`, `.kind::mxf4nvf4` | All supported values of K | M x 2 | 2 x N |
| `.scale_vec::4X` | `.kind::mxf4nvf4` | All supported values of K | M x 4 | 4 x N |
| `.block16` | `.kind::mxf4nvf4` | K = 96 | M x 6 | 6 x N |
| `.block16` | `.kind::mxf4nvf4` | K = 128 | M x 8 | 8 x N |
| `.block16` | `.kind::mxf4nvf4` | All supported values of K except 96 | M x 4 | 4 x N |
| `.block32` | `.kind::mxf4`, `.kind::mxf4nvf4` | K = 96 | M x 3 | 3 x N |
| `.block32` | `.kind::mxf4`, `.kind::mxf4nvf4` | K = 128 | M x 4 | 4 x N |
| `.block32` | `.kind::mxf4`, `.kind::mxf4nvf4` | All supported values of K except 96 | M x 2 | 2 x N |
| `.block32` | `.kind::mxf8f6f4` | All supported values of K | M x 1 | 1 x N |

The valid combination of the exact element types and the `.scale_vectorsize` are listed in Table 69.

**Table 69** Valid combinations of scale_vectorsize with types and MMA-Kind

| `.kind::*` | Element Data Type | Scale Data Type | `.scale_vectorsize` |
|------------|-------------------|-----------------|---------------------|
| `.kind::mxf8f6f4` | E4M3, E5M2, E2M3 E3M2, E2M1 | UE8M0 | `.scale_vec::1X` / `.block32` |
| `.kind::mxf4` | E2M1 | UE8M0 | `.scale_vec::2X` / `.block32` |
| `.kind::mxf4nvf4` | E2M1 | UE8M0 | `.scale_vec::2X` / `.block32`, `.scale_vec::4X` / `.block16` |
| `.kind::mxf4nvf4` | E2M1 | UE4M3 | `.scale_vec::2X` / `.block32`, `.scale_vec::4X` / `.block16` |
| `.kind::mxf4nvf4` | E2M1 | UE5M3 | `.scale_vec::2X` / `.block32`, `.scale_vec::4X` / `.block16` |

New `.blockN` qualifiers are aliases for `.scale_vec::NX` qualifiers as:

- `.block32` is alias for `.scale_vec::1X` or `.scale_vec::2X` based on `.kind` and K dimension
- `.block16` is alias for `.scale_vec::4X`

**Target ISA Note**

- Support for scale type UE5M3 requires target architecture `sm_107f` or higher in the same family, otherwise behavior is undefined.
- Support for scale type UE4M3 with scale_vectorsize `.block32` requires target architecture `sm_107f` or higher in the same family, otherwise behavior is undefined.

## 9.7.18.10.7.2. Scale Factor A ID

The value of the scale factor A ID selects the sub-columns in the Tensor Memory to form the scale factor A matrix, which is used to scale the matrix A.

The following shows the scale factor matrix layout for various scale vector sizes:

### 9.7.18.10.7.2.1. Layout of the Scale Factor A Matrix for scale_vec::1X/block32 with K=32/K=64

There is one scale factor per row of the A matrix with block size as 32 and the scale factor must be provided in 1-byte aligned sub-column of the Tensor Memory. SFA_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 237 shows which sub-columns get selected for different values of SFA_ID.

![Layout of scale factor A matrix with scale_vec::1X/block32 with K=32/K=64](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-1x-dig.png)

**Figure 237** Layout of scale factor A matrix with scale_vec::1X/block32 with K=32/K=64

For example, if SFA_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, SFA_ID values of 1, 2 and 3 would select the blue, yellow, and red columns, respectively.

Figure 238 shows the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with scale_vec::1X/block32 with K=32/K=64 with 128 lanes](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-1x-128-lane-dig.png)

**Figure 238** Layout of scale factor A matrix with scale_vec::1X/block32 with K=32/K=64 with 128 lanes

### 9.7.18.10.7.2.2. Layout of the Scale Factor A Matrix for scale_vec::2X/block32 with K=64/K=128

There are two scale factors per row of the A matrix with block size as 32 and the scale factor must be provided in 2-byte aligned sub-column of the Tensor Memory. SFA_ID specifies the half word offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 239 shows which sub-columns get selected for different values of SFA_ID.

![Layout of scale factor A matrix with scale_vec::2X/block32 with K=64/K=128](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-2x-dig.png)

**Figure 239** Layout of scale factor A matrix with scale_vec::2X/block32 with K=64/K=128

For example, if SFA_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, if SFA_ID is 2, then all of the blue columns are selected to form the scale factor matrix.

Figure 240 shows the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with scale_vec::2X/block32 with K=64/K=128 with 128 lanes](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-2x-128-lane-dig.png)

**Figure 240** Layout of scale factor A matrix with scale_vec::2X/block32 with K=64/K=128 with 128 lanes

### 9.7.18.10.7.2.3. Layout of the Scale Factor A Matrix for scale_vec::4X/block16 with K=64/K=128

There are four scale factors per row of the A matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. The SFA_ID value must be 0 and this specifies that all of the columns (in green) will be used for the scale factor matrix. Figure 241 shows which sub-columns get selected for different values of SFA_ID.

![Layout of scale factor A matrix with scale_vec::4X/block16 with K=64/K=128](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-4x-dig.png)

**Figure 241** Layout of scale factor A matrix with scale_vec::4X/block16 with K=64/K=128

Figure 242 shows the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with scale_vec::4X/block16 with K=64/K=128 with 128 lanes](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-4x-128-lane-dig.png)

**Figure 242** Layout of scale factor A matrix with scale_vec::4X/block16 with K=64/K=128 with 128 lanes

### 9.7.18.10.7.2.4. Layout of the Scale Factor A Matrix for block32 with K=96 (Semantically equivalent to scale_vec::3X)

There are three scale factors per row of the A matrix with block size as 32 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFA_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 243, Figure 244, Figure 245 and Figure 246 show which sub-columns get selected for different values of SFA_ID.

![Layout of scale factor A matrix with block32 with K=96 with SFA_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-dig1.png)

**Figure 243** Layout of scale factor A matrix with block32 with K=96 with SFA_ID=00

![Layout of scale factor A matrix with block32 with K=96 with SFA_ID=01](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-dig2.png)

**Figure 244** Layout of scale factor A matrix with block32 with K=96 with SFA_ID=01

![Layout of scale factor A matrix with block32 with K=96 with SFA_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-dig3.png)

**Figure 245** Layout of scale factor A matrix with block32 with K=96 with SFA_ID=10

![Layout of scale factor A matrix with block32 with K=96 with SFA_ID=11](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-dig4.png)

**Figure 246** Layout of scale factor A matrix with block32 with K=96 with SFA_ID=11

For example, if SFA_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, SFA_ID values of 1, 2 and 3 would select the blue, yellow, and red columns, respectively.

Figure 247, Figure 248, Figure 249 and Figure 250 show the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-128-lane-dig1.png)

**Figure 247** Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=00

![Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=01](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-128-lane-dig2.png)

**Figure 248** Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=01

![Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-128-lane-dig3.png)

**Figure 249** Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=10

![Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=11](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block32-k96-128-lane-dig4.png)

**Figure 250** Layout of scale factor A matrix with block32 with K=96 with 128 lanes SFA_ID=11

### 9.7.18.10.7.2.5. Layout of the Scale Factor A Matrix for block16 with K=96 (Semantically equivalent to scale_vec::6X)

There are six scale factors per row of the A matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFA_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 251 and Figure 252 show which sub-columns get selected for different values of SFA_ID.

![Layout of scale factor A matrix with block16 with K=96 with SFA_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k96-dig1.png)

**Figure 251** Layout of scale factor A matrix with block16 with K=96 with SFA_ID=00

![Layout of scale factor A matrix with block16 with K=96 with SFA_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k96-dig2.png)

**Figure 252** Layout of scale factor A matrix with block16 with K=96 with SFA_ID=10

For example, if SFA_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, if SFA_ID is 2, then all of the blue columns are selected to form the scale factor matrix.

Figure 253 and Figure 254 show the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with block16 with K=96 with 128 lanes with SFA_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k96-128-lane-dig1.png)

**Figure 253** Layout of scale factor A matrix with block16 with K=96 with 128 lanes with SFA_ID=00

![Layout of scale factor A matrix with block16 with K=96 with 128 lanes with SFA_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k96-128-lane-dig2.png)

**Figure 254** Layout of scale factor A matrix with block16 with K=96 with 128 lanes with SFA_ID=10

### 9.7.18.10.7.2.6. Layout of the Scale Factor A Matrix for block16 with K=128/256 (Semantically equivalent to scale_vec::8X)

There are eight scale factors per row of the A matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFA_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix and must be 0. Figure 255 shows which sub-columns get selected.

![Layout of scale factor A matrix with block16 with K=128/256](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k128_256-dig.png)

**Figure 255** Layout of scale factor A matrix with block16 with K=128/256

Figure 256 shows the scale factor A matrix layout with 128 lanes which is supported on `sm_107f` architecture. Valid values of subp here are [0, 3];

![Layout of scale factor A matrix with block16 with K=128/256 with 128 lanes](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-a-block16-k128_256-128-lane-dig.png)

**Figure 256** Layout of scale factor A matrix with block16 with K=128/256 with 128 lanes

## 9.7.18.10.7.3. Scale Factor B ID

The value of the scale factor B ID selects the sub-columns in the Tensor Memory to form the scale factor B matrix, which is used to scale the matrix B.

The following shows the scale factor matrix layout for various scale vector sizes:

### 9.7.18.10.7.3.1. Layout of the Scale Factor B Matrix for scale_vec::1X/block32 with K=32/K=64

There is one scale factor per row of the B matrix with block size as 32 and the scale factor must be provided in 1-byte aligned sub-column of the Tensor Memory. SFB_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 257 shows which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with scale_vec::1X/block32 with K=32/K=64](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-1x-dig.png)

**Figure 257** Layout of scale factor B matrix with scale_vec::1X/block32 with K=32/K=64

For example, if SFB_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, SFB_ID values of 1, 2 and 3 would select the blue, yellow, and red columns, respectively.

### 9.7.18.10.7.3.2. Layout of the Scale Factor B Matrix for scale_vec::2X/block32 with K=64/K=128

There are two scale factors per row of the B matrix with block size as 32 and the scale factor must be provided in 2-byte aligned sub-column of the Tensor Memory. SFB_ID specifies the half word offset in the Tensor Memory word that must be used for the scale factor matrix. Figure 258 shows which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with scale_vec::2X/block32 with K=64/K=128](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-2x-dig.png)

**Figure 258** Layout of scale factor B matrix with scale_vec::2X/block32 with K=64/K=128

For example, if SFB_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, if SFB_ID is 2, then all of the blue columns are selected to form the scale factor matrix.

### 9.7.18.10.7.3.3. Layout of the Scale Factor B Matrix for scale_vec::4X/block16 with K=64/K=128

There are four scale factors per row of the B matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. The SFB_ID value must be 0 and this specifies that all of the columns (in green) will be used for the scale factor matrix. Figure 259 shows which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with scale_vec::4X/block16 with K=64/K=128](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-4x-dig.png)

**Figure 259** Layout of scale factor B matrix with scale_vec::4X/block16 with K=64/K=128

### 9.7.18.10.7.3.4. Layout of the Scale Factor B Matrix for block32 with K=96 (Semantically equivalent to scale_vec::3X)

There are three scale factors per row of the B matrix with block size as 32 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFB_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix.

For N<=128, Figure 260, Figure 261, Figure 262 and Figure 263 show which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-nlt128-dig1.png)

**Figure 260** Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=00

![Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=01](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-nlt128-dig2.png)

**Figure 261** Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=01

![Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-nlt128-dig3.png)

**Figure 262** Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=10

![Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=11](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-nlt128-dig4.png)

**Figure 263** Layout of scale factor B matrix with block32 with K=96 and N<=128 with SFB_ID=11

For N>128, Figure 264, Figure 265, Figure 266, Figure 267, Figure 268 and Figure 269 show which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig1.png)

**Figure 264** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=00

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=01](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig2.png)

**Figure 265** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=01

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig3.png)

**Figure 266** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=10

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig4.png)

**Figure 267** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=10

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=11](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig5.png)

**Figure 268** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=11

![Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=11](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block32-k96-ngt128-dig6.png)

**Figure 269** Layout of scale factor B matrix with block32 with K=96 and N>128 with SFB_ID=11

For example, if SFB_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, SFB_ID values of 1, 2 and 3 would select the blue, yellow, and red columns, respectively.

### 9.7.18.10.7.3.5. Layout of the Scale Factor B Matrix for block16 with K=96 (Semantically equivalent to scale_vec::6X)

There are six scale factors per row of the B matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFB_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix.

For N<=128, Figure 270 and Figure 271 show which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block16 with K=96 and N<=128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-nlt128-dig1.png)

**Figure 270** Layout of scale factor B matrix with block16 with K=96 and N<=128 with SFB_ID=00

![Layout of scale factor B matrix with block16 with K=96 and N<=128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-nlt128-dig2.png)

**Figure 271** Layout of scale factor B matrix with block16 with K=96 and N<=128 with SFB_ID=10

For N>128, Figure 272, Figure 273, Figure 274 and Figure 275 show which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-ngt128-dig1.png)

**Figure 272** Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=00

![Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-ngt128-dig2.png)

**Figure 273** Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=00

![Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-ngt128-dig3.png)

**Figure 274** Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=10

![Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=10](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k96-ngt128-dig4.png)

**Figure 275** Layout of scale factor B matrix with block16 with K=96 and N>128 with SFB_ID=10

For example, if SFB_ID is 0, then all the green columns are selected to form the scale factor matrix. Similarly, if SFB_ID is 2, then all of the blue columns are selected to form the scale factor matrix.

### 9.7.18.10.7.3.6. Layout of the Scale Factor B Matrix for block16 with K=128/256 (Semantically equivalent to scale_vec::8X)

There are eight scale factors per row of the B matrix with block size as 16 and the scale factor must be provided in 4-byte aligned sub-column of the Tensor Memory. SFB_ID specifies the byte offset in the Tensor Memory word that must be used for the scale factor matrix.

For N<=128, Figure 276 shows which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block16 with K=128/256 and N<=128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k128-256-nlt128-dig1.png)

**Figure 276** Layout of scale factor B matrix with block16 with K=128/256 and N<=128 with SFB_ID=00

For N>128, Figure 277 and Figure 278 show which sub-columns get selected for different values of SFB_ID.

![Layout of scale factor B matrix with block16 with K=128/256 and N>128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k128-256-ngt128-dig1.png)

**Figure 277** Layout of scale factor B matrix with block16 with K=128/256 and N>128 with SFB_ID=00

![Layout of scale factor B matrix with block16 with K=128/256 and N>128 with SFB_ID=00](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-mma-scale-factor-b-block16-k128-256-ngt128-dig2.png)

**Figure 278** Layout of scale factor B matrix with block16 with K=128/256 and N>128 with SFB_ID=00

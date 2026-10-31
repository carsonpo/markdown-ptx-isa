# 9.7.18.10.9. Sparse Matrices

This instruction `tcgen05.mma.sp` can be used when the matrix A is a structured sparse matrix with 50% zeros in each row distributed as per its sparse granularity.

In a MxNxK sparse `tcgen05.mma.sp` operation, the matrix A of shape MxK is stored in a packed form as Mx(K/2) in memory. For each K-wide row of matrix A, 50% of elements are zeros and the remaining K/2 non-zero elements are stored in memory. The metadata specifies the mapping of the K/2 non-zero elements to the K elements before performing the MMA operation.

Granularity of sparse matrix A is defined as the ratio of the number of non-zero elements in a sub-chunk of the matrix row to the total number of elements in that sub-chunk where the size of the sub-chunk is shape-specific. The following table lists the granularity of different `tcgen05.mma.sp` variants:

| `.kind` of `tcgen05.mma` | Sparse Granularity | Sparsity Version |
|--------------------------|--------------------|------------------|
| `.kind::tf32` | 1:2 | N/A |
| `.kind::f16` | 2:4 | N/A |
| `.kind::ti16` | 2:4 | N/A |
| `.kind::f8f6f4` | 2:4 | N/A |
| `.kind::mxf8f6f4` | 2:4 | N/A |
| `.kind::i8` | 2:4 | N/A |
| `.kind::mxf4` | 4:8 (in pairs) | v0 |
| `.kind::mxf4` | 2:4 | v1 |
| `.kind::mxf4nvf4` | 4:8 (in pairs) | v0 |
| `.kind::mxf4nvf4` | 2:4 | v1 |

## 9.7.18.10.9.1. Sparse tcgen05.mma.sp with .kind::tf32

For `.kind::tf32`, matrix A is structured sparse at a granularity of 1:2. In other words, each chunk of two adjacent elements in a row of matrix A has one zero and one non-zero element. Only the non-zero element is stored in memory and the 4-bit index in the metadata indicates the position of the non-zero element in the two-wide chunk. The only meaningful values of the index are:

- `0b1110`
- `0b0100`

Rest of the values result in undefined behavior.

![Sparse tcgen05.mma metadata example for tf32 kind](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-mma-metadata-tf32.png)

**Figure 283** Sparse tcgen05.mma metadata example for tf32 kind

## 9.7.18.10.9.2. Sparse tcgen05.mma.sp with .kind::f16, .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::ti16

For the following `.kind` variants of `tcgen05.mma`:

- `.kind::f16`
- `.kind::f8f6f4`
- `.kind::mxf8f6f4`
- `.kind::i8`
- `.kind::ti16`

matrix A is structured sparse at a granularity of 2:4. In other words, each chunk of four adjacent elements in a row of matrix A has two zero and two non-zero elements. Only the non-zero elements are stored in memory and the two 2-bit indices in the metadata indicates the position of the two non-zero elements in the four-wide chunk. The only meaningful values of the index are:

- `0b0100`
- `0b1000`
- `0b1100`
- `0b1001`
- `0b1101`
- `0b0110`
- `0b1110`

![Sparse tcgen05.mma metadata example for f16/f8f6f4/mxf8f6f4 kind](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-mma-metadata-f16-f8f6f4-mxf8f6f4.png)

**Figure 284** Sparse tcgen05.mma metadata example for f16/f8f6f4/mxf8f6f4 kind

## 9.7.18.10.9.3. Sparse tcgen05.mma.sp with .kind::mxf4 and .kind::mxf4nvf4

The sparsity granularity for `.kind::mxf4` and `.kind::mxf4nvf4` is determined by the SparsityVersion field (bit 12) of the [Instruction descriptor](../instruction-descriptor.md):

- SparsityVersion v0 (bit 12 = 0): Applicable to `sm_100a`, `sm_103a`, and `sm_110a`. Matrix A is pair-wise structured sparse at a granularity of 4:8. Each chunk of eight adjacent elements in a row has four zeros and four non-zero elements, clustered in two-element sub-chunks. Only the four non-zero elements are stored in memory and the two 2-bit indices in the metadata indicate the positions of the two non-zero two-wide sub-chunks within the eight-wide chunk.
- SparsityVersion v1 (bit 12 = 1): Applicable to `sm_107a`. Matrix A is structured sparse at a granularity of 2:4. Each chunk of four adjacent elements in a row has two zeros and two non-zero elements. Only the two non-zero elements are stored in memory and the two 2-bit indices in the metadata indicate the positions of the two non-zero elements within the four-wide chunk. The metadata format and valid index values are the same as for `.kind::mxf8f6f4` (see Sparse tcgen05.mma.sp with .kind::f16, .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::ti16).

The only meaningful values of the metadata index are:

- `0b0100`
- `0b1000`
- `0b1100`
- `0b1001`
- `0b1101`
- `0b0110`
- `0b1110`

Rest of the values result in undefined behavior.

> **Note:** Bit 12 of the instruction descriptor (SparsityVersion) must be set to v0 for `sm_100a`, `sm_103a`, `sm_110a` and to v1 for `sm_107a`. Using the wrong SparsityVersion results in undefined behavior. See [Instruction descriptor](../instruction-descriptor.md) for details.

![Sparse tcgen05.mma metadata example for mxf4 kind (SparsityVersion v0, 4:8)](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-mma-metadata-mxf4.png)

**Figure 285** Sparse tcgen05.mma metadata example for mxf4 kind (SparsityVersion v0, 4:8)

![Sparse tcgen05.mma metadata example for mxf4 kind (SparsityVersion v1, 2:4)](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-mma-metadata-mxf4-v1.png)

**Figure 286** Sparse tcgen05.mma metadata example for mxf4 kind (SparsityVersion v1, 2:4)

## 9.7.18.10.9.4. Sparsity selector

The value of the sparsity selector selects the sub-columns in the Tensor Memory to form the sparsity metadata matrix, which is used with matrix A to form the multiplicand matrix.

The following shows the sparse metadata matrix layout in Tensor Memory for various MMA variants:

### 9.7.18.10.9.4.1. Layout of the Sparsity Metadata Matrix for M = 64 for .kind::f16, .kind::ti16

Figure 287 shows which sub-columns get selected for different values of Sparsity Selector.

![Sparsity Metadata Layout for M = 64 for .kind::f16](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-f16-m64.png)

**Figure 287** Sparsity Metadata Layout for M = 64 for .kind::f16

### 9.7.18.10.9.4.2. Layout of the Sparsity Metadata Matrix for M = 128 / M = 256 for .kind::f16, .kind::ti16

Figure 288 shows which sub-columns get selected for different values of Sparsity Selector.

![Sparsity Metadata Layout for M = 128 / M = 256 for .kind::f16](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-f16-m128-256.png)

**Figure 288** Sparsity Metadata Layout for M = 128 / M = 256 for .kind::f16

### 9.7.18.10.9.4.3. Layout of the Sparsity Metadata Matrix for M = 64 for .kind::tf32

Figure 289 shows which sub-columns get selected for different values of Sparsity Selector.

![Sparsity Metadata Layout for M = 64 for .kind::tf32](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-tf32-m64.png)

**Figure 289** Sparsity Metadata Layout for M = 64 for .kind::tf32

### 9.7.18.10.9.4.4. Layout of the Sparsity Metadata Matrix for M = 128 / M = 256 for .kind::tf32

Figure 290 shows which sub-columns get selected for different values of Sparsity Selector.

![Sparsity Metadata Layout for M = 128 / M = 256 for .kind::tf32](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-tf32-m128-256.png)

**Figure 290** Sparsity Metadata Layout for M = 128 / M = 256 for .kind::tf32

### 9.7.18.10.9.4.5. Layout of the Sparsity Metadata Matrix for M = 64 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4

The value of the sparsity selector:

- must be 0 for `.kind::i8` and `.kind::f8f6f4`
- is assumed to be 0 for `.kind::mxf8f6f4`, `.kind::mxf4` and `.kind::mxf4nvf4`

and all of the columns are selected as shown in Figure 291

![Sparsity Metadata Layout for M = 64 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-f8f6f4-mxf8f6f4-m64.png)

**Figure 291** Sparsity Metadata Layout for M = 64 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4

### 9.7.18.10.9.4.6. Layout of the Sparsity Metadata Matrix for M = 128 / M = 256 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4

The value of the sparsity selector:

- must be 0 for `.kind::i8` and `.kind::f8f6f4`
- is assumed to be 0 for `.kind::mxf8f6f4`, `.kind::mxf4` and `.kind::mxf4nvf4`

and all of the columns are selected as shown in Figure 292

![Sparsity Metadata Layout for M = 128 / M = 256 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-sparse-matrices-sparsity-selector-kind-f8f6f4-mxf8f6f4-m128-256.png)

**Figure 292** Sparsity Metadata Layout for M = 128 / M = 256 for .kind::f8f6f4, .kind::mxf8f6f4, .kind::i8, .kind::mxf4, .kind::mxf4nvf4

## 9.7.18.10.9.5. Alignment restriction

The layouts which utilize only half the datapath lanes as specified in [Data Path Layout Organization](data-path-layouts.md), i.e. Layout F and Layout C, must use the same alignment across matrices A, D and the sparsity metadata matrix.

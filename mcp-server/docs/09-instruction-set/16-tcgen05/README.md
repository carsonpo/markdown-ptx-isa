# 9.7.16. TensorCore 5th Generation Family Instructions

## 9.7.16.1. Tensor Memory

The 5th generation TensorCore has dedicated on-chip memory that is specialized for use by TensorCore operations. This Tensor Memory is organized as a two-dimensional matrix where the horizontal rows are called lanes and the vertical columns are called columns.

On architecture sm_100a/sm_100f, the 5th generation TensorCore's Tensor Memory has a two-dimensional structure of 512 columns and 128 rows per CTA, with each cell being 32-bits in size.

Restrictions on threads accessing the Tensor Memory via the load and store operations are specified in Access restrictions.

### 9.7.16.1.1. Tensor Memory Addressing

Tensor Memory addresses are 32-bit wide and specify two components.

- Lane index
- Column index

The layout is as follows:

| 31–16      | 15–0         |
|------------|--------------|
| Lane index | Column index |

Figure 182 shows the view of the Tensor Memory Layout within CTA.

![Tensor Memory Layout and Addressing](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-memory-layout.png)

**Figure 182** Tensor Memory Layout and Addressing

### 9.7.16.1.2. Tensor Memory Allocation

The Tensor Memory is dynamically allocated. The Tensor Memory must be allocated by a single warp in a CTA using the Tensor Memory Allocation and Management Instructions.

The allocation and deallocation of Tensor Memory is performed in terms of columns. The unit of allocation is 32 columns and the number of columns being allocated must be a power of 2. When a column is allocated, all 128 lanes of the column are allocated.

All of the Tensor Memory that was allocated in a kernel, must be explicitly deallocated before the kernel exits.

## 9.7.16.2. Matrix and Data Movement Shape

There are two kinds of shapes involved.

- Shapes in the data movement operations
- Shapes in the MMA operations

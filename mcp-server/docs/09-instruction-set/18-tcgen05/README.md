# 9.7.18. TensorCore 5th Generation Family Instructions

## 9.7.18.1. Tensor Memory

The 5th generation TensorCore has dedicated on-chip memory that is specialized for use by TensorCore operations. This Tensor Memory is organized as a two-dimensional matrix where the horizontal rows are called lanes and the vertical columns are called columns.

On architecture `sm_100a`/`sm_100f`, the 5th generation TensorCore's Tensor Memory has a two-dimensional structure of 512 columns and 128 rows per CTA, with each cell being 32-bits in size.

Restrictions on threads accessing the Tensor Memory via the load and store operations are specified in [Access restrictions](tensor-memory-load-store-rules.md).

### 9.7.18.1.1. Tensor Memory Addressing

Tensor Memory addresses are 32-bit wide and specify two components.

- Lane index
- Column index

The layout is as follows:

| 31–16      | 15–0         |
|------------|--------------|
| Lane index | Column index |

Figure 185 shows the view of the Tensor Memory Layout within CTA.

![Tensor Memory Layout and Addressing](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-memory-layout.png)

**Figure 185** Tensor Memory Layout and Addressing

### 9.7.18.1.2. Tensor Memory Allocation

The Tensor Memory is dynamically allocated. The Tensor Memory must be allocated by a single warp in a CTA using the [Tensor Memory Allocation and Management Instructions](tcgen05-alloc-dealloc-relinquish-alloc-permit.md).

The allocation and deallocation of Tensor Memory is performed in terms of columns. The unit of allocation is 32 columns and the number of columns being allocated must be a power of 2. When a column is allocated, all 128 lanes of the column are allocated.

All of the Tensor Memory that was allocated in a kernel, must be explicitly deallocated before the kernel exits.

## Pages

- [9.7.18.2. Matrix and Data Movement Shape](matrix-shapes.md) — the two kinds of shapes, the `tcgen05.mma` matrix shape table (Table 48) and how M, N and K are specified.
- [9.7.18.2.3. Data Movement Shape](data-movement-shapes.md) — `lane x size` shapes for `tcgen05.ld`/`.st`/`.cp`/`.shift` and the per-shape register fragment layouts.
- [9.7.18.3. Major-ness supported by Strides](strides-and-layouts.md) — leading dimension stride, stride dimension byte offset and the canonical CuTe layouts with worked examples.
- [9.7.18.4. Matrix Descriptors: Shared Memory Descriptor](shared-memory-descriptor.md) — format of the shared memory matrix descriptor.
- [9.7.18.4.2. Instruction descriptor](instruction-descriptor.md) — format of the instruction descriptor for `tcgen05.mma`.
- [9.7.18.4.3. Zero-column mask descriptor](zero-column-mask.md) — the zero-column mask descriptor.
- [9.7.18.5. Issue granularity](issue-granularity.md) — which `tcgen05` instructions are issued per-warp versus per-thread.
- [9.7.18.6. Memory Consistency Model](memory-consistency.md) — ordering rules for `tcgen05` operations and the async proxy.
- [9.7.18.7. Tensor Memory Allocation and Management Instructions](tcgen05-alloc-dealloc-relinquish-alloc-permit.md) — `tcgen05.alloc`, `tcgen05.dealloc` and `tcgen05.relinquish_alloc_permit`.
- [9.7.18.8. Tensor Memory and Register Load/Store Instructions](tensor-memory-load-store-rules.md) — access restrictions and packing/unpacking rules.
- [tcgen05.ld](tcgen05-ld.md) — load from Tensor Memory into registers.
- [tcgen05.st](tcgen05-st.md) — store from registers into Tensor Memory.
- [tcgen05.wait](tcgen05-wait.md) — wait for prior `tcgen05.ld`/`tcgen05.st` to complete.
- [9.7.18.9. Tensor Memory Data Movement Instructions](tensor-memory-data-movement.md) — data movement into Tensor Memory and optional decompression.
- [tcgen05.cp](tcgen05-cp.md) — copy from shared memory to Tensor Memory.
- [tcgen05.shift](tcgen05-shift.md) — shift rows of Tensor Memory down by one.
- [9.7.18.10. TensorCore 5th Generation Instructions: MMA](mma/README.md) — the `tcgen05.mma` family: layouts, packing, scaling, sparsity and the instructions.
- [tcgen05.fence](tcgen05-fence.md) — ordering fences for `tcgen05` operations.
- [tcgen05.commit](tcgen05-commit.md) — commit prior `tcgen05` operations to an mbarrier.

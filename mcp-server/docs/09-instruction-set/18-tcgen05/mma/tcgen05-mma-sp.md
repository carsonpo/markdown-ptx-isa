# 9.7.18.10.10.2. TensorCore 5th Generation Instructions: tcgen05.mma.sp

**tcgen05.mma.sp**

Perform the 5th generation of matrix multiply and accumulate operation with sparse A matrix.

## Syntax

```ptx
// 1. Floating-point type without block scaling:

tcgen05.mma.sp.cta_group.kind  [d-tmem],  a-desc,  b-desc, [sp-meta-tmem] ,  idesc,
                               { disable-output-lane }, enable-input-d{, scale-input-d};

tcgen05.mma.sp.cta_group.kind  [d-tmem], [a-tmem], b-desc, [sp-meta-tmem] , idesc,
                               { disable-output-lane }, enable-input-d{, scale-input-d};

.kind       = { .kind::f16, .kind::tf32, .kind::f8f6f4 }
.cta_group  = { .cta_group::1,  .cta_group::2 }

----------------------------------------------------------------------------------

// 2. Floating-point type with block scaling:

tcgen05.mma.sp.cta_group.kind.block_scale{.scale_vectorsize}
                                         [d-tmem],  a-desc,  b-desc , [sp-meta-tmem] , idesc,
                                         [scale-A-tmem], [scale-B-tmem], enable-input-d;

tcgen05.mma.sp.cta_group.kind.block_scale{.scale_vectorsize}
                                         [d-tmem], [a-tmem], b-desc , [sp-meta-tmem] , idesc,
                                         [scale-A-tmem], [scale-B-tmem], enable-input-d;

.scale_vectorsize = { .scale_vec::1X, .scale_vec::2X, .scale_vec::4X, .block16, .block32 }
.cta_group      = { .cta_group::1,  .cta_group::2 }
.kind = { .kind::mxf8f6f4, .kind::mxf4, .kind::mxf4nvf4 }

----------------------------------------------------------------------------------

// 3. Convolution MMA with floating-point type without block scaling:

tcgen05.mma.sp.cta_group.kind.collector_a_usage{.collector_b_usage}           [d-tmem],  a-desc,  b-desc,
                                                        [sp-meta-tmem] ,  idesc,
                                                        { disable-output-lane }, enable-input-d
                                                        {, scale-input-d};

tcgen05.mma.sp.cta_group.kind.ashift{.collector_a_usage}{.collector_b_usage}  [d-tmem], [a-tmem], b-desc,
                                                        [sp-meta-tmem] , idesc,
                                                        { disable-output-lane }, enable-input-d
                                                        {, scale-input-d};

tcgen05.mma.sp.cta_group.kind{.ashift}.collector_a_usage{.collector_b_usage}  [d-tmem], [a-tmem], b-desc,
                                                        [sp-meta-tmem] , idesc,
                                                        { disable-output-lane }, enable-input-d
                                                        {, scale-input-d};

.kind            = { .kind::f16, .kind::tf32, .kind::f8f6f4 }
.collector_a_usage = { .collector::buffer_a::op }
.collector_b_usage = { .collector::buffer_b::op }
::buffer_a         = { ::a }
::buffer_b         = { ::b }
::op             = { ::fill, ::use, ::lastuse, ::discard* }

----------------------------------------------------------------------------------

// 4. Activation Stationary MMA with floating-point type with block scaling:

tcgen05.mma.sp.cta_group.kind.block_scale{.scale_vectorsize}.collector_a_usage{.collector_b_usage}
                                         [d-tmem],  a-desc,  b-desc , [sp-meta-tmem] , idesc,
                                         [scale-A-tmem], [scale-B-tmem], enable-input-d;

tcgen05.mma.sp.cta_group.kind.block_scale{.scale_vectorsize}.collector_a_usage{.collector_b_usage}
                                         [d-tmem], [a-tmem], b-desc , [sp-meta-tmem] , idesc,
                                         [scale-A-tmem], [scale-B-tmem], enable-input-d;

.kind = { .kind::mxf8f6f4, .kind::mxf4, .kind::mxf4nvf4 }
.scale_vectorsize = { .scale_vec::1X, .scale_vec::2X, .scale_vec::4X, .block16, .block32 }
.collector_a_usage = { .collector::buffer_a::op }
.collector_b_usage = { .collector::buffer_b::op }
::buffer_a         = { ::a }
::buffer_b         = { ::b }
::op             = { ::fill, ::use, ::lastuse, ::discard* }

----------------------------------------------------------------------------------

// 5. Integer type:

tcgen05.mma.sp.cta_group.kind [d-tmem],  a-desc,  b-desc, [sp-meta-tmem] , idesc,
                              { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind [d-tmem], [a-tmem], b-desc, [sp-meta-tmem] , idesc,
                              { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind::ti16.collector_b_usage
                         [d-tmem],  a-desc,  b-desc, idesc,
                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind::ti16.collector_b_usage
                         [d-tmem], [a-tmem], b-desc, idesc,
                         { disable-output-lane }, enable-input-d;

.cta_group      = { .cta_group::1,  .cta_group::2 }
.kind = { .kind::i8, .kind::ti16 }
.collector_b_usage = { .collector::buffer::op }
::buffer         = { ::b }
::op             = { ::fill, ::use, ::lastuse, ::discard* }

----------------------------------------------------------------------------------

// 6. Convolution MMA with Integer type:

tcgen05.mma.sp.cta_group.kind.collector_a_usage          [d-tmem],  a-desc,  b-desc,
                                                         [sp-meta-tmem] , idesc,
                                                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind.ashift{.collector_a_usage} [d-tmem], [a-tmem], b-desc,
                                                         [sp-meta-tmem], idesc,
                                                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind{.ashift}.collector_a_usage [d-tmem], [a-tmem], b-desc,
                                                         [sp-meta-tmem], idesc,
                                                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind::ti16.collector_a_usage.collector_b_usage
                                                         [d-tmem],  a-desc,  b-desc, idesc,
                                                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind::ti16.ashift{.collector_a_usage}.collector_b_usage
                                                         [d-tmem], [a-tmem], b-desc, idesc,
                                                         { disable-output-lane }, enable-input-d;

tcgen05.mma.sp.cta_group.kind::ti16{.ashift}.collector_a_usage.collector_b_usage
                                                         [d-tmem], [a-tmem], b-desc, idesc,
                                                         { disable-output-lane }, enable-input-d;

.cta_group = { .cta_group::1,   .cta_group::2 }
.kind = { .kind::i8, .kind::ti16 }
.collector_a_usage = { .collector::buffer_a::op }
.collector_b_usage = { .collector::buffer_b::op }
::buffer_a         = { ::a }
::buffer_b         = { ::b }
::op             = { ::fill, ::use, ::lastuse, ::discard* }
```

## Description

Instruction `tcgen05.mma.sp` is an asynchronous instruction which initiates an MxNxK matrix multiply and accumulate operation of the form D = A\*B+D where the A matrix is Mx(K/2), the B matrix is KxN, and the D matrix is MxN. [Sparse Matrices](sparse-matrices.md) describes the details of the sparsity.

The operation of the form D = A\*B is issued when the input predicate argument `enable-input-d` is false.

The optional immediate argument `scale-input-d` can be specified to scale the input matrix D as follows: D = A\*B+D \* (2 ^ - `scale-input-d`)

The valid range of values for argument `scale-input-d` is [0, 15]. The argument `scale-input-d` is only valid for `.kind::tf32` and `.kind::f16`.

The 32-bit register operand `idesc` is the instruction descriptor as described in [Instruction descriptor](../instruction-descriptor.md), specifies the shapes, exact types, sparsity and other details of the input matrices, output matrix and the matrix multiply and accumulate operation.

The qualifier `.cta_group::1` specifies that the matrix multiply and accumulate operation is performed on the Tensor Memory of the executing thread's CTA only. The qualifier `.cta_group::2` specifies that the matrix multiply and accumulate operation is performed on the Tensor Memory of the executing thread's CTA and its peer CTA.

All `tcgen05` instructions within a kernel must specify the same value for the `.cta_group` qualifier.

The instruction `tcgen05.mma.sp` has single thread semantics, unlike the collective instructions `mma.sync` or `wgmma.mma_async`. So, a single thread issuing the `tcgen05.mma.sp` will result in the initiation of the whole matrix multiply and accumulate operation. Refer to the section [Issue Granularity](../issue-granularity.md).

The qualifier `.kind` specifies the general kind of the element types of the multiplicand matrices. The exact types of the elements of the input and output matrices for each MMA-kind are specified in the [Instruction descriptor](../instruction-descriptor.md).

The address operand `d-tmem` specifies the address of the destination and the accumulation matrix D in the Tensor Memory. The address operand `a-tmem` specifies the address of the matrix A in the Tensor Memory. The 64-bit register operand `a-desc` and `b-desc` are the matrix descriptors which represent the matrices A and B in shared memory respectively. The format of the matrix descriptor is described in [Matrix Descriptors](../shared-memory-descriptor.md).

The vector operand `disable-output-lane` specifies the lane(s) in the Tensor Memory that should be not be updated with the resultant matrix D. Elements of the vector operand `disable-output-lane` forms a mask where each bit corresponds to a lane of the Tensor Memory, with least significant bit of the first element of the vector (leftmost in syntax) corresponding to the lane 0 of the Tensor Memory. If a bit in the mask is 1, then the corresponding lane in the Tensor Memory for the resultant matrix D will not be updated. The size of the vector is as follows:

| `.cta_group` | Size of the vector `disable-output-lane` |
|---|---|
| `::1` | 4 |
| `::2` | 8 |

Qualifier `.block_scale` specifies that the matrices A and B are scaled with `scale_A` and `scale_B` matrices respectively before performing the matrix multiply and accumulate operation as specified in the section [Block Scaling for tcgen05.mma](block-scaling.md). The address operand `scale-A-tmem` and `scale-B-tmem` specify the base address the matrices `scale_A` and `scale_B` respectively in the Tensor Memory.

For qualifier `.scale_vectorsize`,

- If `.scale_vec::NX` is specified: N specifies the number of columns in `scale_A` matrix and number of rows in `scale_B` matrix.
- If `.blockN` is specified: N specifies the block size for which single scale factor will be applied. In this form, value of N is same as the K-dimension / (N of `.scale_vec::NX`).

Aliased `.scale_vectorsize` variants:

- `.block16` is aliased with:
  - `.scale_vec::4X` when `.kind` = `.kind::mxf4nvf4` and K = 64 or 128
- `.block32` is aliased with:
  - `.scale_vec::1X` when `.kind` = `.kind::mxf8f6f4` for all supported values of K
  - `.scale_vec::2X` when `.kind` = `.kind::mxf4` or `.kind::mxf4nvf4` and K = 64 or 128

The valid combinations of MMA-kind and `.scale_vectorsize` are described in [Table 68](block-scaling.md). For `.kind::mxf4` when the qualifier `.scale_vectorsize` is not specified, then it defaults to `.block32`. For `.kind::mxf4nvf4`, the qualifier `.scale_vectorsize` must be explicitly specified.

The qualifier `.ashift` shifts the rows of the A matrix down by one row, except for the last row in the Tensor Memory. Qualifier `.ashift` is only allowed with M = 128 or M = 256.

The qualifier `.collector_a_usage` specifies the usage of collector buffer for matrix A. The qualifier `.collector_b_usage` specifies the usage of collector buffer for matrix B. Following collector buffer operations can be specified:

| `.collector_usage` | Semantics |
|---|---|
| `.collector::a::fill`, `.collector::b::fill` | Specified matrix read from the memory should be filled in collector buffer. |
| `.collector::a::use`, `.collector::b::use` | Specified matrix can be read from the collector buffer. This requires a previous fill to the collector buffer to be still valid. |
| `.collector::a::lastuse`, `.collector::b::lastuse` | Specified matrix can be read from the collector buffer and the contents of the collector buffer can be discarded. This requires a previous fill to the collector buffer to be valid till the collector buffer is read. |
| `.collector::a::discard`, `.collector::b::discard` | Contents of the collector buffer for the specified matrix can be discarded. |

If no `.collector_a_usage` qualifier is specified, then it defaults to `.collector::a::discard`. If no `.collector_b_usage` qualifier is specified, then it defaults to `.collector::b::discard`. It is illegal to specify either of `.collector::a::use` or `.collector::a::fill` along with `.ashift`.

## PTX ISA Notes

Introduced in PTX ISA version 8.6.

Qualifier `.kind::mxf4nvf4` introduced in PTX ISA version 8.7.

Qualifiers `.block16` and `.block32` introduced in PTX ISA version 8.8.

Qualifier `.kind::ti16` introduced in PTX ISA version 9.4.

Qualifiers `.collector::b::*` introduced in PTX ISA version 9.4.

## Target ISA Notes

Supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8 except `.kind::i8`/`.kind::mxf4nvf4`/`.kind::mxf4`:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifier `.kind::i8` is supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- `sm_110a`

Qualifiers `.kind::mxf4nvf4` and `.kind::mxf4` are supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- `sm_103a`
- `sm_107a`
- `sm_110a`

Argument `scale-input-d` requires `sm_100a` and is supported on `sm_100f` or higher in the same family from PTX ISA version 8.8.

For `.scale_vectorsize`,

- `.scale_vec::1X`, `.scale_vec::2X`, `.scale_vec::4X` requires `sm_100a`.
- `.block16`, `.block32` requires `sm_100f` or `sm_110f`.

For Target ISA details on matrix shape, check [Target ISA Note](../matrix-shapes.md).

For Target ISA details on shared memory descriptor, check [Target ISA Note](../shared-memory-descriptor.md).

Qualifier `.kind::ti16` supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifiers `.collector::b::*` supported on following architectures:

- `sm_107f`

## Examples

```ptx
tcgen05.mma.sp.cta_group::1.kind::f16      [taddr0],  adesc,  bdesc, [tmem_spmeta0], idesc, p;

tcgen05.mma.sp.cta_group::1.kind::mxf8f6f4.collector::a:fill
                                           [taddr2],  [taddr1],  bdesc, [tmem_spmeta1], idesc,
                                           [tmem_scaleA], [tmem_scaleB], p;

tcgen05.commit.cta_group::1.mbarrier::arrive::one.b64 [mbarObj0];

loop:
mbarrier.try_wait.parity.b64 p, [mbarObj0], 0;
@!p bra loop;
```

### 9.7.9.25.4. Data Movement and Conversion Instructions: Bulk copy

#### 9.7.9.25.4.1. Data Movement and Conversion Instructions: cp.async.bulk

##### cp.async.bulk

Initiates an asynchronous copy operation from one state space to another.

**Syntax**

```
// global -> shared::cta
cp.async.bulk.dst.src.completion_mechanism{.level::cache_hint}{.ignore_oob}
                      [dstMem], [srcMem], size{, ignoreBytesLeft, ignoreBytesRight}, [mbar] {, cache-policy}

.dst =                  { .shared::cta }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes }
.level::cache_hint =    { .L2::cache_hint }


// global -> shared::cluster
cp.async.bulk.dst.src.completion_mechanism{.multicast}{.level::cache_hint}
                      [dstMem], [srcMem], size, [mbar] {, ctaMask} {, cache-policy}

.dst =                  { .shared::cluster }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes }
.level::cache_hint =    { .L2::cache_hint }
.multicast =            { .multicast::cluster }


// shared::cta -> shared::cluster
cp.async.bulk.dst.src.completion_mechanism [dstMem], [srcMem], size, [mbar]

.dst =                  { .shared::cluster }
.src =                  { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes }


// shared::cta -> global
cp.async.bulk.dst.src.completion_mechanism{.level::cache_hint}{.cp_mask}
                      [dstMem], [srcMem], size {, cache-policy} {, byteMask}

.dst =                  { .global }
.src =                  { .shared::cta }
.completion_mechanism = { .bulk_group }
.level::cache_hint =    { .L2::cache_hint }
```

**Description**

cp.async.bulk is a non-blocking instruction which initiates an asynchronous bulk-copy operation from the location specified by source address operand srcMem to the location specified by destination address operand dstMem.

The direction of bulk-copy is from the state space specified by the `.src` modifier to the state space specified by the `.dst` modifiers.

The 32-bit operand size specifies the amount of memory to be copied, in terms of number of bytes. size must be a multiple of 16. If the value is not a multiple of 16, then the behavior is undefined. The memory range [dstMem, dstMem + size - 1] must not overflow the destination memory space and the memory range [srcMem, srcMem + size - 1] must not overflow the source memory space. Otherwise, the behavior is undefined. The addresses dstMem and srcMem must be aligned to 16 bytes.

The optional qualifier `.ignore_oob` specifies that up to 15 bytes at the beginning or ending of [srcMem .. srcMem+size) may be out-of-bounds of a global memory allocation, and the value of the corresponding bytes in destination shared memory [dstMem .. dstMem+size) is indeterminate. The 32-bit operands ignoreBytesLeft and ignoreBytesRight are used to specify the bytes from beginning and ending of the copy-chunk specified by size that may go out of bounds. The only valid values for ignoreBytesLeft and ignoreBytesRight are [0..15]. The qualifier `.ignore_oob` is only available for the global to `.shared::cta` copy direction.

When the destination of the copy is `.shared::cta` the destination address has to be in the shared memory of the executing CTA within the cluster, otherwise the behavior is undefined.

When the source of the copy is `.shared::cta` and the destination is `.shared::cluster`, the destination has to be in the shared memory of a different CTA within the cluster.

The modifier `.completion_mechanism` specifies the completion mechanism that is supported on the instruction variant:

| .completion-mechanism | .dst | .src | Completion mechanism |
|-----------------------|------|------|---------------------|
| .mbarrier::... | .shared::cta | .global | mbarrier based |
| | .shared::cluster | .global | |
| | .shared::cluster | .shared::cta | |
| .bulk_group | .global | .shared::cta | Bulk async-group based |

The modifier `.mbarrier::complete_tx::bytes` specifies that the cp.async.bulk variant uses mbarrier based completion mechanism. The complete-tx operation, with completeCount argument equal to amount of data copied in bytes, will be performed on the mbarrier object specified by the operand mbar.

The modifier `.bulk_group` specifies that the cp.async.bulk variant uses bulk async-group based completion mechanism.

The optional qualifier `.multicast::cluster` allows copying of data from global memory to shared memory of multiple CTAs in the cluster. Operand ctaMask specifies the destination CTAs in the cluster such that each bit position in the 16-bit ctaMask operand corresponds to the `%cluster_ctarank` of the destination CTA.

When the optional argument cache-policy is specified, the qualifier `.level::cache_hint` is required.

When the optional qualifier `.cp_mask` is specified, the argument byteMask is required. The i-th bit in the 16-bit wide byteMask operand specifies whether the i-th byte of each 16-byte wide chunk of source data is copied to the destination.

The copy operation in cp.async.bulk is treated as a weak memory operation and the complete-tx operation on the mbarrier has `.release` semantics at the `.cluster` scope.

**Notes**

`.multicast::cluster` qualifier is optimized for target architecture sm_90a/sm_100f/sm_100a/sm_103f/sm_103a/sm_110f/sm_110a and may have substantially reduced performance on other targets.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

Support for `.shared::cta` as destination state space is introduced in PTX ISA version 8.6.

Support for `.cp_mask` qualifier introduced in PTX ISA version 8.6.

Support for `.ignore_oob` qualifier introduced in PTX ISA version 9.2.

**Target ISA Notes**

Requires sm_90 or higher.

`.multicast::cluster` qualifier advised to be used with `.target` sm_90a or sm_100f or sm_100a or sm_103f or sm_103a or sm_110f or sm_110a.

Support for `.cp_mask` qualifier requires sm_100 or higher.

**Examples**

```ptx
// .global -> .shared::cta (strictly non-remote):
cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes.L2::cache_hint
                                             [dstMem], [srcMem], size, [mbar], cache-policy;

// .global -> .shared::cluster:
cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.multicast::cluster
                                             [dstMem], [srcMem], size, [mbar], ctaMask;

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.L2::cache_hint
                                             [dstMem], [srcMem], size, [mbar], cache-policy;


// .shared::cta -> .shared::cluster (strictly remote):
cp.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

// .shared::cta -> .global:
cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], size;

cp.async.bulk.global.shared::cta.bulk_group.L2::cache_hint} [dstMem], [srcMem], size, cache-policy;

// .shared::cta -> .global with .cp_mask:
cp.async.bulk.global.shared::cta.bulk_group.L2::cache_hint.cp_mask [dstMem], [srcMem], size, cache-policy, byteMask;

// ignore_oob
cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes.ignore_oob [dstMem], [srcMem], size, ignoreBytesLeft, ignoreBytesRight, [mbar];
```

#### 9.7.9.25.4.2. Data Movement and Conversion Instructions: cp.reduce.async.bulk

##### cp.reduce.async.bulk

Initiates an asynchronous reduction operation.

**Syntax**

```
cp.reduce.async.bulk.dst.src.completion_mechanism.redOp.type
              [dstMem], [srcMem], size, [mbar]

.dst =                  { .shared::cluster }
.src =                  { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes }
.redOp=                 { .and, .or, .xor,
                          .add, .inc, .dec,
                          .min, .max }
.type =                 { .b32, .u32, .s32, .b64, .u64 }


cp.reduce.async.bulk.dst.src.completion_mechanism{.level::cache_hint}.redOp.type
               [dstMem], [srcMem], size{, cache-policy}

.dst =                  { .global      }
.src =                  { .shared::cta }
.completion_mechanism = { .bulk_group }
.level::cache_hint    = { .L2::cache_hint }
.redOp=                 { .and, .or, .xor,
                          .add, .inc, .dec,
                          .min, .max }
.type =                 { .f16, .bf16, .b32, .u32, .s32, .b64, .u64, .s64, .f32, .f64 }


cp.reduce.async.bulk.dst.src.completion_mechanism{.level::cache_hint}.add.noftz.type
               [dstMem], [srcMem], size{, cache-policy}
.dst  =                 { .global }
.src  =                 { .shared::cta }
.completion_mechanism = { .bulk_group }
.type =                 { .f16, .bf16 }
```

**Description**

cp.reduce.async.bulk is a non-blocking instruction which initiates an asynchronous reduction operation on an array of memory locations specified by the destination address operand dstMem with the source array whose location is specified by the source address operand srcMem. The size of the source and the destination array must be the same and is specified by the operand size.

Each data element in the destination array is reduced inline with the corresponding data element in the source array with the reduction operation specified by the modifier `.redOp`. The type of each data element in the source and the destination array is specified by the modifier `.type`.

The 32-bit operand size specifies the amount of memory to be copied from the source location and used in the reduction operation, in terms of number of bytes. size must be a multiple of 16. The addresses dstMem and srcMem must be aligned to 16 bytes.

The operations supported by `.redOp` are classified as follows: The bit-size operations are `.and`, `.or`, and `.xor`. The integer operations are `.add`, `.inc`, `.dec`, `.min`, and `.max`. The `.inc` and `.dec` operations return a result in the range [0..x] where x is the value at the source state space.

The floating point operation `.add` rounds to the nearest even. The current implementation of `cp.reduce.async.bulk.add.f32` flushes subnormal inputs and results to sign-preserving zero. The `cp.reduce.async.bulk.add.f16` and `cp.reduce.async.bulk.add.bf16` operations require `.noftz` qualifier.

The following table describes the valid combinations of `.redOp` and element type:

| .dst | .redOp | Element type |
|------|--------|-------------|
| .shared::cluster | .add | .u32, .s32, .u64 |
| | .min, .max | .u32, .s32 |
| | .inc, .dec | .u32 |
| | .and, .or, .xor | .b32 |
| .global | .add | .u32, .s32, .u64, .f32, .f64, .f16, .bf16 |
| | .min, .max | .u32, .s32, .u64, .s64, .f16, .bf16 |
| | .inc, .dec | .u32 |
| | .and, .or, .xor | .b32, .b64 |

The modifier `.completion_mechanism` specifies the completion mechanism:

| .completion-mechanism | .dst | .src | Completion mechanism |
|-----------------------|------|------|---------------------|
| .mbarrier::... | .shared::cluster | .shared::cta | mbarrier based |
| .bulk_group | .global | .shared::cta | Bulk async-group based |

The modifier `.mbarrier::complete_tx::bytes` specifies that the cp.reduce.async.bulk variant uses mbarrier based completion mechanism.

The modifier `.bulk_group` specifies that the cp.reduce.async.bulk variant uses bulk async-group based completion mechanism.

Each reduction operation performed by the cp.reduce.async.bulk has individually `.relaxed.gpu` memory ordering semantics.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
cp.reduce.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes.add.u64
                                                                  [dstMem], [srcMem], size, [mbar];

cp.reduce.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes.min.s32
                                                                  [dstMem], [srcMem], size, [mbar];

cp.reduce.async.bulk.global.shared::cta.bulk_group.min.f16 [dstMem], [srcMem], size;

cp.reduce.async.bulk.global.shared::cta.bulk_group.L2::cache_hint.xor.s32 [dstMem], [srcMem], size, policy;

cp.reduce.async.bulk.global.shared::cta.bulk_group.add.noftz.f16 [dstMem], [srcMem], size;
```

#### 9.7.9.25.4.3. Data Movement and Conversion Instructions: cp.async.bulk.prefetch

##### cp.async.bulk.prefetch

Provides a hint to the system to initiate the asynchronous prefetch of data to the cache.

**Syntax**

```
cp.async.bulk.prefetch.L2.src{.level::cache_hint}   [srcMem], size {, cache-policy};

.src =                { .global }
.level::cache_hint =  { .L2::cache_hint }
```

**Description**

cp.async.bulk.prefetch is a non-blocking instruction which may initiate an asynchronous prefetch of data from the location specified by source address operand srcMem, in `.src` statespace, to the L2 cache.

The 32-bit operand size specifies the amount of memory to be prefetched in terms of number of bytes. size must be a multiple of 16. The address srcMem must be aligned to 16 bytes.

When the optional argument cache-policy is specified, the qualifier `.level::cache_hint` is required.

cp.async.bulk.prefetch is treated as a weak memory operation in the Memory Consistency Model.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
cp.async.bulk.prefetch.L2.global                 [srcMem], size;

cp.async.bulk.prefetch.L2.global.L2::cache_hint  [srcMem], size, policy;
```

#### 9.7.9.25.4.4. Data Movement and Conversion Instructions: multimem.cp.async.bulk

##### multimem.cp.async.bulk

Initiates an asynchronous copy operation to a multimem address range.

**Syntax**

```
multimem.cp.async.bulk.dst.src.completion_mechanism{.cp_mask}
    [dstMem], [srcMem], size{, byteMask};

    .dst                  = { .global }
    .src                  = { .shared::cta }
    .completion_mechanism = { .bulk_group }
```

**Description**

Instruction multimem.cp.async.bulk initiates an asynchronous bulk-copy operation from source address range [srcMem, srcMem + size) to memory locations residing on each GPU's memory referred to by the destination multimem address range [dstMem, dstMem + size). The direction of bulk-copy is from the state space specified by the `.src` modifier to the state space specified by the `.dst` modifiers.

The 32-bit operand size specifies the amount of memory to be copied, in terms of number of bytes. Operand size must be a multiple of 16.

The modifier `.completion_mechanism` specifies the completion mechanism that is supported by the instruction. The modifier `.bulk_group` specifies that the multimem.cp.async.bulk instruction uses bulk async-group based completion mechanism.

When the optional modifier `.cp_mask` is specified, the argument byteMask is required. The i-th bit in the 16-bit wide byteMask operand specifies whether the i-th byte of each 16-byte wide chunk of source data is copied to the destination.

The reads and writes of the copy operation in multimem.cp.async.bulk are weak memory operations.

**PTX ISA Notes**

Introduced in PTX ISA version 9.1.

**Target ISA Notes**

Requires sm_90 or higher.

Support for `.cp_mask` qualifier requires sm_100 or higher.

**Examples**

```ptx
multimem.cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], size;

multimem.cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], 512;

multimem.cp.async.bulk.global.shared::cta.bulk_group.cp_mask [dstMem], [srcMem], size, byteMask;
```

#### 9.7.9.25.4.5. Data Movement and Conversion Instructions: multimem.cp.reduce.async.bulk

##### multimem.cp.reduce.async.bulk

Initiates an asynchronous reduction operation to a multimem address range.

**Syntax**

```
multimem.cp.reduce.async.bulk.dst.src.completion_mechanism.redOp.type  [dstMem], [srcMem], size;

    .dst                  = { .global }
    .src                  = { .shared::cta }
    .completion_mechanism = { .bulk_group }
    .redOp                = { .and, .or, .xor,
                              .add, .inc, .dec,
                              .min, .max }
    .type                 = { .f16, .bf16,
                              .b32, .u32, .s32,
                              .b64, .u64, .s64,
                              .f32, .f64 }

multimem.cp.reduce.async.bulk.dst.src.completion_mechanism.add.noftz.type  [dstMem], [srcMem], size;

    .dst                  = { .global }
    .src                  = { .shared::cta }
    .completion_mechanism = { .bulk_group }
    .type                 = { .f16, .bf16 }
```

**Description**

Instruction multimem.cp.reduce.async.bulk initiates an element-wise asynchronous reduction operation with elements from source memory address range [srcMem, srcMem + size) to memory locations residing on each GPU's memory referred to by the multimem destination address range [dstMem, dstMem + size).

Each data element in the destination array is reduced inline with the corresponding data element in the source array with the reduction operation specified by the modifier `.redOp`. The type of each data element in the source and the destination array is specified by the modifier `.type`.

The 32-bit operand size specifies the amount of memory to be copied from the source location and used in the reduction operation, in terms of number of bytes. Operand size must be a multiple of 16. The addresses dstMem and srcMem must be aligned to 16 bytes.

The operations supported by `.redOp` are: bit-size operations `.and`, `.or`, and `.xor`; integer operations `.add`, `.inc`, `.dec`, `.min`, and `.max`; and floating point operation `.add` rounds to the nearest even.

The following table describes the valid combinations of `.redOp` and element type:

| .redOp | element type |
|--------|-------------|
| .add | .u32, .s32, .u64, .f32, .f64, .f16, .bf16 |
| .min, .max | .u32, .s32, .u64, .s64, .f16, .bf16 |
| .inc, .dec | .u32 |
| .and, .or, .xor | .b32, .b64 |

The modifier `.bulk_group` specifies that the multimem.cp.reduce.async.bulk uses bulk async-group based completion mechanism.

Each reduction operation performed by the multimem.cp.reduce.async.bulk has individually `.relaxed.sys` memory ordering semantics.

**PTX ISA Notes**

Introduced in PTX ISA version 9.1.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.add.u32 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.xor.b64 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.inc.u32 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.dec.u32 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.max.s32 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.add.noftz.f16 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.min.bf16 [dstMem], [srcMem], size;

multimem.cp.reduce.async.bulk.global.shared::cta.bulk_group.add.noftz.bf16 [dstMem], [srcMem], size;
```


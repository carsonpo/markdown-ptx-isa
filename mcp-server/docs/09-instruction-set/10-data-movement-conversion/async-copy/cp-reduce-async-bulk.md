# 9.7.10.28.4.2. Data Movement and Conversion Instructions: cp.reduce.async.bulk

**cp.reduce.async.bulk**

Initiates an asynchronous reduction operation.

## Syntax

```ptx
cp.reduce.async.bulk{.sem.scope}.dst.src.completion_mechanism.redOp.type
              [dstMem], [srcMem], size, [mbar]

.sem =                  { .relaxed }
.scope =                { .cta, .cluster }
.dst =                  { .shared::cluster }
.src =                  { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes }
.redOp=                 { .and, .or, .xor,
                          .add, .inc, .dec,
                          .min, .max }
.type =                 { .b32, .u32, .s32, .b64, .u64 }


cp.reduce.async.bulk{.sem.scope}.dst.src.completion_mechanism{.level::cache_hint}.redOp.type
               [dstMem], [srcMem], size{, cache_policy}

.sem =                  { .relaxed }
.scope =                { .cta, .cluster, .gpu, .sys }
.dst =                  { .global      }
.src =                  { .shared::cta }
.completion_mechanism = { .bulk_group }
.level::cache_hint    = { .L2::cache_hint }
.redOp=                 { .and, .or, .xor,
                          .add, .inc, .dec,
                          .min, .max }
.type =                 { .f16, .bf16, .b32, .u32, .s32, .b64, .u64, .s64, .f32, .f64 }


cp.reduce.async.bulk{.sem.scope}.dst.src.completion_mechanism{.level::cache_hint}.add.noftz.type
               [dstMem], [srcMem], size{, cache_policy}

.sem =                  { .relaxed }
.scope =                { .cta, .cluster, .gpu, .sys }
.dst  =                 { .global }
.src  =                 { .shared::cta }
.completion_mechanism = { .bulk_group }
.type =                 { .f16, .bf16, .f32 }
```

## Description

`cp.reduce.async.bulk` is a non-blocking instruction which initiates an asynchronous reduction operation on an array of memory locations specified by the destination address operand `dstMem` with the source array whose location is specified by the source address operand `srcMem`. The size of the source and the destination array must be the same and is specified by the operand `size`.

Each data element in the destination array is reduced inline with the corresponding data element in the source array with the reduction operation specified by the modifier `.redOp`. The type of each data element in the source and the destination array is specified by the modifier `.type`.

The source address operand `srcMem` is located in the state space specified by `.src` and the destination address operand `dstMem` is located in the state specified by the `.dst`.

The 32-bit operand `size` specifies the amount of memory to be copied from the source location and used in the reduction operation, in terms of number of bytes. `size` must be a multiple of 16. If the value is not a multiple of 16, then the behavior is undefined. The memory range `[dstMem, dstMem + size - 1]` must not overflow the destination memory space and the memory range `[srcMem, srcMem + size - 1]` must not overflow the source memory space. Otherwise, the behavior is undefined. The addresses `dstMem` and `srcMem` must be aligned to 16 bytes.

The operations supported by `.redOp` are classified as follows:

- The bit-size operations are `.and`, `.or`, and `.xor`.
- The integer operations are `.add`, `.inc`, `.dec`, `.min`, and `.max`. The `.inc` and `.dec` operations return a result in the range `[0..x]` where `x` is the value at the source state space.
- The floating point operation `.add` rounds to the nearest even. The `cp.reduce.async.bulk.add.f16` and `cp.reduce.async.bulk.add.bf16` operations require `.noftz` qualifier. It preserves input and result subnormals, and does not flush them to zero. The default behavior for `cp.reduce.async.bulk.add.f32` is equivalent to specifying optional `.noftz` qualifier which preserves input and result subnormals, and does not flush them to zero.

The following table describes the valid combinations of `.redOp` and element type:

| `.dst` | `.redOp` | Element type |
|---|---|---|
| `.shared::cluster` | `.add` | `.u32`, `.s32`, `.u64` |
| `.shared::cluster` | `.min`, `.max` | `.u32`, `.s32` |
| `.shared::cluster` | `.inc`, `.dec` | `.u32` |
| `.shared::cluster` | `.and`, `.or`, `.xor` | `.b32` |
| `.global` | `.add` | `.u32`, `.s32`, `.u64`, `.f32`, `.f64`, `.f16`, `.bf16` |
| `.global` | `.min`, `.max` | `.u32`, `.s32`, `.u64`, `.s64`, `.f16`, `.bf16` |
| `.global` | `.inc`, `.dec` | `.u32` |
| `.global` | `.and`, `.or`, `.xor` | `.b32`, `.b64` |

The modifier `.completion_mechanism` specifies the completion mechanism that is supported on the instruction variant. The completion mechanisms that are supported for different variants are summarized in the following table:

| `.completion-mechanism` | `.dst` | `.src` | Completion mechanism |
|---|---|---|---|
| `.mbarrier::...` | `.shared::cluster` | `.global` | mbarrier based |
| `.mbarrier::...` | `.shared::cluster` | `.shared::cta` | mbarrier based |
| `.bulk_group` | `.global` | `.shared::cta` | Bulk async-group based |

The modifier `.mbarrier::complete_tx::bytes` specifies that the `cp.reduce.async.bulk` variant uses mbarrier based completion mechanism. The complete-tx operation, with `completeCount` argument equal to amount of data copied in bytes, will be performed on the mbarrier object specified by the operand `mbar`. This instruction accesses its mbarrier operand using generic-proxy.

The modifier `.bulk_group` specifies that the `cp.reduce.async.bulk` variant uses bulk async-group based completion mechanism.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program. The qualifier `.level::cache_hint` is only supported when at least one of the `.src` or `.dst` statespaces is `.global` state space.

The optional `.sem.scope` qualifier specifies the memory ordering semantics of each individual element-wise reduction in `dstMem` performed by this operation as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). These are element-wise atomic at the specified scope. Source location accesses are `.weak`, that is, not atomic. When `.sem.scope` is not specified, it defaults to `.relaxed.sys`.

The load operations from `srcMem` in `cp.reduce.async.bulk` are treated as weak memory operation and the complete-tx operation on the mbarrier has `.release` semantics at the `.cluster` scope as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). The memory operations are performed in the async proxy.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for `.sem.scope` qualifier is introduced in PTX ISA version 9.3.

Qualifier `.noftz` with `.f32` type introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

## Examples

```ptx
cp.reduce.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes.add.u64
                                                                  [dstMem], [srcMem], size, [mbar];

cp.reduce.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes.min.s32
                                                                  [dstMem], [srcMem], size, [mbar];

cp.reduce.async.bulk.global.shared::cta.bulk_group.min.f16 [dstMem], [srcMem], size;

cp.reduce.async.bulk.global.shared::cta.bulk_group.L2::cache_hint.xor.s32 [dstMem], [srcMem], size, policy;

cp.reduce.async.bulk.global.shared::cta.bulk_group.add.noftz.f16 [dstMem], [srcMem], size;

cp.reduce.async.bulk.global.shared::cta.bulk_group.add.noftz.f32 [dstMem], [srcMem], size;

cp.reduce.async.bulk.relaxed.cta.global.bulk_group.add.u64 [dstMem], [srcMem], size, [mbar];
```

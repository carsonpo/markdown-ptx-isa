# 9.7.10.28.4.1. Data Movement and Conversion Instructions: cp.async.bulk

This instruction belongs to section 9.7.10.28.4, Data Movement and Conversion Instructions: Bulk copy, which groups the bulk asynchronous copy instructions `cp.async.bulk`, [`cp.reduce.async.bulk`](cp-reduce-async-bulk.md), [`cp.async.bulk.prefetch`](cp-async-bulk-prefetch.md), [`multimem.cp.async.bulk`](multimem-cp-async-bulk.md) and [`multimem.cp.reduce.async.bulk`](multimem-cp-reduce-async-bulk.md).

**cp.async.bulk**

Initiates an asynchronous copy operation from one state space to another.

## Syntax

```ptx
// global -> shared::cta
cp.async.bulk{.sem}.dst.src.completion_mechanism{.level::cache_hint}{.ignore_oob}
                      [dstMem], [srcMem], size{, ignoreBytesLeft, ignoreBytesRight}, [mbar] {, cache_policy}

.sem =                  { .weak }
.dst =                  { .shared::cta }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.level::cache_hint =    { .L2::cache_hint }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }

cp.async.bulk.sem.scope.dst.src.completion_mechanism{.level::cache_hint}{.ignore_oob}.type
                      [dstMem], [srcMem], size{, ignoreBytesLeft, ignoreBytesRight}, [mbar] {, cache_policy};

.sem =                  { .relaxed }
.scope =                { .cta, .cluster, .gpu, .sys }
.dst =                  { .shared::cta }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.level::cache_hint =    { .L2::cache_hint }
.type =                 { .b128 }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }


// global -> shared::cluster
cp.async.bulk{.sem}.dst.src.completion_mechanism{.multicast}{.level::cache_hint}
                      [dstMem], [srcMem], size, [mbar] {, ctaMask} {, cache_policy}

.sem =                  { .weak }
.dst =                  { .shared::cluster }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.level::cache_hint =    { .L2::cache_hint }
.multicast =            { .multicast::cluster{::16b, ::32b} }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }

cp.async.bulk.sem.scope.dst.src.completion_mechanism{.multicast}{.level::cache_hint}.type
                      [dstMem], [srcMem], size, [mbar] {, ctaMask} {, cache_policy};

.sem =                  { .relaxed }
.scope =                { .cta, .cluster, .gpu, .sys }
.dst =                  { .shared::cluster }
.src =                  { .global }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.level::cache_hint =    { .L2::cache_hint }
.type =                 { .b128 }
.multicast =            { .multicast::cluster{::16b, ::32b} }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }


// shared::cta -> shared::cluster
cp.async.bulk{.sem}.dst.src.completion_mechanism [dstMem], [srcMem], size, [mbar]

.sem =                  { .weak }
.dst =                  { .shared::cluster }
.src =                  { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes }

cp.async.bulk.sem.scope.dst.src.completion_mechanism.type [dstMem], [srcMem], size, [mbar];

.sem =                  { .relaxed }
.scope =                { .cta, .cluster }
.dst =                  { .shared::cluster }
.src =                  { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes }
.type =                 { .b128 }


// shared::cta -> global
cp.async.bulk{.sem}.dst.src.completion_mechanism{.level::cache_hint}{.cp_mask}
                      [dstMem], [srcMem], size {, cache_policy} {, byteMask}

.sem =                  { .weak }
.dst =                  { .global }
.src =                  { .shared::cta }
.completion_mechanism = { .bulk_group }
.level::cache_hint =    { .L2::cache_hint }

cp.async.bulk.sem.scope.dst.src.completion_mechanism{.level::cache_hint}{.cp_mask}.type
                      [dstMem], [srcMem], size {, cache_policy} {, byteMask};

.sem =                  { .relaxed }
.scope =                { .cta, .cluster, .gpu, .sys }
.dst =                  { .global }
.src =                  { .shared::cta }
.completion_mechanism = { .bulk_group }
.level::cache_hint =    { .L2::cache_hint }
.type =                 { .b128 }
```

## Description

`cp.async.bulk` is a non-blocking instruction which initiates an asynchronous bulk-copy operation from the location specified by source address operand `srcMem` to the location specified by destination address operand `dstMem`.

The direction of bulk-copy is from the state space specified by the `.src` modifier to the state space specified by the `.dst` modifiers.

The 32-bit operand `size` specifies the amount of memory to be copied, in terms of number of bytes. `size` must be a multiple of 16. If the value is not a multiple of 16, then the behavior is undefined. The memory range `[dstMem, dstMem + size - 1]` must not overflow the destination memory space and the memory range `[srcMem, srcMem + size - 1]` must not overflow the source memory space. Otherwise, the behavior is undefined. The addresses `dstMem` and `srcMem` must be aligned to 16 bytes.

The optional qualifier `.ignore_oob` specifies that up to 15 bytes at the beginning or ending of `[srcMem .. srcMem+size)` may be out-of-bounds of a global memory allocation, and the value of the corresponding bytes in destination shared memory `[dstMem .. dstMem+size)` is indeterminate. The 32-bit operands `ignoreBytesLeft` and `ignoreBytesRight` are used to specify the bytes from beginning and ending of the copy-chunk specified by `size` that may go out of bounds. The only valid values for `ignoreBytesLeft` and `ignoreBytesRight` are [0..15], and any other value may result in undefined behavior. The `srcMem` and `dstMem` addresses must be aligned to 16 bytes, and the `size` operand must be a multiple of 16 even with `.ignore_oob` qualifier. The qualifier `.ignore_oob` is only available for the global to `.shared::cta` copy direction. In presence of `.ignore_oob`, the qualifier `.report_mechanism`, if specified, must be set to `.mbarrier::report::disabled`.

When the destination of the copy is `.shared::cta` the destination address has to be in the shared memory of the executing CTA within the cluster, otherwise the behavior is undefined.

When the source of the copy is `.shared::cta` and the destination is `.shared::cluster`, the destination has to be in the shared memory of a different CTA within the cluster.

The modifier `.completion_mechanism` specifies the completion mechanism that is supported on the instruction variant. The completion mechanisms that are supported for different variants are summarized in the following table:

| `.completion-mechanism` | `.dst` | `.src` | Completion mechanism |
|---|---|---|---|
| `.mbarrier::...` | `.shared::cta` | `.global` | mbarrier based |
| `.mbarrier::...` | `.shared::cluster` | `.global` | mbarrier based |
| `.mbarrier::...` | `.shared::cluster` | `.shared::cta` | mbarrier based |
| `.bulk_group` | `.global` | `.shared::cta` | Bulk async-group based |

The modifier `.mbarrier::complete_tx::bytes` specifies that the `cp.async.bulk` variant uses mbarrier based completion mechanism. The complete-tx operation, with `completeCount` argument equal to amount of data copied in bytes, will be performed on the mbarrier object specified by the operand `mbar`. This instruction accesses its mbarrier operand using generic-proxy.

The modifier `.bulk_group` specifies that the `cp.async.bulk` variant uses bulk async-group based completion mechanism.

The optional qualifier `.multicast::cluster` allows copying of data from global memory to shared memory of multiple CTAs in the cluster. Operand `ctaMask` specifies the destination CTAs in the cluster such that each bit position in the 16-bit or otherwise 32-bit `ctaMask` operand corresponds to the `%cluster_ctarank` of the destination CTA. The additional sub-qualifier `::16b` or `::32b` can be specified to correspond to the width of the `ctaMask` argument. By default, `ctaMask` is assumed to be of 16-bit width. The source data is multicast to the same CTA-relative offset as `dstMem` in the shared memory of each destination CTA. The mbarrier signal is also multicast to the same CTA-relative offset as `mbar` in the shared memory of the destination CTA.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program. The qualifier `.level::cache_hint` is only supported when at least one of the `.src` or `.dst` statespaces is `.global` state space.

The optional qualifier `.report_mechanism` specifies the mbarrier reporting mechanism as outlined in the [Report Mechanisms for Asynchronous Copy Operations](README.md).

When the optional qualifier `.cp_mask` is specified, the argument `byteMask` is required. The i-th bit in the 16-bit wide `byteMask` operand specifies whether the i-th byte of each 16-byte wide chunk of source data is copied to the destination. If the bit is set, the byte is copied.

The optional `.sem` modifier specifies the memory ordering semantics as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

- When `.sem` is not specified, it defaults to `.weak`.
- When `.sem` is `.weak`, the data copy operation accesses memory with weak memory operations.
- When `.sem` is `.relaxed`, the data copy accesses memory with naturally-aligned strong memory operations with element-wise atomic size specified by `.type` and thread scope specified by `.scope`.

The complete-tx operation on the mbarrier has `.release` semantics at the `.cluster` scope as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## Notes

The copy operation with `shared::cluster.global` is optimized for target architecture `sm_90a`/`sm_100f`/`sm_100a`/`sm_103f`/`sm_103a`/`sm_107a`/`sm_107f`/`sm_110f`/`sm_110a` and may have substantially reduced performance on other targets and hence such operation is advised to be used with `.target` `sm_90a`/`sm_100f`/`sm_100a`/`sm_103f`/`sm_103a`/`sm_107a`/`sm_107f`/`sm_110f`/`sm_110a`.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for `.shared::cta` as destination state space is introduced in PTX ISA version 8.6.

Support for `.cp_mask` qualifier introduced in PTX ISA version 8.6.

Support for `.ignore_oob` qualifier introduced in PTX ISA version 9.2.

Support for `.weak` and `.relaxed` semantics, `.scope` and `.type` qualifiers are introduced in PTX ISA version 9.3.

Support for `.multicast::cluster::16b` and `.multicast::cluster::32b` qualifiers introduced in PTX ISA version 9.4.

Support for `.report_mechanism` qualifier introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

`.multicast::cluster{::16b}` qualifier advised to be used with `.target` `sm_90a` or `sm_100f` or `sm_100a` or `sm_103f` or `sm_103a` or `sm_107a` or `sm_107f` or `sm_110f` or `sm_110a`.

Support for `.cp_mask` qualifier requires `sm_100` or higher.

Qualifiers `.weak`, `.relaxed`, `.scope` and `.type` supported on following architectures:

- `sm_90a`
- `sm_100f` or higher in the same family
- `sm_110f` or higher in the same family

Qualifier `.multicast::cluster::32b` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifier `.report_mechanism` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
// .global -> .shared::cta (strictly non-remote):
cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes.L2::cache_hint
                                             [dstMem], [srcMem], size, [mbar], cache_policy;

// .global -> .shared::cluster:
cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.multicast::cluster
                                             [dstMem], [srcMem], size, [mbar], ctaMask;

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.L2::cache_hint
                                             [dstMem], [srcMem], size, [mbar], cache_policy;

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.multicast::cluster::32b
                                             [dstMem], [srcMem], size, [mbar], ctaMask32;

// Validity check using 0x8000 pattern on every 16B
cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes.mbarrier::report::validity::per_16bytes::8000
                                             [dstMem], [srcMem], size, [mbar];

// .shared::cta -> .shared::cluster (strictly remote):
cp.async.bulk.shared::cluster.shared::cta.mbarrier::complete_tx::bytes [dstMem], [srcMem], size, [mbar];

// .shared::cta -> .global:
cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], size;

cp.async.bulk.global.shared::cta.bulk_group.L2::cache_hint} [dstMem], [srcMem], size, cache_policy;

// .shared::cta -> .global with .cp_mask:
cp.async.bulk.global.shared::cta.bulk_group.L2::cache_hint.cp_mask [dstMem], [srcMem], size, cache_policy, byteMask;

// ignore_oob
cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes.ignore_oob [dstMem], [srcMem], size, ignoreBytesLeft, ignoreBytesRight, [mbar];

// .global -> .shared::cta with .relaxed scope and .b128 type
cp.async.bulk.relaxed.shared::cta.global.mbarrier::complete_tx::bytes.b128 [dstMem], [srcMem], size, [mbar];

cp.async.bulk.relaxed.shared::cta.global.mbarrier::complete_tx::bytes.L2::cache_hint.b128
                                             [dstMem], [srcMem], size, [mbar], cache_policy;
```

# 9.7.15.16.14. Parallel Synchronization and Communication Instructions: mbarrier.expect_tx

**mbarrier.expect_tx**

Performs expect-tx operation on the mbarrier object.

## Syntax

```ptx
mbarrier.expect_tx{.sem.scope}{.space}.b64 [addr], txCount;

.sem   = { .relaxed }
.scope = { .cta, .cluster }
.space = { .shared{::cta} }

mbarrier.expect_tx{.sem.scope}{.space}{.multicast}.b64 [addr], txCount{, ctaMask};

.sem      = { .relaxed }
.scope    = { .cta, .cluster }
.space    = { .shared::cluster }
.multicast = { .multicast::cluster::32b }
```

## Description

A thread executing `mbarrier.expect_tx` performs an expect-tx operation on the mbarrier object at the location specified by the address operand `addr`. The 32-bit unsigned integer operand `txCount` specifies the `expectCount` argument to the expect-tx operation.

If no state space is specified then [Generic Addressing](../../../06-instruction-operands.md) is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` or `.shared::cluster` state space then the behavior is undefined.

Supported addressing modes for operand `addr` are as described in [Addresses as Operands](../../../06-instruction-operands.md). Alignment for operand `addr` is as described in the [Size and alignment of mbarrier object](README.md#9715161-size-and-alignment-of-mbarrier-object).

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that directly observe the memory synchronizing effect of this operation, as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

Qualifiers `.sem` and `.scope` must be specified together.

The optional qualifier `.multicast::cluster::32b` allows performing the expect-tx operation on an mbarrier object from shared memory of multiple CTAs in the cluster. The operand `txCount` specifies the `expectCount` argument for the expect-tx operation. Operand `ctaMask` specifies the intended target CTAs in the cluster such that each bit position in the 32-bit `ctaMask` operand corresponds to the `%cluster_ctarank` of a target CTA. For example, a `ctaMask` with value `0x1` performs the operation on the CTA with rank 0, whereas a `ctaMask` with value `0x3` performs the operation on CTAs with ranks 0 and 1. The expect-tx operation is multicast to the same CTA-relative offset as `addr` in the shared memory of the target CTA.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for `.multicast::cluster::32b` qualifier introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

Qualifier `.multicast::cluster::32b` is supported on the following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
mbarrier.expect_tx.b64                       [addr], 32;
mbarrier.expect_tx.relaxed.cta.shared.b64    [mbarObj1], 512;
mbarrier.expect_tx.relaxed.cta.shared.b64    [mbarObj2], 512;
mbarrier.expect_tx.relaxed.cta.shared::cluster.multicast::cluster::32b.b64    [mbarObj3], 512, 0x3;
```

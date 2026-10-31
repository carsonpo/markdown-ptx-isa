# 9.7.15.16.16. Parallel Synchronization and Communication Instructions: mbarrier.arrive

**mbarrier.arrive**

Performs arrive-on operation on the mbarrier object.

## Syntax

```ptx
mbarrier.arrive{.sem.scope}{.shared{::cta}}.b64                         state, [addr]{, count};
mbarrier.arrive{.sem.scope}{.shared::cluster}{.multicast}.b64           _, [addr] {,count} {, ctaMask};
mbarrier.arrive.expect_tx{.sem.scope}{.shared{::cta}}.b64               state, [addr], txCount;
mbarrier.arrive.expect_tx{.sem.scope}{.shared::cluster}{.multicast}.b64 _, [addr], txCount {, ctaMask};
mbarrier.arrive.noComplete{.release.cta}{.shared{::cta}}.b64            state, [addr], count;

.sem   = { .release, .relaxed }
.scope = { .cta, .cluster }
.multicast = { .multicast::cluster::32b }
```

## Description

A thread executing `mbarrier.arrive` performs an arrive-on operation on the mbarrier object at the location specified by the address operand `addr`. The 32-bit unsigned integer operand `count` specifies the count argument to the arrive-on operation.

If no state space is specified then Generic Addressing is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand `addr` is as described in [Addresses as Operands](../../../06-instruction-operands.md). Alignment for operand `addr` is as described in the [Size and alignment of mbarrier object](README.md).

The optional qualifier `.expect_tx` specifies that an expect-tx operation is performed prior to the arrive-on operation. The 32-bit unsigned integer operand `txCount` specifies the `expectCount` argument to the expect-tx operation. When both qualifiers `.arrive` and `.expect_tx` are specified, then the count argument of the arrive-on operation is assumed to be 1.

A `mbarrier.arrive` operation with `.noComplete` qualifier must not cause the mbarrier to complete its current phase, otherwise the behavior is undefined.

The value of the operand `count` must be in the range as specified in [Contents of the mbarrier object](README.md).

> **Note:** for `sm_8x`, when the argument `count` is specified, the modifier `.noComplete` is required.

`mbarrier.arrive` operation on an mbarrier object located in `.shared::cta` returns an opaque 64-bit register capturing the phase of the mbarrier object prior to the arrive-on operation in the destination operand `state`. Contents of the `state` operand are implementation specific. Optionally, sink symbol `_` can be used for the `state` argument.

`mbarrier.arrive` operation on an mbarrier object located in `.shared::cluster` but not in `.shared::cta` cannot return a value. Sink symbol `_` is mandatory for the destination operand for such cases.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). If the `.sem` qualifier is absent, `.release` is assumed by default.

The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that directly observe the memory synchronizing effect of this operation, as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). If the `.scope` qualifier is not specified then it defaults to `.cta`. In contrast, the `.shared::<scope>` indicates the state space where the mbarrier resides.

Qualifiers `.sem` and `.scope` must be specified together.

The optional qualifier `.multicast::cluster::32b` allows performing arrive-on and optionally expect-tx operation on an mbarrier object from shared memory of multiple CTAs in the cluster. Operand `ctaMask` specifies the intended target CTAs in the cluster; each bit position in the 32-bit `ctaMask` operand corresponds to the `%cluster_ctarank` of the target CTA. For example, `ctaMask` with the value `0x1` applies the operation on CTA with rank 0, while a value of `0x3` applies it to CTAs with ranks 0 and 1. The arrive-on and optionally expect-tx operation are multicast to the same CTA-relative offset as `addr` in the shared memory of each target CTA.

## PTX ISA Notes

Introduced in PTX ISA version 7.0.

Support for sink symbol `_` as the destination operand is introduced in PTX ISA version 7.1.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

Support for `count` argument without the modifier `.noComplete` introduced in PTX ISA version 7.8.

Support for sub-qualifier `::cluster` introduced in PTX ISA version 8.0.

Support for qualifier `.expect_tx` is introduced in PTX ISA version 8.0.

Support for `.scope` and `.sem` qualifiers introduced in PTX ISA version 8.0

Support for `.relaxed` qualifier introduced in PTX ISA version 8.6.

Support for `.multicast::cluster::32b` introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_80` or higher.

Support for `count` argument without the modifier `.noComplete` requires `sm_90` or higher.

Qualifier `.expect_tx` requires `sm_90` or higher.

Sub-qualifier `::cluster` requires `sm_90` or higher.

Support for `.cluster` scope requires `sm_90` or higher.

Support for `.relaxed` qualifier requires `sm_90` or higher.

Qualifier `.multicast::cluster::32b` is supported on the following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
.reg .b32 cnt, remoteAddr32, remoteCTAId, addr32;
.reg .b64 %r<5>, addr, remoteAddr64;
.shared .b64 shMem, shMem2;

cvta.shared.u64            addr, shMem2;
mov.b32                    addr32, shMem2;
mapa.shared::cluster.u32   remoteAddr32, addr32, remoteCTAId;
mapa.u64                   remoteAddr64, addr,   remoteCTAId;

cvta.shared.u64          addr, shMem2;

mbarrier.arrive.shared.b64                       %r0, [shMem];
mbarrier.arrive.shared::cta.b64                  %r0, [shMem2];
mbarrier.arrive.release.cta.shared::cluster.b64  _, [remoteAddr32];
mbarrier.arrive.release.cluster.b64              _, [remoteAddr64], cnt;
mbarrier.arrive.expect_tx.release.cluster.b64    _, [remoteAddr64], tx_count;
mbarrier.arrive.noComplete.b64                   %r1, [addr], 2;
mbarrier.arrive.relaxed.cta.b64                  %r2, [addr], 4;
mbarrier.arrive.b64                              %r2, [addr], cnt;
mbarrier.arrive.release.cta.shared::cluster.multicast::cluster::32b.b64  _, [remoteAddr32], 0xa;
```

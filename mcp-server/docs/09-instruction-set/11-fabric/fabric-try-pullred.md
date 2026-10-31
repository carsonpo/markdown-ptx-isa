# 9.7.11.5.4. Fabric Instructions: fabric.try_pullred

**fabric.try_pullred**

Asynchronous copy from fabric handle with pull-reduction.

## Syntax

```ptx
fabric.try_pullred.async.multimem.dst.completion_mechanism.sem.scope.redOpBit.typeBit.sync [dst], [srcLeId, srcDataOff], size, [bar], imm-membermask;

fabric.try_pullred.async.multimem.dst.completion_mechanism.sem.scope.redOpMinMax.typeMinMax.sync [dst], [srcLeId, srcDataOff], size, [bar], imm-membermask;

fabric.try_pullred.async.multimem.dst.completion_mechanism.sem.scope.redOpAdd.typeAdd.sync [dst], [srcLeId, srcDataOff], size, [bar], imm-membermask;

fabric.try_pullred.async.multimem.dst.completion_mechanism.sem.scope.redOpAddAcc16.typeAddAcc16.sync [dst], [srcLeId, srcDataOff], size, [bar], imm-membermask;

fabric.try_pullred.async.multimem.dst.completion_mechanism.sem.scope.redOpAddAcc32.typeAddAcc32.sync [dst], [srcLeId, srcDataOff], size, [bar], imm-membermask;

.dst = { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes.mbarrier::report::fabric }
.sem = { .relaxed }
.scope = { .sys }
.redOpBit = { .and, .xor, .or }
.typeBit = { .b32, .b64 }
.redOpMinMax = { .min, .max }
.typeMinMax = { .u32, .s32, .u64, .s64, .bf16, .f16, .e4m3, .e5m2 }
.redOpAdd = { .add }
.typeAdd = { .u32, .u64, .f16, .bf16, .f32 }
.redOpAddAcc16 = { .add.acc::f16 }
.typeAddAcc16 = { .e4m3, .e5m2 }
.redOpAddAcc32 = { .add.acc::f32 }
.typeAddAcc32 = { .f16, .bf16 }
```

## Description

Initiates asynchronous loads from multiple resources pointed to by multicast fabric handle `[srcLeId, srcDataOff]`, of `size` bytes, and performs element-wise reduction on data across each of the loads. The result is stored in `[dst, dst + size - 1]`. `srcLeId` is a 32-bit unsigned value denoting the logical endpoint identifier, and `srcDataOff` is a 64-bit unsigned value denoting the base offset of the resources to access within the multicast logical endpoint associated with `srcLeId`.

The `size` operand is 32 bits and specifies the number of bytes to be copied. It must be a multiple of 16; otherwise, the behavior is undefined. The destination range `[dst, dst + size - 1]` must be in bounds of the destination memory space. The source range `[srcDataOff, srcDataOff + size - 1]` must be in bounds of the logical endpoint associated with `srcLeId` on the current device.

The destination pointer `dst` and the source handle offset `srcDataOff` must be 16-byte aligned.

A reduction is performed on the values read from all resources referred to by the multicast logical endpoint. The `.redOp*` qualifiers specify the reduction operation. The `.type*` qualifiers specify the type of each data element in the source arrays.

The `srcLeId` operand must be associated with a multicast logical endpoint with pull-reduction support, and the device that issues the operation must be a member of the multicast endpoint.

If `.dst` is `.shared::cta`, then the destination `[dst]` and the barrier `[bar]` refer to the local CTA's shared memory.

The mbarrier object `bar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::bytes` specifies that the complete-tx operation is performed on `bar` with completion count equal to the number of bytes copied. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`.

This instruction accesses data at the locations specified by the handle operands through the fabric-proxy, accesses the destination `.shared::cta` through the async-proxy, and updates the mbarrier object in `.shared::cta` through the generic-proxy.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

This operation has `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

The `.sync` qualifier indicates that this instruction causes the issuing thread to wait until all warp lanes execute this instruction with the same operand values. Operand `imm-membermask` is an integer constant and must be `0xFFFFFFFF`. The behavior is undefined if:

- while a thread is waiting, a warp lane executes this instruction with different operand values, OR
- any thread in the warp has exited.

## PTX ISA Notes

Introduced in PTX ISA version 9.3.

## Target ISA Notes

Requires `sm_100` or higher.

Reduction operations `.add.acc::f16` and `.add.acc::f32` are supported on following architectures:

- `sm_120a`
- `sm_121a`
- `sm_100f` or higher in the same family
- `sm_110f` or higher in the same family

Reduction operations `.min` and `.max` on types `.e4m3` and `.e5m2` are supported on following architectures:

- `sm_120a`
- `sm_121a`
- `sm_100f` or higher in the same family
- `sm_110f` or higher in the same family

## Examples

```ptx
fabric.try_pullred.async.multimem.mbarrier::complete_tx::bytes.mbarrier::report::fabric.shared::cta.f32.add.sync.relaxed.sys [dst], [leId, offset], size, [mbar], 0xFFFFFFFF;
```

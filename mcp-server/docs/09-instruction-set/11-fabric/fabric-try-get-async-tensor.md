# 9.7.11.5.7. Fabric Instructions: fabric.try_get.async.tensor

**fabric.try_get.async.tensor**

Asynchronous copy of tensor data from fabric handle.

## Syntax

```ptx
fabric.try_get.async.tensor.dim.dst{.load_mode}.completion_mechanism
    {.level::cache_hint}.override::global_address{.override_attribute}
    .sem.sco.b128
    [dstMem], [tensorMap, tensorMapLeId, tensorMapOff,
    attributeOverrideInfo, tensorCoords], [mbar] {, cache_policy};

.dim                    = { .1d, .2d, .3d, .4d, .5d };
.dst                    = { .shared::cta };
.load_mode              = { .tiled };
.completion_mechanism   = { .mbarrier::complete_tx::bytes.mbarrier::report::fabric };
.sem.sco                = { .relaxed.sys };
.level::cache_hint      = { .l2::cache_hint };
.override_attribute     = { .override::global_dim, .override::global_dim_stride };
```

## Description

Asynchronously copies data from the tensor at fabric handle `[tensorMapLeId, tensorMapOff]` to destination memory `[dstMem]`, where `tensorMapLeId` is a 32-bit unsigned value denoting the logical endpoint identifier, and `tensorMapOff` is a 64-bit unsigned value denoting the base offset of the resource to access within the logical endpoint associated with `tensorMapLeId`.

The logical endpoint associated with `tensorMapLeId` must be a unicast logical endpoint.

The range `[dstMem, dstMem + size - 1]` must be in bounds of the destination memory space, where `size` is computed using the tensor descriptor `tensorMap`, and it is the number of bytes copied from the source fabric handle. It must be a multiple of 16; otherwise, the behavior is undefined. The source handle offset `tensorMapOff` and destination pointer `dstMem` must be 16-byte aligned.

If `.dst` is `.shared::cta`, then:

- The destination of the copy `[dstMem]` and the barrier `[mbar]` must refer to the local CTA's shared memory; otherwise, the behavior is undefined.
- The completion mechanism must be `.mbarrier::complete_tx::bytes.mbarrier::report::fabric`.

The mbarrier object `mbar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::bytes` specifies that the operation completes by performing a complete-tx operation with the total number of bytes copied on the mbarrier object at the location specified by the address operand `mbar`. Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

The operand `tensorMap` is the generic address of the opaque tensor-map object which resides in `.param` space, `.const` space, or `.global` space. The operand `tensorMap` specifies the properties of the tensor copy operation. The `tensorMap` is accessed in the tensormap proxy. Refer to the CUDA programming guide for creating the tensor-map objects on the host side.

The dimension of the tensor data is specified by the `.dim` qualifier.

The qualifier `.load_mode` specifies how the data in the source location is copied into the destination location.

This instruction reads the data at the location specified by the handle operand through the fabric-proxy, reads the operand `tensorMap` through the tensormap-proxy, copies the data to the destination `.shared::cta` memory through the async-proxy, and updates the mbarrier object in `.shared::cta` through the generic-proxy.

The qualifiers `.override::global_address` and `.override_attribute` support value override functionality for various tensor properties present in the `tensorMap` object. For more details refer to the [Overriding tensor property value](../10-data-movement-conversion/async-copy/tensor-copy-restrictions-and-overrides.md).

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access. `cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only and does not change the memory consistency behavior of the program.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

Accesses to a source handle are 128-bit-wide atomic with `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md). Accesses to the destination shared memory are with weak memory-order semantics.

## PTX ISA Notes

Introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_107f` or higher in the same family.

## Examples

```ptx
fabric.try_get.async.tensor.1d.shared::cta.tiled.mbarrier::complete_tx::bytes.mbarrier::report::fabric.override::global_address.relaxed.sys.b128 [dstSmem], [tensorDesc, overrideLeId, overrideLeOff, {u}], [mbar];

fabric.try_get.async.tensor.1d.shared::cta.tiled.mbarrier::complete_tx::bytes.mbarrier::report::fabric.override::global_address.relaxed.sys.l2::cache_hint.b128 [dstSmem], [tensorDesc, overrideLeId, overrideLeOff, {u}], [mbar], mdesc;
```

# 9.7.11.5.9. Fabric Instructions: fabric.try_red.async.tensor

**fabric.try_red.async.tensor**

Asynchronous reduction of tensor data to fabric handle.

## Syntax

```ptx
// Form 0
fabric.try_red.async.tensor{.multimem}.dim.src{.load_mode}.completion_mechanism0
    {.level::cache_hint}.override::global_address{.override_attribute}
    .sem.sco.redOp.type
    [tensorMap, tensorMapLeId, tensorMapOff,
    attributeOverrideInfo, tensorCoords], [src], sizeBytes, [mbar] {, cache_policy};

// Form 1 (counted::bytes)
fabric.try_red.async.tensor{.multimem}.dim.src{.load_mode}.completion_mechanism1
    {.level::cache_hint}.override::global_address{.override_attribute}
    .sem.sco.redOp.type
    [tensorMap, tensorMapLeId, tensorMapOff, counterOff,
    attributeOverrideInfo, tensorCoords], [src], sizeBytes, [mbar] {, cache_policy};

.dim                    = { .1d, .2d, .3d, .4d, .5d };
.src                    = { .shared::cta };
.load_mode              = { .tiled };
.completion_mechanism0  = { .mbarrier::complete_tx::16B.mbarrier::report::fabric };
.completion_mechanism1  = { .mbarrier::complete_tx::16B.mbarrier::report::fabric.counted::bytes };
.sem.sco                = { .relaxed.sys };
.level::cache_hint      = { .l2::cache_hint };
.override_attribute     = { .override::global_dim, .override::global_dim_stride };
.redOp                  = { .and, .xor, .or, .add, .min, .max };
```

## Description

Asynchronously copies `sizeBytes` bytes from source memory `[src]` to the tensor at fabric handle `[tensorMapLeId, tensorMapOff]` with element-wise reduction, where `tensorMapLeId` is a 32-bit unsigned value denoting the logical endpoint identifier, and `tensorMapOff` is a 64-bit unsigned value denoting the base offset of the resource to access within the logical endpoint associated with `tensorMapLeId`.

The `sizeBytes` operand is 32 bits and specifies the number of bytes to be copied. It must be a multiple of 16; otherwise, the behavior is undefined. The range `[src, src + sizeBytes - 1]` must be in bounds of the source memory space. The source pointer `src` and the destination handle offset `tensorMapOff` must be 16-byte aligned.

Each data element in the destination array is reduced at the destination with the corresponding data element in the source array and the reduction operation specified by the modifier `.redOp`. The type of each data element in the source and the destination array is specified by the `tensorMap`.

If the optional `.multimem` qualifier is specified, then `tensorMapLeId` must be associated with a multicast logical endpoint such that the device that issued the operation is a member of the multicast endpoint. Also, in the case of `.multimem`, the reduction operation is performed on all member devices of the multicast endpoint. In the absence of the `.multimem` qualifier, `tensorMapLeId` must be associated with a unicast logical endpoint.

If `.src` is `.shared::cta`, then the source of the copy `[src]` and the barrier `[mbar]` refer to the local CTA's shared memory.

The mbarrier object `mbar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::16B` specifies that the complete-tx operation is performed on `mbar` with completion count equal to the number of bytes copied divided by 16; that is, the count is incremented by 1 for every 16 bytes copied. Note that `fabric.try_get` uses a different completion mechanism in which the complete-tx operation is performed with completion count equal to the number of bytes copied. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

If the qualifier `.counted::bytes` is present, then:

- `tensorMapLeId` must be associated with a logical endpoint with counted completion support ([Counted completion mechanism](README.md#971143-counted-completion-mechanism)), and
- the counter offset `counterOff` must be 256-byte aligned, and
- the range `[counterOff, counterOff + 7]` is in bounds of the logical endpoint `tensorMapLeId` on the current device, and must not overlap with the `tensorMap` being accessed, and
- this operation provides counter-based completion for destination data using a 256-byte-aligned counter of size 8 bytes specified at `[tensorMapLeId, counterOff]`.

Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`.

The operand `tensorMap` is the generic address of the opaque tensor-map object which resides in `.param` space, `.const` space, or `.global` space. The operand `tensorMap` specifies the properties of the tensor copy operation, as described in [Tensor-map](../../05-state-spaces-types-variables/06-tensor-swizzling-and-tensormap.md). The `tensorMap` is accessed in the tensormap proxy. Refer to the CUDA programming guide for creating the tensor-map objects on the host side.

The dimension of the tensor data is specified by the `.dim` qualifier.

The qualifier `.load_mode` specifies how the data in the source location is copied into the destination location.

The following table describes the valid combinations of `.redOp` and element type:

| `.redOp` | Element Type |
|---|---|
| `.and`, `.xor`, `.or` | `.b32`, `.b64` |
| `.min`, `.max` | `.u32`, `.s32`, `.u64`, `.s64`, `.f16`, `.bf16` |
| `.add` | `.u32`, `.u64`, `.f16`, `.bf16`, `.f32`, `.f64` |

This instruction accesses the data and the counter at the location specified by the handle operands through the fabric-proxy, reads the `tensorMap` through the tensormap-proxy, reads from the source `.shared::cta` through the async-proxy, and updates the mbarrier object in `.shared::cta` through the generic-proxy.

The qualifiers `.override::global_address` and `.override_attribute` support value override functionality for various tensor properties present in the `tensorMap` object. For more details refer to the [Overriding tensor property value](../10-data-movement-conversion/async-copy/tensor-copy-restrictions-and-overrides.md).

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access. `cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

This operation has `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md). Accesses to the source shared memory are with weak memory-order semantics.

## PTX ISA Notes

Introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_107f` or higher in the same family.

## Examples

```ptx
fabric.try_red.async.tensor.2d.shared::cta.tile.mbarrier::complete_tx::16B.mbarrier::report::fabric.override::global_address.override::global_dim_stride.relaxed.sys.max
       [tensorDesc, overrideLeId, overrideLeOff, {overrideSize_0, overrideSize_1}, {overrideLowerStrd_0}, overrideUpperStrd, {u, v}], [srcSmem], numBytes, [mbar];

fabric.try_red.async.tensor.3d.shared::cta.tile.mbarrier::complete_tx::16B.mbarrier::report::fabric.override::global_address.override::global_dim_stride.relaxed.sys.L2::cache_hint.or
       [tensorDesc, overrideLeId, overrideLeOff, {overrideSize_0, overrideSize_1, overrideSize_2}, {overrideLowerStrd_0, overrideLowerStrd_1}, overrideUpperStrd, {u, v, w}], [srcSmem], numBytes, [mbar], mdesc;
```

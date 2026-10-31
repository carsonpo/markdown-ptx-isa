# 9.7.10.28.5.4. Data Movement and Conversion Instructions: cp.reduce.async.bulk.tensor

**cp.reduce.async.bulk.tensor**

Initiates an asynchronous reduction operation on the tensor data.

## Syntax

```ptx
// shared::cta -> global:
cp.reduce.async.bulk.tensor.dim.dst.src.redOp{.load_mode}.completion_mechanism{.level::cache_hint}{.override::global_address}{.override_attribute}
                                          [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords], [srcMem] {,cache_policy}

.dst =                  { .global }
.src =                  { .shared::cta }
.dim =                  { .1d, .2d, .3d, .4d, .5d }
.completion_mechanism = { .bulk_group }
.load_mode =            { .tile, .im2col_no_offs, .im2col_no_offs::w }
.redOp =                { .add, .min, .max, .inc, .dec, .and, .or, .xor}
.override_attribute =   { .override::global_dim, .override::global_dim_stride }
```

## Description

`cp.reduce.async.bulk.tensor` is a non-blocking instruction which initiates an asynchronous reduction operation of tensor data in the `.dst` state space with tensor data in the `.src` state space.

The operand `srcMem` specifies the location of the tensor data in the `.src` state space using which the reduction operation has to be performed.

The operand `tensorMap` is the generic address of the opaque tensor-map object which resides in `.param` space or `.const` space or `.global` space. The operand `tensorMap` specifies the properties of the tensor copy operation, as described in [Tensor-map](../../../05-state-spaces-types-variables/06-tensor-swizzling-and-tensormap.md). The `tensorMap` is accessed in tensormap proxy. Refer to the CUDA programming guide for creating the tensor-map objects on the host side.

Each element of the tensor data in the `.dst` state space is reduced inline with the corresponding element from the tensor data in the `.src` state space. The modifier `.redOp` specifies the reduction operation used for the inline reduction. The type of each tensor data element in the source and the destination tensor is specified in [Tensor-map](../../../05-state-spaces-types-variables/06-tensor-swizzling-and-tensormap.md).

The dimension of the tensor is specified by the `.dim` modifier.

The vector operand `tensorCoords` specifies the starting coordinates of the tensor data in the global memory on which the reduce operation is to be performed. The number of tensor coordinates in the vector argument `tensorCoords` should be equal to the dimension specified by the modifier `.dim`. The individual tensor coordinates are of the type `.s32`.

The following table describes the valid combinations of `.redOp` and element type:

| `.redOp` | Element type |
|---|---|
| `.add` | `.u32`, `.s32`, `.u64`, `.f32`, `.f16`, `.bf16` |
| `.min`, `.max` | `.u32`, `.s32`, `.u64`, `.s64`, `.f16`, `.bf16` |
| `.inc`, `.dec` | `.u32` |
| `.and`, `.or`, `.xor` | `.b32`, `.b64` |

The modifier `.completion_mechanism` specifies the completion mechanism that is supported on the instruction variant. Value `.bulk_group` of the modifier `.completion_mechanism` specifies that `cp.reduce.async.bulk.tensor` instruction uses bulk async-group based completion mechanism.

The qualifier `.load_mode` specifies how the data in the source location is copied into the destination location. If `.load_mode` is not specified, it defaults to `.tile`. In `.tile` mode, the multi-dimensional layout of the source tensor is preserved at the destination. In `.im2col_no_offs` and `.im2col_no_offs::w` modes, some dimensions of the source tensors are unrolled in a single dimensional column at the destination. Details of the im2col mode are described in [im2col mode](../../../05-state-spaces-types-variables/05-tensors.md). In `.im2col` mode, the tensor has to be at least 3-dimensional.

The optional qualifiers `.override::global_address` and `.override_attribute` support value override functionality for various tensor properties present in the `tensorMap` object. For more details refer to the [Overriding tensor property value](tensor-copy-restrictions-and-overrides.md) section.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program. The qualifier `.level::cache_hint` is only supported when at least one of the `.src` or `.dst` statespaces is `.global` state space.

Each reduction operation performed by `cp.reduce.async.bulk.tensor` has individually `.relaxed.gpu` memory ordering semantics and are element-wise atomic. The load operations in `cp.reduce.async.bulk.tensor` are treated as weak memory operations and the complete-tx operation on the mbarrier has `.release` semantics at the `.cluster` scope as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for qualifiers `.override::global_address` and `.override_attribute` introduced in PTX ISA version 9.4.

Support for qualifier `.im2col_no_offs::w` introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

Qualifiers `.override::global_address` and `.override_attribute` are supported on following architectures:

- `sm_107f` or higher in the same family

Qualifier `.im2col_no_offs::w` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
.reg .b8  newTensorSize_<2>;
.reg .u64 gAddrToOverride<3>;

cp.reduce.async.bulk.tensor.1d.global.shared::cta.add.tile.bulk_group
                                             [tensorMap0, {tc0}], [sMem0];

cp.reduce.async.bulk.tensor.2d.global.shared::cta.and.bulk_group.L2::cache_hint
                                             [tensorMap1, {tc0, tc1}], [sMem1] , policy;

cp.reduce.async.bulk.tensor.3d.global.shared::cta.xor.im2col.bulk_group
                                             [tensorMap2, {tc0, tc1, tc2}], [sMem2];

cp.reduce.async.bulk.tensor.global.shared::cta.bulk_group.2d.tile.min.override::global_address
                                             [tensorMap3, gAddrToOverride1, {tc0, tc1}], [sMem3];

cp.reduce.async.bulk.tensor.global.shared::cta.bulk_group.1d.max.L2::cache_hint.override::global_address.override::global_dim
                                             [tensorMap4, gAddrToOverride2, {newTensorSize_0}, {0}], [sMem4], policy;

cp.reduce.async.bulk.tensor.3d.global.shared::cta.or.im2col_no_offs::w.bulk_group
                                             [tensorMap5, {tc0, tc1, tc2}], [sMem5];
```

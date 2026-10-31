# 9.7.10.28.5.5. Data Movement and Conversion Instructions: cp.async.bulk.prefetch.tensor

**cp.async.bulk.prefetch.tensor**

Provides a hint to the system to initiate the asynchronous prefetch of tensor data to the cache.

## Syntax

```ptx
// global -> L2:
cp.async.bulk.prefetch.tensor.dim.L2.src{.load_mode}{.level::cache_hint}{.override::global_address}{.override_attribute}
                                                             [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords]
                                                             {, im2colInfo } {, cache_policy}

cp.async.bulk.prefetch.tensor.dim.L2.src{.load_mode}{.level::eviction_priority}{.override::global_address}{.override_attribute}
                                                             [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords]
                                                             {, im2colInfo }

.src =                { .global }
.dim =                { .1d, .2d, .3d, .4d, .5d }
.load_mode =          { .tile, .tile::gather4, .im2col, .im2col::w, .im2col::w::128 }
.level::cache_hint =  { .L2::cache_hint }
.level::eviction_priority = { .L2::evict_last }
.override_attribute =  { .override::global_dim, .override::global_dim_stride }
```

## Description

`cp.async.bulk.prefetch.tensor` is a non-blocking instruction which may initiate an asynchronous prefetch of tensor data from the location in `.src` statespace to the L2 cache.

The operand `tensorMap` is the generic address of the opaque tensor-map object which resides in `.param` space or `.const` space or `.global` space. The operand `tensorMap` specifies the properties of the tensor copy operation, as described in [Tensor-map](../../../05-state-spaces-types-variables/06-tensor-swizzling-and-tensormap.md). The `tensorMap` is accessed in tensormap proxy. Refer to the CUDA programming guide for creating the tensor-map objects on the host side.

The dimension of the tensor data is specified by the `.dim` modifier.

The vector operand `tensorCoords` specifies the starting coordinates in the tensor data in the global memory from which the copy operation has to be performed. The individual tensor coordinates in `tensorCoords` are of type `.s32`. The format of vector argument `tensorCoords` is dependent on `.load_mode` specified and is as follows:

| `.load_mode` | `tensorCoords` | Semantics |
|---|---|---|
| `.tile::gather4` | `{col_idx, row_idx0, row_idx1, row_idx2, row_idx3}` | Fixed length vector of size 5. The five elements together specify the start co-ordinates of the four rows. |
| Rest all | `{d0, .., dn}` for n = `.dim` | Vector of n elements where n = `.dim`. The elements indicate the offset in each of the dimension. |

The qualifier `.load_mode` specifies how the data in the source location is copied into the destination location. If `.load_mode` is not specified, it defaults to `.tile`.

In `.tile` mode, the multi-dimensional layout of the source tensor is preserved at the destination. In `.tile::gather4` mode, four rows in the 2-dimensional source tensor are fetched to L2 cache. Details of `.tile::gather4` modes are described in [.tile::scatter4 and .tile::gather4 modes](../../../05-state-spaces-types-variables/05-tensors.md).

In `.im2col` and `.im2col::*` modes, some dimensions of the source tensors are unrolled in a single dimensional column at the destination. Details of the im2col and `.im2col::*` modes are described in [im2col mode](../../../05-state-spaces-types-variables/05-tensors.md) and [im2col::w, im2col_no_offs::w and im2col::w::128 modes](../../../05-state-spaces-types-variables/05-tensors.md) respectively. In `.im2col` and `.im2col::*` modes, the tensor has to be at least 3-dimensional. The vector operand `im2colInfo` can be specified only when `.load_mode` is `.im2col` or `.im2col::w` or `.im2col::w::128`. The format of the vector argument `im2colInfo` is dependent on the exact im2col mode and is as follows:

| Exact im2col mode | `im2colInfo` argument | Semantics |
|---|---|---|
| `.im2col` | `{ i2cOffW , i2cOffH , i2cOffD }` for `.dim` = `.5d` | A vector of im2col offsets whose vector size is two less than number of dimensions `.dim`. |
| `.im2col::w` | `{ wHalo, wOffset }` | A vector of 2 arguments containing `wHalo` and `wOffset` arguments. |
| `.im2col::w::128` | `{ wHalo, wOffset }` | A vector of 2 arguments containing `wHalo` and `wOffset` arguments. |

The optional qualifiers `.override::global_address` and `.override_attribute` support value override functionality for various tensor properties present in the `tensorMap` object. For more details refer to the [Overriding tensor property value](tensor-copy-restrictions-and-overrides.md) section.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

Qualifier `.level::eviction_priority` specifies the eviction priority to be applied for the prefetched cache line.

`cp.async.bulk.prefetch.tensor` is treated as a weak memory operation in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for qualifier `.tile::gather4` introduced in PTX ISA version 8.6.

Support for qualifiers `.im2col::w` and `.im2col::w::128` introduced in PTX ISA version 8.6.

Support for qualifier `.level::eviction_priority` introduced in PTX ISA version 9.4.

Support for qualifiers `.override::global_address` and `.override_attribute` introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

Qualifier `.tile::gather4` is supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifiers `.im2col::w` and `.im2col::w::128` are supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And are supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifier `.level::eviction_priority` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifiers `.override::global_address` and `.override_attribute` are supported on following architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
.reg .b16 ctaMask, im2colwHalo, im2colOff;
.reg .u16 i2cOffW, i2cOffH, i2cOffD;
.reg .b64 l2CachePolicy;
.reg .b8  newTensorSize_<5>;
.reg .b32 newTensorLowerStrd_<4>;
.reg .b16 tensorUpperStrd;
.reg .u64 gAddrToOverride<3>;

cp.async.bulk.prefetch.tensor.1d.L2.global.tile  [tensorMap0, {tc0}];

@p cp.async.bulk.prefetch.tensor.2d.L2.global    [tensorMap1, {tc0, tc1}];

@p cp.async.bulk.prefetch.tensor.5d.L2.global.im2col
                      [tensorMap2, {tc0, tc1, tc2, tc3, tc4}], {i2cOffW, i2cOffH, i2cOffD};

@p cp.async.bulk.prefetch.tensor.3d.L2.global.im2col.L2::cache_hint
                      [tensorMap3, {tc0, tc1, tc2}], {i2cOffW}, policy;

cp.async.bulk.prefetch.tensor.2d.L2.global.tile::gather4 [tensorMap5, {col_idx, row_idx0, row_idx1, row_idx2, row_idx3}];

cp.async.bulk.prefetch.tensor.4d.L2.global.im2col::w::128
                      [tensorMap4, {t0, t1, t2, t3}], {im2colwHalo, im2colOff};

cp.async.bulk.prefetch.tensor.3d.L2.global.tile::gather4.L2::evict_last
                      [tensorMap5, {t0, t1, t2}], {i2cOffW};

cp.async.bulk.prefetch.tensor.2d.L2.global.tile.override::global_address
                      [tensorMap6, gAddrToOverride1, {t0, t1}];

cp.async.bulk.prefetch.tensor.3d.L2.global.override::global_address.override::global_dim_stride.L2::cache_hint
                      [tensorMap7, gAddrToOverride2, {newTensorSize_0, newTensorSize_1, newTensorSize_2}, {newTensorLowerStrd_0, newTensorLowerStrd_1}, tensorUpperStrd, {0, 0, 0}], policy;
```

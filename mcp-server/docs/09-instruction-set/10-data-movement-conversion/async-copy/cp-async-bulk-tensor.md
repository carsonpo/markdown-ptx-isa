# 9.7.10.28.5.3. Data Movement and Conversion Instructions: cp.async.bulk.tensor

**cp.async.bulk.tensor**

Initiates an asynchronous copy operation on the tensor data from one state space to another.

## Syntax

```ptx
// global -> shared::cta
cp.async.bulk.tensor.dim.dst.src{.load_mode}.completion_mechanism{.cta_group}{.level::cache_hint}{.override::global_address}{.override_attribute}
                                   [dstMem], [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords], [mbar]{, im2colInfo} {, cache_policy}

.dst =                  { .shared::cta }
.src =                  { .global }
.dim =                  { .1d, .2d, .3d, .4d, .5d }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.cta_group =            { .cta_group::1, .cta_group::2 }
.load_mode =            { .tile, .tile::gather4, .im2col, .im2col::w, .im2col::w::128 }
.level::cache_hint =    { .L2::cache_hint }
.override_attribute =   { .override::global_dim, .override::global_dim_stride }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }


// global -> shared::cluster
cp.async.bulk.tensor.dim.dst.src{.load_mode}.completion_mechanism{.multicast}{.cta_group}{.level::cache_hint}{.override::global_address}{.override_attribute}
                                   [dstMem], [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords], [mbar]{, im2colInfo}
                                   {, ctaMask} {, cache_policy}

.dst =                  { .shared::cluster }
.src =                  { .global }
.dim =                  { .1d, .2d, .3d, .4d, .5d }
.completion_mechanism = { .mbarrier::complete_tx::bytes{.report_mechanism} }
.cta_group =            { .cta_group::1, .cta_group::2 }
.load_mode =            { .tile, .tile::gather4, .im2col, .im2col::w, .im2col::w::128 }
.level::cache_hint =    { .L2::cache_hint }
.multicast =            { .multicast::cluster{::16b, ::32b} }
.override_attribute =   { .override::global_dim, .override::global_dim_stride }
.report_mechanism =     { .mbarrier::report::disabled,
                          .mbarrier::report::validity::per_16bytes::80000000,
                          .mbarrier::report::validity::per_16bytes::8000,
                          .mbarrier::report::validity::per_16bytes::80,
                          .mbarrier::report::validity::per_16bytes::8,
                          .mbarrier::report::validity::per_element::ff
                        }


// shared::cta -> global
cp.async.bulk.tensor.dim.dst.src{.load_mode}.completion_mechanism{.level::cache_hint}{.override::global_address}{.override_attribute}
                                   [tensorMap{, gAddrToOverride}{, attributeOverrideInfo}, tensorCoords], [srcMem] {, cache_policy}

.dst =                  { .global }
.src =                  { .shared::cta }
.dim =                  { .1d, .2d, .3d, .4d, .5d }
.completion_mechanism = { .bulk_group }
.load_mode =            { .tile, .tile::scatter4, .im2col_no_offs, .im2col_no_offs::w }
.level::cache_hint =    { .L2::cache_hint }
.override_attribute =   { .override::global_dim, .override::global_dim_stride }
```

## Description

`cp.async.bulk.tensor` is a non-blocking instruction which initiates an asynchronous copy operation of tensor data from the location in `.src` state space to the location in the `.dst` state space.

The operand `dstMem` specifies the location in the `.dst` state space into which the tensor data has to be copied and `srcMem` specifies the location in the `.src` state space from which the tensor data has to be copied.

When `.dst` is specified as `.shared::cta`, the address `dstMem` must be in the shared memory of the executing CTA within the cluster, otherwise the behavior is undefined. When `.dst` is `.shared::cta`, the mbarrier object `mbar` must also reside in the shared memory of the executing CTA, otherwise behavior is undefined. If the mbarrier object `mbar` resides in the shared memory of a different CTA within the cluster (a remote barrier), `.dst` must be specified as `.shared::cluster`, otherwise behavior is undefined.

When `.dst` is specified as `.shared::cluster`, the address `dstMem` can be in the shared memory of any of the CTAs within the current cluster.

The operand `tensorMap` is the generic address of the opaque tensor-map object which resides in `.param` space or `.const` space or `.global` space. The operand `tensorMap` specifies the properties of the tensor copy operation, as described in [Tensor-map](../../../05-state-spaces-types-variables/06-tensor-swizzling-and-tensormap.md). The `tensorMap` is accessed in tensormap proxy. Refer to the CUDA programming guide for creating the tensor-map objects on the host side.

The dimension of the tensor data is specified by the `.dim` modifier.

The vector operand `tensorCoords` specifies the starting coordinates in the tensor data in the global memory from or to which the copy operation has to be performed. The individual tensor coordinates in `tensorCoords` are of type `.s32`. The format of vector argument `tensorCoords` is dependent on `.load_mode` specified and is as follows:

| `.load_mode` | `tensorCoords` | Semantics |
|---|---|---|
| `.tile::scatter4` | `{col_idx, row_idx0, row_idx1, row_idx2, row_idx3}` | Fixed length vector of size 5. The five elements together specify the start co-ordinates of the four rows. |
| `.tile::gather4` | `{col_idx, row_idx0, row_idx1, row_idx2, row_idx3}` | Fixed length vector of size 5. The five elements together specify the start co-ordinates of the four rows. |
| Rest all | `{d0, .., dn}` for n = `.dim` | Vector of n elements where n = `.dim`. The elements indicate the offset in each of the dimension. |

The modifier `.completion_mechanism` specifies the completion mechanism that is supported on the instruction variant. The completion mechanisms that are supported for different variants are summarized in the following table:

| `.completion-mechanism` | `.dst` | `.src` | Completion mechanism: Needed for completion of entire Async operation | Completion mechanism: optionally can be used for the completion of reading of the tensormap object |
|---|---|---|---|---|
| `.mbarrier::...` | `.shared::cta` | `.global` | mbarrier based | Bulk async-group based |
| `.mbarrier::...` | `.shared::cluster` | `.global` | mbarrier based | Bulk async-group based |
| `.bulk_group` | `.global` | `.shared::cta` | Bulk async-group based | Bulk async-group based |

The modifier `.mbarrier::complete_tx::bytes` specifies that the `cp.async.bulk.tensor` variant uses mbarrier based completion mechanism. Upon the completion of the asynchronous copy operation, the complete-tx operation, with `completeCount` argument equal to amount of data copied in bytes, will be performed on the mbarrier object specified by the operand `mbar`. This instruction accesses its mbarrier operand using generic-proxy. When the mbarrier object `mbar` resides in the shared memory of a different CTA within the cluster (a remote barrier), `.dst` must be specified as `.shared::cluster`; using `.shared::cta` as `.dst` in this case will not signal the remote barrier and results in undefined behavior.

The modifier `.cta_group` can only be specified with the mbarrier based completion mechanism. The modifier `.cta_group` is used to signal either the odd numbered CTA or the even numbered CTA among the CTA-Pair. When `.cta_group::1` is specified, the mbarrier object `mbar` that is specified must be in the shared memory of the same CTA as the shared memory destination `dstMem`. When `.cta_group::2` is specified, the mbarrier object `mbar` can be in shared memory of either the same CTA as the shared memory destination `dstMem` or in its peer-CTA. If `.cta_group` is not specified, then it defaults to `.cta_group::1`.

The modifier `.bulk_group` specifies that the `cp.async.bulk.tensor` variant uses bulk async-group based completion mechanism.

The qualifier `.load_mode` specifies how the data in the source location is copied into the destination location. If `.load_mode` is not specified, it defaults to `.tile`.

In `.tile` mode, the multi-dimensional layout of the source tensor is preserved at the destination. In `.tile::gather4` mode, four rows in 2-dimensional source tensor are combined to form a single 2-dimensional destination tensor. In `.tile::scatter4` mode, single 2-dimensional source tensor is divided into four rows in 2-dimensional destination tensor. Details of `.tile::scatter4`/`.tile::gather4` modes are described in [.tile::scatter4 and .tile::gather4 modes](../../../05-state-spaces-types-variables/05-tensors.md).

In `.im2col`, `.im2col::*`, `.im2col_no_offs` and `.im2col_no_offs::w` modes, some dimensions of the source tensors are unrolled in a single dimensional column at the destination. Details of various im2col modes are described in [im2col mode](../../../05-state-spaces-types-variables/05-tensors.md). In each of these modes, the tensor has to be at least 3-dimensional. The vector operand `im2colInfo` can be specified only when `.load_mode` is `.im2col` or `.im2col::w` or `.im2col::w::128`. The format of the vector argument `im2colInfo` is dependent on the exact im2col mode and is as follows:

| Exact im2col mode | `im2colInfo` argument | Semantics |
|---|---|---|
| `.im2col` | `{ i2cOffW , i2cOffH , i2cOffD }` for `.dim` = `.5d` | A vector of im2col offsets whose vector size is two less than number of dimensions `.dim`. |
| `.im2col::w` | `{ wHalo, wOffset }` | A vector of 2 arguments containing `wHalo` and `wOffset` arguments. |
| `.im2col::w::128` | `{ wHalo, wOffset }` | A vector of 2 arguments containing `wHalo` and `wOffset` arguments. |
| `.im2col_no_offs` | `im2colInfo` is not applicable. | `im2colInfo` is not applicable. |
| `.im2col_no_offs::w` | `im2colInfo` is not applicable. | `im2colInfo` is not applicable. `wHalo` and `wOffset` values default to 0. |

Argument `wHalo` is a 16bit unsigned integer whose valid set of values differs on the load-mode and is as follows:

- Im2col::w mode : valid range is [0, 512).
- Im2col::w::128 mode : valid range is [0, 32).

Argument `wOffset` is a 16bit unsigned integer whose valid range of values is [0, 32).

The optional qualifier `.multicast::cluster` allows copying of data from global memory to shared memory of multiple CTAs in the cluster. Operand `ctaMask` specifies the destination CTAs in the cluster such that each bit position in the 16-bit or otherwise 32-bit `ctaMask` operand corresponds to the `%cluster_ctarank` of the destination CTA. The additional sub-qualifier `::16b` or `::32b` can be specified to correspond to the width of the `ctaMask` argument. By default, `ctaMask` is assumed to be of 16-bit width. The source data is multicast to the same offset as `dstMem` in the shared memory of each destination CTA. When `.cta_group` is specified as:

- `.cta_group::1` : The mbarrier signal is multicast to the same shared memory offset as `mbar` in the destination CTA.
- `.cta_group::2` : The mbarrier signal is multicast either to all the odd-numbered CTAs or even-numbered CTAs for each possible CTA-Pair within a cluster. In particular, for each destination CTA specified in the `ctaMask`, the mbarrier signal is sent either to the destination CTA or its peer-CTA based on the `%cluster_ctarank` parity of the shared memory where the mbarrier object `mbar` resides.

The optional modifiers `.override::global_address` and `.override_attribute` support value override functionality for various tensor properties present in the `tensorMap` object. For more details refer to the [Overriding tensor property value](tensor-copy-restrictions-and-overrides.md) section.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

The optional qualifier `.report_mechanism` specifies the mbarrier reporting mechanism as outlined in the [Report Mechanisms for Asynchronous Copy Operations](README.md).

The copy operation in `cp.async.bulk.tensor` is treated as a weak memory operation and the complete-tx operation on the mbarrier has `.release` semantics at the `.cluster` scope as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## Notes

The copy operation with `shared::cluster.global` is optimized for target architecture `sm_90a`/`sm_100f`/`sm_100a`/`sm_103f`/`sm_103a`/`sm_107a`/`sm_107f`/`sm_110f`/`sm_110a` and may have substantially reduced performance on other targets and hence such operation is advised to be used with `.target` `sm_90a`/`sm_100f`/`sm_100a`/`sm_103f`/`sm_103a`/`sm_107a`/`sm_107f`/`sm_110f`/`sm_110a`.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for `.shared::cta` as destination state space is introduced in PTX ISA version 8.6.

Support for qualifiers `.tile::gather4` and `.tile::scatter4` introduced in PTX ISA version 8.6.

Support for qualifiers `.im2col::w` and `.im2col::w::128` introduced in PTX ISA version 8.6.

Support for qualifier `.cta_group` introduced in PTX ISA version 8.6.

Support for `.multicast::cluster::16b` and `.multicast::cluster::32b` qualifiers introduced in PTX ISA version 9.4.

Support for qualifiers `.override::global_address` and `.override_attribute` introduced in PTX ISA version 9.4.

Support for qualifier `.im2col_no_offs::w` introduced in PTX ISA version 9.4.

Support for qualifier `.report_mechanism` introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

`.multicast::cluster` qualifier advised to be used with `.target` `sm_90a` or `sm_100f` or `sm_100a` or `sm_103f` or `sm_103a` or `sm_110f` or `sm_110a`.

Qualifiers `.tile::gather4` and `.im2col::w` require:

- `sm_100a` when destination state space is `.shared::cluster` and is supported on `sm_100f` from PTX ISA version 8.8.
- `sm_100` or higher when destination state space is `.shared::cta`.

Qualifier `.tile::scatter4` is supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifier `.im2col::w::128` is supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifier `.cta_group` is supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

Qualifier `.multicast::cluster::32b` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifiers `.override::global_address` and `.override_attribute` are supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifier `.im2col_no_offs::w` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

Qualifier `.report_mechanism` is supported on following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
.reg .b16 ctaMask;
.reg .u16 i2cOffW, i2cOffH, i2cOffD;
.reg .b64 l2CachePolicy;
.reg .b8  newTensorSize_<5>;
.reg .b32 newTensorLowerStrd_<4>;
.reg .b16 tensorUpperStrd;
.reg .u64 gAddrToOverride<3>;

cp.async.bulk.tensor.1d.shared::cta.global.mbarrier::complete_tx::bytes.tile  [sMem0], [tensorMap0, {tc0}], [mbar0];

@p cp.async.bulk.tensor.5d.shared::cta.global.im2col.mbarrier::complete_tx::bytes
                     [sMem2], [tensorMap2, {tc0, tc1, tc2, tc3, tc4}], [mbar2], {i2cOffW, i2cOffH, i2cOffD};

cp.async.bulk.tensor.1d.shared::cluster.global.mbarrier::complete_tx::bytes.tile  [sMem0], [tensorMap0, {tc0}], [mbar0];

@p cp.async.bulk.tensor.2d.shared::cluster.global.mbarrier::complete_tx::bytes.multicast::cluster
                     [sMem1], [tensorMap1, {tc0, tc1}], [mbar2], ctaMask;

@p cp.async.bulk.tensor.5d.shared::cluster.global.im2col.mbarrier::complete_tx::bytes
                     [sMem2], [tensorMap2, {tc0, tc1, tc2, tc3, tc4}], [mbar2], {i2cOffW, i2cOffH, i2cOffD};

@p cp.async.bulk.tensor.3d.im2col.shared::cluster.global.mbarrier::complete_tx::bytes.L2::cache_hint
                     [sMem3], [tensorMap3, {tc0, tc1, tc2}], [mbar3], {i2cOffW}, policy;

@p cp.async.bulk.tensor.1d.global.shared::cta.bulk_group  [tensorMap3, {tc0}], [sMem3];

cp.async.bulk.tensor.2d.tile::gather4.shared::cluster.global.mbarrier::complete_tx::bytes
                     [sMem5], [tensorMap6, {x0, y0, y1, y2, y3}], [mbar5];

cp.async.bulk.tensor.3d.im2col::w.shared::cluster.global.mbarrier::complete_tx::bytes
                     [sMem4], [tensorMap5, {t0, t1, t2}], [mbar4], {im2colwHalo, im2colOff};

cp.async.bulk.tensor.1d.shared::cluster.global.tile.cta_group::2
                     [sMem6], [tensorMap7, {tc0}], [peerMbar];

cp.async.bulk.tensor.mbarrier::complete_tx::bytes.shared::cta.global.1d.override::global_address
                     [sMem7], [tensorMap8, gAddrToOverride1, {tc0}], [peerMbar];

cp.async.bulk.tensor.mbarrier::complete_tx::bytes.shared::cta.global.5d.tile.override::global_address.cta_group::1.override::global_dim_stride
                     [sMem8], [tensorMap9, gAddrToOverride2, {newTensorSize_0, newTensorSize_1, newTensorSize_2, newTensorSize_3, newTensorSize_4}, {newTensorLowerStrd_0, newTensorLowerStrd_1, newTensorLowerStrd_2, newTensorLowerStrd_3}, tensorUpperStrd, {0, 0, 0, 0, 0}], [mbar];

cp.async.bulk.tensor.global.shared::cta.1d.bulk_group.tile.override::global_address.override::global_dim
                     [tensorMap10, gAddrToOverride3, {newTensorSize_0}, {0}], [sMem9];

cp.async.bulk.tensor.mbarrier::complete_tx::bytes.shared::cluster.global.4d.im2col::w::128.override::global_address.cta_group::1
                     [sMem10], [tensorMap11, gAddrToOverride4, {tc0, tc1, tc2, tc3}], [mbar5], {im2col_0, im2col_1};

cp.async.bulk.tensor.3d.global.shared::cta.bulk_group.im2col_no_offs::w  [tensorMap6, {tc0, tc1, tc2}], [sMem11];

// Validity check using 0x8 pattern on every 16B
cp.async.bulk.tensor.1d.shared::cluster.global.mbarrier::complete_tx::bytes.mbarrier::report::validity::per_16bytes::8 [sMem], [tensorDesc, {u}], [mbar];

// Validity check using 0xff pattern on per element
cp.async.bulk.tensor.2d.shared::cluster.global.tile::gather4.mbarrier::complete_tx::bytes.mbarrier::report::validity::per_element::ff
                     [sMem], [tensorDesc, {u, v, w, x, y}], [mbar];
```

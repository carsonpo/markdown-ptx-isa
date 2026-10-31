# 13.6. Changes in PTX ISA Version 8.8

## New Features

PTX ISA version 8.8 introduces the following new features:

- Adds support for `sm_103` target architecture.
- Adds support for target `sm_103a` that supports architecture-specific features.
- Adds support for `sm_121` target architecture.
- Adds support for target `sm_121a` that supports architecture-specific features.
- Introduces family-specific target architectures that are represented with "f" suffix. PTX for family-specific targets is compatible with all subsequent targets in same family. Adds support for `sm_100f`, `sm_101f`, `sm_103f`, `sm_120f`, `sm_121f`.
- Extends `min` and `max` instructions to support three input arguments.
- Extends `tcgen05.mma` instruction to add support for new `scale_vectorsize` qualifiers `.block16` and `.block32` and K dimension 96.
- Extends `.field3` of `tensormap.replace` instruction to support 96B swizzle mode.
- Adds support for `tcgen05.ld.red` instruction.
- Extends `ld`, `ld.global.nc` and `st` instructions to support 256b load/store operations.
- Table 73 shows the list of features that are supported on family-specific targets:

**Table 73** List of features promoted to family-specific architecture

| Feature | Supported targets |
|---|---|
| `.m16n8`, `.m16n16`, `.m8n16` shapes and `.b8` type for `ldmatrix`/`stmatrix` | `sm_100f`, `sm_101f`, `sm_120f` |
| Shapes for tcgen05 `.16x64b` `.16x128b`, `.16x256b`, `.16x32bx2`, `.32x32b`, `.4x256b`, `.32x128b`, `.64x128b`, `.128x256b`, `.128x128b`, `.31x256b` | `sm_100f`, `sm_101f` |
| `setmaxnreg` | `sm_100f`, `sm_101f`, `sm_120f` |
| `.cta_group` modifier | `sm_100f`, `sm_101f` |
| `cvt` with `.e2m1x2`, `.e3m2x2`, `.e2m3x2`, `.ue8m0x2` | `sm_100f`, `sm_101f`, `sm_120f` |
| `multimem` with `.acc::f16` and `.e5m2`, `.e5m2x2`, `.e5m2x4`, `.e4m3`, `.e4m3x2`, `.e4m3x4` types | `sm_100f`, `sm_101f` |
| `tensormap.replace` | `sm_100f`, `sm_101f`, `sm_120f` |
| `tcgen05.ld.red` | `sm_101f`, `sm_103f` |
| `tcgen05.ld`/`st`/`fence`/ `wait`/`commit`/`cp`/ `alloc`/`dealloc`/ `relinquish_alloc_permit` | `sm_100f`, `sm_101f` |
| `tcgen05.mma{.ws}{.sp}` (except `kind::mxf4`/ `kind::mxf4nvf4` for `.sp`) | `sm_100f`, `sm_101f` |
| tcgen05 `.kind::mxf4nvf4`, `.kind::mxf4`, `.kind::mxf8f6f4`, `.kind::f16`, `.kind::tf32`, `.kind::f8f6f4` | `sm_100f`, `sm_101f` |
| `.ashift`, `.collector_usage` modifiers for tcgen05 | `sm_100f`, `sm_101f` |
| Modifiers `.b8x16`, `.b6x16_p32`, `.b4x16_p64` | `sm_100f`, `sm_101f`, `sm_120f` |
| `.block_scale` modifier | `sm_100f`, `sm_101f`, `sm_120f` |
| `mma{.sp}` with `.e3m2`, `.e2m3`, `.e2m1` types and `.kind`, `.block_scale`, `.scale_vec_size` modifiers (except `.sp` with `mxf4`/ `mxf4nvf4`) | `sm_120f` |
| `.scale_vec::1X`/`2X`/`4X` modifiers | `sm_120f` |
| `.block16`/`.block32` modifiers (alias to `scale_vec`) | `sm_100f`, `sm_101f` |
| `.warpx2::02_13`, `.warpx2::01_23`, `.warpx4`, `.pack::16b`, `.unpack::16b` modifiers for tcgen05 | `sm_100f`, `sm_101f` |
| `clusterlaunchcontrol.try_cancel` `multicast::cluster::all` | `sm_100f`, `sm_101f`, `sm_120f` |
| `.tile::scatter4`, `.tile::gather4`, `.im2col::w`, `.im2col::w::128` | `sm_100f`, `sm_101f` |
| `redux.f32` | `sm_100f` |
| scale-input-d for tcgen05 | `sm_100f` |

## Semantic Changes and Clarifications

- Clarified the behavior of float-to-integer conversions for NaN input.

# 13.7. Changes in PTX ISA Version 8.7

## New Features

PTX ISA version 8.7 introduces the following new features:

- Adds support for `sm_120` target architecture.
- Adds support for target `sm_120a` that supports architecture-specific features.
- Extends `tcgen05.mma` instruction to add support for `.kind::mxf4nvf4` and `.scale_vec::4X` qualifiers.
- Extends `mma` instructions to support `.f16` type accumulator and shape `.m16n8k16` with FP8 types `.e4m3` and `.e5m2`.
- Extends `cvt` instruction to add support for `.rs` rounding mode and destination types `.e2m1x4`, `.e4m3x4`, `.e5m2x4`, `.e3m2x4`, `.e2m3x4`.
- Extends support for `st.async` and `red.async` instructions to add support for `.mmio`, `.release`, `.global` and `.scope` qualifiers.
- Extends `tensormap.replace` instruction to add support for values 13 to 15 for `.elemtype` qualifier.
- Extends `mma` and `mma.sp::ordered_metadata` instructions to add support for types `.e3m2`/`.e2m3`/ `.e2m1` and qualifiers `.kind`, `.block_scale`, `.scale_vec_size`.

## Semantic Changes and Clarifications

- Clarified that in `.tile::gather4`, `.tile::scatter4` modes, tensor coordinates need to be specified as {col_idx, row_idx0, row_idx1, row_idx2, row_idx3} i.e. {x, y0, y1, y2, y3} instead of {x0, x1, x2, x3, y}.
- Updated Instruction descriptor of `tcgen05.mma` instruction to clarify the bits that are reserved for future use.

# 13.8. Changes in PTX ISA Version 8.6

## New Features

PTX ISA version 8.6 introduces the following new features:

- Adds support for `sm_100` target architecture.
- Adds support for target `sm_100a` that supports architecture-specific features.
- Adds support for `sm_101` target architecture.
- Adds support for target `sm_101a` that supports architecture-specific features.
- Extends `cp.async.bulk` and `cp.async.bulk.tensor` instructions to add `.shared::cta` as destination state space.
- Extends `fence` instruction to add support for `.acquire` and `.release` qualifiers.
- Extends `fence` and `fence.proxy` instructions to add support for `.sync_restrict` qualifier.
- Extends `ldmatrix` instruction to support `.m16n16`, `.m8n16` shapes and `.b8` type.
- Extends `ldmatrix` instruction to support `.src_fmt`, `.dst_fmt` qualifiers.
- Extends `stmatrix` instruction to support `.m16n8` shape and `.b8` type.
- Adds support for `clusterlaunchcontrol` instruction.
- Extends `add`, `sub` and `fma` instructions to support mixed precision floating point operations with `.f32` as destaination operand type and `.f16`/`.bf16` as source operand types.
- Extends `add`, `sub`, `mul` and `fma` instructions to support `.f32x2` type.
- Extends `cvt` instruction with `.tf32` type to support `.satfinite` qualifier for `.rn`/`.rz` rounding modes.
- Extends `cp.async.bulk` instruction to support `.cp_mask` qualifier and `byteMask` operand.
- Extends `multimem.ld_reduce` and `multimem.st` instructions to support `.e5m2`, `.e5m2x2`, `.e5m2x4`, `.e4m3`, `.e4m3x2` and `.e4m3x4` types.
- Extends `cvt` instruction to support conversions to/from `.e2m1x2`, `.e3m2x2`, `.e2m3x2` and `.ue8m0x2` types.
- Extends `cp.async.bulk.tensor` and `cp.async.bulk.prefetch.tensor` instructions to support new load_mode qualifiers `.tile::scatter4` and `.tile::gather4`.
- Extends `tensormap.replace` instruction to add support for new qualifier `.swizzle_atomicity` for supporting new swizzle modes.
- Extends `mbarrier.arrive`, `mbarrier.arrive_drop`, `.mbarrier.test_wait` and `.mbarrier.try_wait` instructions to support `.relaxed` qualifier.
- Extends `cp.async.bulk.tensor` and `cp.async.bulk.prefetch.tensor` instructions to support new load_mode qualifiers `.im2col::w` and `.im2col::w::128`.
- Extends `cp.async.bulk.tensor` instruction to support new qualifier `.cta_group`.
- Add support for `st.bulk` instruction.
- Adds support for tcgen05 features and related instructions: `tcgen05.alloc`, `tcgen05.dealloc`, `tcgen05.relinquish_alloc_permit`, `tcgen05.ld`, `tcgen05.st`, `tcgen05.wait`, `tcgen05.cp`, `tcgen05.shift`, `tcgen05.mma`, `tcgen05.mma.sp`, `tcgen05.mma.ws`, `tcgen05.mma.ws.sp`, `tcgen05.fence` and `tcgen05.commit`.
- Extends `redux.sync` instruction to add support for `.f32` type with qualifiers `.abs` and `.NaN`.

## Semantic Changes and Clarifications

None.

# 13.9. Changes in PTX ISA Version 8.5

## New Features

PTX ISA version 8.5 introduces the following new features:

- Adds support for `mma.sp::ordered_metadata` instruction.

## Semantic Changes and Clarifications

- Values `0b0000`, `0b0101`, `0b1010`, `0b1111` for sparsity metadata (operand `e`) of instruction `mma.sp` are invalid and their usage results in undefined behavior.

# 13.10. Changes in PTX ISA Version 8.4

## New Features

PTX ISA version 8.4 introduces the following new features:

- Extends `ld`, `st` and `atom` instructions with `.b128` type to support `.sys` scope.
- Extends integer `wgmma.mma_async` instruction to support `.u8.s8` and `.s8.u8` as `.atype` and `.btype` respectively.
- Extends `mma`, `mma.sp` instructions to support FP8 types `.e4m3` and `.e5m2`.

## Semantic Changes and Clarifications

None.

# 13.11. Changes in PTX ISA Version 8.3

## New Features

PTX ISA version 8.3 introduces the following new features:

- Adds support for pragma `used_bytes_mask` that is used to specify mask for used bytes for a load operation.
- Extends `isspacep`, `cvta.to`, `ld` and `st` instructions to accept `::entry` and `::func` sub-qualifiers with `.param` state space qualifier.
- Adds support for `.b128` type on instructions `ld`, `ld.global.nc`, `ldu`, `st`, `mov` and `atom`.
- Add support for instructions `tensormap.replace`, `tensormap.cp_fenceproxy` and support for qualifier `.to_proxykind::from_proxykind` on instruction `fence.proxy` to support modifying tensor-map.

## Semantic Changes and Clarifications

None.

# 13.12. Changes in PTX ISA Version 8.2

## New Features

PTX ISA version 8.2 introduces the following new features:

- Adds support for `.mmio` qualifier on `ld` and `st` instructions.
- Extends `lop3` instruction to allow predicate destination.
- Extends `multimem.ld_reduce` instruction to support `.acc::f32` qualifier to allow `.f32` precision of the intermediate accumulation.
- Extends the asynchronous warpgroup-level matrix multiply-and-accumulate operation `wgmma.mma_async` to support `.sp` modifier that allows matrix multiply-accumulate operation when input matrix A is sparse.

## Semantic Changes and Clarifications

The `.multicast::cluster` qualifier on `cp.async.bulk` and `cp.async.bulk.tensor` instructions is optimized for target architecture `sm_90a` and may have substantially reduced performance on other targets and hence `.multicast::cluster` is advised to be used with `sm_90a`.

# 13.13. Changes in PTX ISA Version 8.1

## New Features

PTX ISA version 8.1 introduces the following new features:

- Adds support for `st.async` and `red.async` instructions for asynchronous store and asynchronous reduction operations respectively on shared memory.
- Adds support for `.oob` modifier on half-precision `fma` instruction.
- Adds support for `.satfinite` saturation modifier on `cvt` instruction for `.f16`, `.bf16` and `.tf32` formats.
- Extends support for `cvt` with `.e4m3`/`.e5m2` to `sm_89`.
- Extends `atom` and `red` instructions to support vector types.
- Adds support for special register `%aggr_smem_size`.
- Extends `sured` instruction with 64-bit min/max operations.
- Adds support for increased kernel parameter size of 32764 bytes.
- Adds support for multimem addresses in memory consistency model.
- Adds support for `multimem.ld_reduce`, `multimem.st` and `multimem.red` instructions to perform memory operations on multimem addresses.

## Semantic Changes and Clarifications

None.

# 13.14. Changes in PTX ISA Version 8.0

## New Features

PTX ISA version 8.0 introduces the following new features:

- Adds support for target `sm_90a` that supports architecture-specific features.
- Adds support for asynchronous warpgroup-level matrix multiply-and-accumulate operation `wgmma`.
- Extends the asynchronous copy operations with bulk operations that operate on large data, including tensor data.
- Introduces packed integer types `.u16x2` and `.s16x2`.
- Extends integer arithmetic instruction `add` to allow packed integer types `.u16x2` and `.s16x2`.
- Extends integer arithmetic instructions `min` and `max` to allow packed integer types `.u16x2` and `.s16x2`, as well as saturation modifier `.relu` on `.s16x2` and `.s32` types.
- Adds support for special register `%current_graph_exec` that identifies the currently executing CUDA device graph.
- Adds support for `elect.sync` instruction.
- Adds support for `.unified` attribute on functions and variables.
- Adds support for `setmaxnreg` instruction.
- Adds support for `.sem` qualifier on `barrier.cluster` instruction.
- Extends the `fence` instruction to allow opcode-specific synchronizaion using `op_restrict` qualifier.
- Adds support for `.cluster` scope on `mbarrier.arrive`, `mbarrier.arrive_drop`, `mbarrier.test_wait` and `mbarrier.try_wait` operations.
- Adds support for transaction count operations on mbarrier objects, specified with `.expect_tx` and `.complete_tx` qualifiers.

## Semantic Changes and Clarifications

None.

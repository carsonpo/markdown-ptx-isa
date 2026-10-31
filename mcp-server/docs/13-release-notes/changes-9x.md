# 13.1. Changes in PTX ISA Version 9.4

## New Features

PTX ISA version 9.4 introduces the following new features:

- Adds support for `sm_107` target architecture.
- Adds support for target `sm_107f` that supports family-specific features.
- Adds support for target `sm_107a` that supports architecture-specific features.
- Adds support for instruction types `.u8x4`, `.s8x4`, `.u16x2`, `.s16x2` for `set` instruction.
- Adds support for `.pzo` qualifier for `cvt` instruction.
- Adds support for `.rz` rounding mode for `cvt` instruction with `.e4m3x2`, `.e5m2x2`, `.e2m3x2`, `.e3m2x2`, `.e2m1x2` destination types.
- Adds support for `.multicast::cluster::32b` qualifier for `mbarrier.expect_tx`, `mbarrier.complete_tx`, `mbarrier.arrive`, `mbarrier.arrive_drop`, `cp.async.bulk`, `cp.async.bulk.tensor` and `tcgen05.commit` instructions.
- Adds support for `.sync_restrict::shared::read::mma::a` qualifier for `tcgen05.commit` instruction.
- Adds support for `.level::eviction_priority` qualifier for `cp.async.bulk.prefetch` and `cp.async.bulk.prefetch.tensor` instructions.
- Adds support for `applypriority.async.bulk` and `applypriority.async.bulk.tensor` instructions.
- Adds support for `.override::global_address` and `.override_attribute` qualifiers for `cp.async.bulk.tensor`, `cp.reduce.async.bulk.tensor`, `cp.async.bulk.prefetch.tensor` instructions.
- Adds support for `.im2col_no_offs::w` qualifier for `cp.async.bulk.tensor` and `cp.reduce.async.bulk.tensor` instructions.
- Adds support for `.spcompress` qualifier for `tcgen05.ld` and `tcgen05.ld.red` instructions.
- Adds support for `spcompress` and `spdecompress` instructions.
- Adds support for `.ue5m3x2` instruction type for `cvt` instruction.
- Adds support for `.scaled::n1::ue8m0` qualifier for `cvt` instruction.
- Adds UE5M3 as scale type for `tcgen05.mma` and `tcgen05.mma.sp` instructions.
- Adds support for `.kind::ti16` qualifier for `tcgen05.mma`, `tcgen05.mma.sp`, `tcgen05.mma.ws`, `tcgen05.mma.ws.sp` instructions.
- Adds support for `add`, `sub`, `mul` and `fma` instructions with `.f16x2`/`.bf16x2`/`.f32x2` types.
- Adds support for `add`, `sub`, `mul` and `fma` instructions with FP8/FP6/FP4 x4 packed types.
- Adds support for `.exclusive` qualifier for `tcgen05.alloc` and `tcgen05.dealloc` instructions.
- Adds support for `.report_mechanism` qualifier for `cp.async.bulk` and `cp.async.bulk.tensor` instructions.
- Adds support for `.decompress::lut::b` qualifier for `tcgen05.mma` instruction.
- Adds support for `.collector::b::*` qualifier for `tcgen05.mma` instruction.
- Adds support for `.loc_intermediate` directive and `.nv_intermediate_source_section` construct for intermediate IR source location mapping.
- Adds support for `.valid_addr` and `.L1::32B` qualifiers for `prefetch` instruction.
- Adds support for `.noftz` qualifier with `.f32` type for `atom`, `red`, `cp.reduce.async.bulk`, and `multimem.cp.reduce.async.bulk` instructions.
- Adds support for `.proxy::readonly` qualifier for `ld` instruction.
- Adds support for `.minperctamemory` directive and `%perctamemoryoffset`, `%perctamemorysize` special registers for per-CTA global memory.
- Adds support for `.s8.s4` types for `ldmatrix` instruction for `.m8n16` shape.
- Adds support for `.sync_restrict::shared::cluster::read` qualifier for `fence.proxy.async::generic` instruction.
- Adds support for `.acquire` and `.release` qualifiers with `.alias` qualifier for `fence.proxy` instruction.
- Adds support for `fabric.try_get.async.tensor`, `fabric.try_put.async.tensor`, and `fabric.try_red.async.tensor` instructions.
- Adds support for `fabric.try_atom` instruction.
- Adds support for `createpolicy.range.fabric` instruction.
- Adds support for `.level::cache_hint` qualifier for `fabric.try_get`, `fabric.try_put`, and `fabric.try_red` instructions.

## Semantic Changes and Clarifications

- None

# 13.2. Changes in PTX ISA Version 9.3

## New Features

PTX ISA version 9.3 introduces the following new features:

- Adds support for `mma_throughput` pragma.
- Adds support for `clmad` instruction.
- Adds support for `.phase_type::*` qualifier for `mbarrier.test_wait` and `mbarrier.try_wait` instructions.
- Adds support for `reportPredicate` and `reportValue` operands for `mbarrier.test_wait` and `mbarrier.try_wait` instructions.
- Adds support for `.layout` qualifier for `mbarrier` instructions and support for `mbarrier.check_layout` instruction.
- Adds support for `multimem.st.async` and `multimem.red.async` instructions.
- Adds support for `.sem` and `.scope` qualifiers for `cp.async.bulk`, `cp.reduce.async.bulk`, `multimem.cp.async.bulk` and `multimem.cp.reduce.async.bulk` instructions.
- Adds support for `fabric.try_get`, `fabric.try_put`, `fabric.try_red`, `fabric.try_pullred`, `fabric.wait`, `fabric.submit` instructions.
- Adds support for `fence.proxy.to_proxykind::from_proxykind_fabric` qualifier for `fence` instruction.
- Adds support for `.language` directive.

## Semantic Changes and Clarifications

- Clarified that `red.async` instruction supports `sys` scope and not `cluster` scope with `.release` qualifier.

# 13.3. Changes in PTX ISA Version 9.2

## New Features

PTX ISA version 9.2 introduces the following new features:

- Adds support for `.u8x4` and `.s8x4` instruction types for `add`, `sub`, `min`, `max`, `neg` instructions.
- Adds support for `add.sat.{u16x2/s16x2/u32}` instruction.
- Adds support for `.b128` type for `st.async` instruction.
- Adds support for `.ignore_oob` qualifier for `cp.async.bulk` instruction.
- Adds support for `.bf16x2` destination type for `cvt` instruction with `.e4m3x2`, `.e5m2x2`, `.e3m2x2`, `.e2m3x2`, `.e2m1x2` source types.

## Semantic Changes and Clarifications

- For `wgmma.mma_async` instruction with `.atype` and `.btype` as `.e4m3`/`.e5m2` and `.dtype` as `.f32`, current implementation does accumulation at higher than half precision but lower than single precision.

# 13.4. Changes in PTX ISA Version 9.1

## New Features

PTX ISA version 9.1 introduces the following new features:

- Adds support for `.volatile` qualifier with `.local` state space for `ld` and `st` instructions.
- Adds support for `.f16x2` and `.bf16x2` source types for `cvt` instruction with destination types `.e2m1x2`, `.e2m3x2`, `.e3m2x2`, `.e4m3x2`, `.e5m2x2`.
- Adds support for `.scale_vec::4X` with `.ue8m0` as `.stype` with `.kind::mxf4nvf4` for `mma`/`mma.sp` instructions.
- Adds support for `.s2f6x2` instruction type for `cvt` instruction.
- Adds support for `multimem.cp.async.bulk` and `multimem.cp.reduce.async.bulk` instructions.

## Semantic Changes and Clarifications

None.

# 13.5. Changes in PTX ISA Version 9.0

## New Features

PTX ISA version 9.0 introduces the following new features:

- Adds support for `sm_88` target architecture.
- Adds support for `sm_110` target architecture.
- Adds support for target `sm_110f` that supports family-specific features.
- Adds support for target `sm_110a` that supports architecture-specific features.
- Adds support for pragma `enable_smem_spilling` that is used to enable shared memory spilling for a function.
- Adds support for pragma `frequency` that is used to specify the execution frequency of a basic block.
- Adds support for directive `.blocksareclusters` that is used to specify that CUDA thread blocks are mapped to clusters.
- Extends size operand of `st.bulk` instruction to support 32-bit length.
- Adds support for performance-tuning directives `.abi_preserve` and `.abi_preserve_control` that are used to specify the number of data and control registers that should be preserved by the callers of a function.

## Notes

- Targets `sm_{101,101f,101a}` are renamed to targets `sm_{110,110f,110a}` from PTX ISA version 9.0.

## Semantic Changes and Clarifications

- All tcgen05 instructions(`tcgen05.alloc`, `tcgen05.dealloc`, `tcgen05.relinquish_alloc_permit`, `tcgen05.cp`, `tcgen05.shift`, `tcgen05.mma`, `tcgen05.mma.sp`, `tcgen05.mma.ws`, `tcgen05.mma.ws.sp`, `tcgen05.commit`) within a kernel must specify the same value for the `.cta_group` qualifier.

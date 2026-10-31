# NVIDIA PTX ISA v9.4 — Overview

Markdown edition of the NVIDIA Parallel Thread Execution (PTX) ISA, version 9.4. Each entry below is a page (or a directory of pages) carrying the official section numbers. Instruction pages follow the specification's layout: name and summary, then **Syntax**, **Description**, **Semantics**, **Notes**, **PTX ISA Notes**, **Target ISA Notes**, **Examples**.

> This is an unofficial reformatting. The authoritative source is [NVIDIA's documentation](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html).

## Chapters

- [1. Introduction](01-introduction.md) — goals of PTX, what is new in PTX ISA 9.4, document structure
- [2. Programming Model](02-programming-model.md) — threads, CTAs, clusters, grids, memory hierarchy
- [3. PTX Machine Model](03-machine-model.md) — SIMT multiprocessors, independent thread scheduling, on-chip shared memory
- [4. Syntax](04-syntax.md) — source format, statements, directive and instruction keywords, identifiers, constants and constant expressions
- [5. State Spaces, Types, and Variables](05-state-spaces-types-variables/README.md) — state spaces, fundamental and packed types, texture/sampler/surface types, variables, tensors, swizzling, tensor-maps
- [6. Instruction Operands](06-instruction-operands.md) — operand types, addresses, arrays, vectors, scalar conversion table, rounding modifiers, operand costs
- [7. Abstracting the ABI](07-abstracting-abi.md) — function declarations and definitions, variadic functions, alloca
- [8. Memory Consistency Model](08-memory-consistency-model/README.md) — scopes, proxies, strong and weak operations, release/acquire patterns, ordering relations, axioms, litmus tests
- [9. Instruction Set](09-instruction-set/README.md) — predicated execution, type information, relaxed type checking, and every instruction family:
  - [9.7.1 Integer Arithmetic](09-instruction-set/01-integer-arithmetic/README.md) · [9.7.2 Extended-Precision](09-instruction-set/02-extended-precision/README.md) · [9.7.3 Floating-Point](09-instruction-set/03-floating-point/README.md) · [9.7.4 Half Precision](09-instruction-set/04-half-precision-fp/README.md) · [9.7.5 Mixed Precision](09-instruction-set/05-mixed-precision-fp/README.md) · [9.7.6 Alternate Floating-Point](09-instruction-set/06-alternate-fp/README.md)
  - [9.7.7 Comparison and Selection](09-instruction-set/07-comparison-selection/README.md) · [9.7.8 Half Precision Comparison](09-instruction-set/08-half-precision-comparison/README.md) · [9.7.9 Logic and Shift](09-instruction-set/09-logic-shift/README.md)
  - [9.7.10 Data Movement and Conversion](09-instruction-set/10-data-movement-conversion/README.md) — `ld`, `st`, `cvt`, `prmt`, `shfl.sync`, cache hints, `multimem.*`, `tensormap.replace`, `spcompress`/`spdecompress`, and the [asynchronous copy](09-instruction-set/10-data-movement-conversion/async-copy/README.md) family (`cp.async`, `cp.async.bulk`, `cp.async.bulk.tensor`, `cp.reduce.async.bulk*`, prefetch and completion instructions)
  - [9.7.11 Fabric Instructions](09-instruction-set/11-fabric/README.md) — `fabric.try_get/try_put/try_red/try_pullred/try_atom`, `fabric.submit/wait`, tensor variants
  - [9.7.12 Texture](09-instruction-set/12-texture/README.md) · [9.7.13 Surface](09-instruction-set/13-surface/README.md) · [9.7.14 Control Flow](09-instruction-set/14-control-flow/README.md)
  - [9.7.15 Parallel Synchronization and Communication](09-instruction-set/15-parallel-sync-communication/README.md) — barriers, `membar`/`fence`, `atom`, `red`, `red.async`, `vote`, `match`, `redux`, `elect`, `griddepcontrol`, the [mbarrier](09-instruction-set/15-parallel-sync-communication/mbarrier/README.md) object and instructions, `tensormap.cp_fenceproxy`, `clusterlaunchcontrol.*`
  - [9.7.16 Warp Level Matrix Multiply-Accumulate](09-instruction-set/16-warp-level-mma/README.md) — shapes and data types, block scaling, [wmma](09-instruction-set/16-warp-level-mma/wmma/README.md), [mma](09-instruction-set/16-warp-level-mma/mma/README.md) with per-shape fragment layouts, `ldmatrix`/`stmatrix`/`movmatrix`, and [sparse mma.sp](09-instruction-set/16-warp-level-mma/mma-sp/README.md)
  - [9.7.17 Asynchronous Warpgroup Level MMA (wgmma)](09-instruction-set/17-wgmma/README.md) — shapes, register fragments, shared-memory layouts and matrix descriptors, `wgmma.mma_async`, `wgmma.mma_async.sp`, `wgmma.fence/commit_group/wait_group`
  - [9.7.18 TensorCore 5th Generation (tcgen05)](09-instruction-set/18-tcgen05/README.md) — tensor memory, shapes, strides and canonical layouts, shared-memory/instruction/zero-column-mask descriptors, issue granularity, memory consistency, `tcgen05.alloc/ld/st/wait/cp/shift`, the [MMA operations](09-instruction-set/18-tcgen05/mma/README.md) (layouts, packing, block scaling, decompression, sparsity, `tcgen05.mma*`), `tcgen05.fence`, `tcgen05.commit`
  - [9.7.19 Stack Manipulation](09-instruction-set/19-stack-manipulation/README.md) · [9.7.20 Video](09-instruction-set/20-video/README.md) · [9.7.21 Miscellaneous](09-instruction-set/21-miscellaneous/README.md)
- [10. Special Registers](10-special-registers/README.md) — `%tid` … `%perctamemorysize`, one page per register
- [11. Directives](11-directives/README.md) — module, kernel/function, control flow, performance tuning, debugging, linking, cluster dimension and miscellaneous directives
- [12. Descriptions of .pragma Strings](12-pragma-strings/README.md) — `"nounroll"`, `"used_bytes_mask"`, `"enable_smem_spilling"`, `"frequency"`, `"mma_throughput"`
- [13. Release Notes](13-release-notes/README.md) — PTX release history, arch/family-specific feature history, and per-version change lists
- [14. Notices](14-notices.md)

## Reading tips for agents

- Instruction pages are named after the mnemonic with dots replaced by hyphens (`cp-async-bulk-tensor.md`); `read_ptx_isa_page` also accepts the mnemonic itself.
- Every page's sections are addressable: ask for `section="Syntax"`, `section="Examples"` or a numbered subsection to avoid reading a whole page.
- `search_ptx_isa` understands dotted qualifiers and section numbers; narrow with `scope="09-instruction-set/18-tcgen05"` when a term is common.

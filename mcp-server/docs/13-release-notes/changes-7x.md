# 13.15. Changes in PTX ISA Version 7.8

## New Features

PTX ISA version 7.8 introduces the following new features:

- Adds support for `sm_89` target architecture.
- Adds support for `sm_90` target architecture.
- Extends `bar` and `barrier` instructions to accept optional scope qualifier `.cta`.
- Extends `.shared` state space qualifier with optional sub-qualifier `::cta`.
- Adds support for `movmatrix` instruction which transposes a matrix in registers across a warp.
- Adds support for `stmatrix` instruction which stores one or more matrices to shared memory.
- Extends the `.f64` floating point type `mma` operation with shapes `.m16n8k4`, `.m16n8k8`, and `.m16n8k16`.
- Extends `add`, `sub`, `mul`, `set`, `setp`, `cvt`, `tanh`, `ex2`, `atom` and `red` instructions with bf16 alternate floating point data format.
- Adds support for new alternate floating-point data formats `.e4m3` and `.e5m2`.
- Extends `cvt` instruction to convert `.e4m3` and `.e5m2` alternate floating point data formats.
- Adds support for `griddepcontrol` instruction as a communication mechanism to control the execution of dependent grids.
- Extends `mbarrier` instruction to allow a new phase completion check operation `try_wait`.
- Adds support for new thread scope `.cluster` which is a set of Cooperative Thread Arrays (CTAs).
- Extends `fence`/`membar`, `ld`, `st`, `atom`, and `red` instructions to accept `.cluster` scope.
- Adds support for extended visibility of shared state space to all threads within a cluster.
- Extends `.shared` state space qualifier with `::cluster` sub-qualifier for cluster-level visibility of shared memory.
- Extends `isspacep`, `cvta`, `ld`, `st`, `atom`, and `red` instructions to accept `::cluster` sub-qualifier with `.shared` state space qualifier.
- Adds support for `mapa` instruction to map a shared memory address to the corresponding address in a different CTA within the cluster.
- Adds support for `getctarank` instruction to query the rank of the CTA that contains a given address.
- Adds support for new barrier synchronization instruction `barrier.cluster`.
- Extends the memory consistency model to include the new cluster scope.
- Adds support for special registers related to cluster information: `%is_explicit_cluster`, `%clusterid`, `%nclusterid`, `%cluster_ctaid`, `%cluster_nctaid`, `%cluster_ctarank`, `%cluster_nctarank`.
- Adds support for cluster dimension directives `.reqnctapercluster`, `.explicitcluster`, and `.maxclusterrank`.

## Semantic Changes and Clarifications

None.

# 13.16. Changes in PTX ISA Version 7.7

## New Features

PTX ISA version 7.7 introduces the following new features:

- Extends `isspacep` and `cvta` instructions to include the `.param` state space for kernel function parameters.

## Semantic Changes and Clarifications

None.

# 13.17. Changes in PTX ISA Version 7.6

## New Features

PTX ISA version 7.6 introduces the following new features:

- Support for `szext` instruction which performs sign-extension or zero-extension on a specified value.
- Support for `bmsk` instruction which creates a bitmask of the specified width starting at the specified bit position.
- Support for special registers `%reserved_smem_offset_begin`, `%reserved_smem_offset_end`, `%reserved_smem_offset_cap`, `%reserved_smem_offset<2>`.

## Semantic Changes and Clarifications

None.

# 13.18. Changes in PTX ISA Version 7.5

## New Features

PTX ISA version 7.5 introduces the following new features:

- Debug information enhancements to support label difference and negative values in the `.section` debugging directive.
- Support for ignore-src operand on `cp.async` instruction.
- Extensions to the memory consistency model to introduce the following new concepts:
  - A memory proxy as an abstract label for different methods of memory access.
  - Virtual aliases as distinct memory addresses accessing the same physical memory location.
- Support for new `fence.proxy` and `membar.proxy` instructions to allow synchronization of memory accesses performed via virtual aliases.

## Semantic Changes and Clarifications

None.

# 13.19. Changes in PTX ISA Version 7.4

## New Features

PTX ISA version 7.4 introduces the following new features:

- Support for `sm_87` target architecture.
- Support for `.level::eviction_priority` qualifier which allows specifying cache eviction priority hints on `ld`, `ld.global.nc`, `st`, and `prefetch` instructions.
- Support for `.level::prefetch_size` qualifier which allows specifying data prefetch hints on `ld` and `cp.async` instructions.
- Support for `createpolicy` instruction which allows construction of different types of cache eviction policies.
- Support for `.level::cache_hint` qualifier which allows the use of cache eviction policies with `ld`, `ld.global.nc`, `st`, `atom`, `red` and `cp.async` instructions.
- Support for `applypriority` and `discard` operations on cached data.

## Semantic Changes and Clarifications

None.

# 13.20. Changes in PTX ISA Version 7.3

## New Features

PTX ISA version 7.3 introduces the following new features:

- Extends `mask()` operator used in initializers to also support integer constant expression.
- Adds support for stack manpulation instructions that allow manipulating stack using `stacksave` and `stackrestore` instructions and allocation of per-thread stack using `alloca` instruction.

## Semantic Changes and Clarifications

The unimplemented version of `alloca` from the older PTX ISA specification has been replaced with new stack manipulation instructions in PTX ISA version 7.3.

# 13.21. Changes in PTX ISA Version 7.2

## New Features

PTX ISA version 7.2 introduces the following new features:

- Enhances `.loc` directive to represent inline function information.
- Adds support to define labels inside the debug sections.
- Extends `min` and `max` instructions to support `.xorsign` and `.abs` modifiers.

## Semantic Changes and Clarifications

None.

# 13.22. Changes in PTX ISA Version 7.1

## New Features

PTX ISA version 7.1 introduces the following new features:

- Support for `sm_86` target architecture.
- Adds a new operator, `mask()`, to extract a specific byte from variable's address used in initializers.
- Extends `tex` and `tld4` instructions to return an optional predicate that indicates if data at specified coordinates is resident in memory.
- Extends single-bit `wmma` and `mma` instructions to support `.and` operation.
- Extends `mma` instruction to support `.sp` modifier that allows matrix multiply-accumulate operation when input matrix A is sparse.
- Extends `mbarrier.test_wait` instruction to test the completion of specific phase parity.

## Semantic Changes and Clarifications

None.

# 13.23. Changes in PTX ISA Version 7.0

## New Features

PTX ISA version 7.0 introduces the following new features:

- Support for `sm_80` target architecture.
- Adds support for asynchronous copy instructions that allow copying of data asynchronously from one state space to another.
- Adds support for `mbarrier` instructions that allow creation of mbarrier objects in memory and use of these objects to synchronize threads and asynchronous copy operations initiated by threads.
- Adds support for `redux.sync` instruction which allows reduction operation across threads in a warp.
- Adds support for new alternate floating-point data formats `.bf16` and `.tf32`.
- Extends `wmma` instruction to support `.f64` type with shape `.m8n8k4`.
- Extends `wmma` instruction to support `.bf16` data format.
- Extends `wmma` instruction to support `.tf32` data format with shape `.m16n16k8`.
- Extends `mma` instruction to support `.f64` type with shape `.m8n8k4`.
- Extends `mma` instruction to support `.bf16` and `.tf32` data formats with shape `.m16n8k8`.
- Extends `mma` instruction to support new shapes `.m8n8k128`, `.m16n8k4`, `.m16n8k16`, `.m16n8k32`, `.m16n8k64`, `.m16n8k128` and `.m16n8k256`.
- Extends `abs` and `neg` instructions to support `.bf16` and `.bf16x2` data formats.
- Extends `min` and `max` instructions to support `.NaN` modifier and `.f16`, `.f16x2`, `.bf16` and `.bf16x2` data formats.
- Extends `fma` instruction to support `.relu` saturation mode and `.bf16` and `.bf16x2` data formats.
- Extends `cvt` instruction to support `.relu` saturation mode and `.f16`, `.f16x2`, `.bf16`, `.bf16x2` and `.tf32` destination formats.
- Adds support for `tanh` instruction that computes hyperbolic-tangent.
- Extends `ex2` instruction to support `.f16` and `.f16x2` types.

## Semantic Changes and Clarifications

None.

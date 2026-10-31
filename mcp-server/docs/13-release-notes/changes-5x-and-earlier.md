# 13.30. Changes in PTX ISA Version 5.0

## New Features

PTX ISA version 5.0 introduces the following new features:

- Support for `sm_60`, `sm_61`, `sm_62` target architecture.
- Extends atomic and reduction instructions to perform double-precision add operation.
- Extends atomic and reduction instructions to specify scope modifier.
- A new `.common` directive to permit linking multiple object files containing declarations of the same symbol with different size.
- A new `dp4a` instruction which allows 4-way dot product with accumulate operation.
- A new `dp2a` instruction which allows 2-way dot product with accumulate operation.
- Support for special register `%clock_hi`.

## Semantic Changes and Clarifications

Semantics of cache modifiers on `ld` and `st` instructions were clarified to reflect cache operations are treated as performance hint only and do not change memory consistency behavior of the program.

Semantics of volatile operations on `ld` and `st` instructions were clarified to reflect how volatile operations are handled by optimizing compiler.

# 13.31. Changes in PTX ISA Version 4.3

## New Features

PTX ISA version 4.3 introduces the following new features:

- A new `lop3` instruction which allows arbitrary logical operation on 3 inputs.
- Adds support for 64-bit computations in extended precision arithmetic instructions.
- Extends `tex.grad` instruction to support `cube` and `acube` geometries.
- Extends `tld4` instruction to support `a2d`, `cube` and `acube` geometries.
- Extends `tex` and `tld4` instructions to support optional operands for offset vector and depth compare.
- Extends `txq` instruction to support querying texture fields from specific LOD.

## Semantic Changes and Clarifications

None.

# 13.32. Changes in PTX ISA Version 4.2

## New Features

PTX ISA version 4.2 introduces the following new features:

- Support for `sm_53` target architecture.
- Support for arithmetic, comparison and texture instructions for `.f16` and `.f16x2` types.
- Support for `memory_layout` field for surfaces and `suq` instruction support for querying this field.

## Semantic Changes and Clarifications

Semantics for parameter passing under ABI were updated to indicate `ld.param` and `st.param` instructions used for argument passing cannot be predicated.

Semantics of `{atom/red}.add.f32` were updated to indicate subnormal inputs and results are flushed to sign-preserving zero for atomic operations on global memory; whereas atomic operations on shared memory preserve subnormal inputs and results and don't flush them to zero.

# 13.33. Changes in PTX ISA Version 4.1

## New Features

PTX ISA version 4.1 introduces the following new features:

- Support for `sm_37` and `sm_52` target architectures.
- Support for new fields `array_size`, `num_mipmap_levels` and `num_samples` for Textures, and the `txq` instruction support for querying these fields.
- Support for new field `array_size` for Surfaces, and the `suq` instruction support for querying this field.
- Support for special registers `%total_smem_size` and `%dynamic_smem_size`.

## Semantic Changes and Clarifications

None.

# 13.34. Changes in PTX ISA Version 4.0

## New Features

PTX ISA version 4.0 introduces the following new features:

- Support for `sm_32` and `sm_50` target architectures.
- Support for 64bit performance counter special registers `%pm0_64`,..,`%pm7_64`.
- A new `istypep` instruction.
- A new instruction, `rsqrt.approx.ftz.f64` has been added to compute a fast approximation of the square root reciprocal of a value.
- Support for a new directive `.attribute` for specifying special attributes of a variable.
- Support for `.managed` variable attribute.

## Semantic Changes and Clarifications

The `vote` instruction semantics were updated to clearly indicate that an inactive thread in a warp contributes a 0 for its entry when participating in `vote.ballot.b32`.

# 13.35. Changes in PTX ISA Version 3.2

## New Features

PTX ISA version 3.2 introduces the following new features:

- The texture instruction supports reads from multi-sample and multisample array textures.
- Extends `.section` debugging directive to include label + immediate expressions.
- Extends `.file` directive to include timestamp and file size information.

## Semantic Changes and Clarifications

The `vavrg2` and `vavrg4` instruction semantics were updated to indicate that instruction adds 1 only if Va[i] + Vb[i] is non-negative, and that the addition result is shifted by 1 (rather than being divided by 2).

# 13.36. Changes in PTX ISA Version 3.1

## New Features

PTX ISA version 3.1 introduces the following new features:

- Support for `sm_35` target architecture.
- Support for CUDA Dynamic Parallelism, which enables a kernel to create and synchronize new work.
- `ld.global.nc` for loading read-only global data though the non-coherent texture cache.
- A new funnel shift instruction, `shf`.
- Extends atomic and reduction instructions to perform 64-bit {`and`, `or`, `xor`} operations, and 64-bit integer {`min`, `max`} operations.
- Adds support for mipmaps.
- Adds support for indirect access to textures and surfaces.
- Extends support for generic addressing to include the `.const` state space, and adds a new operator, `generic()`, to form a generic address for `.global` or `.const` variables used in initializers.
- A new `.weak` directive to permit linking multiple object files containing declarations of the same symbol.

## Semantic Changes and Clarifications

PTX 3.1 redefines the default addressing for global variables in initializers, from generic addresses to offsets in the global state space. Legacy PTX code is treated as having an implicit `generic()` operator for each global variable used in an initializer. PTX 3.1 code should either include explicit `generic()` operators in initializers, use `cvta.global` to form generic addresses at runtime, or load from the non-generic address using `ld.global`.

Instruction `mad.f32` requires a rounding modifier for `sm_20` and higher targets. However for PTX ISA version 3.0 and earlier, `ptxas` does not enforce this requirement and `mad.f32` silently defaults to `mad.rn.f32`. For PTX ISA version 3.1, `ptxas` generates a warning and defaults to `mad.rn.f32`, and in subsequent releases `ptxas` will enforce the requirement for PTX ISA version 3.2 and later.

# 13.37. Changes in PTX ISA Version 3.0

## New Features

PTX ISA version 3.0 introduces the following new features:

- Support for `sm_30` target architectures.
- SIMD video instructions.
- A new warp shuffle instruction.
- Instructions `mad.cc` and `madc` for efficient, extended-precision integer multiplication.
- Surface instructions with 3D and array geometries.
- The texture instruction supports reads from cubemap and cubemap array textures.
- Platform option `.target debug` to declare that a PTX module contains DWARF debug information.
- `pmevent.mask`, for triggering multiple performance monitor events.
- Performance monitor counter special registers `%pm4`..`%pm7`.

## Semantic Changes and Clarifications

Special register `%gridid` has been extended from 32-bits to 64-bits.

PTX ISA version 3.0 deprecates module-scoped `.reg` and `.local` variables when compiling to the Application Binary Interface (ABI). When compiling without use of the ABI, module-scoped `.reg` and `.local` variables are supported as before. When compiling legacy PTX code (ISA versions prior to 3.0) containing module-scoped `.reg` or `.local` variables, the compiler silently disables use of the ABI.

The `shfl` instruction semantics were updated to clearly indicate that value of source operand `a` is unpredictable for inactive and predicated-off threads within the warp.

PTX modules no longer allow duplicate `.version` directives. This feature was unimplemented, so there is no semantic change.

Unimplemented instructions `suld.p` and `sust.p.{u32,s32,f32}` have been removed.

# 13.38. Changes in PTX ISA Version 2.3

## New Features

PTX 2.3 adds support for texture arrays. The texture array feature supports access to an array of 1D or 2D textures, where an integer indexes into the array of textures, and then one or two single-precision floating point coordinates are used to address within the selected 1D or 2D texture.

PTX 2.3 adds a new directive, `.address_size`, for specifying the size of addresses.

Variables in `.const` and `.global` state spaces are initialized to zero by default.

## Semantic Changes and Clarifications

The semantics of the `.maxntid` directive have been updated to match the current implementation. Specifically, `.maxntid` only guarantees that the total number of threads in a thread block does not exceed the maximum. Previously, the semantics indicated that the maximum was enforced separately in each dimension, which is not the case.

Bit field extract and insert instructions `BFE` and `BFI` now indicate that the `len` and `pos` operands are restricted to the value range 0..255.

Unimplemented instructions `{atom,red}.{min,max}.f32` have been removed.

# 13.39. Changes in PTX ISA Version 2.2

## New Features

PTX 2.2 adds a new directive for specifying kernel parameter attributes; specifically, there is a new directives for specifying that a kernel parameter is a pointer, for specifying to which state space the parameter points, and for optionally specifying the alignment of the memory to which the parameter points.

PTX 2.2 adds a new field named `force_unnormalized_coords` to the `.samplerref` opaque type. This field is used in the independent texturing mode to override the `normalized_coords` field in the texture header. This field is needed to support languages such as OpenCL, which represent the property of normalized/unnormalized coordinates in the sampler header rather than in the texture header.

PTX 2.2 deprecates explicit constant banks and supports a large, flat address space for the `.const` state space. Legacy PTX that uses explicit constant banks is still supported.

PTX 2.2 adds a new `tld4` instruction for loading a component (`r`, `g`, `b`, or `a`) from the four texels compising the bilinear interpolation footprint of a given texture location. This instruction may be used to compute higher-precision bilerp results in software, or for performing higher-bandwidth texture loads.

## Semantic Changes and Clarifications

None.

# 13.40. Changes in PTX ISA Version 2.1

## New Features

The underlying, stack-based ABI is supported in PTX ISA version 2.1 for `sm_2x` targets.

Support for indirect calls has been implemented for `sm_2x` targets.

New directives, `.branchtargets` and `.calltargets`, have been added for specifying potential targets for indirect branches and indirect function calls. A `.callprototype` directive has been added for declaring the type signatures for indirect function calls.

The names of `.global` and `.const` variables can now be specified in variable initializers to represent their addresses.

A set of thirty-two driver-specific execution environment special registers has been added. These are named `%envreg0`..`%envreg31`.

Textures and surfaces have new fields for channel data type and channel order, and the `txq` and `suq` instructions support queries for these fields.

Directive `.minnctapersm` has replaced the `.maxnctapersm` directive.

Directive `.reqntid` has been added to allow specification of exact CTA dimensions.

A new instruction, `rcp.approx.ftz.f64`, has been added to compute a fast, gross approximate reciprocal.

## Semantic Changes and Clarifications

A warning is emitted if `.minnctapersm` is specified without also specifying `.maxntid`.

# 13.41. Changes in PTX ISA Version 2.0

## New Features

### Floating Point Extensions

This section describes the floating-point changes in PTX ISA version 2.0 for `sm_20` targets. The goal is to achieve IEEE 754 compliance wherever possible, while maximizing backward compatibility with legacy PTX ISA version 1.x code and `sm_1x` targets.

The changes from PTX ISA version 1.x are as follows:

- Single-precision instructions support subnormal numbers by default for `sm_20` targets. The `.ftz` modifier may be used to enforce backward compatibility with `sm_1x`.
- Single-precision `add`, `sub`, and `mul` now support `.rm` and `.rp` rounding modifiers for `sm_20` targets.
- A single-precision fused multiply-add (`fma`) instruction has been added, with support for IEEE 754 compliant rounding modifiers and support for subnormal numbers. The `fma.f32` instruction also supports `.ftz` and `.sat` modifiers. `fma.f32` requires `sm_20`. The `mad.f32` instruction has been extended with rounding modifiers so that it's synonymous with `fma.f32` for `sm_20` targets. Both `fma.f32` and `mad.f32` require a rounding modifier for `sm_20` targets.
- The `mad.f32` instruction without rounding is retained so that compilers can generate code for `sm_1x` targets. When code compiled for `sm_1x` is executed on `sm_20` devices, `mad.f32` maps to `fma.rn.f32`.
- Single- and double-precision `div`, `rcp`, and `sqrt` with IEEE 754 compliant rounding have been added. These are indicated by the use of a rounding modifier and require `sm_20`.
- Instructions `testp` and `copysign` have been added.

### New Instructions

A load uniform instruction, `ldu`, has been added.

Surface instructions support additional `.clamp` modifiers, `.clamp` and `.zero`.

Instruction `sust` now supports formatted surface stores.

A count leading zeros instruction, `clz`, has been added.

A find leading non-sign bit instruction, `bfind`, has been added.

A bit reversal instruction, `brev`, has been added.

Bit field extract and insert instructions, `bfe` and `bfi`, have been added.

A population count instruction, `popc`, has been added.

A vote ballot instruction, `vote.ballot.b32`, has been added.

Instructions `{atom,red}.add.f32` have been implemented.

Instructions `{atom,red}.shared` have been extended to handle 64-bit data types for `sm_20` targets.

A system-level membar instruction, `membar.sys`, has been added.

The `bar` instruction has been extended as follows:

- A `bar.arrive` instruction has been added.
- Instructions `bar.red.popc.u32` and `bar.red.{and,or}.pred` have been added.
- `bar` now supports optional thread count and register operands.

Scalar video instructions (includes `prmt`) have been added.

Instruction `isspacep` for querying whether a generic address falls within a specified state space window has been added.

Instruction `cvta` for converting global, local, and shared addresses to generic address and vice-versa has been added.

### Other New Features

Instructions `ld`, `ldu`, `st`, `prefetch`, `prefetchu`, `isspacep`, `cvta`, `atom`, and `red` now support generic addressing.

New special registers `%nwarpid`, `%nsmid`, `%clock64`, `%lanemask_{eq,le,lt,ge,gt}` have been added.

Cache operations have been added to instructions `ld`, `st`, `suld`, and `sust`, e.g., for prefetching to specified level of memory hierarchy. Instructions `prefetch` and `prefetchu` have also been added.

The `.maxnctapersm` directive was deprecated and replaced with `.minnctapersm` to better match its behavior and usage.

A new directive, `.section`, has been added to replace the `@@DWARF` syntax for passing DWARF-format debugging information through PTX.

A new directive, `.pragma nounroll`, has been added to allow users to disable loop unrolling.

## Semantic Changes and Clarifications

The errata in `cvt.ftz` for PTX ISA versions 1.4 and earlier, where single-precision subnormal inputs and results were not flushed to zero if either source or destination type size was 64-bits, has been fixed. In PTX ISA version 1.5 and later, `cvt.ftz` (and `cvt` for `.target sm_1x`, where `.ftz` is implied) instructions flush single-precision subnormal inputs and results to sign-preserving zero for all combinations of floating-point instruction types. To maintain compatibility with legacy PTX code, if `.version` is 1.4 or earlier, single-precision subnormal inputs and results are flushed to sign-preserving zero only when neither source nor destination type size is 64-bits.

Components of special registers `%tid`, `%ntid`, `%ctaid`, and `%nctaid` have been extended from 16-bits to 32-bits. These registers now have type `.v4.u32`.

The number of samplers available in independent texturing mode was incorrectly listed as thirty-two in PTX ISA version 1.5; the correct number is sixteen.

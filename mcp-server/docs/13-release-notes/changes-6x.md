# 13.24. Changes in PTX ISA Version 6.5

## New Features

PTX ISA version 6.5 introduces the following new features:

- Adds support for integer destination types for half precision comparison instruction set.
- Extends `abs` instruction to support `.f16` and `.f16x2` types.
- Adds support for `cvt.pack` instruction which allows converting two integer values and packing the results together.
- Adds new shapes `.m16n8k8`, `.m8n8k16` and `.m8n8k32` on the `mma` instruction.
- Adds support for `ldmatrix` instruction which loads one or more matrices from shared memory for `mma` instruction.

## Removed Features

PTX ISA version 6.5 removes the following features:

- Support for `.satfinite` qualifier on floating point `wmma.mma` instruction has been removed. This support was deprecated since PTX ISA version 6.4.

## Semantic Changes and Clarifications

None.

# 13.25. Changes in PTX ISA Version 6.4

## New Features

PTX ISA version 6.4 introduces the following new features:

- Adds support for `.noreturn` directive which can be used to indicate a function does not return to it's caller function.
- Adds support for `mma` instruction which allows performing matrix multiply-and-accumulate operation.

## Deprecated Features

PTX ISA version 6.4 deprecates the following features:

- Support for `.satfinite` qualifier on floating point `wmma.mma` instruction.

## Removed Features

PTX ISA version 6.4 removes the following features:

- Support for `shfl` and `vote` instructions without the `.sync` qualifier has been removed for `.target` `sm_70` and higher. This support was deprecated since PTX ISA version 6.0 as documented in PTX ISA version 6.2.

## Semantic Changes and Clarifications

- Clarified that resolving references of a `.weak` symbol considers only `.weak` or `.visible` symbols with the same name and does not consider local symbols with the same name.
- Clarified that in `cvt` instruction, modifier `.ftz` can only be specified when either `.atype` or `.dtype` is `.f32`.

# 13.26. Changes in PTX ISA Version 6.3

## New Features

PTX ISA version 6.3 introduces the following new features:

- Support for `sm_75` target architecture.
- Adds support for a new instruction `nanosleep` that suspends a thread for a specified duration.
- Adds support for `.alias` directive which allows defining alias to function symbol.
- Extends `atom` instruction to perform `.f16` addition operation and `.cas.b16` operation.
- Extends `red` instruction to perform `.f16` addition operation.
- The `wmma` instructions are extended to support multiplicand matrices of type `.s8`, `.u8`, `.s4`, `.u4`, `.b1` and accumulator matrices of type `.s32`.

## Semantic Changes and Clarifications

- Introduced the mandatory `.aligned` qualifier for all `wmma` instructions.
- Specified the alignment required for the base address and stride parameters passed to `wmma.load` and `wmma.store`.
- Clarified that layout of fragment returned by `wmma` operation is architecture dependent and passing `wmma` fragments around functions compiled for different link compatible SM architectures may not work as expected.
- Clarified that atomicity for `{atom/red}.f16x2}` operations is guaranteed separately for each of the two `.f16` elements but not guaranteed to be atomic as single 32-bit access.

# 13.27. Changes in PTX ISA Version 6.2

## New Features

PTX ISA version 6.2 introduces the following new features:

- A new instruction `activemask` for querying active threads in a warp.
- Extends atomic and reduction instructions to perform `.f16x2` addition operation with mandatory `.noftz` qualifier.

## Deprecated Features

PTX ISA version 6.2 deprecates the following features:

- The use of `shfl` and `vote` instructions without the `.sync` is deprecated retrospectively from PTX ISA version 6.0, which introduced the `sm_70` architecture that implements Independent Thread Scheduling.

## Semantic Changes and Clarifications

- Clarified that `wmma` instructions can be used in conditionally executed code only if it is known that all threads in the warp evaluate the condition identically, otherwise behavior is undefined.
- In the memory consistency model, the definition of morally strong operations was updated to exclude fences from the requirement of complete overlap since fences do not access memory.

# 13.28. Changes in PTX ISA Version 6.1

## New Features

PTX ISA version 6.1 introduces the following new features:

- Support for `sm_72` target architecture.
- Support for new matrix shapes 32x8x16 and 8x32x16 in `wmma` instruction.

## Semantic Changes and Clarifications

None.

# 13.29. Changes in PTX ISA Version 6.0

## New Features

PTX ISA version 6.0 introduces the following new features:

- Support for `sm_70` target architecture.
- Specifies the memory consistency model for programs running on `sm_70` and later architectures.
- Various extensions to memory instructions to specify memory synchronization semantics and scopes at which such synchronization can be observed.
- New instruction `wmma` for matrix operations which allows loading matrices from memory, performing multiply-and-accumulate on them and storing result in memory.
- Support for new `barrier` instruction.
- Extends `neg` instruction to support `.f16` and `.f16x2` types.
- A new instruction `fns` which allows finding n-th set bit in integer.
- A new instruction `bar.warp.sync` which allows synchronizing threads in warp.
- Extends `vote` and `shfl` instructions with `.sync` modifier which waits for specified threads before executing the `vote` and `shfl` operation respectively.
- A new instruction `match.sync` which allows broadcasting and comparing a value across threads in warp.
- A new instruction `brx.idx` which allows branching to a label indexed from list of potential targets.
- Support for unsized array parameter for `.func` which can be used to implement variadic functions.
- Support for `.b16` integer type in dwarf-lines.
- Support for taking address of device function return parameters using `mov` instruction.

## Semantic Changes and Clarifications

- Semantics of `bar` instruction were updated to indicate that executing thread waits for other non-exited threads from it's warp.
- Support for indirect branch introduced in PTX 2.1 which was unimplemented has been removed from the spec.
- Support for taking address of labels, using labels in initializers which was unimplemented has been removed from the spec.
- Support for variadic functions which was unimplemented has been removed from the spec.

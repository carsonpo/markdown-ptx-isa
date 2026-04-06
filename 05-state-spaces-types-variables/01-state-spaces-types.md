# 5. State Spaces, Types, and Variables

While the specific resources available in a given target GPU will vary, the kinds of resources will be common across platforms, and these resources are abstracted in PTX through state spaces and data types.

## 5.1. State Spaces

A state space is a storage area with particular characteristics. All variables reside in some state space. The characteristics of a state space include its size, addressability, access speed, access rights, and level of sharing between threads.

The state spaces defined in PTX are a byproduct of parallel programming and graphics programming. The list of state spaces is shown in Table 6, and properties of state spaces are shown in Table 7.

**Table 6 State Spaces**

| Name | Description |
|------|-------------|
| `.reg` | Registers, fast. |
| `.sreg` | Special registers. Read-only; pre-defined; platform-specific. |
| `.const` | Shared, read-only memory. |
| `.global` | Global memory, shared by all threads. |
| `.local` | Local memory, private to each thread. |
| `.param` | Kernel parameters, defined per-grid; or Function or local parameters, defined per-thread. |
| `.shared` | Addressable memory, defined per CTA, accessible to all threads in the cluster throughout the lifetime of the CTA that defines it. |
| `.tex` | Global texture memory (deprecated). |

**Table 7 Properties of State Spaces**

| Name | Addressable | Initializable | Access | Sharing |
|------|-------------|---------------|--------|---------|
| `.reg` | No | No | R/W | per-thread |
| `.sreg` | No | No | RO | per-CTA |
| `.const` | Yes | Yes¹ | RO | per-grid |
| `.global` | Yes | Yes¹ | R/W | Context |
| `.local` | Yes | No | R/W | per-thread |
| `.param` (as input to kernel) | Yes² | No | RO | per-grid |
| `.param` (used in functions) | Restricted³ | No | R/W | per-thread |
| `.shared` | Yes | No | R/W | per-cluster⁵ |
| `.tex` | No⁴ | Yes, via driver | RO | Context |

**Notes:**

1. Variables in `.const` and `.global` state spaces are initialized to zero by default.
2. Accessible only via the `ld.param{::entry}` instruction. Address may be taken via `mov` instruction.
3. Accessible via `ld.param{::func}` and `st.param{::func}` instructions. Device function input and return parameters may have their address taken via `mov`; the parameter is then located on the stack frame and its address is in the `.local` state space.
4. Accessible only via the `tex` instruction.
5. Visible to the owning CTA and other active CTAs in the cluster.

### 5.1.1. Register State Space

Registers (`.reg` state space) are fast storage locations. The number of registers is limited, and will vary from platform to platform. When the limit is exceeded, register variables will be spilled to memory, causing changes in performance. For each architecture, there is a recommended maximum number of registers to use (see the CUDA Programming Guide for details).

Registers may be typed (signed integer, unsigned integer, floating point, predicate) or untyped. Register size is restricted; aside from predicate registers which are 1-bit, scalar registers have a width of 8-, 16-, 32-, 64-, or 128-bits, and vector registers have a width of 16-, 32-, 64-, or 128-bits. The most common use of 8-bit registers is with `ld`, `st`, and `cvt` instructions, or as elements of vector tuples.

Registers differ from the other state spaces in that they are not fully addressable, i.e., it is not possible to refer to the address of a register. When compiling to use the Application Binary Interface (ABI), register variables are restricted to function scope and may not be declared at module scope. When compiling legacy PTX code (ISA versions prior to 3.0) containing module-scoped `.reg` variables, the compiler silently disables use of the ABI. Registers may have alignment boundaries required by multi-word loads and stores.

### 5.1.2. Special Register State Space

The special register (`.sreg`) state space holds predefined, platform-specific registers, such as grid, cluster, CTA, and thread parameters, clock counters, and performance monitoring registers. All special registers are predefined.

### 5.1.3. Constant State Space

The constant (`.const`) state space is a read-only memory initialized by the host. Constant memory is accessed with a `ld.const` instruction. Constant memory is restricted in size, currently limited to 64 KB which can be used to hold statically-sized constant variables. There is an additional 640 KB of constant memory, organized as ten independent 64 KB regions. The driver may allocate and initialize constant buffers in these regions and pass pointers to the buffers as kernel function parameters. Since the ten regions are not contiguous, the driver must ensure that constant buffers are allocated so that each buffer fits entirely within a 64 KB region and does not span a region boundary.

Statically-sized constant variables have an optional variable initializer; constant variables with no explicit initializer are initialized to zero by default. Constant buffers allocated by the driver are initialized by the host, and pointers to such buffers are passed to the kernel as parameters. See the description of kernel parameter attributes in Kernel Function Parameter Attributes for more details on passing pointers to constant buffers as kernel parameters.

#### 5.1.3.1. Banked Constant State Space (deprecated)

Previous versions of PTX exposed constant memory as a set of eleven 64 KB banks, with explicit bank numbers required for variable declaration and during access.

Prior to PTX ISA version 2.2, the constant memory was organized into fixed size banks. There were eleven 64 KB banks, and banks were specified using the `.const[bank]` modifier, where bank ranged from 0 to 10. If no bank number was given, bank zero was assumed.

By convention, bank zero was used for all statically-sized constant variables. The remaining banks were used to declare incomplete constant arrays (as in C, for example), where the size is not known at compile time. For example, the declaration

```ptx
.extern .const[2] .b32 const_buffer[];
```

resulted in `const_buffer` pointing to the start of constant bank two. This pointer could then be used to access the entire 64 KB constant bank. Multiple incomplete array variables declared in the same bank were aliased, with each pointing to the start address of the specified constant bank.

To access data in constant banks 1 through 10, the bank number was required in the state space of the load instruction. For example, an incomplete array in bank 2 was accessed as follows:

```ptx
.extern .const[2] .b32 const_buffer[];
ld.const[2].b32  %r1, [const_buffer+4]; // load second word
```

In PTX ISA version 2.2, we eliminated explicit banks and replaced the incomplete array representation of driver-allocated constant buffers with kernel parameter attributes that allow pointers to constant buffers to be passed as kernel parameters.

### 5.1.4. Global State Space

The global (`.global`) state space is memory that is accessible by all threads in a context. It is the mechanism by which threads in different CTAs, clusters, and grids can communicate. Use `ld.global`, `st.global`, and `atom.global` to access global variables.

Global variables have an optional variable initializer; global variables with no explicit initializer are initialized to zero by default.

### 5.1.5. Local State Space

The local state space (`.local`) is private memory for each thread to keep its own data. It is typically standard memory with cache. The size is limited, as it must be allocated on a per-thread basis. Use `ld.local` and `st.local` to access local variables.

When compiling to use the Application Binary Interface (ABI), `.local` state-space variables must be declared within function scope and are allocated on the stack. In implementations that do not support a stack, all local memory variables are stored at fixed addresses, recursive function calls are not supported, and `.local` variables may be declared at module scope. When compiling legacy PTX code (ISA versions prior to 3.0) containing module-scoped `.local` variables, the compiler silently disables use of the ABI.

### 5.1.6. Parameter State Space

The parameter (`.param`) state space is used (1) to pass input arguments from the host to the kernel, (2a) to declare formal input and return parameters for device functions called from within kernel execution, and (2b) to declare locally-scoped byte array variables that serve as function call arguments, typically for passing large structures by value to a function. Kernel function parameters differ from device function parameters in terms of access and sharing (read-only versus read-write, per-kernel versus per-thread). Note that PTX ISA versions 1.x supports only kernel function parameters in `.param` space; device function parameters were previously restricted to the register state space. The use of parameter state space for device function parameters was introduced in PTX ISA version 2.0 and requires target architecture sm_20 or higher. Additional sub-qualifiers `::entry` or `::func` can be specified on instructions with `.param` state space to indicate whether the address refers to kernel function parameter or device function parameter. If no sub-qualifier is specified with the `.param` state space, then the default sub-qualifier is specific to and dependent on the exact instruction. For example, `st.param` is equivalent to `st.param::func` whereas `isspacep.param` is equivalent to `isspacep.param::entry`. Refer to the instruction description for more details on default sub-qualifier assumption.

> **Note**
>
> The location of parameter space is implementation specific. For example, in some implementations kernel parameters reside in global memory. No access protection is provided between parameter and global space in this case. Though the exact location of the kernel parameter space is implementation specific, the kernel parameter space window is always contained within the global space window. Similarly, function parameters are mapped to parameter passing registers and/or stack locations based on the function calling conventions of the Application Binary Interface (ABI). Therefore, PTX code should make no assumptions about the relative locations or ordering of `.param` space variables.

#### 5.1.6.1. Kernel Function Parameters

Each kernel function definition includes an optional list of parameters. These parameters are addressable, read-only variables declared in the `.param` state space. Values passed from the host to the kernel are accessed through these parameter variables using `ld.param` instructions. The kernel parameter variables are shared across all CTAs from all clusters within a grid.

The address of a kernel parameter may be moved into a register using the `mov` instruction. The resulting address is in the `.param` state space and is accessed using `ld.param` instructions.

**Example**

```ptx
.entry foo ( .param .b32 N, .param .align 8 .b8 buffer[64] )
{
    .reg .u32 %n;
    .reg .f64 %d;

    ld.param.u32 %n, [N];
    ld.param.f64 %d, [buffer];
    ...
```

**Example**

```ptx
.entry bar ( .param .b32 len )
{
    .reg .u32 %ptr, %n;

    mov.u32      %ptr, len;
    ld.param.u32 %n, [%ptr];
    ...
```

Kernel function parameters may represent normal data values, or they may hold addresses to objects in constant, global, local, or shared state spaces. In the case of pointers, the compiler and runtime system need information about which parameters are pointers, and to which state space they point. Kernel parameter attribute directives are used to provide this information at the PTX level. See Kernel Function Parameter Attributes for a description of kernel parameter attribute directives.

> **Note**
>
> The current implementation does not allow creation of generic pointers to constant variables (`cvta.const`) in programs that have pointers to constant buffers passed as kernel parameters.

#### 5.1.6.2. Kernel Function Parameter Attributes

Kernel function parameters may be declared with an optional `.ptr` attribute to indicate that a parameter is a pointer to memory, and also indicate the state space and alignment of the memory being pointed to. Kernel Parameter Attribute: `.ptr` describes the `.ptr` kernel parameter attribute.

#### 5.1.6.3. Kernel Parameter Attribute: .ptr

**.ptr**

Kernel parameter alignment attribute.

**Syntax**

```
.param .type .ptr .space .align N  varname
.param .type .ptr        .align N  varname

.space = { .const, .global, .local, .shared };
```

**Description**

Used to specify the state space and, optionally, the alignment of memory pointed to by a pointer type kernel parameter. The alignment value N, if present, must be a power of two. If no state space is specified, the pointer is assumed to be a generic address pointing to one of const, global, local, or shared memory. If no alignment is specified, the memory pointed to is assumed to be aligned to a 4 byte boundary.

Spaces between `.ptr`, `.space`, and `.align` may be eliminated to improve readability.

**PTX ISA Notes**

Introduced in PTX ISA version 2.2.

Support for generic addressing of `.const` space added in PTX ISA version 3.1.

**Target ISA Notes**

Supported on all target architectures.

**Examples**

```ptx
.entry foo ( .param .u32 param1,
             .param .u32 .ptr.global.align 16 param2,
             .param .u32 .ptr.const.align 8 param3,
             .param .u32 .ptr.align 16 param4  // generic address
                                               // pointer
) { .. }
```

#### 5.1.6.4. Device Function Parameters

PTX ISA version 2.0 extended the use of parameter space to device function parameters. The most common use is for passing objects by value that do not fit within a PTX register, such as C structures larger than 8 bytes. In this case, a byte array in parameter space is used. Typically, the caller will declare a locally-scoped `.param` byte array variable that represents a flattened C structure or union. This will be passed by value to a callee, which declares a `.param` formal parameter having the same size and alignment as the passed argument.

**Example**

```ptx
// pass object of type struct { double d; int y; };
.func foo ( .reg .b32 N, .param .align 8 .b8 buffer[12] )
{
    .reg .f64 %d;
    .reg .s32 %y;

    ld.param.f64 %d, [buffer];
    ld.param.s32 %y, [buffer+8];
    ...
}

// code snippet from the caller
// struct { double d; int y; } mystruct; is flattened, passed to foo
    ...
    .reg .f64 dbl;
    .reg .s32 x;
    .param .align 8 .b8 mystruct;
    ...
    st.param.f64 [mystruct+0], dbl;
    st.param.s32 [mystruct+8], x;
    call foo, (4, mystruct);
    ...
```

See the section on function call syntax for more details.

Function input parameters may be read via `ld.param` and function return parameters may be written using `st.param`; it is illegal to write to an input parameter or read from a return parameter.

Aside from passing structures by value, `.param` space is also required whenever a formal parameter has its address taken within the called function. In PTX, the address of a function input parameter may be moved into a register using the `mov` instruction. Note that the parameter will be copied to the stack if necessary, and so the address will be in the `.local` state space and is accessed via `ld.local` and `st.local` instructions. It is not possible to use `mov` to get the address of or a locally-scoped `.param` space variable. Starting PTX ISA version 6.0, it is possible to use `mov` instruction to get address of return parameter of device function.

**Example**

```ptx
// pass array of up to eight floating-point values in buffer
.func foo ( .param .b32 N, .param .b32 buffer[32] )
{
    .reg .u32  %n, %r;
    .reg .f32  %f;
    .reg .pred %p;

    ld.param.u32 %n, [N];
    mov.u32      %r, buffer;  // forces buffer to .local state space
Loop:
    setp.eq.u32  %p, %n, 0;
@%p bra         Done;
    ld.local.f32 %f, [%r];
    ...
    add.u32      %r, %r, 4;
    sub.u32      %n, %n, 1;
    bra          Loop;
Done:
    ...
}
```

### 5.1.7. Shared State Space

The shared (`.shared`) state space is a memory that is owned by an executing CTA and is accessible to the threads of all the CTAs within a cluster. An address in shared memory can be read and written by any thread in a CTA cluster.

Additional sub-qualifiers `::cta` or `::cluster` can be specified on instructions with `.shared` state space to indicate whether the address belongs to the shared memory window of the executing CTA or of any CTA in the cluster respectively. The addresses in the `.shared::cta` window also fall within the `.shared::cluster` window. If no sub-qualifier is specified with the `.shared` state space, then it defaults to `::cta`. For example, `ld.shared` is equivalent to `ld.shared::cta`.

Variables declared in `.shared` state space refer to the memory addresses in the current CTA. Instruction `mapa` gives the `.shared::cluster` address of the corresponding variable in another CTA in the cluster.

Shared memory typically has some optimizations to support the sharing. One example is broadcast; where all threads read from the same address. Another is sequential access from sequential threads.

### 5.1.8. Texture State Space (deprecated)

The texture (`.tex`) state space is global memory accessed via the texture instruction. It is shared by all threads in a context. Texture memory is read-only and cached, so accesses to texture memory are not coherent with global memory stores to the texture image.

The GPU hardware has a fixed number of texture bindings that can be accessed within a single kernel (typically 128). The `.tex` directive will bind the named texture memory variable to a hardware texture identifier, where texture identifiers are allocated sequentially beginning with zero. Multiple names may be bound to the same physical texture identifier. An error is generated if the maximum number of physical resources is exceeded. The texture name must be of type `.u32` or `.u64`.

Physical texture resources are allocated on a per-kernel granularity, and `.tex` variables are required to be defined in the global scope.

Texture memory is read-only. A texture's base address is assumed to be aligned to a 16 byte boundary.

**Example**

```ptx
.tex .u32 tex_a;         // bound to physical texture 0
.tex .u32 tex_c, tex_d;  // both bound to physical texture 1
.tex .u32 tex_d;         // bound to physical texture 2
.tex .u32 tex_f;         // bound to physical texture 3
```

> **Note**
>
> Explicit declarations of variables in the texture state space is deprecated, and programs should instead reference texture memory through variables of type `.texref`. The `.tex` directive is retained for backward compatibility, and variables declared in the `.tex` state space are equivalent to module-scoped `.texref` variables in the `.global` state space.
>
> For example, a legacy PTX definition such as
>
> ```ptx
> .tex .u32 tex_a;
> ```
>
> is equivalent to:
>
> ```ptx
> .global .texref tex_a;
> ```
>
> See Texture Sampler and Surface Types for the description of the `.texref` type and Texture Instructions for its use in texture instructions.

## 5.2. Types

### 5.2.1. Fundamental Types

In PTX, the fundamental types reflect the native data types supported by the target architectures. A fundamental type specifies both a basic type and a size. Register variables are always of a fundamental type, and instructions operate on these types. The same type-size specifiers are used for both variable definitions and for typing instructions, so their names are intentionally short.

Table 8 lists the fundamental type specifiers for each basic type:

**Table 8 Fundamental Type Specifiers**

| Basic Type | Fundamental Type Specifiers |
|------------|-----------------------------|
| Signed integer | `.s8`, `.s16`, `.s32`, `.s64` |
| Unsigned integer | `.u8`, `.u16`, `.u32`, `.u64` |
| Floating-point | `.f16`, `.f16x2`, `.f32`, `.f64` |
| Bits (untyped) | `.b8`, `.b16`, `.b32`, `.b64`, `.b128` |
| Predicate | `.pred` |

Most instructions have one or more type specifiers, needed to fully specify instruction behavior. Operand types and sizes are checked against instruction types for compatibility.

Two fundamental types are compatible if they have the same basic type and are the same size. Signed and unsigned integer types are compatible if they have the same size. The bit-size type is compatible with any fundamental type having the same size.

In principle, all variables (aside from predicates) could be declared using only bit-size types, but typed variables enhance program readability and allow for better operand type checking.

### 5.2.2. Restricted Use of Sub-Word Sizes

The `.u8`, `.s8`, and `.b8` instruction types are restricted to `ld`, `st`, `add`, `sub`, `min`, `max`, `neg` and `cvt` instructions. The `.f16` floating-point type is allowed in half precision floating point instructions and texture fetch instructions. The `.f16x2` floating point type is allowed only in half precision floating point arithmetic instructions and texture fetch instructions.

For convenience, `ld`, `st`, and `cvt` instructions permit source and destination data operands to be wider than the instruction-type size, so that narrow values may be loaded, stored, and converted using regular-width registers. For example, 8-bit or 16-bit values may be held directly in 32-bit or 64-bit registers when being loaded, stored, or converted to other types and sizes.

### 5.2.3. Alternate Floating-Point Data Formats

The fundamental floating-point types supported in PTX have implicit bit representations that indicate the number of bits used to store exponent and mantissa. For example, the `.f16` type indicates 5 bits reserved for exponent and 10 bits reserved for mantissa. In addition to the floating-point representations assumed by the fundamental types, PTX allows the following alternate floating-point data formats:

**bf16 data format:**
This data format is a 16-bit floating point format with 8 bits for exponent and 7 bits for mantissa. A register variable containing bf16 data must be declared with `.b16` type.

**e4m3 data format:**
This data format is an 8-bit floating point format with 4 bits for exponent and 3 bits for mantissa. The e4m3 encoding does not support infinity and NaN values are limited to 0x7f and 0xff. A register variable containing e4m3 value must be declared using bit-size type.

**e5m2 data format:**
This data format is an 8-bit floating point format with 5 bits for exponent and 2 bits for mantissa. A register variable containing e5m2 value must be declared using bit-size type.

**tf32 data format:**
This data format is a special 32-bit floating point format supported by the matrix multiply-and-accumulate instructions, with the same range as `.f32` and reduced precision (>=10 bits). The internal layout of tf32 format is implementation defined. PTX facilitates conversion from single precision `.f32` type to tf32 format. A register variable containing tf32 data must be declared with `.b32` type.

**e2m1 data format:**
This data format is a 4-bit floating point format with 2 bits for exponent and 1 bit for mantissa. The e2m1 encoding does not support infinity and NaN. e2m1 values must be used in a packed format specified as e2m1x2. A register variable containing two e2m1 values must be declared with `.b8` type.

**e2m3 data format:**
This data format is a 6-bit floating point format with 2 bits for exponent and 3 bits for mantissa. The e2m3 encoding does not support infinity and NaN. e2m3 values must be used in a packed format specified as e2m3x2. A register variable containing two e2m3 values must be declared with `.b16` type where each `.b8` element has 6-bit floating point value and 2 MSB bits padded with zeros.

**e3m2 data format:**
This data format is a 6-bit floating point format with 3 bits for exponent and 2 bits for mantissa. The e3m2 encoding does not support infinity and NaN. e3m2 values must be used in a packed format specified as e3m2x2. A register variable containing two e3m2 values must be declared with `.b16` type where each `.b8` element has 6-bit floating point value and 2 MSB bits padded with zeros.

**ue8m0 data format:**
This data format is an 8-bit unsigned floating-point format with 8 bits for exponent and 0 bits for mantissa. The ue8m0 encoding does not support infinity. NaN value is limited to 0xff. ue8m0 values must be used in a packed format specified as ue8m0x2. A register variable containing two ue8m0 values must be declared with `.b16` type.

**ue4m3 data format:**
This data format is a 7-bit unsigned floating-point format with 4 bits for exponent and 3 bits for mantissa. The ue4m3 encoding does not support infinity. NaN value is limited to 0x7f. A register variable containing single ue4m3 value must be declared with `.b8` type having MSB bit padded with zero.

Alternate data formats cannot be used as fundamental types. They are supported as source or destination formats by certain instructions.

### 5.2.4. Fixed-point Data format

PTX supports the following fixed-point data formats:

**s2f6 data format:**
This data format is 8-bit signed 2's complement integer with 2 sign-integer bits and 6 fractional bits with form xx.xxxxxx. The s2f6 encoding does not support infinity and NaN.

```
s2f6 value = s8 value * 2^(-6)
Positive max representation = 01.111111 = 127 * 2^(-6) = 1.984375
Negative max representation = 10.000000 = -128 * 2^(-6) = -2.0
```

### 5.2.5. Packed Data Types

Certain PTX instructions operate on two or more sets of inputs in parallel, and produce two or more sets of outputs. Such instructions can use the data stored in a packed format. PTX supports either two or four values of the same scalar data type to be packed into a single, larger value. The packed value is considered as a value of a packed data type. In this section we describe the packed data types supported in PTX.

#### 5.2.5.1. Packed Floating Point Data Types

PTX supports various variants of packed floating point data types. Out of them, only `.f16x2` is supported as a fundamental type, while others cannot be used as fundamental types - they are supported as instruction types on certain instructions. When using an instruction with such non-fundamental types, the operand data variables must be of bit type of appropriate size. For example, all of the operand variables must be of type `.b32` for an instruction with instruction type as `.bf16x2`. Table 9 describes various variants of packed floating point data types in PTX.

**Table 9 Operand types for packed floating point instruction type.**

| Packed floating point type | Number of elements contained in a packed format | Type of each element | Register variable type to be used in the declaration |
|---------------------------|--------------------------------------------------|----------------------|------------------------------------------------------|
| `.f16x2` | Two | `.f16` | `.f16x2` or `.b32` |
| `.f32x2` | Two | `.f32` | `.b64` |
| `.bf16x2` | Two | `.bf16` | `.b32` |
| `.e4m3x2` | Two | `.e4m3` | `.b16` |
| `.e5m2x2` | Two | `.e5m2` | `.b16` |
| `.e2m3x2` | Two | `.e2m3` | `.b16` |
| `.e3m2x2` | Two | `.e3m2` | `.b16` |
| `.ue8m0x2` | Two | `.ue8m0` | `.b16` |
| `.s2f6x2` | Two | `.s2f6` | `.b16` |
| `.e2m1x2` | Two | `.e2m1` | `.b8` |
| `.e4m3x4` | Four | `.e4m3` | `.b32` |
| `.e5m2x4` | Four | `.e5m2` | `.b32` |
| `.e2m3x4` | Four | `.e2m3` | `.b32` |
| `.e3m2x4` | Four | `.e3m2` | `.b32` |
| `.e2m1x4` | Four | `.e2m1` | `.b16` |

#### 5.2.5.2. Packed Integer Data Types

PTX supports four variants of packed integer data types: `.u16x2`, `.s16x2`, `.u8x4`, and `.s8x4`. The `.u16x2`, `.s16x2` packed data types consist of two `.u16` or `.s16` values. The `.u8x4`, `.s8x4` packed data types consist of four `.u8` or `.s8` values. A register variable containing `.u16x2`, `.s16x2`, `.u8x4`, `.s8x4` data must be declared with `.b32` type. Packed integer data types cannot be used as fundamental types. They are supported as instruction types on certain instructions.

#### 5.2.5.3. Packed Fixed-Point Data Types

PTX supports `.s2f6x2` packed fixed-point data type consisting of two `.s2f6` packed fixed-point values. A register variable containing `.s2f6x2` value must be declared with `.b16` type. Packed fixed-point data type cannot be used as fundamental type and is only supported as instruction type.

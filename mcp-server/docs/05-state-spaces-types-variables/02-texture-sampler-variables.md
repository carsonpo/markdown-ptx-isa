## 5.3. Texture Sampler and Surface Types

PTX includes built-in opaque types for defining texture, sampler, and surface descriptor variables. These types have named fields similar to structures, but all information about layout, field ordering, base address, and overall size is hidden to a PTX program, hence the term opaque. The use of these opaque types is limited to:

- Variable definition within global (module) scope and in kernel entry parameter lists.
- Static initialization of module-scope variables using comma-delimited static assignment expressions for the named members of the type.
- Referencing textures, samplers, or surfaces via texture and surface load/store instructions (`tex`, `suld`, `sust`, `sured`).
- Retrieving the value of a named member via query instructions (`txq`, `suq`).
- Creating pointers to opaque variables using `mov`, e.g., `mov.u64 reg, opaque_var;`. The resulting pointer may be stored to and loaded from memory, passed as a parameter to functions, and de-referenced by texture and surface load, store, and query instructions, but the pointer cannot otherwise be treated as an address, i.e., accessing the pointer with `ld` and `st` instructions, or performing pointer arithmetic will result in undefined results.

Opaque variables may not appear in initializers, e.g., to initialize a pointer to an opaque variable.

> **Note**
>
> Indirect access to textures and surfaces using pointers to opaque variables is supported beginning with PTX ISA version 3.1 and requires target sm_20 or later.
>
> Indirect access to textures is supported only in unified texture mode (see below).

The three built-in types are `.texref`, `.samplerref`, and `.surfref`. For working with textures and samplers, PTX has two modes of operation. In the unified mode, texture and sampler information is accessed through a single `.texref` handle. In the independent mode, texture and sampler information each have their own handle, allowing them to be defined separately and combined at the site of usage in the program. In independent mode, the fields of the `.texref` type that describe sampler properties are ignored, since these properties are defined by `.samplerref` variables.

Table 10 and Table 11 list the named members of each type for unified and independent texture modes. These members and their values have precise mappings to methods and values defined in the texture HW class as well as exposed values via the API.

**Table 10 Opaque Type Fields in Unified Texture Mode**

| Member | `.texref` values | `.surfref` values |
|--------|------------------|-------------------|
| `width` | in elements | in elements |
| `height` | in elements | in elements |
| `depth` | in elements | in elements |
| `channel_data_type` | enum type corresponding to source language API | enum type corresponding to source language API |
| `channel_order` | enum type corresponding to source language API | enum type corresponding to source language API |
| `normalized_coords` | 0, 1 | N/A |
| `filter_mode` | nearest, linear | N/A |
| `addr_mode_0`, `addr_mode_1`, `addr_mode_2` | wrap, mirror, clamp_ogl, clamp_to_edge, clamp_to_border | N/A |
| `array_size` | as number of textures in a texture array | as number of surfaces in a surface array |
| `num_mipmap_levels` | as number of levels in a mipmapped texture | N/A |
| `num_samples` | as number of samples in a multi-sample texture | N/A |
| `memory_layout` | N/A | 1 for linear memory layout; 0 otherwise |

### 5.3.1. Texture and Surface Properties

Fields `width`, `height`, and `depth` specify the size of the texture or surface in number of elements in each dimension.

The `channel_data_type` and `channel_order` fields specify these properties of the texture or surface using enumeration types corresponding to the source language API. For example, see Channel Data Type and Channel Order Fields for the OpenCL enumeration types currently supported in PTX.

### 5.3.2. Sampler Properties

The `normalized_coords` field indicates whether the texture or surface uses normalized coordinates in the range [0.0, 1.0) instead of unnormalized coordinates in the range [0, N). If no value is specified, the default is set by the runtime system based on the source language.

The `filter_mode` field specifies how the values returned by texture reads are computed based on the input texture coordinates.

The `addr_mode_{0,1,2}` fields define the addressing mode in each dimension, which determine how out-of-range coordinates are handled.

See the CUDA C++ Programming Guide for more details of these properties.

**Table 11 Opaque Type Fields in Independent Texture Mode**

| Member | `.samplerref` values | `.texref` values | `.surfref` values |
|--------|----------------------|------------------|-------------------|
| `width` | N/A | in elements | in elements |
| `height` | N/A | in elements | in elements |
| `depth` | N/A | in elements | in elements |
| `channel_data_type` | N/A | enum type corresponding to source language API | enum type corresponding to source language API |
| `channel_order` | N/A | enum type corresponding to source language API | enum type corresponding to source language API |
| `normalized_coords` | N/A | 0, 1 | N/A |
| `force_unnormalized_coords` | 0, 1 | N/A | N/A |
| `filter_mode` | nearest, linear | ignored | N/A |
| `addr_mode_0`, `addr_mode_1`, `addr_mode_2` | wrap, mirror, clamp_ogl, clamp_to_edge, clamp_to_border | N/A | N/A |
| `array_size` | N/A | as number of textures in a texture array | as number of surfaces in a surface array |
| `num_mipmap_levels` | N/A | as number of levels in a mipmapped texture | N/A |
| `num_samples` | N/A | as number of samples in a multi-sample texture | N/A |
| `memory_layout` | N/A | N/A | 1 for linear memory layout; 0 otherwise |

In independent texture mode, the sampler properties are carried in an independent `.samplerref` variable, and these fields are disabled in the `.texref` variables. One additional sampler property, `force_unnormalized_coords`, is available in independent texture mode.

The `force_unnormalized_coords` field is a property of `.samplerref` variables that allows the sampler to override the texture header `normalized_coords` property. This field is defined only in independent texture mode. When True, the texture header setting is overridden and unnormalized coordinates are used; when False, the texture header setting is used.

The `force_unnormalized_coords` property is used in compiling OpenCL; in OpenCL, the property of normalized coordinates is carried in sampler headers. To compile OpenCL to PTX, texture headers are always initialized with `normalized_coords` set to True, and the OpenCL sampler-based `normalized_coords` flag maps (negated) to the PTX-level `force_unnormalized_coords` flag.

Variables using these types may be declared at module scope or within kernel entry parameter lists. At module scope, these variables must be in the `.global` state space. As kernel parameters, these variables are declared in the `.param` state space.

**Example**

```ptx
.global .texref     my_texture_name;
.global .samplerref my_sampler_name;
.global .surfref    my_surface_name;
```

When declared at module scope, the types may be initialized using a list of static expressions assigning values to the named members.

**Example**

```ptx
.global .texref tex1;
.global .samplerref tsamp1 = { addr_mode_0 = clamp_to_border,
                               filter_mode = nearest
                             };
```

### 5.3.3. Channel Data Type and Channel Order Fields

The `channel_data_type` and `channel_order` fields have enumeration types corresponding to the source language API. Currently, OpenCL is the only source language that defines these fields. Table 13 and Table 12 show the enumeration values defined in OpenCL version 1.0 for channel data type and channel order.

**Table 12 OpenCL 1.0 Channel Data Type Definition**

| Name | Value |
|------|-------|
| `CL_SNORM_INT8` | 0x10D0 |
| `CL_SNORM_INT16` | 0x10D1 |
| `CL_UNORM_INT8` | 0x10D2 |
| `CL_UNORM_INT16` | 0x10D3 |
| `CL_UNORM_SHORT_565` | 0x10D4 |
| `CL_UNORM_SHORT_555` | 0x10D5 |
| `CL_UNORM_INT_101010` | 0x10D6 |
| `CL_SIGNED_INT8` | 0x10D7 |
| `CL_SIGNED_INT16` | 0x10D8 |
| `CL_SIGNED_INT32` | 0x10D9 |
| `CL_UNSIGNED_INT8` | 0x10DA |
| `CL_UNSIGNED_INT16` | 0x10DB |
| `CL_UNSIGNED_INT32` | 0x10DC |
| `CL_HALF_FLOAT` | 0x10DD |
| `CL_FLOAT` | 0x10DE |

**Table 13 OpenCL 1.0 Channel Order Definition**

| Name | Value |
|------|-------|
| `CL_R` | 0x10B0 |
| `CL_A` | 0x10B1 |
| `CL_RG` | 0x10B2 |
| `CL_RA` | 0x10B3 |
| `CL_RGB` | 0x10B4 |
| `CL_RGBA` | 0x10B5 |
| `CL_BGRA` | 0x10B6 |
| `CL_ARGB` | 0x10B7 |
| `CL_INTENSITY` | 0x10B8 |
| `CL_LUMINANCE` | 0x10B9 |

## 5.4. Variables

In PTX, a variable declaration describes both the variable's type and its state space. In addition to fundamental types, PTX supports types for simple aggregate objects such as vectors and arrays.

### 5.4.1. Variable Declarations

All storage for data is specified with variable declarations. Every variable must reside in one of the state spaces enumerated in the previous section.

A variable declaration names the space in which the variable resides, its type and size, its name, an optional array size, an optional initializer, and an optional fixed address for the variable.

Predicate variables may only be declared in the register state space.

**Examples**

```ptx
.global .u32 loc;
.reg    .s32 i;
.const  .f32 bias[] = {-1.0, 1.0};
.global .u8  bg[4] = {0, 0, 0, 0};
.reg    .v4 .f32 accel;
.reg    .pred p, q, r;
```

### 5.4.2. Vectors

Limited-length vector types are supported. Vectors of length 2 and 4 of any non-predicate fundamental type can be declared by prefixing the type with `.v2` or `.v4`. Vectors must be based on a fundamental type, and they may reside in the register space. Vectors cannot exceed 128-bits in length; for example, `.v4 .f64` is not allowed. Three-element vectors may be handled by using a `.v4` vector, where the fourth element provides padding. This is a common case for three-dimensional grids, textures, etc.

**Examples**

```ptx
.global .v4 .f32 V;   // a length-4 vector of floats
.shared .v2 .u16 uv;  // a length-2 vector of unsigned ints
.global .v4 .b8  v;   // a length-4 vector of bytes
```

By default, vector variables are aligned to a multiple of their overall size (vector length times base-type size), to enable vector load and store instructions which require addresses aligned to a multiple of the access size.

### 5.4.3. Array Declarations

Array declarations are provided to allow the programmer to reserve space. To declare an array, the variable name is followed with dimensional declarations similar to fixed-size array declarations in C. The size of each dimension is a constant expression.

**Examples**

```ptx
.local  .u16 kernel[19][19];
.shared .u8  mailbox[128];
```

The size of the array specifies how many elements should be reserved. For the declaration of array `kernel` above, 19*19 = 361 halfwords are reserved, for a total of 722 bytes.

When declared with an initializer, the first dimension of the array may be omitted. The size of the first array dimension is determined by the number of elements in the array initializer.

**Examples**

```ptx
.global .u32 index[] = { 0, 1, 2, 3, 4, 5, 6, 7 };
.global .s32 offset[][2] = { {-1, 0}, {0, -1}, {1, 0}, {0, 1} };
```

Array `index` has eight elements, and array `offset` is a 4x2 array.

### 5.4.4. Initializers

Declared variables may specify an initial value using a syntax similar to C/C++, where the variable name is followed by an equals sign and the initial value or values for the variable. A scalar takes a single value, while vectors and arrays take nested lists of values inside of curly braces (the nesting matches the dimensionality of the declaration).

As in C, array initializers may be incomplete, i.e., the number of initializer elements may be less than the extent of the corresponding array dimension, with remaining array locations initialized to the default value for the specified array type.

**Examples**

```ptx
.const  .f32 vals[8] = { 0.33, 0.25, 0.125 };
.global .s32 x[3][2] = { {1,2}, {3} };
```

is equivalent to

```ptx
.const  .f32 vals[8] = { 0.33, 0.25, 0.125, 0.0, 0.0, 0.0, 0.0, 0.0 };
.global .s32 x[3][2] = { {1,2}, {3,0}, {0,0} };
```

Currently, variable initialization is supported only for constant and global state spaces. Variables in constant and global state spaces with no explicit initializer are initialized to zero by default. Initializers are not allowed in external variable declarations.

Variable names appearing in initializers represent the address of the variable; this can be used to statically initialize a pointer to a variable. Initializers may also contain `var+offset` expressions, where offset is a byte offset added to the address of `var`. Only variables in `.global` or `.const` state spaces may be used in initializers. By default, the resulting address is the offset in the variable's state space (as is the case when taking the address of a variable with a `mov` instruction). An operator, `generic()`, is provided to create a generic address for variables used in initializers.

Starting PTX ISA version 7.1, an operator `mask()` is provided, where `mask` is an integer immediate. The only allowed expressions in the `mask()` operator are integer constant expression and symbol expression representing address of variable. The `mask()` operator extracts n consecutive bits from the expression used in initializers and inserts these bits at the lowest position of the initialized variable. The number n and the starting position of the bits to be extracted is specified by the integer immediate mask. PTX ISA version 7.1 only supports extracting a single byte starting at byte boundary from the address of the variable. PTX ISA version 7.3 supports Integer constant expression as an operand in the `mask()` operator.

Supported values for mask are: `0xFF`, `0xFF00`, `0XFF0000`, `0xFF000000`, `0xFF00000000`, `0xFF0000000000`, `0xFF000000000000`, `0xFF00000000000000`.

**Examples**

```ptx
.const  .u32 foo = 42;
.global .u32 bar[] = { 2, 3, 5 };
.global .u32 p1 = foo;          // offset of foo in .const space
.global .u32 p2 = generic(foo); // generic address of foo

// array of generic-address pointers to elements of bar
.global .u32 parr[] = { generic(bar), generic(bar)+4,
generic(bar)+8 };

// examples using mask() operator are pruned for brevity
.global .u8 addr[] = {0xff(foo), 0xff00(foo), 0xff0000(foo), ...};

.global .u8 addr2[] = {0xff(foo+4), 0xff00(foo+4), 0xff0000(foo+4),...}

.global .u8 addr3[] = {0xff(generic(foo)), 0xff00(generic(foo)),...}

.global .u8 addr4[] = {0xff(generic(foo)+4), 0xff00(generic(foo)+4),...}

// mask() operator with integer const expression
.global .u8 addr5[] = { 0xFF(1000 + 546), 0xFF00(131187), ...};
```

> **Note**
>
> PTX 3.1 redefines the default addressing for global variables in initializers, from generic addresses to offsets in the global state space. Legacy PTX code is treated as having an implicit `generic()` operator for each global variable used in an initializer. PTX 3.1 code should either include explicit `generic()` operators in initializers, use `cvta.global` to form generic addresses at runtime, or load from the non-generic address using `ld.global`.

Device function names appearing in initializers represent the address of the first instruction in the function; this can be used to initialize a table of function pointers to be used with indirect calls. Beginning in PTX ISA version 3.1, kernel function names can be used as initializers e.g. to initialize a table of kernel function pointers, to be used with CUDA Dynamic Parallelism to launch kernels from GPU. See the CUDA Dynamic Parallelism Programming Guide for details.

Labels cannot be used in initializers.

Variables that hold addresses of variables or functions should be of type `.u8` or `.u32` or `.u64`.

Type `.u8` is allowed only if the `mask()` operator is used.

Initializers are allowed for all types except `.f16`, `.f16x2` and `.pred`.

**Examples**

```ptx
.global .s32 n = 10;
.global .f32 blur_kernel[][3]
               = {{.05,.1,.05},{.1,.4,.1},{.05,.1,.05}};

.global .u32 foo[] = { 2, 3, 5, 7, 9, 11 };
.global .u64 ptr = generic(foo);   // generic address of foo[0]
.global .u64 ptr = generic(foo)+8; // generic address of foo[2]
```

### 5.4.5. Alignment

Byte alignment of storage for all addressable variables can be specified in the variable declaration. Alignment is specified using an optional `.align` byte-count specifier immediately following the state-space specifier. The variable will be aligned to an address which is an integer multiple of byte-count. The alignment value byte-count must be a power of two. For arrays, alignment specifies the address alignment for the starting address of the entire array, not for individual elements.

The default alignment for scalar and array variables is to a multiple of the base-type size. The default alignment for vector variables is to a multiple of the overall vector size.

**Examples**

```ptx
 // allocate array at 4-byte aligned address.  Elements are bytes.
.const .align 4 .b8 bar[8] = {0,0,0,0,2,0,0,0};
```

Note that all PTX instructions that access memory require that the address be aligned to a multiple of the access size. The access size of a memory instruction is the total number of bytes accessed in memory. For example, the access size of `ld.v4.b32` is 16 bytes, while the access size of `atom.f16x2` is 4 bytes.

### 5.4.6. Parameterized Variable Names

Since PTX supports virtual registers, it is quite common for a compiler frontend to generate a large number of register names. Rather than require explicit declaration of every name, PTX supports a syntax for creating a set of variables having a common prefix string appended with integer suffixes.

For example, suppose a program uses a large number, say one hundred, of `.b32` variables, named `%r0`, `%r1`, ..., `%r99`. These 100 register variables can be declared as follows:

```ptx
.reg .b32 %r<100>;    // declare %r0, %r1, ..., %r99
```

This shorthand syntax may be used with any of the fundamental types and with any state space, and may be preceded by an alignment specifier. Array variables cannot be declared this way, nor are initializers permitted.

### 5.4.7. Variable Attributes

Variables may be declared with an optional `.attribute` directive which allows specifying special attributes of variables. Keyword `.attribute` is followed by attribute specification inside parenthesis. Multiple attributes are separated by comma.

Variable and Function Attribute Directive: `.attribute` describes the `.attribute` directive.

### 5.4.8. Variable and Function Attribute Directive: .attribute

**.attribute**

Variable and function attributes

**Description**

Used to specify special attributes of a variable or a function.

The following attributes are supported.

**`.managed`**
`.managed` attribute specifies that variable will be allocated at a location in unified virtual memory environment where host and other devices in the system can reference the variable directly. This attribute can only be used with variables in `.global` state space. See the CUDA UVM-Lite Programming Guide for details.

**`.unified`**
`.unified` attribute specifies that function has the same memory address on the host and on other devices in the system. Integer constants `uuid1` and `uuid2` respectively specify upper and lower 64 bits of the unique identifier associated with the function or the variable. This attribute can only be used on device functions or on variables in the `.global` state space. Variables with `.unified` attribute are read-only and must be loaded by specifying `.unified` qualifier on the address operand of `ld` instruction, otherwise the behavior is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 4.0.

Support for function attributes introduced in PTX ISA version 8.0.

**Target ISA Notes**

`.managed` attribute requires sm_30 or higher.

`.unified` attribute requires sm_90 or higher.

**Examples**

```ptx
.global .attribute(.managed) .s32 g;
.global .attribute(.managed) .u64 x;

.global .attribute(.unified(19,95)) .f32 f;

.func .attribute(.unified(0xAB, 0xCD)) bar() { ... }
```

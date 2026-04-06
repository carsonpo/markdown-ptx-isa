# 9.7.9. Data Movement and Conversion Instructions

These instructions copy data from place to place, and from state space to state space, possibly converting it from one format to another. mov, ld, ldu, and st operate on both scalar and vector types. The isspacep instruction is provided to query whether a generic address falls within a particular state space window. The cvta instruction converts addresses between generic and const, global, local, or shared state spaces.

Instructions ld, st, suld, and sust support optional cache operations.

The Data Movement and Conversion Instructions are:

- mov
- shfl.sync
- prmt
- ld
- ldu
- st
- st.async
- st.bulk
- multimem.ld_reduce, multimem.st, multimem.red
- prefetch, prefetchu
- isspacep
- cvta
- cvt
- cvt.pack
- cp.async
- cp.async.commit_group
- cp.async.wait_group, cp.async.wait_all
- cp.async.bulk
- cp.reduce.async.bulk
- cp.async.bulk.prefetch
- multimem.cp.async.bulk
- multimem.cp.reduce.async.bulk
- cp.async.bulk.tensor
- cp.reduce.async.bulk.tensor
- cp.async.bulk.prefetch.tensor
- cp.async.bulk.commit_group
- cp.async.bulk.wait_group
- tensormap.replace

## 9.7.9.1. Cache Operators

PTX ISA version 2.0 introduced optional cache operators on load and store instructions. The cache operators require a target architecture of sm_20 or higher.

Cache operators on load or store instructions are treated as performance hints only. The use of a cache operator on an ld or st instruction does not change the memory consistency behavior of the program.

For sm_20 and higher, the cache operators have the following definitions and behavior.

**Table 30 Cache Operators for Memory Load Instructions**

| Operator | Meaning |
|----------|---------|
| `.ca` | Cache at all levels, likely to be accessed again. The default load instruction cache operation is ld.ca, which allocates cache lines in all levels (L1 and L2) with normal eviction policy. Global data is coherent at the L2 level, but multiple L1 caches are not coherent for global data. If one thread stores to global memory via one L1 cache, and a second thread loads that address via a second L1 cache with ld.ca, the second thread may get stale L1 cache data, rather than the data stored by the first thread. The driver must invalidate global L1 cache lines between dependent grids of parallel threads. Stores by the first grid program are then correctly fetched by the second grid program issuing default ld.ca loads cached in L1. |
| `.cg` | Cache at global level (cache in L2 and below, not L1). Use ld.cg to cache loads only globally, bypassing the L1 cache, and cache only in the L2 cache. |
| `.cs` | Cache streaming, likely to be accessed once. The ld.cs load cached streaming operation allocates global lines with evict-first policy in L1 and L2 to limit cache pollution by temporary streaming data that may be accessed once or twice. When ld.cs is applied to a Local window address, it performs the ld.lu operation. |
| `.lu` | Last use. The compiler/programmer may use ld.lu when restoring spilled registers and popping function stack frames to avoid needless write-backs of lines that will not be used again. The ld.lu instruction performs a load cached streaming operation (ld.cs) on global addresses. |
| `.cv` | Don't cache and fetch again (consider cached system memory lines stale, fetch again). The ld.cv load operation applied to a global System Memory address invalidates (discards) a matching L2 line and re-fetches the line on each new load. |

**Table 31 Cache Operators for Memory Store Instructions**

| Operator | Meaning |
|----------|---------|
| `.wb` | Cache write-back all coherent levels. The default store instruction cache operation is st.wb, which writes back cache lines of coherent cache levels with normal eviction policy. If one thread stores to global memory, bypassing its L1 cache, and a second thread in a different SM later loads from that address via a different L1 cache with ld.ca, the second thread may get a hit on stale L1 cache data, rather than get the data from L2 or memory stored by the first thread. The driver must invalidate global L1 cache lines between dependent grids of thread arrays. Stores by the first grid program are then correctly missed in L1 and fetched by the second grid program issuing default ld.ca loads. |
| `.cg` | Cache at global level (cache in L2 and below, not L1). Use st.cg to cache global store data only globally, bypassing the L1 cache, and cache only in the L2 cache. |
| `.cs` | Cache streaming, likely to be accessed once. The st.cs store cached-streaming operation allocates cache lines with evict-first policy to limit cache pollution by streaming output data. |
| `.wt` | Cache write-through (to system memory). The st.wt store write-through operation applied to a global System Memory address writes through the L2 cache. |

## 9.7.9.2. Cache Eviction Priority Hints

PTX ISA version 7.4 adds optional cache eviction priority hints on load and store instructions. Cache eviction priority requires target architecture sm_70 or higher.

Cache eviction priority on load or store instructions is treated as a performance hint. It is supported for `.global` state space and generic addresses where the address points to `.global` state space.

**Table 32 Cache Eviction Priority Hints for Memory Load and Store Instructions**

| Cache Eviction Priority | Meaning |
|------------------------|---------|
| `evict_normal` | Cache data with normal eviction priority. This is the default eviction priority. |
| `evict_first` | Data cached with this priority will be first in the eviction priority order and will likely be evicted when cache eviction is required. This priority is suitable for streaming data. |
| `evict_last` | Data cached with this priority will be last in the eviction priority order and will likely be evicted only after other data with evict_normal or evict_first eviction priority is already evicted. This priority is suitable for data that should remain persistent in cache. |
| `evict_unchanged` | Do not change eviction priority order as part of this operation. |
| `no_allocate` | Do not allocate data to cache. This priority is suitable for streaming data. |

## 9.7.9.3. Data Movement and Conversion Instructions: mov

### mov

Set a register variable with the value of a register variable or an immediate value. Take the non-generic address of a variable in global, local, or shared state space.

**Syntax**

```
mov.type  d, a;
mov.type  d, sreg;
mov.type  d, avar;       // get address of variable
mov.type  d, avar+imm;   // get address of variable with offset
mov.u32   d, fname;      // get address of device function
mov.u64   d, fname;      // get address of device function
mov.u32   d, kernel;     // get address of entry function
mov.u64   d, kernel;     // get address of entry function

.type = { .pred,
          .b16, .b32, .b64,
          .u16, .u32, .u64,
          .s16, .s32, .s64,
                .f32, .f64 };
```

**Description**

Write register d with the value of a.

Operand a may be a register, special register, variable with optional offset in an addressable memory space, or function name.

For variables declared in `.const`, `.global`, `.local`, and `.shared` state spaces, mov places the non-generic address of the variable (i.e., the address of the variable in its state space) into the destination register. The generic address of a variable in const, global, local, or shared state space may be generated by first taking the address within the state space with mov and then converting it to a generic address using the cvta instruction; alternately, the generic address of a variable declared in const, global, local, or shared state space may be taken directly using the cvta instruction.

Note that if the address of a device function parameter is moved to a register, the parameter will be copied onto the stack and the address will be in the local state space.

**Semantics**

```ptx
d = a;
d = sreg;
d = &avar;        // address is non-generic; i.e., within the variable's declared state space
d = &avar+imm;
```

**Notes**

Although only predicate and bit-size types are required, we include the arithmetic types for the programmer's convenience: their use enhances program readability and allows additional type checking.

When moving address of a kernel or a device function, only `.u32` or `.u64` instruction types are allowed. However, if a signed type is used, it is not treated as a compilation error. The compiler issues a warning in this case.

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

Taking the address of kernel entry functions requires PTX ISA version 3.1 or later. Kernel function addresses should only be used in the context of CUDA Dynamic Parallelism system calls. See the CUDA Dynamic Parallelism Programming Guide for details.

**Target ISA Notes**

mov.f64 requires sm_13 or higher.

Taking the address of kernel entry functions requires sm_35 or higher.

**Examples**

```ptx
mov.f32  d,a;
mov.u16  u,v;
mov.f32  k,0.1;
mov.u32  ptr, A;        // move address of A into ptr
mov.u32  ptr, A[5];     // move address of A[5] into ptr
mov.u32  ptr, A+20;     // move address with offset into ptr
mov.u32  addr, myFunc;  // get address of device function 'myFunc'
mov.u64  kptr, main;    // get address of entry function 'main'
```

## 9.7.9.4. Data Movement and Conversion Instructions: mov (vector)

### mov

Move vector-to-scalar (pack) or scalar-to-vector (unpack).

**Syntax**

```
mov.type  d, a;

.type = { .b16, .b32, .b64, .b128 };
```

**Description**

Write scalar register d with the packed value of vector register a, or write vector register d with the unpacked values from scalar register a.

When destination operand d is a vector register, the sink symbol `_` may be used for one or more elements provided that at least one element is a scalar register.

For bit-size types, mov may be used to pack vector elements into a scalar register or unpack sub-fields of a scalar register into a vector. Both the overall size of the vector and the size of the scalar must match the size of the instruction type.

**Semantics**

```ptx
// pack two 8-bit elements into .b16
d = a.x | (a.y << 8)
// pack four 8-bit elements into .b32
d = a.x | (a.y << 8)  | (a.z << 16) | (a.w << 24)
// pack two 16-bit elements into .b32
d = a.x | (a.y << 16)
// pack four 16-bit elements into .b64
d = a.x | (a.y << 16)  | (a.z << 32) | (a.w << 48)
// pack two 32-bit elements into .b64
d = a.x | (a.y << 32)
// pack four 32-bit elements into .b128
d = a.x | (a.y << 32)  | (a.z << 64) | (a.w << 96)
// pack two 64-bit elements into .b128
d = a.x | (a.y << 64)

// unpack 8-bit elements from .b16
{ d.x, d.y } = { a[0..7], a[8..15] }
// unpack 8-bit elements from .b32
{ d.x, d.y, d.z, d.w }
        { a[0..7], a[8..15], a[16..23], a[24..31] }

// unpack 16-bit elements from .b32
{ d.x, d.y }  = { a[0..15], a[16..31] }
// unpack 16-bit elements from .b64
{ d.x, d.y, d.z, d.w } =
        { a[0..15], a[16..31], a[32..47], a[48..63] }

// unpack 32-bit elements from .b64
{ d.x, d.y } = { a[0..31], a[32..63] }

// unpack 32-bit elements from .b128
{ d.x, d.y, d.z, d.w } =
        { a[0..31], a[32..63], a[64..95], a[96..127] }
// unpack 64-bit elements from .b128
{ d.x, d.y } = { a[0..63], a[64..127] }
```

**PTX ISA Notes**

Introduced in PTX ISA version 1.0.

Support for `.b128` type introduced in PTX ISA version 8.3.

**Target ISA Notes**

Supported on all target architectures.

Support for `.b128` type requires sm_70 or higher.

**Examples**

```ptx
mov.b32 %r1,{a,b};      // a,b have type .u16
mov.b64 {lo,hi}, %x;    // %x is a double; lo,hi are .u32
mov.b32 %r1,{x,y,z,w};  // x,y,z,w have type .b8
mov.b32 {r,g,b,a},%r1;  // r,g,b,a have type .u8
mov.b64 {%r1, _}, %x;   // %x is.b64, %r1 is .b32
mov.b128 {%b1, %b2}, %y;   // %y is.b128, %b1 and % b2 are .b64
mov.b128 %y, {%b1, %b2};   // %y is.b128, %b1 and % b2 are .b64
```

## 9.7.9.5. Data Movement and Conversion Instructions: shfl (deprecated)

### shfl (deprecated)

Register data shuffle within threads of a warp.

**Syntax**

```
shfl.mode.b32  d[|p], a, b, c;

.mode = { .up, .down, .bfly, .idx };
```

**Deprecation Note**

The shfl instruction without a `.sync` qualifier is deprecated in PTX ISA version 6.0.

Support for this instruction with `.target` lower than sm_70 may be removed in a future PTX ISA version.

**Removal Note**

Support for shfl instruction without a `.sync` qualifier is removed in PTX ISA version 6.4 for `.target` sm_70 or higher.

**Description**

Exchange register data between threads of a warp.

Each thread in the currently executing warp will compute a source lane index j based on input operands b and c and the mode. If the computed source lane index j is in range, the thread will copy the input operand a from lane j into its own destination register d; otherwise, the thread will simply copy its own input a to destination d. The optional destination predicate p is set to True if the computed source lane is in range, and otherwise set to False.

Note that an out of range value of b may still result in a valid computed source lane index j. In this case, a data transfer occurs and the destination predicate p is True.

Note that results are undefined in divergent control flow within a warp, if an active thread sources a register from an inactive thread.

Operand b specifies a source lane or source lane offset, depending on the mode.

Operand c contains two packed values specifying a mask for logically splitting warps into sub-segments and an upper bound for clamping the source lane index.

**Semantics**

```ptx
lane[4:0]  = [Thread].laneid;  // position of thread in warp
bval[4:0] = b[4:0];            // source lane or lane offset (0..31)
cval[4:0] = c[4:0];            // clamp value
mask[4:0] = c[12:8];

// get value of source register a if thread is active and
// guard predicate true, else unpredictable
if (isActive(Thread) && isGuardPredicateTrue(Thread)) {
    SourceA[lane] = a;
} else {
    // Value of SourceA[lane] is unpredictable for
    // inactive/predicated-off threads in warp
}
maxLane = (lane[4:0] & mask[4:0]) | (cval[4:0] & ~mask[4:0]);
minLane = (lane[4:0] & mask[4:0]);

switch (.mode) {
    case .up:    j = lane - bval; pval = (j >= maxLane); break;
    case .down:  j = lane + bval; pval = (j <= maxLane); break;
    case .bfly:  j = lane ^ bval; pval = (j <= maxLane); break;
    case .idx:   j = minLane  | (bval[4:0] & ~mask[4:0]);
                                 pval = (j <= maxLane); break;
}
if (!pval) j = lane;  // copy from own lane
d = SourceA[j];       // copy input a from lane j
if (dest predicate selected)
    p = pval;
```

**PTX ISA Notes**

Introduced in PTX ISA version 3.0.

Deprecated in PTX ISA version 6.0 in favor of shfl.sync.

Not supported in PTX ISA version 6.4 for `.target` sm_70 or higher.

**Target ISA Notes**

shfl requires sm_30 or higher.

shfl is not supported on sm_70 or higher starting PTX ISA version 6.4.

**Examples**

```ptx
    // Warp-level INCLUSIVE PLUS SCAN:
    //
    // Assumes input in following registers:
    //     - Rx  = sequence value for this thread
    //
    shfl.up.b32  Ry|p, Rx, 0x1,  0x0;
@p  add.f32      Rx, Ry, Rx;
    shfl.up.b32  Ry|p, Rx, 0x2,  0x0;
@p  add.f32      Rx, Ry, Rx;
    shfl.up.b32  Ry|p, Rx, 0x4,  0x0;
@p  add.f32      Rx, Ry, Rx;
    shfl.up.b32  Ry|p, Rx, 0x8,  0x0;
@p  add.f32      Rx, Ry, Rx;
    shfl.up.b32  Ry|p, Rx, 0x10, 0x0;
@p  add.f32      Rx, Ry, Rx;


    // Warp-level INCLUSIVE PLUS REVERSE-SCAN:
    //
    // Assumes input in following registers:
    //     - Rx  = sequence value for this thread
    //
    shfl.down.b32  Ry|p, Rx, 0x1,  0x1f;
@p  add.f32        Rx, Ry, Rx;
    shfl.down.b32  Ry|p, Rx, 0x2,  0x1f;
@p  add.f32        Rx, Ry, Rx;
    shfl.down.b32  Ry|p, Rx, 0x4,  0x1f;
@p  add.f32        Rx, Ry, Rx;
    shfl.down.b32  Ry|p, Rx, 0x8,  0x1f;
@p  add.f32        Rx, Ry, Rx;
    shfl.down.b32  Ry|p, Rx, 0x10, 0x1f;
@p  add.f32        Rx, Ry, Rx;


    // BUTTERFLY REDUCTION:
    //
    // Assumes input in following registers:
    //     - Rx  = sequence value for this thread
    //
    shfl.bfly.b32  Ry, Rx, 0x10, 0x1f;   // no predicate dest
    add.f32        Rx, Ry, Rx;
    shfl.bfly.b32  Ry, Rx, 0x8,  0x1f;
    add.f32        Rx, Ry, Rx;
    shfl.bfly.b32  Ry, Rx, 0x4,  0x1f;
    add.f32        Rx, Ry, Rx;
    shfl.bfly.b32  Ry, Rx, 0x2,  0x1f;
    add.f32        Rx, Ry, Rx;
    shfl.bfly.b32  Ry, Rx, 0x1,  0x1f;
    add.f32        Rx, Ry, Rx;
    //
    // All threads now hold sum in Rx
```


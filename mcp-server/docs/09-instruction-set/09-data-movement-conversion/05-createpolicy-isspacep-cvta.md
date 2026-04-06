## 9.7.9.18. Data Movement and Conversion Instructions: createpolicy

### createpolicy

Create a cache eviction policy for the specified cache level.

**Syntax**

```
// Range-based policy
createpolicy.range{.global}.level::primary_priority{.level::secondary_priority}.b64
                                   cache-policy, [a], primary-size, total-size;

// Fraction-based policy
createpolicy.fractional.level::primary_priority{.level::secondary_priority}.b64
                                   cache-policy{, fraction};

// Converting the access property from CUDA APIs
createpolicy.cvt.L2.b64            cache-policy, access-property;

.level::primary_priority =   { .L2::evict_last, .L2::evict_normal,
                               .L2::evict_first, .L2::evict_unchanged };
.level::secondary_priority = { .L2::evict_first, .L2::evict_unchanged };
```

**Description**

The createpolicy instruction creates a cache eviction policy for the specified cache level in an opaque 64-bit register specified by the destination operand cache-policy. The cache eviction policy specifies how cache eviction priorities are applied to global memory addresses used in memory operations with `.level::cache_hint` qualifier.

There are two types of cache eviction policies:

**Range-based policy**

The cache eviction policy created using `createpolicy.range` specifies the cache eviction behaviors for the following three address ranges:

- `[a .. a + (primary-size - 1)]` referred to as primary range.
- `[a + primary-size .. a + (total-size - 1)]` referred to as trailing secondary range.
- `[a - (total-size - primary-size) .. (a - 1)]` referred to as preceding secondary range.

When a range-based cache eviction policy is used in a memory operation with `.level::cache_hint` qualifier, the eviction priorities are applied as follows:

- If the memory address falls in the primary range, the eviction priority specified by `.level::primary_priority` is applied.
- If the memory address falls in any of the secondary ranges, the eviction priority specified by `.level::secondary_priority` is applied.
- If the memory address does not fall in either of the above ranges, then the applied eviction priority is unspecified.

The 32-bit operand primary-size specifies the size, in bytes, of the primary range. The 32-bit operand total-size specifies the combined size, in bytes, of the address range including primary and secondary ranges. The value of primary-size must be less than or equal to the value of total-size. Maximum allowed value of total-size is 4GB.

If `.level::secondary_priority` is not specified, then it defaults to `.L2::evict_unchanged`.

If no state space is specified then Generic Addressing is used. If the specified address does not fall within the address window of `.global` state space then the behavior is undefined.

**Fraction-based policy**

A memory operation with `.level::cache_hint` qualifier can use the fraction-based cache eviction policy to request the cache eviction priority specified by `.level::primary_priority` to be applied to a fraction of cache accesses specified by the 32-bit floating point operand fraction. The remainder of the cache accesses get the eviction priority specified by `.level::secondary_priority`. This implies that in a memory operation that uses a fraction-based cache policy, the memory access has a probability specified by the operand fraction of getting the cache eviction priority specified by `.level::primary_priority`.

The valid range of values for the operand fraction is (0.0,.., 1.0]. If the operand fraction is not specified, it defaults to 1.0.

If `.level::secondary_priority` is not specified, then it defaults to `.L2::evict_unchanged`.

The access property created using the CUDA APIs can be converted into cache eviction policy by the instruction `createpolicy.cvt`. The source operand access-property is a 64-bit opaque register. Refer to CUDA programming guide for more details.

**PTX ISA Notes**

Introduced in PTX ISA version 7.4.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
createpolicy.fractional.L2::evict_last.b64                      policy, 1.0;
createpolicy.fractional.L2::evict_last.L2::evict_unchanged.b64  policy, 0.5;

createpolicy.range.L2::evict_last.L2::evict_first.b64
                                            policy, [ptr], 0x100000, 0x200000;

// access-prop is created by CUDA APIs.
createpolicy.cvt.L2.b64 policy, access-prop;
```

## 9.7.9.19. Data Movement and Conversion Instructions: isspacep

### isspacep

Query whether a generic address falls within a specified state space window.

**Syntax**

```
isspacep.space  p, a;    // result is .pred

.space = { const, .global, .local, .shared{::cta, ::cluster}, .param{::entry} };
```

**Description**

Write predicate register p with 1 if generic address a falls within the specified state space window and with 0 otherwise. Destination p has type `.pred`; the source address operand must be of type `.u32` or `.u64`.

`isspacep.param{::entry}` returns 1 if the generic address falls within the window of Kernel Function Parameters, otherwise returns 0. If `.param` is specified without any sub-qualifiers then it defaults to `.param::entry`.

`isspacep.global` returns 1 for Kernel Function Parameters as `.param` window is contained within the `.global` window.

If no sub-qualifier is specified with `.shared` state space, then `::cta` is assumed by default.

> **Note:** `ispacep.shared::cluster` will return 1 for every shared memory address that is accessible to the threads in the cluster, whereas `ispacep.shared::cta` will return 1 only if the address is of a variable declared in the executing CTA.

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

isspacep.const introduced in PTX ISA version 3.1.

isspacep.param introduced in PTX ISA version 7.7.

Support for `::cta` and `::cluster` sub-qualifiers introduced in PTX ISA version 7.8.

Support for sub-qualifier `::entry` on `.param` space introduced in PTX ISA version 8.3.

**Target ISA Notes**

isspacep requires sm_20 or higher.

`isspacep.param{::entry}` requires sm_70 or higher.

Sub-qualifier `::cta` requires sm_30 or higher.

Sub-qualifier `::cluster` requires sm_90 or higher.

**Examples**

```ptx
isspacep.const           iscnst, cptr;
isspacep.global          isglbl, gptr;
isspacep.local           islcl,  lptr;
isspacep.shared          isshrd, sptr;
isspacep.param::entry    isparam, pptr;
isspacep.shared::cta     isshrdcta, sptr;
isspacep.shared::cluster ishrdany sptr;
```

## 9.7.9.20. Data Movement and Conversion Instructions: cvta

### cvta

Convert address from `.const`, Kernel Function Parameters (`.param`), `.global`, `.local`, or `.shared` state space to generic, or vice-versa. Take the generic address of a variable declared in `.const`, Kernel Function Parameters (`.param`), `.global`, `.local`, or `.shared` state space.

**Syntax**

```
// convert const, global, local, or shared address to generic address
cvta.space.size  p, a;        // source address in register a
cvta.space.size  p, var;      // get generic address of var
cvta.space.size  p, var+imm;  // generic address of var+offset

// convert generic address to const, global, local, or shared address
cvta.to.space.size  p, a;

.space = { .const, .global, .local, .shared{::cta, ::cluster}, .param{::entry} };
.size  = { .u32, .u64 };
```

**Description**

Convert a const, Kernel Function Parameters (`.param`), global, local, or shared address to a generic address, or vice-versa. The source and destination addresses must be the same size. Use `cvt.u32.u64` or `cvt.u64.u32` to truncate or zero-extend addresses.

For variables declared in `.const`, Kernel Function Parameters (`.param`), `.global`, `.local`, or `.shared` state space, the generic address of the variable may be taken using cvta. The source is either a register or a variable defined in const, Kernel Function Parameters (`.param`), global, local, or shared memory with an optional offset.

When converting a generic address into a const, Kernel Function Parameters (`.param`), global, local, or shared address, the resulting address is undefined in cases where the generic address does not fall within the address window of the specified state space. A program may use isspacep to guard against such incorrect behavior.

For cvta with `.shared` state space, the address must belong to the space specified by `::cta` or `::cluster` sub-qualifier, otherwise the behavior is undefined. If no sub-qualifier is specified with `.shared` state space, then `::cta` is assumed by default.

If `.param` is specified without any sub-qualifiers then it defaults to `.param::entry`. For `.param{::entry}` state space, operand a must be a kernel parameter address, otherwise behavior is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

cvta.const and cvta.to.const introduced in PTX ISA version 3.1.

cvta.param and cvta.to.param introduced in PTX ISA version 7.7.

Note: The current implementation does not allow generic pointers to const space variables in programs that contain pointers to constant buffers passed as kernel parameters.

Support for `::cta` and `::cluster` sub-qualifiers introduced in PTX ISA version 7.8.

Support for sub-qualifier `::entry` on `.param` space introduced in PTX ISA version 8.3.

**Target ISA Notes**

cvta requires sm_20 or higher.

`cvta.param{::entry}` and `cvta.to.param{::entry}` requires sm_70 or higher.

Sub-qualifier `::cta` requires sm_30 or higher.

Sub-qualifier `::cluster` requires sm_90 or higher.

**Examples**

```ptx
cvta.const.u32   ptr,cvar;
cvta.local.u32   ptr,lptr;
cvta.shared::cta.u32  p,As+4;
cvta.shared::cluster.u32 ptr, As;
cvta.to.global.u32  p,gptr;
cvta.param.u64   ptr,pvar;
cvta.to.param::entry.u64  epptr, ptr;
```


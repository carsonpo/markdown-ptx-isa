## 9.7.9.12. Data Movement and Conversion Instructions: st.async

### st.async

Asynchronous store operation.

**Syntax**

```
st.async{.weak}{.ss}.completion_mechanism{.vec}.type [a], b, [mbar];
st.async{.scope}{.ss}.completion_mechanism{.vec}.type [a], b, [mbar];

.scope =                { .cluster };
.ss   =                 { .shared::cluster };
.type =                 { .b32, .b64, .b128,
                          .u32, .u64,
                          .s32, .s64,
                          .f32, .f64 };
.vec  =                 { .v2, .v4 };
.completion_mechanism = { .mbarrier::complete_tx::bytes };

st.async{.mmio}.sem.scope{.ss}.type [a], b;

.sem =                  { .release };
.scope =                { .gpu, .sys };
.ss =                   { .global };
.type =                 { .b8, .b16, .b32, .b64,
                          .u8, .u16, .u32, .u64,
                          .s8, .s16, .s32, .s64,
                                     .f32, .f64 };
```

**Description**

st.async is a non-blocking instruction which initiates an asynchronous store operation that stores the value specified by source operand b to the destination memory location specified by operand a.

st.async is performed in the generic proxy.

**Operands**

- a is a destination address, and must be either a register, or of the form register + immOff, as described in Addresses as Operands.
- b is a source value, of the type indicated by qualifier `.type`.
- mbar is an mbarrier object address.

**Qualifiers**

- `.mmio` indicates whether this is an mmio Operation.
- `.sem` specifies the memory ordering semantics as described in the Memory Consistency Model. If `.sem` is not specified, it defaults to `.weak`.
- `.scope` specifies the set of threads with which this instruction can directly synchronize.
- `.ss` specifies the state space of the destination operand a and the mbarrier operand mbar. If `.ss` is not specified, Generic Addressing is used.
- `.completion_mechanism` specifies the mechanism for observing the completion of the asynchronous operation. When `.completion_mechanism` is `.mbarrier::complete_tx::bytes`: upon completion of the asynchronous operation, a complete-tx operation will be performed on the mbarrier object specified by the operand mbar, with completeCount argument equal to the amount of data stored in bytes. This instruction accesses its mbarrier operand using generic-proxy.
- `.type` specifies the type of the source operand b.

**Conditions**

When `.sem` is `.weak`:

This is a weak store to shared memory, which signals its completion through an mbarrier object. The store operation is treated as a weak memory operation. The complete-tx operation on the mbarrier has `.release` semantics at `.cluster` scope.

Requires: The shared memory addresses of destination operand a and the mbarrier object mbar belong to the same CTA within the same cluster as the executing thread. The number of CTAs within the cluster is strictly greater than one; `%cluster_nctarank > 1` is true. Otherwise, the behavior is undefined. `.mmio` must not be specified. If `.ss` is specified, it must be `.shared::cluster`. If `.ss` is not specified, generic addressing is used for operands a and mbar. If the generic addresses specified do not fall within the address window of `.shared::cluster` state space, the behavior is undefined. `.completion_mechanism` must be specified and must be `.mbarrier::complete_tx::bytes`.

When `.sem` is `.release`:

This is a release store to global memory. The store operation is a strong memory operation with `.release` semantics at the scope specified by `.scope`. If `.mmio` is specified, `.scope` must be `.sys`. If `.ss` is specified, it must be `.global`. If `.ss` is not specified, generic addressing is used for operand a. If the generic address specified does not fall within the address window of `.global` state space, the behavior is undefined.

For `.vec` qualifier: `.v2` is supported with `.b32`, `.b64`, `.s32`, `.s64`, `.u32`, `.u64`, `.f32` and `.f64` types. `.v4` qualifier is supported with `.b32`, `.s32`, `.u32` and `.f32` types.

**PTX ISA Notes**

Introduced in PTX ISA version 8.1.

Support for `.mmio` qualifier, `.release` semantics, `.global` state space, and `.scope` qualifier introduced in PTX ISA version 8.7.

Support for `.b128` type introduced in PTX ISA version 9.2.

**Target ISA Notes**

Requires sm_90 or higher.

`.mmio` qualifier, `.release` semantics, `.global` state space, and `.scope` qualifier require sm_100 or higher.

**Examples**

```ptx
st.async.shared::cluster.mbarrier::complete_tx::bytes.u32 [addr], b, [mbar_addr];

st.async.sys.release.global.u32 [addr], b;

st.async.mbarrier::complete_tx::bytes.b128 [addr], b, [mbar_addr];

st.async.shared::cluster.mbarrier::complete_tx::bytes.b128 [addr], b, [mbar_addr];
```

## 9.7.9.13. Data Movement and Conversion Instructions: st.bulk

### st.bulk

Initializes a region of memory as specified by state space.

**Syntax**

```
st.bulk{.weak}{.shared::cta}  [a], size, initval; // initval must be zero
```

**Description**

st.bulk instruction initializes a region of shared memory starting from the location specified by destination address operand a.

The 32-bit or 64-bit integer operand size specifies the amount of memory to be initialized in terms of number of bytes. size must be a multiple of 8. If the value is not a multiple of 8, then the behavior is undefined. The maximum value of size operand can be 16777216.

The integer immediate operand initval specifies the initialization value for the memory locations. The only numeric value allowed for operand initval is 0.

If no state space is specified then Generic Addressing is used. If the address specified by a does not fall within the address window of `.shared` state space then the behavior is undefined.

The optional qualifier `.weak` specify the memory synchronizing effect of the st.bulk instruction as described in the Memory Consistency Model.

**PTX ISA Notes**

Introduced in PTX ISA version 8.6.

Support for size operand with 32-bit length is introduced in PTX ISA version 9.0.

**Target ISA Notes**

Requires sm_100 or higher.

**Examples**

```ptx
st.bulk.weak.shared::cta  [dst], n, 0;

st.bulk                   [gdst], 4096, 0;
```

## 9.7.9.14. Data Movement and Conversion Instructions: multimem.ld_reduce, multimem.st, multimem.red

The multimem.* operations operate on multimem addresses and accesses all of the multiple memory locations which the multimem address points to.

Multimem addresses can be accessed only by multimem.* operations. Accessing a multimem address with ld, st or any other memory operations results in undefined behavior.

Refer to CUDA programming guide for creation and management of the multimem addresses.

### multimem.ld_reduce, multimem.st, multimem.red

Perform memory operations on the multimem address.

**Syntax**

```
// Integer type:

multimem.ld_reduce{.ldsem}{.scope}{.ss}.op.type      d, [a];
multimem.ld_reduce.weak{.ss}.op.type                 d, [a];

multimem.st{.stsem}{.scope}{.ss}.type                [a], b;
multimem.st.weak{.ss}.type                           [a], b;

multimem.red{.redsem}{.scope}{.ss}.op.type           [a], b;

.ss =       { .global }
.ldsem =    { .relaxed, .acquire }
.stsem =    { .relaxed, .release }
.redsem =   { .relaxed, .release }
.scope =    { .cta, .cluster, .gpu, .sys }
.op  =      { .min, .max, .add, .and, .or, .xor }
.type =     { .b32, .b64,  .u32, .u64, .s32, .s64 }

// Floating point type:

multimem.ld_reduce{.ldsem}{.scope}{.ss}.op{.acc_prec}{.vec}.type    d, [a];
multimem.ld_reduce.weak{.ss}.op{.acc_prec}{.vec}.type               d, [a];

multimem.st{.stsem}{.scope}{.ss}{.vec}.type                         [a], b;
multimem.st.weak{.ss}{.vec}.type                                    [a], b;

multimem.red{.redsem}{.scope}{.ss}.redop{.vec}.redtype              [a], b;

.ss =       { .global }
.ldsem =    { .relaxed, .acquire }
.stsem =    { .relaxed, .release }
.redsem =   { .relaxed, .release }
.scope =    { .cta, .cluster, .gpu, .sys }
.op  =      { .min, .max, .add }
.redop  =   { .add }
.acc_prec = { .acc::f32, .acc::f16 }
.vec =      { .v2, .v4, .v8 }
.type=      { .f16, .f16x2, .bf16, .bf16x2, .f32, .f64, .e5m2, .e5m2x2, .e5m2x4, .e4m3, .e4m3x2, .e4m3x4 }
.redtype =  { .f16, .f16x2, .bf16, .bf16x2, .f32, .f64 }
```

**Description**

Instruction multimem.ld_reduce performs the following operations: load operation on the multimem address a, which involves loading of data from all of the multiple memory locations pointed to by the multimem address a, and reduction operation specified by `.op` on the multiple data loaded from the multimem address a. The result of the reduction operation is returned in register d.

Instruction multimem.st performs a store operation of the input operand b to all the memory locations pointed to by the multimem address a.

Instruction multimem.red performs a reduction operation on all the memory locations pointed to by the multimem address a, with operand b.

Instruction multimem.ld_reduce performs reduction on the values loaded from all the memory locations that the multimem address points to. In contrast, the multimem.red perform reduction on all the memory locations that the multimem address points to.

Address operand a must be a multimem address. Otherwise, the behavior is undefined.

If no state space is specified then Generic Addressing is used. If the address specified by a does not fall within the address window of `.global` state space then the behavior is undefined.

For floating-point type multi- operations, the size of the specified type along with `.vec` must equal either 32-bits or 64-bits or 128-bits. No other combinations of `.vec` and type are allowed. Type `.f64` cannot be used with `.vec` qualifier.

The following table describes the valid usage of `.vec` and base floating-point type:

| .vec | Base float-type supported |
|------|--------------------------|
| No .vec specified | .f16x2, .bf16x2, .f32, .f64, .e5m2x4, .e4m3x4 |
| .v2 | .f16, .f16x2, .bf16, .bf16x2 .f32, .e5m2x2, .e5m2x4, .e4m3x2, .e4m3x4 |
| .v4 | .f16, .f16x2, .bf16, .bf16x2 .f32, .e5m2, .e5m2x2, .e5m2x4, .e4m3, .e4m3x2, .e4m3x4 |
| .v8 | .f16, .bf16, .e5m2, .e4m3, .e5m2x2, .e4m3x2 |

The following table describes the valid combinations of `.op` and base type:

| op | Base type |
|----|----------|
| .add | .u32, .u64, .s32 .f16, .f16x2, .bf16, .bf16x2 .f32, .f64, .e5m2, .e5m2x2, .e5m2x4, .e4m3, .e4m3x2, .e4m3x4 |
| .and, .or, .xor | .b32, .b64 |
| .min, .max | .u32, .s32, .u64, .s64 .f16, .f16x2, .bf16, .bf16x2 .e5m2, .e5m2x2, .e5m2x4, .e4m3, .e4m3x2, .e4m3x4 |

For multimem.ld_reduce, the default precision of the intermediate accumulation is same as the specified type.

Optionally, `.acc_prec` qualifier can be specified to change the precision of intermediate accumulation as follows:

| .type | .acc::prec | Changes precision to |
|-------|-----------|---------------------|
| .f16, .f16x2, .bf16, .bf16x2 | .acc::f32 | .f32 |
| .e5m2, .e4m3, .e5m2x2, .e4m3x2, .e4m3x4, .e5m2x4 | .acc::f16 | .f16 |

Optional qualifiers `.ldsem`, `.stsem` and `.redsem` specify the memory synchronizing effect of the multimem.ld_reduce, multimem.st and multimem.red respectively, as described in Memory Consistency Model. If explicit semantics qualifiers are not specified, then multimem.ld_reduce and multimem.st default to `.weak` and multimem.red defaults to `.relaxed`.

The optional `.scope` qualifier specifies the set of threads that can directly observe the memory synchronizing effect of this operation, as described in Memory Consistency Model. If the `.scope` qualifier is not specified for multimem.red then `.sys` scope is assumed by default.

**PTX ISA Notes**

Introduced in PTX ISA version 8.1.

Support for `.acc::f32` qualifier introduced in PTX ISA version 8.2.

Support for types `.e5m2`, `.e5m2x2`, `.e5m2x4`, `.e4m3`, `.e4m3x2`, `.e4m3x4` introduced in PTX ISA version 8.6.

Support for `.acc::f16` qualifier introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_90 or higher.

Types `.e5m2`, `.e5m2x2`, `.e5m2x4`, `.e4m3`, `.e4m3x2`, `.e4m3x4` are supported on: sm_100a, sm_101a (Renamed to sm_110a from PTX ISA version 9.0), sm_120a, sm_121a. And are supported on family-specific architectures: sm_100f or higher in the same family, sm_101f or higher in the same family (Renamed to sm_110f from PTX ISA version 9.0), sm_110f or higher in the same family.

Qualifier `.acc::f16` is supported on: sm_100a, sm_101a (Renamed to sm_110a from PTX ISA version 9.0), sm_120a, sm_121a. And is supported on family-specific architectures: sm_100f or higher in the same family, sm_101f or higher in the same family (Renamed to sm_110f from PTX ISA version 9.0), sm_110f or higher in the same family.

**Examples**

```ptx
multimem.ld_reduce.and.b32                    val1_b32, [addr1];
multimem.ld_reduce.acquire.gpu.global.add.u32 val2_u32, [addr2];

multimem.st.relaxed.gpu.b32                [addr3], val3_b32;
multimem.st.release.cta.global.u32         [addr4], val4_u32;

multimem.red.relaxed.gpu.max.f64           [addr5], val5_f64;
multimem.red.release.cta.global.add.v4.f32 [addr6], {val6, val7, val8, val9};
multimem.ld_reduce.add.acc::f32.v2.f16x2   {val_10, val_11}, [addr7];

multimem.ld_reduce.relaxed.cta.min.v2.e4m3x2 {val_12, val_13}, [addr8];
multimem.ld_reduce.relaxed.cta.add.v4.e4m3   {val_14, val_15, val_16, val_17}, [addr9];
multimem.ld_reduce.add.acc::f16.v4.e5m2      {val_18, val_19, val_20, val_21}, [addr10];
```

## 9.7.9.15. Data Movement and Conversion Instructions: prefetch, prefetchu

### prefetch, prefetchu

Prefetch line containing a generic address at a specified level of memory hierarchy, in specified state space.

**Syntax**

```
prefetch{.space}.level                    [a];   // prefetch to data cache
prefetch.global.level::eviction_priority  [a];   // prefetch to data cache

prefetchu.L1  [a];             // prefetch to uniform cache

prefetch{.tensormap_space}.tensormap [a];  // prefetch the tensormap

.space =                    { .global, .local };
.level =                    { .L1, .L2 };
.level::eviction_priority = { .L2::evict_last, .L2::evict_normal };
.tensormap_space =          { .const, .param };
```

**Description**

The prefetch instruction brings the cache line containing the specified address in global or local memory state space into the specified cache level.

If the `.tensormap` qualifier is specified then the prefetch instruction brings the cache line containing the specified address in the `.const` or `.param` memory state space for subsequent use by the cp.async.bulk.tensor instruction.

If no state space is given, the prefetch uses Generic Addressing.

Optionally, the eviction priority to be applied on the prefetched cache line can be specified by the modifier `.level::eviction_priority`.

The prefetchu instruction brings the cache line containing the specified generic address into the specified uniform cache level.

A prefetch to a shared memory location performs no operation.

A prefetch into the uniform cache requires a generic address, and no operation occurs if the address maps to a const, local, or shared memory location.

**PTX ISA Notes**

Introduced in PTX ISA version 2.0.

Support for `.level::eviction_priority` qualifier introduced in PTX ISA version 7.4.

Support for the `.tensormap` qualifier is introduced in PTX ISA version 8.0.

**Target ISA Notes**

prefetch and prefetchu require sm_20 or higher.

Support for `.level::eviction_priority` qualifier requires sm_80 or higher.

Support for the `.tensormap` qualifier requires sm_90 or higher.

**Examples**

```ptx
prefetch.global.L1             [ptr];
prefetch.global.L2::evict_last [ptr];
prefetchu.L1  [addr];
prefetch.const.tensormap       [ptr];
```

## 9.7.9.16. Data Movement and Conversion Instructions: applypriority

### applypriority

Apply the cache eviction priority to the specified address in the specified cache level.

**Syntax**

```
applypriority{.global}.level::eviction_priority  [a], size;

.level::eviction_priority = { .L2::evict_normal };
```

**Description**

The applypriority instruction applies the cache eviction priority specified by the `.level::eviction_priority` qualifier to the address range [a..a+size) in the specified cache level.

If no state space is specified then Generic Addressing is used. If the specified address does not fall within the address window of `.global` state space then the behavior is undefined.

The operand size is an integer constant that specifies the amount of data, in bytes, in the specified cache level on which the priority is to be applied. The only supported value for the size operand is 128.

Supported addressing modes for operand a are described in Addresses as Operands. a must be aligned to 128 bytes.

**PTX ISA Notes**

Introduced in PTX ISA version 7.4.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
applypriority.global.L2::evict_normal [ptr], 128;
```

## 9.7.9.17. Data Movement and Conversion Instructions: discard

### discard

Discard the data at the specified address range and cache level.

**Syntax**

```
discard{.global}.level  [a], size;

.level = { .L2 };
```

**Description**

Semantically, this behaves like a weak write of an unstable indeterminate value: reads of memory locations with unstable indeterminate values may return different bit patterns each time until the memory is overwritten. This operation hints to the implementation that data in the specified cache `.level` can be destructively discarded without writing it back to memory.

The operand size is an integer constant that specifies the length in bytes of the address range [a, a + size) to write unstable indeterminate values into. The only supported value for the size operand is 128.

If no state space is specified then Generic Addressing is used. If the specified address does not fall within the address window of `.global` state space then the behavior is undefined.

Supported addressing modes for address operand a are described in Addresses as Operands. a must be aligned to 128 bytes.

**PTX ISA Notes**

Introduced in PTX ISA version 7.4.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
discard.global.L2 [ptr], 128;
ld.weak.u32 r0, [ptr];
ld.weak.u32 r1, [ptr];
// The values in r0 and r1 may differ!
```


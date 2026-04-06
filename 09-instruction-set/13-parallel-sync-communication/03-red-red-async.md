## 9.7.13.6. Parallel Synchronization and Communication Instructions: red

### red

Reduction operations on global and shared memory.

**Syntax**

Reduction operation with scalar type:

```
red{.sem}{.scope}{.space}.op{.level::cache_hint}.type          [a], b{, cache-policy};

red{.sem}{.scope}{.space}.add.noftz{.level::cache_hint}.f16    [a], b{, cache-policy};

red{.sem}{.scope}{.space}.add.noftz{.level::cache_hint}.f16x2  [a], b{, cache-policy};

red{.sem}{.scope}{.space}.add.noftz{.level::cache_hint}.bf16
                                                      [a], b {, cache-policy};

red{.sem}{.scope}{.space}.add.noftz{.level::cache_hint}.bf16x2
                                                      [a], b {, cache-policy};

.space =              { .global, .shared{::cta, ::cluster} };
.sem =                {.relaxed, .release};
.scope =              {.cta, .cluster, .gpu, .sys};

.op =                 { .and, .or, .xor,
                        .add, .inc, .dec,
                        .min, .max };
.level::cache_hint =  { .L2::cache_hint };
.type =               { .b32, .b64, .u32, .u64, .s32, .s64, .f32, .f64 };
```

Reduction operation with vector type:

```
red{.sem}{.scope}{.global}.add{.level::cache_hint}.vec_32_bit.f32 [a], b{, cache-policy};
red{.sem}{.scope}{.global}.op.noftz{.level::cache_hint}.vec_16_bit.half_word_type [a], b{, cache-policy};
red{.sem}{.scope}{.global}.op.noftz{.level::cache_hint}.vec_32_bit.packed_type [a], b {, cache-policy};

.sem =                { .relaxed, .release };
.scope =              { .cta, .cluster, .gpu, .sys };
.op =                 { .add, .min, .max };
.half_word_type =     { .f16, .bf16 };
.packed_type =        { .f16x2,.bf16x2 };
.vec_16_bit =         { .v2, .v4, .v8 }
.vec_32_bit =         { .v2, .v4 };
.level::cache_hint =  { .L2::cache_hint }
```

**Description**

Performs a reduction operation with operand b and the value in location a, and stores the result of the specified operation at location a, overwriting the original value. Operand a specifies a location in the specified state space. If no state space is given, perform the memory accesses using Generic Addressing. red with scalar type may be used only with `.global` and `.shared` spaces and with generic addressing, where the address points to `.global` or `.shared` space. red with vector type may be used only with `.global` space and with generic addressing where the address points to `.global` space.

For red with vector type, operand b is brace-enclosed vector expressions, size of which is equal to the size of vector qualifier.

If no sub-qualifier is specified with `.shared` state space, then `::cta` is assumed by default.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the Memory Consistency Model. If the `.sem` qualifier is absent, `.relaxed` is assumed by default.

The optional `.scope` qualifier specifies the set of threads that can directly observe the memory synchronizing effect of this operation, as described in the Memory Consistency Model. If the `.scope` qualifier is absent, `.gpu` scope is assumed by default.

For red with vector type, the supported combinations of vector qualifier, types and reduction operations supported on these combinations are:

| Vector qualifier | `.f16`/`.bf16` | `.f16x2`/`.bf16x2` | `.f32` |
|-----------------|----------------|---------------------|--------|
| `.v2` | `.add`, `.min`, `.max` | `.add`, `.min`, `.max` | `.add` |
| `.v4` | `.add`, `.min`, `.max` | `.add`, `.min`, `.max` | `.add` |
| `.v8` | `.add`, `.min`, `.max` | Not supported | Not supported |

Two atomic operations (atom or red) are performed atomically with respect to each other only if each operation specifies a scope that includes the other. When this condition is not met, each operation observes the other operation being performed as if it were split into a read followed by a dependent write.

red instruction on packed type or vector type, accesses adjacent scalar elements in memory. In such case, the atomicity is guaranteed separately for each of the individual scalar elements; the entire red is not guaranteed to be atomic as a single access.

For sm_6x and earlier architectures, red operations on `.shared` state space do not guarantee atomicity with respect to normal store instructions to the same address. It is the programmer's responsibility to guarantee correctness of programs that use shared memory reduction instructions, e.g., by inserting barriers between normal stores and reduction operations to a common address, or by using `atom.exch` to store to locations accessed by other reduction operations.

Supported addressing modes for operand a and alignment requirements are described in Addresses as Operands.

The bit-size operations are `.and`, `.or`, and `.xor`.

The integer operations are `.add`, `.inc`, `.dec`, `.min`, `.max`. The `.inc` and `.dec` operations return a result in the range [0..b].

The floating-point operation `.add` operation rounds to nearest even. Current implementation of `red.add.f32` on global memory flushes subnormal inputs and results to sign-preserving zero; whereas `red.add.f32` on shared memory supports subnormal inputs and results and doesn't flush them to zero.

`red.add.f16`, `red.add.f16x2`, `red.add.bf16` and `red.add.bf16x2` operation requires the `.noftz` qualifier; it preserves subnormal inputs and results, and does not flush them to zero.

When the optional argument cache-policy is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand cache-policy specifies the cache eviction policy that may be used during the memory access.

The qualifier `.level::cache_hint` is only supported for `.global` state space and for generic addressing where the address points to the `.global` state space.

cache-policy is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

**Semantics**

```ptx
*a = operation(*a, b);

where
    inc(r, s) = (r >= s) ? 0 : r+1;
    dec(r, s) = (r==0 || r > s)  ? s : r-1;
```

**PTX ISA Notes**

Introduced in PTX ISA version 1.2.

`red.add.f32` and `red.shared.add.u64` introduced in PTX ISA 2.0.

64-bit `red.{and,or,xor,min,max}` introduced in PTX ISA 3.1.

`red.add.f64` introduced in PTX ISA 5.0.

`.scope` qualifier introduced in PTX ISA 5.0.

`.sem` qualifier introduced in PTX ISA version 6.0.

`red.add.noftz.f16x2` introduced in PTX ISA 6.2.

`red.add.noftz.f16` introduced in PTX ISA 6.3.

Per-element atomicity of `red.f16x2` clarified in PTX ISA version 6.3, with retrospective effect from PTX ISA version 6.2.

Support for `.level::cache_hint` qualifier introduced in PTX ISA version 7.4.

`red.add.noftz.bf16` and `red.add.noftz.bf16x2` introduced in PTX ISA 7.8.

Support for `.cluster` scope qualifier introduced in PTX ISA version 7.8.

Support for `::cta` and `::cluster` sub-qualifiers introduced in PTX ISA version 7.8.

Support for vector types introduced in PTX ISA version 8.1.

**Target ISA Notes**

`red.global` requires sm_11 or higher.

`red.shared` requires sm_12 or higher.

`red.global.add.u64` requires sm_12 or higher.

`red.shared.add.u64` requires sm_20 or higher.

64-bit `red.{and,or,xor,min,max}` require sm_32 or higher.

`red.add.f32` requires sm_20 or higher.

`red.add.f64` requires sm_60 or higher.

`.scope` qualifier requires sm_60 or higher.

`.sem` qualifier requires sm_70 or higher.

Use of generic addressing requires sm_20 or higher.

`red.add.noftz.f16x2` requires sm_60 or higher.

`red.add.noftz.f16` requires sm_70 or higher.

Support for `.level::cache_hint` qualifier requires sm_80 or higher.

`red.add.noftz.bf16` and `red.add.noftz.bf16x2` require sm_90 or higher.

Support for `.cluster` scope qualifier requires sm_90 or higher.

Sub-qualifier `::cta` requires sm_30 or higher.

Sub-qualifier `::cluster` requires sm_90 or higher.

Support for vector types requires sm_90 or higher.

**Examples**

```ptx
red.global.add.s32  [a],1;
red.shared::cluster.max.u32  [x+4],0;
@p  red.global.and.b32  [p],my_val;
red.global.sys.add.u32 [a], 1;
red.global.acquire.sys.add.u32 [gbl], 1;
red.add.noftz.f16x2 [a], b;
red.add.noftz.bf16   [a], hb;
red.add.noftz.bf16x2 [b], bb;
red.global.cluster.relaxed.add.u32 [a], 1;
red.shared::cta.min.u32  [x+4],0;

createpolicy.fractional.L2::evict_last.b64 cache-policy, 0.25;
red.global.and.L2::cache_hint.b32 [a], 1, cache-policy;

red.global.v8.f16.add.noftz  [gbl], {%h0, %h1, %h2, %h3, %h4, %h5, %h6, %h7};
red.global.v8.bf16.min.noftz [gbl], {%h0, %h1, %h2, %h3, %h4, %h5, %h6, %h7};
red.global.v2.f16.add.noftz [gbl], {%h0, %h1};
red.global.v2.bf16.add.noftz [gbl], {%h0, %h1};
red.global.v4.f16x2.max.noftz [gbl], {%h0, %h1, %h2, %h3};
red.global.v4.f32.add  [gbl], {%f0, %f1, %f2, %f3};
red.global.v2.f16x2.max.noftz {%bd0, %bd1}, [g], {%b0, %b1};
red.global.v2.bf16x2.add.noftz {%bd0, %bd1}, [g], {%b0, %b1};
red.global.v2.f32.add  {%f0, %f1}, [g], {%f0, %f1};
```

## 9.7.13.7. Parallel Synchronization and Communication Instructions: red.async

### red.async

Asynchronous reduction operation.

**Syntax**

```
// Increment and Decrement reductions
red.async.sem.scope{.ss}.completion_mechanism.op.type [a], b, [mbar];

.sem  =                 { .relaxed };
.scope =                { .cluster };
.ss   =                 { .shared::cluster };
.op   =                 { .inc, .dec };
.type =                 { .u32 };
.completion_mechanism = { .mbarrier::complete_tx::bytes };


// MIN and MAX reductions
red.async.sem.scope{.ss}.completion_mechanism.op.type [a], b, [mbar];

.sem  = { .relaxed };
.scope = { .cluster };
.ss   = { .shared::cluster };
.op   = { .min, .max };
.type = { .u32, .s32 };
.completion_mechanism = { .mbarrier::complete_tx::bytes };

// Bitwise AND, OR and XOR reductions
red.async.sem.scope{.ss}.completion_mechanism.op.type [a], b, [mbar];

.sem  = { .relaxed };
.scope = { .cluster };
.ss   = { .shared::cluster };
.op   = { .and, .or, .xor };
.type = { .b32 };
.completion_mechanism = { .mbarrier::complete_tx::bytes };

// ADD reductions
red.async.sem.scope{.ss}.completion_mechanism.add.type [a], b, [mbar];

.sem  = { .relaxed };
.scope = { .cluster };
.ss   = { .shared::cluster };
.type = { .u32, .s32, .u64 };
.completion_mechanism = { .mbarrier::complete_tx::bytes };

red.async{.mmio}.sem.scope{.ss}.add.type [a], b;

.sem  = { .release };
.scope = { .gpu, .cluster };
.ss   = { .global };
.type = { .u32, .s32, .u64, .s64 };
```

**Description**

`red.async` is a non-blocking instruction which initiates an asynchronous reduction operation specified by `.op`, with the operand b and the value at destination shared memory location specified by operand a.

`red.async` is performed in the generic proxy.

**Operands**

a is a destination address, and must be either a register, or of the form register + immOff, as described in Addresses as Operands.

b is a source value, of the type indicated by qualifier `.type`.

mbar is an mbarrier object address.

**Qualifiers**

`.mmio` indicates whether this is an mmio Operation.

`.sem` specifies the memory ordering semantics as described in the Memory Consistency Model.

`.scope` specifies the set of threads with which this instruction can directly synchronize.

`.ss` specifies the state space of the destination operand a and the mbarrier operand mbar.

If `.ss` is not specified, Generic Addressing is used.

`.completion_mechanism` specifies the mechanism for observing the completion of the asynchronous operation.

When `.completion_mechanism` is `.mbarrier::complete_tx::bytes`: upon completion of the asynchronous operation, a complete-tx operation will be performed on the mbarrier object specified by the operand mbar, with completeCount argument equal to the amount of data stored in bytes.

When `.completion_mechanism` is not specified: the completion of the store synchronizes with the end of the CTA. This instruction accesses its mbarrier operand using generic-proxy.

`.op` specifies the reduction operation.

The `.inc` and `.dec` operations return a result in the range [0..b].

`.type` specifies the type of the source operand b.

**Conditions**

When `.sem` is `.relaxed`:

The reduce operation is a relaxed memory operation.

The complete-tx operation on the mbarrier has `.release` semantics at `.cluster` scope.

The shared-memory addresses of the destination operand a and the mbarrier operand mbar must meet all of the following conditions:

- They belong to the same CTA.
- The CTA to which they belong is different from the CTA of the executing thread, but must be within the same cluster.

Otherwise, the behavior is undefined.

`.mmio` must not be specified.

If `.ss` is specified, it must be `.shared::cluster`.

If `.ss` is not specified, generic addressing is used for operands a and mbar. If the generic addresses specified do not fall within the address window of `.shared::cluster` state space, the behavior is undefined.

If `.completion_mechanism` is specified, it must be `.mbarrier::complete_tx::bytes`.

If `.completion_mechanism` is not specified, it defaults to `.mbarrier::complete_tx::bytes`.

When `.sem` is `.release`:

The reduce operation is a strong memory operation with `.release` semantics at the scope specified by `.scope`.

If `.mmio` is specified, `.scope` must be `.sys`.

If `.ss` is specified, it must be `.global`.

If `.ss` is not specified, generic addressing is used for operand a. If the generic address specified does not fall within the address window of `.global` state space, the behavior is undefined.

`.completion_mechanism` must not be specified.

**PTX ISA Notes**

Introduced in PTX ISA version 8.1.

Support for `.mmio` qualifier, `.release` semantics, `.global` state space, and `.gpu` and `.sys` scopes introduced in PTX ISA version 8.7.

**Target ISA Notes**

Requires sm_90 or higher.

`.mmio` qualifier, `.release` semantics, `.global` state space, and `.gpu` and `.sys` scopes require sm_100 or higher.

**Examples**

```ptx
red.async.relaxed.cluster.shared::cluster.mbarrier::complete_tx::bytes.min.u32 [addr], b, [mbar_addr];

red.async.release.sys.global.add.u32 [addr], b;
```


# 9.7.11.5.3. Fabric Instructions: fabric.try_red

**fabric.try_red**

Asynchronous copy to fabric handle with reduction.

## Syntax

```ptx
fabric.try_red.async{.multimem}.src.completion_mechanism0{.level::cache_hint}.sem.scope.redOpBit.typeBit [dstLeId, dstDataOff], [src], size, [bar] {, cache_policy};

fabric.try_red.async{.multimem}.src.completion_mechanism0{.level::cache_hint}.sem.scope.redOpMinMax.typeMinMax [dstLeId, dstDataOff], [src], size, [bar] {, cache_policy};

fabric.try_red.async{.multimem}.src.completion_mechanism0{.level::cache_hint}.sem.scope.redOpArith.typeArith [dstLeId, dstDataOff], [src], size, [bar] {, cache_policy};

fabric.try_red.async{.multimem}.src.completion_mechanism1{.level::cache_hint}.sem.scope.redOpBit.typeBit [dstLeId, dstDataOff, dstCounterOff], [src], size, [bar] {, cache_policy};

fabric.try_red.async{.multimem}.src.completion_mechanism1{.level::cache_hint}.sem.scope.redOpMinMax.typeMinMax [dstLeId, dstDataOff, dstCounterOff], [src], size, [bar] {, cache_policy};

fabric.try_red.async{.multimem}.src.completion_mechanism1{.level::cache_hint}.sem.scope.redOpAdd.typeAdd [dstLeId, dstDataOff, dstCounterOff], [src], size, [bar] {, cache_policy};

.src = { .shared::cta }
.completion_mechanism0 = { .mbarrier::complete_tx::16B.mbarrier::report::fabric }
.completion_mechanism1 = { .mbarrier::complete_tx::16B.mbarrier::report::fabric.counted::bytes }
.sem = { .relaxed }
.scope = { .sys }
.level::cache_hint = { .L2::cache_hint }
.redOpBit = { .and, .xor, .or }
.typeBit = { .b32, .b64 }
.redOpMinMax = { .min, .max }
.typeMinMax = { .u32, .s32, .u64, .s64, .f16, .bf16 }
.redOpArith = { .add }
.typeArith = { .u32, .u64, .f16, .bf16, .f32, .f64 }
.redOpAdd = { .add }
.typeAdd = { .u32, .u64, .f16, .bf16, .f32, .f64 }
```

## Description

Asynchronously copies `size` bytes from `[src]` to destination fabric handle `[dstLeId, dstDataOff]` with element-wise reduction, where `dstLeId` is a 32-bit unsigned value denoting the logical endpoint identifier, and `dstDataOff` is a 64-bit unsigned value denoting the base offset of the resource to access within the logical endpoint associated with `dstLeId`.

The `size` operand is 32 bits and specifies the number of bytes to be copied. It must be a multiple of 16; otherwise, the behavior is undefined. The source range `[src, src + size - 1]` must be in bounds of the source memory space. The destination range `[dstDataOff, dstDataOff + size - 1]` must be in bounds of the logical endpoint associated with `dstLeId` on the current device.

The source pointer `src` and the destination handle offset `dstDataOff` must be 16-byte aligned.

Each data element in the destination array is reduced with the corresponding data element in the source array using the reduction operation indicated by the `.redOp*` qualifier. The type of each data element in the source and destination arrays is specified by the matching `.type*` qualifier.

If the qualifier `.multimem` is specified, then `dstLeId` must be associated with a multicast logical endpoint such that the device that issued the operation is a member of the multicast endpoint. In the absence of the qualifier, `dstLeId` must be associated with a unicast logical endpoint.

If `.src` is `.shared::cta`, then the source of the copy `[src]` and the barrier `[bar]` refer to the local CTA's shared memory.

The mbarrier object `bar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::16B` specifies that the complete-tx operation is performed on `bar` with completion count equal to the number of bytes copied divided by 16; that is, the count is incremented by 1 for every 16 bytes copied. Note that `fabric.try_get` uses a different completion mechanism in which the complete-tx operation uses a completion count equal to the number of bytes copied. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

If the qualifier `.counted::bytes` is present (`completion_mechanism1` form), then:

- `dstLeId` must be associated with a logical endpoint with counted completion support (see [Counted completion mechanism](README.md#971143-counted-completion-mechanism) for details), and
- the counter offset `dstCounterOff` must be 256-byte aligned,
- the range `[dstCounterOff, dstCounterOff + 7]` is in bounds of the logical endpoint `dstLeId` on the current device, and must not overlap with `[dstDataOff, dstDataOff + size - 1]`, and
- this operation provides counter-based completion for destination data using a 256-byte-aligned 8-byte counter at `[dstLeId, dstCounterOff]`.

Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`.

This instruction accesses the data and the counter at the locations specified by the handle operands through the fabric-proxy, reads from the source `.shared::cta` through the async-proxy, and updates the mbarrier object in `.shared::cta` through the generic-proxy.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access. `cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only and does not change the memory consistency behavior of the program.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

This operation has `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## PTX ISA Notes

Introduced in PTX ISA version 9.3.

Support for `.level::cache_hint` qualifier introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_100` or higher.

## Examples

```ptx
fabric.try_red.async.shared::cta.mbarrier::complete_tx::16B.mbarrier::report::fabric.relaxed.sys.add.u32 [dstLeId, dstLeOffData], [srcSmem], size, [mbar];

fabric.try_red.async.counted::bytes.shared::cta.L2::cache_hint.mbarrier::complete_tx::16B.mbarrier::report::fabric.add.u32 [dstLeId, dstLeOffData, dstLeOffCntr], [srcSmem], size, [mbar], cache_policy;
```

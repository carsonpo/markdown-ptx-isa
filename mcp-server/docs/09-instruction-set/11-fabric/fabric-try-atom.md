# 9.7.11.5.10. Fabric Instructions: fabric.try_atom

**fabric.try_atom**

Asynchronous atomic operation to fabric handle.

## Syntax

```ptx
// Bitwise operations
fabric.try_atom.async.src.completion_mechanism{.level::cache_hint}.sem.sco.redOpBit.typeBit
    [dstLeId, dstDataOff], [smem_dst], [smem_src], [mbar] {, cache_policy};

// Exchange / compare-and-swap
fabric.try_atom.async.src.completion_mechanism{.level::cache_hint}.sem.sco.redOpExchCas.typeExchCas
    [dstLeId, dstDataOff], [smem_dst], [smem_src], [mbar] {, cache_policy};

// Min / max operations
fabric.try_atom.async.src.completion_mechanism{.level::cache_hint}.sem.sco.redOpMinMax.typeMinMax
    [dstLeId, dstDataOff], [smem_dst], [smem_src], [mbar] {, cache_policy};

// Add operation
fabric.try_atom.async.src.completion_mechanism{.level::cache_hint}.sem.sco.redOpAdd.typeAdd
    [dstLeId, dstDataOff], [smem_dst], [smem_src], [mbar] {, cache_policy};

.src                    = { .shared::cta };
.completion_mechanism   = { .mbarrier::complete_tx::16B.mbarrier::report::fabric };
.level::cache_hint      = { .L2::cache_hint };
.sem.sco                = { .relaxed.sys };

.redOpBit               = { .and, .xor, .or };
.typeBit                = { .b32, .b64 };

.redOpExchCas           = { .exch, .cas };
.typeExchCas            = { .b32, .b64, .b128 };

.redOpMinMax            = { .min, .max };
.typeMinMax             = { .u32, .u64, .f16x2, .bf16x2 };

.redOpAdd               = { .add };
.typeAdd                = { .u32, .u64, .f16x2, .bf16x2, .f32, .f64 };
```

## Description

Atomically loads the original value at location `[dstLeId, dstDataOff]` into destination shared memory location `[smem_dst]`, performs a reduction operation with the data at shared memory location `[smem_src]` and the value in location `[dstLeId, dstDataOff]`, and stores the result of the specified operation at location `[dstLeId, dstDataOff]`, overwriting the original value.

For the `.cas` (compare-and-swap) operation, the lower 16 bytes at the location `[smem_src]` is the compare value and the upper 16 bytes at the location `[smem_src]` is the swap value. The operation compares the value at location `[dstLeId, dstDataOff]` with the compare value; if they are equal, it stores swap value at location `[dstLeId, dstDataOff]`, otherwise it leaves the value at location `[dstLeId, dstDataOff]` unchanged.

The operation is performed on 16 bytes. The source range `[smem_src, smem_src + 15]` must be in bounds of the source memory space. For the `.cas` operation, the source range `[smem_src, smem_src + 31]` must be in bounds of the source memory space. The pointers `smem_src` and `smem_dst` must be 16B aligned.

For types `.f16x2`, `.bf16x2`, `.b32`, `.f32`, and `.u32`, `dstDataOff` must be 4B aligned. For types `.b64`, `.f64`, and `.u64`, `dstDataOff` must be 8B aligned. For type `.b128`, `dstDataOff` must be 16B aligned.

The element-wide input and output of the atomic operation are selected as follows. Let `smemOffset` be the distance between `dstDataOff` and its lower 16B alignment boundary (`dstDataOff & 0xF`). The input element is read at `smem_src + smemOffset`, and the output element is written at `smem_dst + smemOffset`. This operation writes unspecified values to the byte ranges `[smem_dst, smem_dst + smemOffset)` and `[smem_dst + smemOffset + elementWidth, smem_dst + 16)`.

If `.src` is `.shared::cta`, then the source of the copy `[smem_src]` and the barrier `[mbar]` refer to the local CTA's shared memory.

The mbarrier object `mbar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::16B` specifies that the complete-tx operation will be performed on `mbar` with completion count equal to the number of bytes copied divided by 16; that is, the count is incremented by 1 for every 16 bytes copied. Note that instructions `fabric.try_get` and `fabric.try_get.async.tensor` use a different completion mechanism in which the complete-tx operation is performed with completion count equal to the number of bytes copied. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access. `cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only and does not change the memory consistency behavior of the program.

This instruction reads and updates the data at the location specified by the handle operands through the fabric-proxy, reads and updates the data at the source `.shared::cta` through the async-proxy, and it updates the mbarrier object in `.shared::cta` through the generic-proxy.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

This operation has `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md). Accesses to the source and destination shared memory are with weak memory-order semantics.

## Semantics

```ptx
atomic {
    [smem_dst] = [dstLeId, dstDataOff];            // copy as the prev value
    if (operation == cas) {                         // smem_src must be 32B aligned
        b = lower16Bytes([smem_src]);               // smem_src value to be compared
        c = upper16Bytes([smem_src]);               // swap value
        [dstLeId, dstDataOff] = cas([dstLeId, dstDataOff], b, c);
    } else {
        [dstLeId, dstDataOff] = operation([dstLeId, dstDataOff], [smem_src]);
    }
}

exch(r, s) = s;
cas(r, s, t) = (r == s) ? t : r;
```

## PTX ISA Notes

Introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_100` or higher.

## Examples

```ptx
fabric.try_atom.async.shared::cta.mbarrier::complete_tx::16B.mbarrier::report::fabric.relaxed.sys.and.b32 [dstLeId, dstLeOffData], [dstSmem], [srcSmem], [mbar];

fabric.try_atom.async.shared::cta.mbarrier::complete_tx::16B.mbarrier::report::fabric.relaxed.sys.add.bf16x2 [dstLeId, dstLeOffData], [dstSmem], [srcSmem], [mbar];

fabric.try_atom.async.shared::cta.L2::cache_hint.mbarrier::complete_tx::16B.mbarrier::report::fabric.relaxed.sys.xor.b64 [dstLeId, dstLeOffData], [dstSmem], [srcSmem], [mbar], mdesc;
```

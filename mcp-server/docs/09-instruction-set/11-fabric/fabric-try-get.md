# 9.7.11.5.1. Fabric Instructions: fabric.try_get

**fabric.try_get**

Asynchronous copy from fabric handle.

## Syntax

```ptx
fabric.try_get.async.dst.completion_mechanism{.level::cache_hint}.sem.scope.b128 [dst], [srcLeId, srcDataOff], size, [bar] {, cache_policy};

.dst = { .shared::cta }
.completion_mechanism = { .mbarrier::complete_tx::bytes.mbarrier::report::fabric }
.sem = { .relaxed }
.scope = { .sys }
.level::cache_hint = { .L2::cache_hint }
```

## Description

Asynchronously copies `size` bytes from fabric handle `[srcLeId, srcDataOff]` to destination memory `[dst]`, where `srcLeId` is a 32-bit unsigned value denoting the logical endpoint identifier, and `srcDataOff` is a 64-bit unsigned value denoting the base offset of the resource to access within the logical endpoint associated with `srcLeId`.

The logical endpoint associated with `srcLeId` must be a unicast logical endpoint.

The `size` operand is 32 bits and specifies the number of bytes to be copied. It must be a multiple of 16; otherwise, the behavior is undefined. The range `[dst, dst + size - 1]` must be in bounds of the destination memory space. The range `[srcDataOff, srcDataOff + size - 1]` must be in bounds of the logical endpoint resources associated with `srcLeId`.

The source handle offset `srcDataOff` and destination pointer `dst` must be 16-byte aligned.

If `.dst` is `.shared::cta`, then:

- The destination of the copy `[dst]` and the barrier `[bar]` must refer to the local CTA's shared memory; otherwise, the behavior is undefined.
- The completion mechanism must be `.mbarrier::complete_tx::bytes.mbarrier::report::fabric`.

The mbarrier object `bar` must be initialized with `.layout::v1` (see [Layouts of the mbarrier object](../15-parallel-sync-communication/mbarrier/README.md)). Qualifier `.mbarrier::complete_tx::bytes` specifies that the operation completes by performing a complete-tx operation with the total number of bytes copied (`size`) on mbarrier object at the location specified by the address operand `bar`. Refer to [Fabric Reporting Mechanism](README.md#971141-fabric-reporting-mechanism) for the description of `.mbarrier::report::fabric`. For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances.

This instruction reads the data at the location specified by the handle operand through the fabric-proxy, copies it to the destination `.shared::cta` memory through the async-proxy, and updates the mbarrier object in `.shared::cta` through the generic-proxy.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access. `cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only and does not change the memory consistency behavior of the program.

The completion of this operation may be observed by waiting at the barrier via CTA-scope operations. Threads must submit fabric operations and wait for their completion before grid exit; otherwise, the behavior is undefined.

Accesses to a source handle are 128-bit-wide atomic with `.relaxed.sys` memory-order semantics as described in the [Memory Consistency Model](../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

## PTX ISA Notes

Introduced in PTX ISA version 9.3.

Support for `.level::cache_hint` qualifier introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_100` or higher.

## Examples

```ptx
fabric.try_get.async.shared::cta.mbarrier::complete_tx::bytes.mbarrier::report::fabric.relaxed.sys.b128 [dstSmem], [srcLeId, srcLeOff], 0x100, [mbar];

fabric.try_get.async.shared::cta.relaxed.sys.L2::cache_hint.mbarrier::complete_tx::bytes.mbarrier::report::fabric.b128 [dstSmem], [srcLeId, srcLeOff], sizeBytes, [mbar], cachePolicy;
```

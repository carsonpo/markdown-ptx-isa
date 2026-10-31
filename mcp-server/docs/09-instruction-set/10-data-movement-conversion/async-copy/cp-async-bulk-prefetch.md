# 9.7.10.28.4.3. Data Movement and Conversion Instructions: cp.async.bulk.prefetch

**cp.async.bulk.prefetch**

Provides a hint to the system to initiate the asynchronous prefetch of data to the cache.

## Syntax

```ptx
cp.async.bulk.prefetch.L2.src{.level::cache_hint}         [srcMem], size {, cache_policy};
cp.async.bulk.prefetch.L2.src{.level::eviction_priority}  [srcMem], size;

.src =                { .global }
.level::cache_hint =  { .L2::cache_hint }
.level::eviction_priority = { .L2::evict_last }
```

## Description

`cp.async.bulk.prefetch` is a non-blocking instruction which may initiate an asynchronous prefetch of data from the location specified by source address operand `srcMem`, in `.src` statespace, to the L2 cache.

The 32-bit operand `size` specifies the amount of memory to be prefetched in terms of number of bytes. `size` must be a multiple of 16. If the value is not a multiple of 16, then the behavior is undefined. The address `srcMem` must be aligned to 16 bytes.

When the optional argument `cache_policy` is specified, the qualifier `.level::cache_hint` is required. The 64-bit operand `cache_policy` specifies the cache eviction policy that may be used during the memory access.

`cache_policy` is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

`cp.async.bulk.prefetch` is treated as a weak memory operation in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

Qualifier `.level::eviction_priority` specifies the eviction priority to be applied for the prefetched cache line.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

Support for `.level::eviction_priority` qualifier introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_90` or higher.

Qualifier `.level::eviction_priority` is supported on the following family-specific architectures:

- `sm_107f` or higher in the same family

## Examples

```ptx
cp.async.bulk.prefetch.L2.global                 [srcMem], size;

cp.async.bulk.prefetch.L2.global.L2::cache_hint  [srcMem], size, policy;

cp.async.bulk.prefetch.L2.global.L2::evict_last  [srcMem], size;
```

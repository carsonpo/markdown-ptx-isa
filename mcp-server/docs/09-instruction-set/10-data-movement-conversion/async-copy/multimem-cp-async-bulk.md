# 9.7.10.28.4.4. Data Movement and Conversion Instructions: multimem.cp.async.bulk

**multimem.cp.async.bulk**

Initiates an asynchronous copy operation to a multimem address range.

## Syntax

```ptx
multimem.cp.async.bulk{.sem}.dst.src.completion_mechanism{.cp_mask}
    [dstMem], [srcMem], size{, byteMask};

    .sem                  = { .weak }
    .dst                  = { .global }
    .src                  = { .shared::cta }
    .completion_mechanism = { .bulk_group }

multimem.cp.async.bulk.sem.scope.dst.src.completion_mechanism{.cp_mask}.type
    [dstMem], [srcMem], size{, byteMask};

    .sem                  = { .relaxed }
    .scope                = { .cta, .cluster, .gpu, .sys }
    .dst                  = { .global }
    .src                  = { .shared::cta }
    .completion_mechanism = { .bulk_group }
    .type                 = { .b128 }
```

## Description

Instruction `multimem.cp.async.bulk` initiates an asynchronous bulk-copy operation from source address range `[srcMem, srcMem + size)` to memory locations residing on each GPU's memory referred to by the destination multimem address range `[dstMem, dstMem + size)`. The direction of bulk-copy is from the state space specified by the `.src` modifier to the state space specified by the `.dst` modifiers.

The 32-bit operand `size` specifies the amount of memory to be copied, in terms of number of bytes. Operand `size` must be a multiple of 16. The memory range `[dstMem, dstMem + size)` must not overflow the destination multimem memory space. The memory range `[srcMem, srcMem + size)` must not overflow the source memory space. The addresses `dstMem` and `srcMem` must be aligned to 16 bytes. If any of these pre-conditions is not met, the behavior is undefined.

The modifier `.completion_mechanism` specifies the completion mechanism that is supported by the instruction. The modifier `.bulk_group` specifies that the `multimem.cp.async.bulk` instruction uses bulk async-group based completion mechanism.

When the optional modifier `.cp_mask` is specified, the argument `byteMask` is required. The i-th bit in the 16-bit wide `byteMask` operand specifies whether the i-th byte of each 16-byte wide chunk of source data is copied to the destination. If the bit is set, the byte is copied.

The optional `.sem` qualifier specifies the memory ordering semantics as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

- When `.sem` is not specified, it defaults to `.weak`.
- When `.sem` is `.weak`, the data copy operation accesses memory with weak memory operations.
- When `.sem` is `.relaxed`, the data copy accesses memory with naturally-aligned strong memory operations with element-wise atomic size specified by `.type` and thread scope specified by `.scope`.

## PTX ISA Notes

Introduced in PTX ISA version 9.1.

Support for `.weak` and `.relaxed` semantics, `.scope` and `.type` qualifiers are introduced in PTX ISA version 9.3.

## Target ISA Notes

Requires `sm_90` or higher.

Support for `.cp_mask` qualifier requires `sm_100` or higher.

Qualifiers `.weak`, `.relaxed`, `.scope` and `.type` supported on following architectures:

- `sm_90a`
- `sm_100f` or higher in the same family
- `sm_110f` or higher in the same family

## Examples

```ptx
multimem.cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], size;

multimem.cp.async.bulk.global.shared::cta.bulk_group [dstMem], [srcMem], 512;

multimem.cp.async.bulk.global.shared::cta.bulk_group.cp_mask [dstMem], [srcMem], size, byteMask;

multimem.cp.async.bulk.relaxed.cta.global.bulk_group.b128 [dstMem], [srcMem], size;
```

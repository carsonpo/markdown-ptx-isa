# 9.7.15.16.13. Parallel Synchronization and Communication Instructions: mbarrier.inval

**mbarrier.inval**

Invalidates the mbarrier object.

## Syntax

```ptx
mbarrier.inval{.shared{::cta}}.b64 [addr];
```

## Description

`mbarrier.inval` invalidates the mbarrier object at the location specified by the address operand `addr`. The invalidation is supported for all layouts described in [Layouts of the mbarrier object](README.md#9715162-layouts-of-the-mbarrier-object).

An mbarrier object must be invalidated before using its memory location for any other purpose.

Performing any mbarrier operation except `mbarrier.init` on a memory location that does not contain a valid mbarrier object, results in undefined behaviour.

If no state space is specified then [Generic Addressing](../../../06-instruction-operands.md) is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand `addr` is as described in [Addresses as Operands](../../../06-instruction-operands.md). Alignment for operand `addr` is as described in the [Size and alignment of mbarrier object](README.md#9715161-size-and-alignment-of-mbarrier-object).

## PTX ISA Notes

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

## Target ISA Notes

Requires `sm_80` or higher.

## Examples

```ptx
.shared .b64 shmem;
.reg    .b64 addr;
.reg    .b32 %r1;
.reg    .pred t0;

// Example 1 :
bar.sync                      0;
@t0 mbarrier.init.b64     [addr], %r1;
// ... other mbarrier operations on addr
bar.sync                      0;
@t0 mbarrier.inval.b64    [addr];


// Example 2 :
bar.cta.sync                  0;
mbarrier.init.shared.b64           [shmem], 12;
// ... other mbarrier operations on shmem
bar.cta.sync                  0;
@t0 mbarrier.inval.shared.b64      [shmem];

// shmem can be reused here for unrelated use :
bar.cta.sync                  0;
st.shared.b64                      [shmem], ...;

// shmem can be re-initialized as mbarrier object :
bar.cta.sync                  0;
@t0 mbarrier.init.shared.b64       [shmem], 24;
// ... other mbarrier operations on shmem
bar.cta.sync                  0;
@t0 mbarrier.inval.shared::cta.b64 [shmem];
```

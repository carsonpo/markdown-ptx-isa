# 9.7.15.16.21. Parallel Synchronization and Communication Instructions: mbarrier.check_layout

**mbarrier.check_layout**

Check the layout of the mbarrier object.

## Syntax

```ptx
mbarrier.check_layout.layout{.ss}.b64 p, [addr];

.layout = { .layout::v0, .layout::v1 }
.ss = { .shared::cta }
```

## Description

The layout of the opaque mbarrier object can be queried using `mbarrier.check_layout`.

The address operand `addr` specifies the memory location of the mbarrier object whose layout is being inspected. The instruction sets the predicate operand `p` to True if the layout of the mbarrier object exactly matches the `.layout` qualifier. Refer [Layouts of the mbarrier object](README.md) for more details.

If no state space is specified then Generic Addressing is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

## PTX ISA Notes

Introduced in PTX ISA version 9.3.

## Target ISA Notes

Requires `sm_90` or higher.

## Examples

```ptx
.reg    .pred p;
.shared .b64  shMem;

mbarrier.check_layout.layout::v1.shared::cta.b64 p, [shMem];
@!p bra exit
// ... mbarrier operations on shMem

exit: ret;
```

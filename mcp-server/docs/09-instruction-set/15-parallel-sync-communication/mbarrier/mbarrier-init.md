# 9.7.15.16.12. Parallel Synchronization and Communication Instructions: mbarrier.init

**mbarrier.init**

Initialize the mbarrier object.

## Syntax

```ptx
mbarrier.init{.layout}{.shared{::cta}}.b64 [addr], count;

.layout = { .layout::v0, .layout::v1 }
```

## Description

`mbarrier.init` initializes the mbarrier object at the location specified by the address operand `addr` with the unsigned 32-bit integer `count`. The `.layout` qualifier specifies the layout that is used to initialize the mbarrier object. If not specified explicitly, a `.layout::v0` mbarrier is initialized. Refer [Layouts of the mbarrier object](README.md#9715162-layouts-of-the-mbarrier-object) for more details.

The valid range of values for the operand `count` varies depending upon `.layout` as specified below:

- [1, …, 2^20 - 1] for mbarrier with `.layout::v0`
- [1, …, 2^9 - 1] for mbarrier with `.layout::v1`

The constituents of the mbarrier object are initialized as follows:

- The primary and conditional phases are initialized to zero.
- The expected arrival and pending arrival counts are initialized to `count`.
- The initial transaction count tx-count is initialized to zero.
- For an mbarrier object with `.layout::v1`, the payload report corresponding to the primary phase is initialized to zero.

If no state space is specified then [Generic Addressing](../../../06-instruction-operands.md) is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand `addr` is as described in [Addresses as Operands](../../../06-instruction-operands.md). Alignment for operand `addr` is as described in the [Size and alignment of mbarrier object](README.md#9715161-size-and-alignment-of-mbarrier-object).

The behavior of performing an `mbarrier.init` operation on a memory location containing a valid mbarrier object is undefined; invalidate the mbarrier object using `mbarrier.inval` first, before repurposing the memory location for any other purpose, including another mbarrier object.

## PTX ISA Notes

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

Support for `.layout` qualifier introduced in PTX ISA version 9.3.

## Target ISA Notes

Requires `sm_80` or higher.

Qualifier `.layout` requires `sm_90` or higher.

## Examples

```ptx
.shared .b64 shMem, shMem2, shMem3;
.reg    .b64 addr;
.reg    .b32 %r1;

cvta.shared.u64          addr, shMem2;
mbarrier.init.b64        [addr],   %r1;
bar.cta.sync             0;
// ... other mbarrier operations on addr

mbarrier.init.shared::cta.b64 [shMem], 12;
mbarrier.init.layout::v1.shared::cta.b64 [shMem3], 4;
bar.sync                 0;
// ... other mbarrier operations on shMem
// ... other mbarrier operations on shMem3
```

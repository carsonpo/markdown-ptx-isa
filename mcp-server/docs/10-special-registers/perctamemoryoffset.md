# 10.34. Special Registers: %perctamemoryoffset

**%perctamemoryoffset**

Per-CTA global memory base offset for the current CTA.

## Syntax (predefined)

```ptx
.sreg .u64 %perctamemoryoffset;
```

## Description

A predefined, read-only 64-bit special register. Returns the 64-bit address of the current CTA's memory slice from the per-CTA global memory region.

Usage of this special register is valid only inside entry functions that also specify directive [`.minperctamemory`](../11-directives/04-performance-tuning/minperctamemory.md).

## PTX ISA Notes

Introduced in PTX ISA version 9.4.

## Target ISA Notes

Requires `sm_80` or higher.

## Examples

```ptx
mov.u64  %rd0, %perctamemoryoffset;
```

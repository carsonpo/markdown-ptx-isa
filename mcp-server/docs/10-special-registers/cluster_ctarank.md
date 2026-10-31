# 10.16. Special Registers: %cluster_ctarank

**%cluster_ctarank**

CTA identifier in a cluster across all dimensions.

## Syntax (predefined)

```ptx
.sreg .u32 %cluster_ctarank;
```

## Description

A predefined, read-only special register initialized with the CTA rank within a cluster across all dimensions.

It is guaranteed that:

```ptx
0  <=  %cluster_ctarank <  %cluster_nctarank
```

## PTX ISA Notes

Introduced in PTX ISA version 7.8.

## Target ISA Notes

Requires `sm_90` or higher.

## Examples

```ptx
.reg .b32 %r;

mov.u32  %r, %cluster_ctarank;
```

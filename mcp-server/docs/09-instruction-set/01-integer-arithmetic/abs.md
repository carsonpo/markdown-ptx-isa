# 9.7.1.11. Integer Arithmetic Instructions: abs

**abs**

Absolute value.

## Syntax

```ptx
abs.type  d, a;

.type = { .s16, .s32, .s64 };
```

## Description

Take the absolute value of `a` and store it in `d`.

## Semantics

```ptx
d = |a|;
```

## Notes

Only for signed integers.

## PTX ISA Notes

Introduced in PTX ISA version 1.0.

## Target ISA Notes

Supported on all target architectures.

## Examples

```ptx
abs.s32  r0,a;
```

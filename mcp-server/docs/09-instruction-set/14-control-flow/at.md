# 9.7.14.2. Control Flow Instructions: @

**@**

Predicated execution.

## Syntax

```ptx
@{!}p    instruction;
```

## Description

Execute an instruction or instruction block for threads that have the guard predicate True. Threads with a False guard predicate do nothing.

## Semantics

```ptx
If {!}p then instruction
```

## PTX ISA Notes

Introduced in PTX ISA version 1.0.

## Target ISA Notes

Supported on all target architectures.

## Examples

```ptx
    setp.eq.f32  p,y,0;     // is y zero?
@!p div.f32      ratio,x,y  // avoid division by zero

@q  bra L23;                // conditional branch
```

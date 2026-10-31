# 9.7.11.5.6. Fabric Instructions: fabric.wait

**fabric.wait**

Wait on local shared-memory reads of submitted fabric operations.

## Syntax

```ptx
fabric.wait.sync_restrict::reads;
```

## Description

Fabric-read completion mechanism instruction `fabric.wait` waits on the local shared memory (`.shared::cta`) reads of submitted fabric operations. This enables overwriting the shared memory read by these operations before they complete.

## PTX ISA Notes

Introduced in PTX ISA version 9.3.

## Target ISA Notes

Requires `sm_100` or higher.

## Examples

```ptx
fabric.wait.sync_restrict::reads;
```

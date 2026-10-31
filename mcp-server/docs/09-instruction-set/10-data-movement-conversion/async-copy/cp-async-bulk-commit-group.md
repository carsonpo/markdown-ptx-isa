# 9.7.10.28.6. Data Movement and Conversion Instructions: Bulk and Tensor copy completion instructions

## 9.7.10.28.6.1. Data Movement and Conversion Instructions: cp.async.bulk.commit_group

**cp.async.bulk.commit_group**

Commits all prior initiated but uncommitted `cp.async.bulk` instructions into a cp.async.bulk-group.

### Syntax

```ptx
cp.async.bulk.commit_group;
```

### Description

`cp.async.bulk.commit_group` instruction creates a new per-thread bulk async-group and batches all prior `cp{.reduce}.async.bulk{.prefetch}{.tensor}`/`applypriority.async.bulk{.tensor}` instructions satisfying the following conditions into the new bulk async-group:

- The prior `cp{.reduce}.async.bulk{.prefetch}{.tensor}`/`applypriority.async.bulk{.tensor}` instructions use `bulk_group` based completion mechanism, and
- They are initiated by the executing thread but not committed to any bulk async-group.

If there are no uncommitted `cp{.reduce}.async.bulk{.prefetch}{.tensor}`/`applypriority.async.bulk{.tensor}` instructions then `cp.async.bulk.commit_group` results in an empty bulk async-group.

An executing thread can wait for the completion of all `cp{.reduce}.async.bulk{.prefetch}{.tensor}`/`applypriority.async.bulk{.tensor}` operations in a bulk async-group using [`cp.async.bulk.wait_group`](cp-async-bulk-wait-group.md).

There is no memory ordering guarantee provided between any two `cp{.reduce}.async.bulk{.prefetch}{.tensor}`/`applypriority.async.bulk{.tensor}` operations within the same bulk async-group.

### PTX ISA Notes

Introduced in PTX ISA version 8.0.

### Target ISA Notes

Requires `sm_90` or higher.

### Examples

```ptx
cp.async.bulk.commit_group;
```

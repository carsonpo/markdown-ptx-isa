# 9.7.10.28.6.2. Data Movement and Conversion Instructions: cp.async.bulk.wait_group

**cp.async.bulk.wait_group**

Wait for completion of bulk async-groups.

## Syntax

```ptx
cp.async.bulk.wait_group{.read} N;
```

## Description

`cp.async.bulk.wait_group` instruction will cause the executing thread to wait until only `N` or fewer of the most recent bulk async-groups are pending and all the prior bulk async-groups committed by the executing threads are complete. For example, when `N` is 0, the executing thread waits on all the prior bulk async-groups to complete. Operand `N` is an integer constant.

By default, `cp.async.bulk.wait_group` instruction will cause the executing thread to wait until completion of all the bulk async operations in the specified bulk async-group. A bulk async operation includes the following:

- Optionally, reading from the tensormap.
- Reading from the source locations.
- Writing to their respective destination locations.
- Writes being made visible to the executing thread.

The optional `.read` modifier indicates that the waiting has to be done until all the bulk async operations in the specified bulk async-group have completed:

- reading from the tensormap
- the reading from their source locations.

## PTX ISA Notes

Introduced in PTX ISA version 8.0.

## Target ISA Notes

Requires `sm_90` or higher.

## Examples

```ptx
cp.async.bulk.wait_group.read   0;
cp.async.bulk.wait_group        2;
```

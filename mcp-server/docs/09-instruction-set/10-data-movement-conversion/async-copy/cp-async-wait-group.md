# 9.7.10.28.3.3. Data Movement and Conversion Instructions: cp.async.wait_group / cp.async.wait_all

**cp.async.wait_group, cp.async.wait_all**

Wait for completion of prior asynchronous copy operations.

## Syntax

```ptx
cp.async.wait_group N;
cp.async.wait_all ;
```

## Description

`cp.async.wait_group` instruction will cause executing thread to wait till only `N` or fewer of the most recent cp.async-groups are pending and all the prior cp.async-groups committed by the executing threads are complete. For example, when `N` is 0, the executing thread waits on all the prior cp.async-groups to complete. Operand `N` is an integer constant.

`cp.async.wait_all` is equivalent to :

```ptx
cp.async.commit_group;
cp.async.wait_group 0;
```

An empty cp.async-group is considered to be trivially complete.

Writes performed by `cp.async` operations are made visible to the executing thread only after:

- The completion of `cp.async.wait_all` or
- The completion of `cp.async.wait_group` on the cp.async-group in which the `cp.async` belongs to or
- `mbarrier.test_wait` and `mbarrier.try_wait` returns `True` on an mbarrier object which is tracking the completion of the `cp.async` operation.

There is no ordering between two `cp.async` operations that are not synchronized with `cp.async.wait_all` or `cp.async.wait_group` or mbarrier objects.

`cp.async.wait_group` and `cp.async.wait_all` does not provide any ordering and visibility guarantees for any other memory operation apart from `cp.async`.

## PTX ISA Notes

Introduced in PTX ISA version 7.0.

## Target ISA Notes

Requires `sm_80` or higher.

## Examples

```ptx
// Example of .wait_all:
cp.async.ca.shared.global [shrd1], [gbl1], 4;
cp.async.cg.shared.global [shrd2], [gbl2], 16;
cp.async.wait_all;  // waits for all prior cp.async to complete

// Example of .wait_group :
cp.async.ca.shared.global [shrd3], [gbl3], 8;
cp.async.commit_group;  // End of group 1

cp.async.cg.shared.global [shrd4], [gbl4], 16;
cp.async.commit_group;  // End of group 2

cp.async.cg.shared.global [shrd5], [gbl5], 16;
cp.async.commit_group;  // End of group 3

cp.async.wait_group 1;  // waits for group 1 and group 2 to complete
```

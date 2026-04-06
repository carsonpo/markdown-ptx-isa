## 9.7.13.8. Parallel Synchronization and Communication Instructions: vote (deprecated)

### vote (deprecated)

Vote across thread group.

**Syntax**

```
vote.mode.pred  d, {!}a;
vote.ballot.b32 d, {!}a;  // 'ballot' form, returns bitmask

.mode = { .all, .any, .uni };
```

**Deprecation Note**

The vote instruction without a `.sync` qualifier is deprecated in PTX ISA version 6.0.

Support for this instruction with `.target` lower than sm_70 may be removed in a future PTX ISA version.

**Removal Note**

Support for vote instruction without a `.sync` qualifier is removed in PTX ISA version 6.4 for `.target` sm_70 or higher.

**Description**

Performs a reduction of the source predicate across all active threads in a warp. The destination predicate value is the same across all threads in the warp.

The reduction modes are:

`.all`: True if source predicate is True for all active threads in warp. Negate the source predicate to compute `.none`.

`.any`: True if source predicate is True for some active thread in warp. Negate the source predicate to compute `.not_all`.

`.uni`: True if source predicate has the same value in all active threads in warp. Negating the source predicate also computes `.uni`.

In the ballot form, `vote.ballot.b32` simply copies the predicate from each thread in a warp into the corresponding bit position of destination register d, where the bit position corresponds to the thread's lane id.

An inactive thread in warp will contribute a 0 for its entry when participating in `vote.ballot.b32`.

**PTX ISA Notes**

Introduced in PTX ISA version 1.2.

Deprecated in PTX ISA version 6.0 in favor of `vote.sync`.

Not supported in PTX ISA version 6.4 for `.target` sm_70 or higher.

**Target ISA Notes**

`vote` requires sm_12 or higher.

`vote.ballot.b32` requires sm_20 or higher.

`vote` is not supported on sm_70 or higher starting PTX ISA version 6.4.

**Release Notes**

Note that vote applies to threads in a single warp, not across an entire CTA.

**Examples**

```ptx
vote.all.pred    p,q;
vote.uni.pred    p,q;
vote.ballot.b32  r1,p;  // get 'ballot' across warp
```

## 9.7.13.9. Parallel Synchronization and Communication Instructions: vote.sync

### vote.sync

Vote across thread group.

**Syntax**

```
vote.sync.mode.pred  d, {!}a, membermask;
vote.sync.ballot.b32 d, {!}a, membermask;  // 'ballot' form, returns bitmask

.mode = { .all, .any, .uni };
```

**Description**

`vote.sync` will cause executing thread to wait until all non-exited threads corresponding to membermask have executed `vote.sync` with the same qualifiers and same membermask value before resuming execution.

Operand membermask specifies a 32-bit integer which is a mask indicating threads participating in this instruction where the bit position corresponds to thread's laneid. Operand a is a predicate register.

In the mode form, `vote.sync` performs a reduction of the source predicate across all non-exited threads in membermask. The destination operand d is a predicate register and its value is the same across all threads in membermask.

The reduction modes are:

`.all`: True if source predicate is True for all non-exited threads in membermask. Negate the source predicate to compute `.none`.

`.any`: True if source predicate is True for some thread in membermask. Negate the source predicate to compute `.not_all`.

`.uni`: True if source predicate has the same value in all non-exited threads in membermask. Negating the source predicate also computes `.uni`.

In the ballot form, the destination operand d is a `.b32` register. In this form, `vote.sync.ballot.b32` simply copies the predicate from each thread in membermask into the corresponding bit position of destination register d, where the bit position corresponds to the thread's lane id.

A thread not specified in membermask will contribute a 0 for its entry in `vote.sync.ballot.b32`.

The behavior of `vote.sync` is undefined if the executing thread is not in the membermask.

**Note**

For `.target sm_6x` or below, all threads in membermask must execute the same `vote.sync` instruction in convergence, and only threads belonging to some membermask can be active when the `vote.sync` instruction is executed. Otherwise, the behavior is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 6.0.

**Target ISA Notes**

Requires sm_30 or higher.

**Examples**

```ptx
vote.sync.all.pred    p,q,0xffffffff;
vote.sync.ballot.b32  r1,p,0xffffffff;  // get 'ballot' across warp
```

## 9.7.13.10. Parallel Synchronization and Communication Instructions: match.sync

### match.sync

Broadcast and compare a value across threads in warp.

**Syntax**

```
match.any.sync.type  d, a, membermask;
match.all.sync.type  d[|p], a, membermask;

.type = { .b32, .b64 };
```

**Description**

`match.sync` will cause executing thread to wait until all non-exited threads from membermask have executed `match.sync` with the same qualifiers and same membermask value before resuming execution.

Operand membermask specifies a 32-bit integer which is a mask indicating threads participating in this instruction where the bit position corresponds to thread's laneid.

`match.sync` performs broadcast and compare of operand a across all non-exited threads in membermask and sets destination d and optional predicate p based on mode.

Operand a has instruction type and d has `.b32` type.

Destination d is a 32-bit mask where bit position in mask corresponds to thread's laneid.

The matching operation modes are:

`.all`: d is set to mask corresponding to non-exited threads in membermask if all non-exited threads in membermask have same value of operand a; otherwise d is set to 0. Optionally predicate p is set to true if all non-exited threads in membermask have same value of operand a; otherwise p is set to false. The sink symbol `_` may be used in place of any one of the destination operands.

`.any`: d is set to mask of non-exited threads in membermask that have same value of operand a.

The behavior of `match.sync` is undefined if the executing thread is not in the membermask.

**PTX ISA Notes**

Introduced in PTX ISA version 6.0.

**Target ISA Notes**

Requires sm_70 or higher.

**Release Notes**

Note that `match.sync` applies to threads in a single warp, not across an entire CTA.

**Examples**

```ptx
match.any.sync.b32    d, a, 0xffffffff;
match.all.sync.b64    d|p, a, mask;
```

## 9.7.13.11. Parallel Synchronization and Communication Instructions: activemask

### activemask

Queries the active threads within a warp.

**Syntax**

```
activemask.b32 d;
```

**Description**

`activemask` queries predicated-on active threads from the executing warp and sets the destination d with 32-bit integer mask where bit position in the mask corresponds to the thread's laneid.

Destination d is a 32-bit destination register.

An active thread will contribute 1 for its entry in the result and exited or inactive or predicated-off thread will contribute 0 for its entry in the result.

**PTX ISA Notes**

Introduced in PTX ISA version 6.2.

**Target ISA Notes**

Requires sm_30 or higher.

**Examples**

```ptx
activemask.b32  %r1;
```

## 9.7.13.12. Parallel Synchronization and Communication Instructions: redux.sync

### redux.sync

Perform reduction operation on the data from each predicated active thread in the thread group.

**Syntax**

```
redux.sync.op.type dst, src, membermask;
.op   = {.add, .min, .max}
.type = {.u32, .s32}

redux.sync.op.b32 dst, src, membermask;
.op   = {.and, .or, .xor}

redux.sync.op{.abs.}{.NaN}.f32 dst, src, membermask;
.op   = { .min, .max }
```

**Description**

`redux.sync` will cause the executing thread to wait until all non-exited threads corresponding to membermask have executed `redux.sync` with the same qualifiers and same membermask value before resuming execution.

Operand membermask specifies a 32-bit integer which is a mask indicating threads participating in this instruction where the bit position corresponds to thread's laneid.

`redux.sync` performs a reduction operation `.op` of the 32 bit source register src across all non-exited threads in the membermask. The result of the reduction operation is written to the 32 bit destination register dst.

Reduction operation can be one of the bitwise operation in `.and`, `.or`, `.xor` or arithmetic operation in `.add`, `.min`, `.max`.

For the `.add` operation result is truncated to 32 bits.

For `.f32` instruction type, if the input value is 0.0 then +0.0 > -0.0.

If `.abs` qualifier is specified, then the absolute value of the input is considered for the reduction operation.

If the `.NaN` qualifier is specified, then the result of the reduction operation is canonical NaN if the input to the reduction operation from any participating thread is NaN.

In the absence of `.NaN` qualifier, only non-NaN values are considered for the reduction operation and the result will be canonical NaN when all inputs are NaNs.

The behavior of `redux.sync` is undefined if the executing thread is not in the membermask.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for `.f32` type is introduced in PTX ISA version 8.6.

Support for `.abs` and `.NaN` qualifiers is introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_80 or higher.

`.f32` type requires sm_100a and is supported on sm_100f from PTX ISA version 8.8.

Qualifiers `.abs` and `.NaN` require sm_100a and are supported on sm_100f or higher in the same family from PTX ISA version 8.8.

**Release Notes**

Note that `redux.sync` applies to threads in a single warp, not across an entire CTA.

**Examples**

```ptx
.reg .b32 dst, src, init, mask;
redux.sync.add.s32 dst, src, 0xff;
redux.sync.xor.b32 dst, src, mask;

redux.sync.min.abs.NaN.f32 dst, src, mask;
```

## 9.7.13.13. Parallel Synchronization and Communication Instructions: griddepcontrol

### griddepcontrol

Control execution of dependent grids.

**Syntax**

```
griddepcontrol.action;

.action   = { .launch_dependents, .wait }
```

**Description**

The `griddepcontrol` instruction allows the dependent grids and prerequisite grids as defined by the runtime, to control execution in the following way:

`.launch_dependents` modifier signals that specific dependents the runtime system designated to react to this instruction can be scheduled as soon as all other CTAs in the grid issue the same instruction or have completed. The dependent may launch before the completion of the current grid. There is no guarantee that the dependent will launch before the completion of the current grid. Repeated invocations of this instruction by threads in the current CTA will have no additional side effects past that of the first invocation. A release fence preceding a `griddepcontrol.launch_dependents` in program-order synchronizes with the start of a dependent grid if either both grids have the same memory synchronization domain and the fence scope is gpu, or if the fence scope is sys.

`.wait` modifier causes the executing thread to wait until all prerequisite grids in flight have completed and all the memory operations from the prerequisite grids are performed and made visible to the current grid.

**Note**

If the prerequisite grid is using `griddepcontrol.launch_dependents`, then the dependent grid must use `griddepcontrol.wait` to ensure correct functional execution.

**PTX ISA Notes**

Introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
griddepcontrol.launch_dependents;
griddepcontrol.wait;
```

## 9.7.13.14. Parallel Synchronization and Communication Instructions: elect.sync

### elect.sync

Elect a leader thread from a set of threads.

**Syntax**

```
elect.sync d|p, membermask;
```

**Description**

`elect.sync` elects one predicated active leader thread from among a set of threads specified by membermask. laneid of the elected thread is returned in the 32-bit destination operand d. The sink symbol `_` can be used for destination operand d. The predicate destination p is set to True for the leader thread, and False for all other threads.

Operand membermask specifies a 32-bit integer indicating the set of threads from which a leader is to be elected. The behavior is undefined if the executing thread is not in membermask.

Election of a leader thread happens deterministically, i.e. the same leader thread is elected for the same membermask every time.

The mandatory `.sync` qualifier indicates that `elect` causes the executing thread to wait until all threads in the membermask execute the `elect` instruction before resuming execution.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
elect.sync    %r0|%p0, 0xffffffff;
```


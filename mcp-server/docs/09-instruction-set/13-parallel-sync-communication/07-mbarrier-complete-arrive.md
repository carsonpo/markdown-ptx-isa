### 9.7.13.15.13. Parallel Synchronization and Communication Instructions: mbarrier.arrive

#### mbarrier.arrive

Performs arrive-on operation on the mbarrier object.

**Syntax**

```
mbarrier.arrive{.sem.scope}{.shared{::cta}}.b64           state, [addr]{, count};
mbarrier.arrive{.sem.scope}{.shared::cluster}.b64         _, [addr] {,count}
mbarrier.arrive.expect_tx{.sem.scope}{.shared{::cta}}.b64 state, [addr], txCount;
mbarrier.arrive.expect_tx{.sem.scope}{.shared::cluster}.b64   _, [addr], txCount;
mbarrier.arrive.noComplete{.release.cta}{.shared{::cta}}.b64  state, [addr], count;

.sem   = { .release, .relaxed }
.scope = { .cta, .cluster }
```

**Description**

A thread executing `mbarrier.arrive` performs an arrive-on operation on the mbarrier object at the location specified by the address operand addr. The 32-bit unsigned integer operand count specifies the count argument to the arrive-on operation.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand addr is as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

The optional qualifier `.expect_tx` specifies that an expect-tx operation is performed prior to the arrive-on operation. The 32-bit unsigned integer operand txCount specifies the expectCount argument to the expect-tx operation. When both qualifiers `.arrive` and `.expect_tx` are specified, then the count argument of the arrive-on operation is assumed to be 1.

A `mbarrier.arrive` operation with `.noComplete` qualifier must not cause the mbarrier to complete its current phase, otherwise the behavior is undefined.

The value of the operand count must be in the range as specified in Contents of the mbarrier object.

Note: for sm_8x, when the argument count is specified, the modifier `.noComplete` is required.

`mbarrier.arrive` operation on an mbarrier object located in `.shared::cta` returns an opaque 64-bit register capturing the phase of the mbarrier object prior to the arrive-on operation in the destination operand state. Contents of the state operand are implementation specific. Optionally, sink symbol `_` can be used for the state argument.

`mbarrier.arrive` operation on an mbarrier object located in `.shared::cluster` but not in `.shared::cta` cannot return a value. Sink symbol `_` is mandatory for the destination operand for such cases.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the Memory Consistency Model. If the `.sem` qualifier is absent, `.release` is assumed by default.

The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that directly observe the memory synchronizing effect of this operation, as described in the Memory Consistency Model. If the `.scope` qualifier is not specified then it defaults to `.cta`. In contrast, the `.shared::<scope>` indicates the state space where the mbarrier resides.

Qualifiers `.sem` and `.scope` must be specified together.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for sink symbol `_` as the destination operand is introduced in PTX ISA version 7.1.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

Support for count argument without the modifier `.noComplete` introduced in PTX ISA version 7.8.

Support for sub-qualifier `::cluster` introduced in PTX ISA version 8.0.

Support for qualifier `.expect_tx` is introduced in PTX ISA version 8.0.

Support for `.scope` and `.sem` qualifiers introduced in PTX ISA version 8.0.

Support for `.relaxed` qualifier introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_80 or higher.

Support for count argument without the modifier `.noComplete` requires sm_90 or higher.

Qualifier `.expect_tx` requires sm_90 or higher.

Sub-qualifier `::cluster` requires sm_90 or higher.

Support for `.cluster` scope requires sm_90 or higher.

Support for `.relaxed` qualifier requires sm_90 or higher.

**Examples**

```ptx
.reg .b32 cnt, remoteAddr32, remoteCTAId, addr32;
.reg .b64 %r<5>, addr, remoteAddr64;
.shared .b64 shMem, shMem2;

cvta.shared.u64            addr, shMem2;
mov.b32                    addr32, shMem2;
mapa.shared::cluster.u32   remoteAddr32, addr32, remoteCTAId;
mapa.u64                   remoteAddr64, addr,   remoteCTAId;

cvta.shared.u64          addr, shMem2;

mbarrier.arrive.shared.b64                       %r0, [shMem];
mbarrier.arrive.shared::cta.b64                  %r0, [shMem2];
mbarrier.arrive.release.cta.shared::cluster.b64  _, [remoteAddr32];
mbarrier.arrive.release.cluster.b64              _, [remoteAddr64], cnt;
mbarrier.arrive.expect_tx.release.cluster.b64    _, [remoteAddr64], tx_count;
mbarrier.arrive.noComplete.b64                   %r1, [addr], 2;
mbarrier.arrive.relaxed.cta.b64                  %r2, [addr], 4;
mbarrier.arrive.b64                              %r2, [addr], cnt;
```

### 9.7.13.15.14. Parallel Synchronization and Communication Instructions: mbarrier.arrive_drop

#### mbarrier.arrive_drop

Decrements the expected count of the mbarrier object and performs arrive-on operation.

**Syntax**

```
mbarrier.arrive_drop{.sem.scope}{.shared{::cta}}.b64              state, [addr] {, count};
mbarrier.arrive_drop{.sem.scope}{.shared::cluster}.b64            _,     [addr] {, count};
mbarrier.arrive_drop.expect_tx{.sem.scope}{.shared{::cta}}.b64    state, [addr], tx_count;
mbarrier.arrive_drop.expect_tx{.sem.scope}{.shared::cluster}.b64  _,     [addr], tx_count;
mbarrier.arrive_drop.noComplete{.release.cta}{.shared{::cta}}.b64 state, [addr], count;

.sem   = { .release, .relaxed }
.scope = { .cta, .cluster }
```

**Description**

A thread executing `mbarrier.arrive_drop` on the mbarrier object at the location specified by the address operand addr performs the following steps:

Decrements the expected arrival count of the mbarrier object by the value specified by the 32-bit integer operand count. If count operand is not specified, it defaults to 1.

Performs an arrive-on operation on the mbarrier object. The operand count specifies the count argument to the arrive-on operation.

The decrement done in the expected arrivals count of the mbarrier object will be for all the subsequent phases of the mbarrier object.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` or `.shared::cluster` state space then the behavior is undefined.

Supported addressing modes for operand addr is as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

The optional qualifier `.expect_tx` specifies that an expect-tx operation is performed prior to the `arrive_drop` operation, i.e. the decrement of arrival count and arrive-on operation. The 32-bit unsigned integer operand txCount specifies the expectCount argument to the expect-tx operation. When both qualifiers `.arrive_drop` and `.expect_tx` are specified, then the count argument of the arrive-on operation is assumed to be 1.

`mbarrier.arrive_drop` operation with `.release` qualifier forms the release pattern as described in the Memory Consistency Model and synchronizes with the acquire patterns.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the Memory Consistency Model. If the `.sem` qualifier is absent, `.release` is assumed by default. The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that an `mbarrier.arrive_drop` instruction can directly synchronize. If the `.scope` qualifier is not specified then it defaults to `.cta`. In contrast, the `.shared::<scope>` indicates the state space where the mbarrier resides.

A `mbarrier.arrive_drop` with `.noComplete` qualifier must not complete the mbarrier, otherwise the behavior is undefined.

The value of the operand count must be in the range as specified in Contents of the mbarrier object.

Note: for sm_8x, when the argument count is specified, the modifier `.noComplete` is required.

A thread that wants to either exit or opt out of participating in the arrive-on operation can use `mbarrier.arrive_drop` to drop itself from the mbarrier.

`mbarrier.arrive_drop` operation on an mbarrier object located in `.shared::cta` returns an opaque 64-bit register capturing the phase of the mbarrier object prior to the arrive-on operation in the destination operand state. Contents of the returned state are implementation specific. Optionally, sink symbol `_` can be used for the state argument.

`mbarrier.arrive_drop` operation on an mbarrier object located in `.shared::cluster` but not in `.shared::cta` cannot return a value. Sink symbol `_` is mandatory for the destination operand for such cases.

Qualifiers `.sem` and `.scope` must be specified together.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

Support for count argument without the modifier `.noComplete` introduced in PTX ISA version 7.8.

Support for qualifier `.expect_tx` is introduced in PTX ISA version 8.0.

Support for sub-qualifier `::cluster` introduced in PTX ISA version 8.0.

Support for `.scope` and `.sem` qualifiers introduced in PTX ISA version 8.0.

Support for `.relaxed` qualifier introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_80 or higher.

Support for count argument without the modifier `.noComplete` requires sm_90 or higher.

Qualifier `.expect_tx` requires sm_90 or higher.

Sub-qualifier `::cluster` requires sm_90 or higher.

Support for `.cluster` scope requires sm_90 or higher.

Support for `.relaxed` qualifier requires sm_90 or higher.

**Examples**

```ptx
.reg .b32 cnt;
.reg .b64 %r1;
.shared .b64 shMem;

// Example 1
@p mbarrier.arrive_drop.shared.b64 _, [shMem];
@p exit;
@p2 mbarrier.arrive_drop.noComplete.shared.b64 _, [shMem], %a;
@p2 exit;
..
@!p mbarrier.arrive.shared.b64   %r1, [shMem];
@!p mbarrier.test_wait.shared.b64  q, [shMem], %r1;

// Example 2
mbarrier.arrive_drop.shared::cluster.b64 _, [addr];
mbarrier.arrive_drop.shared::cta.release.cluster.b64     _, [addr], cnt;

// Example 3
mbarrier.arrive_drop.expect_tx.shared::cta.relaxed.cluster.b64 state, [addr], tx_count;
```

### 9.7.13.15.15. Parallel Synchronization and Communication Instructions: cp.async.mbarrier.arrive

#### cp.async.mbarrier.arrive

Makes the mbarrier object track all prior cp.async operations initiated by the executing thread.

**Syntax**

```
cp.async.mbarrier.arrive{.noinc}{.shared{::cta}}.b64 [addr];
```

**Description**

Causes an arrive-on operation to be triggered by the system on the mbarrier object upon the completion of all prior `cp.async` operations initiated by the executing thread. The mbarrier object is at the location specified by the operand addr. The arrive-on operation is asynchronous to execution of `cp.async.mbarrier.arrive`.

When `.noinc` modifier is not specified, the pending count of the mbarrier object is incremented by 1 prior to the asynchronous arrive-on operation. This results in a zero-net change for the pending count from the asynchronous arrive-on operation during the current phase. The pending count of the mbarrier object after the increment should not exceed the limit as mentioned in Contents of the mbarrier object. Otherwise, the behavior is undefined.

When the `.noinc` modifier is specified, the increment to the pending count of the mbarrier object is not performed. Hence the decrement of the pending count done by the asynchronous arrive-on operation must be accounted for in the initialization of the mbarrier object.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand addr is as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
// Example 1: no .noinc
mbarrier.init.shared.b64 [shMem], threadCount;
....
cp.async.ca.shared.global [shard1], [gbl1], 4;
cp.async.cg.shared.global [shard2], [gbl2], 16;
....
// Absence of .noinc accounts for arrive-on from completion of prior cp.async operations.
// So mbarrier.init must only account for arrive-on from mbarrier.arrive.
cp.async.mbarrier.arrive.shared.b64 [shMem];
....
mbarrier.arrive.shared.b64 state, [shMem];

waitLoop:
mbarrier.test_wait.shared.b64 p, [shMem], state;
@!p bra waitLoop;



// Example 2: with .noinc

// Tracks arrive-on from mbarrier.arrive and cp.async.mbarrier.arrive.

// All threads participating in the mbarrier perform cp.async
mov.b32 copyOperationCnt, threadCount;

// 3 arrive-on operations will be triggered per-thread
mul.lo.u32 copyArrivalCnt, copyOperationCnt, 3;

add.u32 totalCount, threadCount, copyArrivalCnt;

mbarrier.init.shared.b64 [shMem], totalCount;
....
cp.async.ca.shared.global [shard1], [gbl1], 4;
cp.async.cg.shared.global [shard2], [gbl2], 16;
...
// Presence of .noinc requires mbarrier initialization to have accounted for arrive-on from cp.async
cp.async.mbarrier.arrive.noinc.shared.b64 [shMem]; // 1st instance
....
cp.async.ca.shared.global [shard3], [gbl3], 4;
cp.async.ca.shared.global [shard4], [gbl4], 16;
cp.async.mbarrier.arrive.noinc.shared::cta.b64 [shMem]; // 2nd instance
....
cp.async.ca.shared.global [shard5], [gbl5], 4;
cp.async.cg.shared.global [shard6], [gbl6], 16;
cp.async.mbarrier.arrive.noinc.shared.b64 [shMem]; // 3rd and last instance
....
mbarrier.arrive.shared.b64 state, [shMem];

waitLoop:
mbarrier.test_wait.shared.b64 p, [shMem], state;
@!p bra waitLoop;
```


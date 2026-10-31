# 9.7.15.16.19. Parallel Synchronization and Communication Instructions: mbarrier.test_wait / mbarrier.try_wait

**mbarrier.test_wait, mbarrier.try_wait**

Checks whether the mbarrier object has completed the phase.

## Syntax

```ptx
// without parity
mbarrier.test_wait{.phase_type::primary}{.sem.scope}{.ss}.b64      waitComplete, [addr], state;

mbarrier.test_wait.phase_type::primary{.sem}{.scope}{.ss}.b64      waitComplete|reportPredicate
                                                                   {, reportValue}, [addr], state;

// with parity
mbarrier.test_wait.parity{.phase_type}{.sem.scope}{.ss}.b64        waitComplete, [addr], phaseParity;

mbarrier.test_wait.parity.phase_type::primary{.sem}{.scope}{.ss}.b64  waitComplete|reportPredicate
                                                                      {, reportValue}, [addr], phaseParity;

// without parity
mbarrier.try_wait{.phase_type::primary}{.sem.scope}{.ss}.b64      waitComplete, [addr], state {, timeHint};

mbarrier.try_wait.phase_type::primary{.sem}{.scope}{.ss}.b64      waitComplete|reportPredicate {, reportValue},
                                                                  [addr], state {, timeHint};

// with parity
mbarrier.try_wait.parity{.phase_type}{.sem.scope}{.ss}.b64            waitComplete, [addr], phaseParity {, timeHint};

mbarrier.try_wait.parity.phase_type::primary{.sem}{.scope}{.ss}.b64   waitComplete|reportPredicate {, reportValue},
                                                                      [addr], phaseParity {, timeHint};


.ss   = { .shared{::cta} }
.sem   = { .acquire, .relaxed }
.scope = { .cta, .cluster }
.phase_type = { .phase_type::primary, .phase_type::conditional }
```

## Description

The `test_wait` and `try_wait` operations test for the completion of the current or the immediately preceding phase of an mbarrier object at the location specified by the operand `addr`.

`mbarrier.test_wait` is a non-blocking instruction which tests for the completion of the phase.

`mbarrier.try_wait` is a potentially blocking instruction which tests for the completion of the phase. If the phase is not complete, the executing thread may be suspended. Suspended thread resumes execution when the specified phase completes OR before the phase completes following a system-dependent time limit. The optional 32-bit unsigned integer operand `timeHint` specifies the time limit, in nanoseconds, that may be used for the time limit instead of the system-dependent limit.

`mbarrier.test_wait` and `mbarrier.try_wait` test for completion of the phase :

- Specified by the 64-bit unsigned integer operand `state`, which was returned by an `mbarrier.arrive` instruction on the same mbarrier object during the current or the immediately preceding phase. Or
- Indicated by the 32-bit unsigned integer operand `phaseParity`, whose integer parity denotes either the current phase or the immediately preceding phase of the mbarrier object.

The `.parity` variant of the instructions test for the completion of the phase indicated by the integer parity of the operand `phaseParity`, which denotes either the current phase or the immediately preceding phase of the mbarrier object. An even phase has integer parity 0 and an odd phase has integer parity of 1.

> **Note:** the use of the `.parity` variants of the instructions requires tracking the phase of an mbarrier object throughout its lifetime.

The `test_wait` and `try_wait` operations are valid only for :

- the current incomplete phase, for which `waitComplete` returns False.
- the immediately preceding phase, for which `waitComplete` returns True.

The qualifier `.phase_type::*` specifies the exact phase to test for completion of an operation. The semantics around possible combinations are summarized below:

- `.phase_type::*` is unspecified: checks completion of the primary phase.
- `.phase_type::primary` checks completion of the primary phase and sets the `reportPredicate` and `reportValue`. Note that the `reportPredicate` and `reportValue` operands are undefined when `waitComplete` is False. For `.layout::v0`, `reportPredicate` and `reportValue` are always zero.
- `.phase_type::conditional` requires `.parity` qualifier and checks for completion of the conditional phase, which may complete independently from the primary phase. For `.layout::v0`, the primary and conditional phase complete in unison.

Operand `reportValue` must be of type `.b8`.

If no state space is specified then Generic Addressing is used. If the address specified by `addr` does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand `addr` is as described in [Addresses as Operands](../../../06-instruction-operands.md). Alignment for operand `addr` is as described in the [Size and alignment of mbarrier object](README.md).

When `mbarrier.test_wait` and `mbarrier.try_wait` operations with `.acquire` qualifier returns True, they form the acquire pattern as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md).

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the [Memory Consistency Model](../../../08-memory-consistency-model/01-scope-operations-types-ordering.md). If the `.sem` qualifier is absent, `.acquire` is assumed by default. The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that the `mbarrier.test_wait` and `mbarrier.try_wait` instructions can directly synchronize. If the `.scope` qualifier is not specified then it defaults to `.cta`. In contrast, the `.shared::<scope>` indicates the state space where the mbarrier resides.

Qualifiers `.sem` and `.scope` must be specified together.

The following ordering of memory operations hold for the executing thread when `mbarrier.test_wait` or `mbarrier.try_wait` having acquire semantics returns True :

- All memory accesses (except async operations) requested prior, in program order, to `mbarrier.arrive` having release semantics during the completed phase by the participating threads of the CTA are performed and are visible to the executing thread.
- All `cp.async` operations requested prior, in program order, to `cp.async.mbarrier.arrive` during the completed phase by the participating threads of the CTA are performed and made visible to the executing thread.
- All `cp.async.bulk` asynchronous operations using the same mbarrier object requested prior, in program order, to `mbarrier.arrive` having release semantics during the completed phase by the participating threads of the CTA are performed and made visible to the executing thread.
- All memory accesses requested after the `mbarrier.test_wait` or `mbarrier.try_wait`, in program order, are not performed and not visible to memory accesses performed prior to `mbarrier.arrive` having release semantics, in program order, by other threads participating in the mbarrier.
- There is no ordering and visibility guarantee for memory accesses requested by the thread after `mbarrier.arrive` having release semantics and prior to `mbarrier.test_wait`, in program order.

## PTX ISA Notes

`mbarrier.test_wait` introduced in PTX ISA version 7.0.

Modifier `.parity` is introduced in PTX ISA version 7.1.

`mbarrier.try_wait` introduced in PTX ISA version 7.8.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

Support for `.scope` and `.sem` qualifiers introduced in PTX ISA version 8.0

Support for `.relaxed` qualifier introduced in PTX ISA version 8.6.

Support for `.phase_type::*` qualifier introduced in PTX ISA version 9.3.

Support for `reportPredicate` and `reportValue` operands introduced in PTX ISA version 9.3.

## Target ISA Notes

`mbarrier.test_wait` requires `sm_80` or higher.

`mbarrier.try_wait` requires `sm_90` or higher.

Support for `.cluster` scope requires `sm_90` or higher.

Support for `.relaxed` qualifier requires `sm_90` or higher.

Operands `reportPredicate` and `reportValue` and qualifier `.phase_type::*` requires `sm_90` or higher.

## Examples

```ptx
// Example 1a, thread synchronization with test_wait:

.reg .b64 %r1;
.shared .b64 shMem;

mbarrier.init.shared.b64 [shMem], N;  // N threads participating in the mbarrier.
...
mbarrier.arrive.shared.b64  %r1, [shMem]; // N threads executing mbarrier.arrive

// computation not requiring mbarrier synchronization...

waitLoop:
mbarrier.test_wait.phase_type::primary.shared.b64    complete, [shMem], %r1;
@!complete nanosleep.u32 20;
@!complete bra waitLoop;

// Example 1b, thread synchronization with try_wait :

.reg .b64 %r1;
.shared .b64 shMem;

mbarrier.init.layout::v0.shared.b64 [shMem], N;  // N threads participating in the mbarrier.
...
mbarrier.arrive.shared.b64  %r1, [shMem]; // N threads executing mbarrier.arrive

// computation not requiring mbarrier synchronization...

waitLoop:
mbarrier.try_wait.phase_type::primary.relaxed.cluster.shared.b64    complete, [shMem], %r1;
@!complete bra waitLoop;


// Example 2, thread synchronization using phase parity :

.reg .b32 i, parArg;
.reg .b64 %r1;
.shared .b64 shMem;

mov.b32 i, 0;
mbarrier.init.shared.b64 [shMem], N;  // N threads participating in the mbarrier.
...
loopStart :                           // One phase per loop iteration
    ...
    mbarrier.arrive.shared.b64  %r1, [shMem]; // N threads
    ...
    and.b32 parArg, i, 1;
    waitLoop:
    mbarrier.test_wait.parity.shared.b64  complete, [shMem], parArg;
    @!complete nanosleep.u32 20;
    @!complete bra waitLoop;
    ...
    add.u32 i, i, 1;
    setp.lt.u32 p, i, IterMax;
@p bra loopStart;


// Example 3, Asynchronous copy completion waiting :

.reg .b64 state;
.shared .b64 shMem2;
.shared .b64 shard1, shard2;
.global .b64 gbl1, gbl2;

mbarrier.init.shared.b64 [shMem2], threadCount;
...
cp.async.ca.shared.global [shard1], [gbl1], 4;
cp.async.cg.shared.global [shard2], [gbl2], 16;

// Absence of .noinc accounts for arrive-on from prior cp.async operation
cp.async.mbarrier.arrive.shared.b64 [shMem2];
...
mbarrier.arrive.shared.b64 state, [shMem2];

waitLoop:
mbarrier.test_wait.shared::cta.b64 p, [shMem2], state;
@!p bra waitLoop;

// Example 4, Synchronizing the CTA0 threads with cluster threads
.reg .b64 %r1, addr, remAddr;
.shared .b64 shMem;

cvta.shared.u64          addr, shMem;
mapa.u64                 remAddr, addr, 0;     // CTA0's shMem instance

// One thread from CTA0 executing the below initialization operation
@p0 mbarrier.init.shared::cta.b64 [shMem], N;  // N = no of cluster threads

barrier.cluster.arrive;
barrier.cluster.wait;

// Entire cluster executing the below arrive operation
mbarrier.arrive.release.cluster.b64              _, [remAddr];

// computation not requiring mbarrier synchronization ...

// Only CTA0 threads executing the below wait operation
waitLoop:
mbarrier.try_wait.parity.acquire.cluster.shared::cta.b64  complete, [shMem], 0;
@!complete bra waitLoop;

// Example 5 Tracking success-status of asynchronous operation using mbarrier.test_wait:

.reg .b64 %r1;
.shared .b64 shMem;

mbarrier.init.layout::v1.shared::cta.b64 [shMem], N;  // N threads participating in the mbarrier
...

// computation that issues asynchronous operation specifying report mechanism on mbarrier located at shMem
...

waitLoop:
mbarrier.test_wait.phase_type::primary.shared::cta.b64    complete|reportPred, reportValue, [shMem], %r1;
@!complete nanosleep.u32 20;
@!complete bra waitLoop;

@reportPred bra noSuccess;
// asynchronous operation completed successfully
...

exit;

noSuccess:
// Handle unsuccessful asynchronous operation
// Inspect reportVal for more details

// Example 6 Tracking successful completion of asynchronous operation by waiting on conditional phase:

.reg .b64 %r1;
.reg .b32 parity, timeHint;
.shared .b64 shMem;

mbarrier.init.layout::v1.shared::cta.b64 [shMem], N;  // N threads participating in the mbarrier
...

// computation that issues asynchronous operation specifying report mechanism on mbarrier located at shMem
...

waitLoop:
mbarrier.try_wait.parity.phase_type::conditional.relaxed.cluster.shared::cta.b64    complete, [shMem], parity, timeHint;
@!complete bra waitLoop;
// asynchronous operation completed successfully
```

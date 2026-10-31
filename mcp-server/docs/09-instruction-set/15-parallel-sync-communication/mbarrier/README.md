# 9.7.15.16. Parallel Synchronization and Communication Instructions: mbarrier

`mbarrier` is a barrier created in shared memory that supports :

- Synchronizing any subset of threads within a CTA
- One-way synchronization of threads across CTAs of a cluster. As noted in [mbarrier support with shared memory](#97151611-mbarrier-support-with-shared-memory), threads can perform only arrive operations but not `*_wait` on an mbarrier located in `shared::cluster` space.
- Waiting for completion of asynchronous memory operations initiated by a thread and making them visible to other threads.

An mbarrier object is an opaque object in memory which can be initialized and invalidated using :

- [`mbarrier.init`](mbarrier-init.md)
- [`mbarrier.inval`](mbarrier-inval.md)

Operations supported on mbarrier objects are :

- [`mbarrier.expect_tx`](mbarrier-expect-tx.md)
- [`mbarrier.complete_tx`](mbarrier-complete-tx.md)
- [`mbarrier.arrive`](mbarrier-arrive.md)
- [`mbarrier.arrive_drop`](mbarrier-arrive-drop.md)
- [`mbarrier.test_wait`](mbarrier-test-wait-try-wait.md)
- [`mbarrier.try_wait`](mbarrier-test-wait-try-wait.md)
- [`mbarrier.pending_count`](mbarrier-pending-count.md)
- [`mbarrier.check_layout`](mbarrier-check-layout.md)
- [`cp.async.mbarrier.arrive`](cp-async-mbarrier-arrive.md)

Performing any mbarrier operation except `mbarrier.init` on an uninitialized mbarrier object results in undefined behavior. Performing any non-mbarrier or `mbarrier.init` operations on an initialized mbarrier object results in undefined behavior.

Unlike `bar{.cta}`/`barrier{.cta}` instructions which can access a limited number of barriers per CTA, mbarrier objects are user defined and are only limited by the total shared memory size available.

mbarrier operations enable threads to perform useful work after the arrival at the mbarrier and before waiting for the mbarrier to complete.

## 9.7.15.16.1. Size and alignment of mbarrier object

An mbarrier object is an opaque object with the following type and alignment requirements :

| Type | Alignment (bytes) | Memory space |
|---|---|---|
| `.b64` | 8 | `.shared` |

## 9.7.15.16.2. Layouts of the mbarrier object

An opaque mbarrier object supports two different layouts:

- `.layout::v0`
- `.layout::v1`

The exact layout of the mbarrier object can be specified at the time of creation. The asynchronous operations that can be tracked by an mbarrier object depend on the layout. Refer to [Contents of the mbarrier object](#9715163-contents-of-the-mbarrier-object) for more details.

## 9.7.15.16.3. Contents of the mbarrier object

An opaque mbarrier object irrespective of the layout keeps track of the following information :

- Current primary and conditional phases of the mbarrier object
- Count of pending arrivals for the current phase of the mbarrier object
- Count of expected arrivals for the next phase of the mbarrier object
- Count of pending asynchronous memory operations (or transactions) tracked by the current phase of the mbarrier object. This is also referred to as tx-count.

However, an mbarrier object with `.layout::v1` additionally keeps track of the following information:

- Payload report corresponding to each primary phase

An mbarrier object progresses through a sequence of phases where each phase is defined by threads performing an expected number of arrive-on operations.

The valid range of each of the counts differs based on the mbarrier layout. Refer Table 43 for more details.

**Table 43** Mbarrier counts for different layouts

| Layout | Count name | Minimum value | Maximum value |
|---|---|---|---|
| `.layout::v0` | Expected arrival count | 1 | 2^20 - 1 |
| `.layout::v0` | Pending arrival count | 0 | 2^20 - 1 |
| `.layout::v0` | tx-count | -(2^20 - 1) | 2^20 - 1 |
| `.layout::v1` | Expected arrival count | 1 | 2^9 - 1 |
| `.layout::v1` | Pending arrival count | 0 | 2^9 - 1 |
| `.layout::v1` | tx-count | -(2^20 - 1) | 2^20 - 1 |

## 9.7.15.16.4. Lifecycle of the mbarrier object

The mbarrier object must be initialized prior to use.

An mbarrier object is used to synchronize threads, track asynchronous memory operations.

An mbarrier object may be used to perform a sequence of such synchronizations.

An mbarrier object must be invalidated to repurpose its memory for any purpose, including repurposing it for another mbarrier object.

## 9.7.15.16.5. Phases of the mbarrier object

### 9.7.15.16.5.1. Primary phase

The primary phase of an mbarrier object is the number of times the mbarrier object has been used to synchronize threads and asynchronous operations. In each primary phase {0, 1, 2, …}, threads perform in program order :

- arrive-on operations to complete the current primary phase and
- `test_wait` / `try_wait` operations to check for the completion of the current primary phase.

An mbarrier object is automatically reinitialized upon completion of the current primary phase for immediate use in the next phase. The current primary phase is incomplete and all prior primary phases are complete.

For each primary phase of the mbarrier object, at least one `test_wait` or `try_wait` operation must be performed which returns True for `waitComplete` before an arrive-on operation in the subsequent primary phase.

### 9.7.15.16.5.2. Conditional phase

The primary phase of an mbarrier object advances upon completion of arrivals, and transaction-count updates of asynchronous operations tracked by the mbarrier. The conditional phase advances if the primary phase advances, and no asynchronous operation tracked by the mbarrier prevents it via a report-on operation.

Mbarrier objects with `.layout::v0` do not support tracking asynchronous operations that could prevent the conditional phase from advancing via report-on, resulting in both phases advancing in unison. That is, either both phase advance, or no phase advances.

Mbarrier objects with `.layout::v1` support tracking asynchronous operations that can prevent the conditional phase from advancing via a report-on operation. If the primary phase advances, but the conditional phase does not advance, the payload report is non-zero and may contain more information. If the conditional phase advances, the payload report is zero.

An mbarrier object is automatically reinitialized upon completion of the current primary phase for immediate use in the next phase. Refer [Phase Completion of the mbarrier object](#9715168-phase-completion-of-the-mbarrier-object) for more details on conditional phase completion.

## 9.7.15.16.6. Tracking asynchronous operations by the mbarrier object

Starting with the Hopper architecture (`sm_9x`), mbarrier object supports a new count, called tx-count, which is used for tracking the completion of asynchronous memory operations or transactions. tx-count tracks the number of asynchronous transactions, in units specified by the asynchronous memory operation, that are outstanding and yet to be complete.

The tx-count of an mbarrier object must be set to the total amount of asynchronous memory operations, in units as specified by the asynchronous operations, to be tracked by the current phase. Upon completion of each of the asynchronous operations, the complete-tx operation will be performed on the mbarrier object and thus progress the mbarrier towards the completion of the current phase.

### 9.7.15.16.6.1. expect-tx operation

The expect-tx operation, with an `expectCount` argument, increases the tx-count of an mbarrier object by the value specified by `expectCount`. This sets the current phase of the mbarrier object to expect and track the completion of additional asynchronous transactions.

### 9.7.15.16.6.2. complete-tx operation

The complete-tx operation, with an `completeCount` argument, on an mbarrier object consists of the following:

- mbarrier signaling

  Signals the completion of asynchronous transactions that were tracked by the current phase. As a result of this, tx-count is decremented by `completeCount`.

- mbarrier potentially completing the current phase

  If the current phase has been completed then the mbarrier transitions to the next phase. Refer to [Phase Completion of the mbarrier object](#9715168-phase-completion-of-the-mbarrier-object) for details on phase completion requirements and phase transition process.

## 9.7.15.16.7. Tracking successful completion of an operation using the mbarrier object

An mbarrier object with layout `.layout::v1` can track asynchronous operations that prevent the conditional phase from advancing and provide additional information via the payload report on completion.

The `mbarrier.test_wait` and `mbarrier.try_wait` instructions with `.phase_type::primary` allow observing primary phase completion and the payload report. The payload report consists of a report predicate (`reportPredicate`) and a report value (`reportValue`). For the conditional phase to advance, the entire payload report must be zero. If the predicate i.e. `reportPredicate` is zero, the value `reportValue` is guaranteed to be zero and therefore the conditional phase has advanced.

The `mbarrier.test_wait` and `mbarrier.try_wait` instructions with `.phase_type::conditional` allow observing the conditional phase advance which means the payload report was zero.

## 9.7.15.16.8. Phase Completion of the mbarrier object

The requirements for completion of the current phase are described below. Upon completion of the current phase, the phase transitions to the subsequent phase as described below.

- Current primary phase completion requirements

  An mbarrier object irrespective of the layout completes the current primary phase when all of the following conditions are met:

  - The count of the pending arrivals has reached zero.
  - The tx-count has reached zero.

- Current conditional phase completion requirements

  An mbarrier object completes the current conditional phase when all of the following conditions are met:

  - The count of the pending arrivals has reached zero.
  - The tx-count has reached zero.
  - If the layout of the mbarrier is `.layout::v1`, then the payload report associated with the primary phase was zero.

- Phase transition

  When an mbarrier object with `.layout::v0` completes the current phase, the following actions are performed atomically:

  - The mbarrier object transitions to the next primary and conditional phases.
  - The pending arrival count is reinitialized to the expected arrival count.

  When an mbarrier object with `.layout::v1` completes the current phase, the following actions are performed atomically:

  - If the payload report associated with the current primary phase of the mbarrier is zero, then the conditional phase advances.
  - The mbarrier object transitions to the next primary phase.
  - The payload report corresponding to the next primary phase is reinitialized to zero.
  - The pending arrival count is reinitialized to the expected arrival count.

## 9.7.15.16.9. Arrive-on operation on mbarrier object

An arrive-on operation, with an optional `count` argument, on an mbarrier object consists of the following 2 steps :

- mbarrier signalling:

  Signals the arrival of the executing thread OR completion of the asynchronous instruction which signals the arrive-on operation initiated by the executing thread on the mbarrier object. As a result of this, the pending arrival count is decremented by `count`. If the `count` argument is not specified, then it defaults to 1.

- mbarrier potentially completing the current phase:

  If the current phase has been completed then the mbarrier transitions to the next phase. Refer to [Phase Completion of the mbarrier object](#9715168-phase-completion-of-the-mbarrier-object) for details on phase completion requirements and phase transition process.

## 9.7.15.16.10. Report-on operation on mbarrier object

The report-on operation on an mbarrier object signals miscellaneous information regarding asynchronous operation. For example, such a miscellaneous information can be about errors, warnings encountered; otherwise, it can as well be any extra information conveyed by asynchronous operation.

The miscellaneous information reported by asynchronous operation via report-on mbarrier operation would be updated in the payload report. The following asynchronous operations can potentially issue report-on operation on an associated mbarrier object:

- `cp.async.bulk`, `cp.async.bulk.tensor` instructions specifying `.report_mechanism` other than `.mbarrier::report::disabled`. Refer Report mechanisms for asynchronous copy operations for more details.
- Fabric operations such as `fabric.try_get`, `fabric.try_put`, `fabric.try_red`, `fabric.try_pullred`, `fabric.try_get.async.tensor`, `fabric.try_put.async.tensor`, `fabric.try_red.async.tensor`. Refer to [Fabric Reporting Mechanism](../../11-fabric/README.md) for more details.

## 9.7.15.16.11. mbarrier support with shared memory

The following table summarizes the support of various mbarrier operations on mbarrier objects located at different shared memory locations:

| mbarrier operations | `.shared::cta` | `.shared::cluster` |
|---|---|---|
| `mbarrier.arrive`, `mbarrier.arrive_drop` | Supported | Supported, cannot return result |
| `mbarrier.expect_tx` | Supported | Supported |
| `mbarrier.complete_tx` | Supported | Supported |
| Other mbarrier operations | Supported | Not supported |

## Pages

- [mbarrier.init](mbarrier-init.md) — initialize an mbarrier object with a layout and an expected arrival count.
- [mbarrier.inval](mbarrier-inval.md) — invalidate an mbarrier object so its memory can be repurposed.
- [mbarrier.expect_tx](mbarrier-expect-tx.md) — perform an expect-tx operation, optionally multicast across cluster CTAs.
- [mbarrier.complete_tx](mbarrier-complete-tx.md) — perform a complete-tx operation, optionally multicast across cluster CTAs.
- [mbarrier.arrive](mbarrier-arrive.md) — perform an arrive-on operation on an mbarrier object.
- [mbarrier.arrive_drop](mbarrier-arrive-drop.md) — decrement the expected count and perform an arrive-on operation.
- [cp.async.mbarrier.arrive](cp-async-mbarrier-arrive.md) — make an mbarrier track completion of prior cp.async operations.
- [mbarrier.test_wait, mbarrier.try_wait](mbarrier-test-wait-try-wait.md) — test or wait for completion of an mbarrier phase.
- [mbarrier.pending_count](mbarrier-pending-count.md) — query the pending arrival count from an opaque state value.
- [mbarrier.check_layout](mbarrier-check-layout.md) — check the layout of an mbarrier object.

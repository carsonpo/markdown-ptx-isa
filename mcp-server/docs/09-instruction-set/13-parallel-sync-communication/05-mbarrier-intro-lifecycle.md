## 9.7.13.15. Parallel Synchronization and Communication Instructions: mbarrier

`mbarrier` is a barrier created in shared memory that supports:

- Synchronizing any subset of threads within a CTA
- One-way synchronization of threads across CTAs of a cluster. As noted in mbarrier support with shared memory, threads can perform only arrive operations but not `*_wait` on an mbarrier located in `shared::cluster` space.
- Waiting for completion of asynchronous memory operations initiated by a thread and making them visible to other threads.

An mbarrier object is an opaque object in memory which can be initialized and invalidated using:

- `mbarrier.init`
- `mbarrier.inval`

Operations supported on mbarrier objects are:

- `mbarrier.expect_tx`
- `mbarrier.complete_tx`
- `mbarrier.arrive`
- `mbarrier.arrive_drop`
- `mbarrier.test_wait`
- `mbarrier.try_wait`
- `mbarrier.pending_count`
- `cp.async.mbarrier.arrive`

Performing any mbarrier operation except `mbarrier.init` on an uninitialized mbarrier object results in undefined behavior. Performing any non-mbarrier or `mbarrier.init` operations on an initialized mbarrier object results in undefined behavior.

Unlike `bar{.cta}`/`barrier{.cta}` instructions which can access a limited number of barriers per CTA, mbarrier objects are user defined and are only limited by the total shared memory size available.

mbarrier operations enable threads to perform useful work after the arrival at the mbarrier and before waiting for the mbarrier to complete.

### 9.7.13.15.1. Size and alignment of mbarrier object

An mbarrier object is an opaque object with the following type and alignment requirements:

| Type | Alignment (bytes) | Memory space |
|------|-------------------|--------------|
| `.b64` | 8 | `.shared` |

### 9.7.13.15.2. Contents of the mbarrier object

An opaque mbarrier object keeps track of the following information:

- Current phase of the mbarrier object
- Count of pending arrivals for the current phase of the mbarrier object
- Count of expected arrivals for the next phase of the mbarrier object
- Count of pending asynchronous memory operations (or transactions) tracked by the current phase of the mbarrier object. This is also referred to as tx-count.

An mbarrier object progresses through a sequence of phases where each phase is defined by threads performing an expected number of arrive-on operations.

The valid range of each of the counts is as shown below:

| Count name | Minimum value | Maximum value |
|------------|---------------|---------------|
| Expected arrival count | 1 | 2^20 - 1 |
| Pending arrival count | 0 | 2^20 - 1 |
| tx-count | -(2^20 - 1) | 2^20 - 1 |

### 9.7.13.15.3. Lifecycle of the mbarrier object

The mbarrier object must be initialized prior to use.

An mbarrier object is used to synchronize threads and asynchronous memory operations.

An mbarrier object may be used to perform a sequence of such synchronizations.

An mbarrier object must be invalidated to repurpose its memory for any purpose, including repurposing it for another mbarrier object.

### 9.7.13.15.4. Phase of the mbarrier object

The phase of an mbarrier object is the number of times the mbarrier object has been used to synchronize threads and asynchronous operations. In each phase {0, 1, 2, …}, threads perform in program order:

- arrive-on operations to complete the current phase and
- test_wait / try_wait operations to check for the completion of the current phase.

An mbarrier object is automatically reinitialized upon completion of the current phase for immediate use in the next phase. The current phase is incomplete and all prior phases are complete.

For each phase of the mbarrier object, at least one `test_wait` or `try_wait` operation must be performed which returns True for waitComplete before an arrive-on operation in the subsequent phase.

### 9.7.13.15.5. Tracking asynchronous operations by the mbarrier object

Starting with the Hopper architecture (sm_9x), mbarrier object supports a new count, called tx-count, which is used for tracking the completion of asynchronous memory operations or transactions. tx-count tracks the number of asynchronous transactions, in units specified by the asynchronous memory operation, that are outstanding and yet to be complete.

The tx-count of an mbarrier object must be set to the total amount of asynchronous memory operations, in units as specified by the asynchronous operations, to be tracked by the current phase. Upon completion of each of the asynchronous operations, the complete-tx operation will be performed on the mbarrier object and thus progress the mbarrier towards the completion of the current phase.

#### 9.7.13.15.5.1. expect-tx operation

The expect-tx operation, with an expectCount argument, increases the tx-count of an mbarrier object by the value specified by expectCount. This sets the current phase of the mbarrier object to expect and track the completion of additional asynchronous transactions.

#### 9.7.13.15.5.2. complete-tx operation

The complete-tx operation, with a completeCount argument, on an mbarrier object consists of the following:

**mbarrier signaling**: Signals the completion of asynchronous transactions that were tracked by the current phase. As a result of this, tx-count is decremented by completeCount.

**mbarrier potentially completing the current phase**: If the current phase has been completed then the mbarrier transitions to the next phase. Refer to Phase Completion of the mbarrier object for details on phase completion requirements and phase transition process.

### 9.7.13.15.6. Phase Completion of the mbarrier object

The requirements for completion of the current phase are described below. Upon completion of the current phase, the phase transitions to the subsequent phase as described below.

**Current phase completion requirements**: An mbarrier object completes the current phase when all of the following conditions are met:

- The count of the pending arrivals has reached zero.
- The tx-count has reached zero.

**Phase transition**: When an mbarrier object completes the current phase, the following actions are performed atomically:

- The mbarrier object transitions to the next phase.
- The pending arrival count is reinitialized to the expected arrival count.

### 9.7.13.15.7. Arrive-on operation on mbarrier object

An arrive-on operation, with an optional count argument, on an mbarrier object consists of the following 2 steps:

**mbarrier signalling**: Signals the arrival of the executing thread OR completion of the asynchronous instruction which signals the arrive-on operation initiated by the executing thread on the mbarrier object. As a result of this, the pending arrival count is decremented by count. If the count argument is not specified, then it defaults to 1.

**mbarrier potentially completing the current phase**: If the current phase has been completed then the mbarrier transitions to the next phase. Refer to Phase Completion of the mbarrier object for details on phase completion requirements and phase transition process.

### 9.7.13.15.8. mbarrier support with shared memory

The following table summarizes the support of various mbarrier operations on mbarrier objects located at different shared memory locations:

| mbarrier operations | `.shared::cta` | `.shared::cluster` |
|--------------------|----------------|---------------------|
| `mbarrier.arrive`, `mbarrier.arrive_drop` | Supported | Supported, cannot return result |
| `mbarrier.expect_tx` | Supported | Supported |
| `mbarrier.complete_tx` | Supported | Supported |
| Other mbarrier operations | Supported | Not supported |

### 9.7.13.15.9. Parallel Synchronization and Communication Instructions: mbarrier.init

#### mbarrier.init

Initialize the mbarrier object.

**Syntax**

```
mbarrier.init{.shared{::cta}}.b64 [addr], count;
```

**Description**

`mbarrier.init` initializes the mbarrier object at the location specified by the address operand addr with the unsigned 32-bit integer count. The value of operand count must be in the range as specified in Contents of the mbarrier object.

Initialization of the mbarrier object involves:

- Initializing the current phase to 0.
- Initializing the expected arrival count to count.
- Initializing the pending arrival count to count.
- Initializing the tx-count to 0.

The valid range of values for the operand count is [1, …, 2^20 - 1]. Refer Contents of the mbarrier object for the valid range of values for the various constituents of the mbarrier.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand addr is as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

The behavior of performing an `mbarrier.init` operation on a memory location containing a valid mbarrier object is undefined; invalidate the mbarrier object using `mbarrier.inval` first, before repurposing the memory location for any other purpose, including another mbarrier object.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
.shared .b64 shMem, shMem2;
.reg    .b64 addr;
.reg    .b32 %r1;

cvta.shared.u64          addr, shMem2;
mbarrier.init.b64        [addr],   %r1;
bar.cta.sync             0;
// ... other mbarrier operations on addr

mbarrier.init.shared::cta.b64 [shMem], 12;
bar.sync                 0;
// ... other mbarrier operations on shMem
```


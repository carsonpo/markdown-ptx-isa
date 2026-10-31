# 9.7.10.28. Data Movement and Conversion Instructions: Asynchronous copy

An asynchronous copy operation performs the underlying operation asynchronously in the background, thus allowing the issuing threads to perform subsequent tasks.

An asynchronous copy operation can be a bulk operation that operates on a large amount of data, or a non-bulk operation that operates on smaller sized data. The amount of data handled by a bulk asynchronous operation must be a multiple of 16 bytes.

An asynchronous copy operation typically includes the following sequence:

- Optionally, reading from the tensormap.
- Reading data from the source location(s).
- Writing data to the destination location(s).
- Writes being made visible to the executing thread or other threads.

## 9.7.10.28.1. Completion Mechanisms for Asynchronous Copy Operations

A thread must explicitly wait for the completion of an asynchronous copy operation in order to access the result of the operation. Once an asynchronous copy operation is initiated, modifying the source memory location or tensor descriptor or reading from the destination memory location before the asynchronous operation completes, exhibits undefined behavior.

This section describes two asynchronous copy operation completion mechanisms supported in PTX: Async-group mechanism and mbarrier-based mechanism.

Asynchronous operations may be tracked by either of the completion mechanisms or both mechanisms. The tracking mechanism is instruction/instruction-variant specific.

### 9.7.10.28.1.1. Async-group mechanism

When using the async-group completion mechanism, the issuing thread specifies a group of asynchronous operations, called async-group, using a commit operation and tracks the completion of this group using a wait operation. The thread issuing the asynchronous operation must create separate async-groups for bulk and non-bulk asynchronous operations.

A commit operation creates a per-thread async-group containing all prior asynchronous operations tracked by async-group completion and initiated by the executing thread but none of the asynchronous operations following the commit operation. A committed asynchronous operation belongs to a single async-group.

When an async-group completes, all the asynchronous operations belonging to that group are complete and the executing thread that initiated the asynchronous operations can read the result of the asynchronous operations. All async-groups committed by an executing thread always complete in the order in which they were committed. There is no ordering between asynchronous operations within an async-group.

A typical pattern of using async-group as the completion mechanism is as follows:

- Initiate the asynchronous operations.
- Group the asynchronous operations into an async-group using a commit operation.
- Wait for the completion of the async-group using the wait operation.
- Once the async-group completes, access the results of all asynchronous operations in that async-group.

### 9.7.10.28.1.2. Mbarrier-based mechanism

A thread can track the completion of one or more asynchronous operations using the current phase of an mbarrier object. When the current phase of the mbarrier object is complete, it implies that all asynchronous operations tracked by this phase are complete, and all threads participating in that mbarrier object can access the result of the asynchronous operations.

The mbarrier object to be used for tracking the completion of an asynchronous operation can be either specified along with the asynchronous operation as part of its syntax, or as a separate operation. For bulk asynchronous operations and fabric operations, the mbarrier object must be specified in the asynchronous operation, whereas for non-bulk operations, it can be specified after the asynchronous operation.

A typical pattern of using mbarrier-based completion mechanism is as follows:

- Initiate the asynchronous operations.
- Set up an mbarrier object to track the asynchronous operations in its current phase, either as part of the asynchronous operation or as a separate operation.
- Wait for the mbarrier object to complete its current phase using [`mbarrier.test_wait` or `mbarrier.try_wait`](../../15-parallel-sync-communication/mbarrier/mbarrier-test-wait-try-wait.md).
- Once the `mbarrier.test_wait` or `mbarrier.try_wait` operation returns `True`, access the results of the asynchronous operations tracked by the mbarrier object.

### 9.7.10.28.1.3. Report Mechanisms for Asynchronous Copy Operations

Asynchronous copy operations with copy-direction from `.global` to `.shared::cta` or `.shared::cluster` support reporting data validity through an mbarrier object. When the qualifier `.report_mechanism` is specified, the copy operation inspects the data being copied and signals a report-on operation on the mbarrier if the data matches the pattern as specified in the qualifier. To avoid data inspection, the report mechanism must be set to `.mbarrier::report::disabled`. When the report mechanism is unspecified, it defaults to `.mbarrier::report::disabled`. The granularity of the data inspection is also specified as part of the qualifier. Note that when the `.report_mechanism` is specified for data inspection, the associated mbarrier operand must have been initialized with the layout `.layout::v1`, otherwise the behavior is undefined. For more details on mbarrier layout, refer [Layouts of the mbarrier object](../../15-parallel-sync-communication/mbarrier/README.md).

Table 33 lists all supported report mechanisms.

**Table 33** Report mechanisms for asynchronous copy operations

| Report mechanism `.mbarrier::report::validity` | Element format | Matching bit pattern | Granularity of the source data that is written into | Details of data inspection | Result of inspection |
|---|---|---|---|---|---|
| `::disabled` | N/A | N/A | N/A | No inspection | N/A |
| `::per_16bytes::80000000` | FP32 | -0 | 16 bytes of 4 FP32 elements | A sampled element from the aligned 16 byte chunk of the source global memory is matched with the Matching bit-pattern | If the pattern matches, issues a report-on operation on the mbarrier to update the payload report to a non-zero value. In particular, the report predicate is modified to non-zero value; whereas report value is altered in an idempotent way (atomically OR'ed with 0) |
| `::per_16bytes::8000` | FP16 | -0 | 16 bytes of 8 FP16 elements | A sampled element from the aligned 16 byte chunk of the source global memory is matched with the Matching bit-pattern | If the pattern matches, issues a report-on operation on the mbarrier to update the payload report to a non-zero value. In particular, the report predicate is modified to non-zero value; whereas report value is altered in an idempotent way (atomically OR'ed with 0) |
| `::per_16bytes::80` | FP8 | -0 | 16 bytes of 16 FP8 elements | A sampled element from the aligned 16 byte chunk of the source global memory is matched with the Matching bit-pattern | If the pattern matches, issues a report-on operation on the mbarrier to update the payload report to a non-zero value. In particular, the report predicate is modified to non-zero value; whereas report value is altered in an idempotent way (atomically OR'ed with 0) |
| `::per_16bytes::8` | FP4 | -0 | 16 bytes of 32 FP4 elements | A sampled element from the aligned 16 byte chunk of the source global memory is matched with the Matching bit-pattern | If the pattern matches, issues a report-on operation on the mbarrier to update the payload report to a non-zero value. In particular, the report predicate is modified to non-zero value; whereas report value is altered in an idempotent way (atomically OR'ed with 0) |
| `::per_element::ff` | 8bit / 4bit | NaN / 0xF | 1 byte | Each element is matched with the Matching bit-pattern | If the pattern matches, issues a report-on operation on the mbarrier to update the payload report to a non-zero value. In particular, the report predicate is modified to non-zero value; whereas report value is altered in an idempotent way (atomically OR'ed with 0) |

## 9.7.10.28.2. Async Proxy

The `cp{.reduce}.async.bulk` operations are performed in the asynchronous proxy (or async proxy).

Accessing the same memory location across multiple proxies needs a cross-proxy fence. For the async proxy, `fence.proxy.async` should be used to synchronize memory between generic proxy and the async proxy.

The completion of a `cp{.reduce}.async.bulk` operation is followed by an implicit generic-async proxy fence. So the result of the asynchronous operation is made visible to the generic proxy as soon as its completion is observed. Async-group OR mbarrier-based completion mechanism must be used to wait for the completion of the `cp{.reduce}.async.bulk` instructions.

## Pages

- [cp.async](cp-async.md) — non-bulk asynchronous copy from global to shared memory.
- [cp.async.commit_group](cp-async-commit-group.md) — commits prior uncommitted `cp.async` operations into a cp.async-group.
- [cp.async.wait_group / cp.async.wait_all](cp-async-wait-group.md) — waits for completion of prior cp.async-groups.
- [cp.async.bulk](cp-async-bulk.md) — bulk asynchronous copy between global and shared state spaces.
- [cp.reduce.async.bulk](cp-reduce-async-bulk.md) — bulk asynchronous reduction from shared memory into shared or global memory.
- [cp.async.bulk.prefetch](cp-async-bulk-prefetch.md) — bulk asynchronous prefetch of global data into the L2 cache.
- [multimem.cp.async.bulk](multimem-cp-async-bulk.md) — bulk asynchronous copy to a multimem address range.
- [multimem.cp.reduce.async.bulk](multimem-cp-reduce-async-bulk.md) — bulk asynchronous reduction to a multimem address range.
- [Tensor copy: restrictions and overrides](tensor-copy-restrictions-and-overrides.md) — tensor copy introduction, restrictions, and bounding-box and tensormap overrides.
- [cp.async.bulk.tensor](cp-async-bulk-tensor.md) — asynchronous tensor copy between global and shared memory.
- [cp.reduce.async.bulk.tensor](cp-reduce-async-bulk-tensor.md) — asynchronous tensor reduction from shared memory into global memory.
- [cp.async.bulk.prefetch.tensor](cp-async-bulk-prefetch-tensor.md) — asynchronous tensor prefetch into the L2 cache.
- [cp.async.bulk.commit_group](cp-async-bulk-commit-group.md) — commits prior bulk asynchronous operations into a bulk async-group.
- [cp.async.bulk.wait_group](cp-async-bulk-wait-group.md) — waits for completion of prior bulk async-groups.

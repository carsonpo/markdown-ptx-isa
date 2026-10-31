# 9.7.11. Fabric Instructions

NVLink failures encountered by pointer-address-based memory operations are fatal to the application. The CUDA Compute Fabric Transport (CUDA CFT) programming model introduces fabric operations that report failures directly to the application, enabling them to be resilient over NVLink failures. How to handle these failures is entirely up to the application and may include aborting or cleanly tearing the process down, or attempting to recover from transient failures by retrying the operation.

Refer to the Logical Endpoint section of the CUDA Driver API for the host-side programming model.

## 9.7.11.1. CFT Handles

A CUDA Fabric Transport Handle is composed of two objects:

- `leId`, a logical endpoint identifier: a 32-bit unsigned integer reference to a logical endpoint
- `off`, a resource offset: a 64-bit unsigned integer reference to a resource within the logical endpoint.

## 9.7.11.2. CFT Handles Overview

All fabric operations:

- May fail and report a status that identifies success or potential failure of the operation, enabling applications to react accordingly.
- Are asynchronous operations, enabling the operation to make progress in the background.
- Perform some CFT Handle resource accesses via the fabric-proxy. Most fabric operations perform multiple accesses: CFT Handle resource accesses via fabric-proxy, and multiple pointer-based accesses via often multiple different proxies.

### 9.7.11.2.1. Fabric Proxy

Fabric operation accesses to CFT Handle resources are performed through the fabric-proxy. Cross-proxy fences between fabric-proxy and generic-proxy are available.

## 9.7.11.3. Life of a Fabric Operation

The lifecycle of a handle starts and ends in the host, when the host-side of the CUDA application detects whether the system supports fabric operations, creates logical endpoints, binds resources to the logical endpoints, and shares them with other GPUs in the NVLink domain. To enable remote source accesses the logical endpoint readiness should be queried. The lifecycle of a fabric operation starts and ends in the device. This section only covers the PTX device-side programming model of fabric operations; refer to the Logical Endpoint section of the CUDA Driver API for the end-to-end programming model of fabric operations spanning host-code and device-code.

The lifecycle of fabric operations includes:

- Threads issue one or more fabric operations tracked by an `mbarrier.layout::v1`.
- Each thread submits the fabric operations before the associated mbarrier phase completes.
- Threads arrive-on and expect-tx at the mbarrier phase to ensure it advances once the fabric operations complete.
- Threads wait until the mbarrier phase completes.
- Threads inspect the predicate report for errors, and handle them. The status report may contain additional information about the errors.

### 9.7.11.3.1. Issue a Fabric Operation

A thread initiates fabric operations by executing any of the following fabric instructions:

- [`fabric.try_get`](fabric-try-get.md): read from CFT Handle
- [`fabric.try_put`](fabric-try-put.md): write to CFT Handle
- [`fabric.try_red`](fabric-try-red.md): reduction to CFT Handle
- [`fabric.try_pullred`](fabric-try-pullred.md): pull-reduction from CFT handle ([`multimem.ld_reduce`](../10-data-movement-conversion/multimem-ld-reduce-st-red.md) equivalent).
- [`fabric.try_get.async.tensor`](fabric-try-get-async-tensor.md): asynchronous read of tensor data from CFT Handle
- [`fabric.try_put.async.tensor`](fabric-try-put-async-tensor.md): asynchronous write of tensor data to CFT Handle
- [`fabric.try_red.async.tensor`](fabric-try-red-async-tensor.md): asynchronous reduction of tensor data to CFT Handle
- [`fabric.try_atom`](fabric-try-atom.md): asynchronous atomic operation to CFT Handle

### 9.7.11.3.2. Submit and then arrive at mbarrier

For any thread to observe completion of fabric operations via an mbarrier object, the issuing thread is required to submit those operations before the barrier phase tracking these operations advances. Otherwise, the behavior is undefined.

A single arrive expect_tx operation can be issued for multiple and different types of fabric operations tracked by the same barrier.

### 9.7.11.3.3. Wait for completion

Submitted fabric operations are guaranteed to eventually complete, and threads may block on the mbarrier to observe their completion and their report status.

### 9.7.11.3.4. Inspect status and handle errors

A single operation like `fabric.try_put` may issue many requests, and each of the requests may fail for a different reason. The failures are reported on the mbarrier objects.

Multiple different fabric operations may also be tracked by the same mbarrier object and fail for different reasons.

The `mbarrier.try_wait.phase_type::primary` operation that notifies the program of completion sets the report predicate if there were any errors; the opaque report value may contain more information. See [fabric reporting mechanism](#971141-fabric-reporting-mechanism) for details. The application can then decide how to handle the errors based on their severity nature.

## 9.7.11.4. Completion mechanisms of fabric operations

The completion of fabric operations can be tracked by mbarrier objects of type `layout::v1`. For details refer to [mbarrier based completion mechanism](../10-data-movement-conversion/async-copy/README.md). Observing completion of a fabric operation provides ordering for all memory accesses and CFT Handle resource accesses performed by the operation, irrespective of whether any errors were reported or not.

In addition to tracking the completion of the fabric operation, a subset of operation effects, such as waiting on reads from shared memory, waiting on changes in a counter value, etc., can also be tracked independently from the entire completion of the operation.

### 9.7.11.4.1. Fabric Reporting Mechanism

Fabric operations tracked by mbarrier use the `report::fabric` reporting mechanism with the following semantics:

- If the operation succeeds, the payload report (contents of the mbarrier object) is not modified. In other words, report predicate and report value both remain unchanged.
- Otherwise, the operation fails, the mbarrier report predicate is set, and the opaque report value may contain more information, which may be decoded via the `cudaFabricOpErrorStatusGet`/`Count` APIs.

The behavior of a program that combines fabric operations specifying `report::fabric` with other operations specifying different reporting mechanism is undefined.

### 9.7.11.4.2. Fabric-read completion mechanism

All fabric operations that read data from shared memory support tracking the completion of the read operation. This enables applications to reuse the shared memory read by these operations without waiting for the entire operation to complete. This is a partial completion mechanism, that is, it does not track completion of an entire asynchronous operation.

Note that since `fabric.try_get` does not read from shared memory - it writes to it - this completion mechanism does not provide any ordering for `try_get` operations.

### 9.7.11.4.3. Counted completion mechanism

Fabric operations support tracking the completion of the destination data accesses performed by `try_put` and `try_red` using a global memory counter. It enables programs to wait on data modifications by observing the counter updates. Multiple fabric operations may share the same counter concurrently. Since concurrent operations are not ordered with respect to each other, programs must wait on the counter reaching a final value.

This mechanism increments a counter by one for each byte of data accessed. The granularity at which counter updates occur is unspecified; updates may happen once per byte, once collectively at the end of the operation, or any granularity in between. The 8B-wide counter must be 256B aligned, and the counter increment is a system-scope atomic operation.

If counter and data overlap, the behavior is undefined. If the logical endpoint lacks support for counted completion, the behavior is undefined (refer to the Logical Endpoint section of the CUDA Driver API for details).

This is a partial completion mechanism that programs can use to wait on destination data accesses. For `.multimem` fabric operations with counted completion, counters only track accesses at their destination device.

## 9.7.11.5. Fabric operations

## Pages

- [9.7.11.5.1. Fabric Instructions: fabric.try_get](fabric-try-get.md) — asynchronous copy from a fabric handle into shared memory.
- [9.7.11.5.2. Fabric Instructions: fabric.try_put](fabric-try-put.md) — asynchronous copy from shared memory to a fabric handle, optionally with byte mask or counted completion.
- [9.7.11.5.3. Fabric Instructions: fabric.try_red](fabric-try-red.md) — asynchronous copy to a fabric handle with element-wise reduction.
- [9.7.11.5.4. Fabric Instructions: fabric.try_pullred](fabric-try-pullred.md) — asynchronous pull-reduction from a multicast fabric handle into shared memory.
- [9.7.11.5.5. Fabric Instructions: fabric.submit](fabric-submit.md) — submits prior fabric operations issued by the current thread.
- [9.7.11.5.6. Fabric Instructions: fabric.wait](fabric-wait.md) — waits on local shared-memory reads of submitted fabric operations.
- [9.7.11.5.7. Fabric Instructions: fabric.try_get.async.tensor](fabric-try-get-async-tensor.md) — asynchronous copy of tensor data from a fabric handle.
- [9.7.11.5.8. Fabric Instructions: fabric.try_put.async.tensor](fabric-try-put-async-tensor.md) — asynchronous copy of tensor data to a fabric handle.
- [9.7.11.5.9. Fabric Instructions: fabric.try_red.async.tensor](fabric-try-red-async-tensor.md) — asynchronous reduction of tensor data to a fabric handle.
- [9.7.11.5.10. Fabric Instructions: fabric.try_atom](fabric-try-atom.md) — asynchronous atomic operation on a fabric handle.

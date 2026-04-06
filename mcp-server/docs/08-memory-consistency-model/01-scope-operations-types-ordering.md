# 8. Memory Consistency Model

In multi-threaded executions, the side-effects of memory operations performed by each thread become visible to other threads in a partial and non-identical order. This means that any two operations may appear to happen in no order, or in different orders, to different threads. The axioms introduced by the memory consistency model specify exactly which contradictions are forbidden between the orders observed by different threads.

In the absence of any constraint, each read operation returns the value committed by some write operation to the same memory location, including the initial write to that memory location. The memory consistency model effectively constrains the set of such candidate writes from which a read operation can return a value.

## 8.1. Scope and applicability of the model

The constraints specified under this model apply to PTX programs with any PTX ISA version number, running on `sm_70` or later architectures.

The memory consistency model does not apply to texture (including `ld.global.nc`) and surface accesses.

### 8.1.1. Limitations on atomicity at system scope

When communicating with the host CPU, certain strong operations with system scope may not be performed atomically on some systems. For more details on atomicity guarantees to host memory, see the CUDA Atomicity Requirements.

## 8.2. Memory operations

The fundamental storage unit in the PTX memory model is a byte, consisting of 8 bits. Each state space available to a PTX program is a sequence of contiguous bytes in memory. Every byte in a PTX state space has a unique address relative to all threads that have access to the same state space.

Each PTX memory instruction specifies an address operand and a data type. The address operand contains a virtual address that gets converted to a physical address during memory access. The physical address and the size of the data type together define a physical memory location, which is the range of bytes starting from the physical address and extending up to the size of the data type in bytes.

The memory consistency model specification uses the terms "address" or "memory address" to indicate a virtual address, and the term "memory location" to indicate a physical memory location.

Each PTX memory instruction also specifies the operation — either a read, a write or an atomic read-modify-write — to be performed on all the bytes in the corresponding memory location.

### 8.2.1. Overlap

Two memory locations are said to overlap when the starting address of one location is within the range of bytes constituting the other location. Two memory operations are said to overlap when they specify the same virtual address and the corresponding memory locations overlap. The overlap is said to be complete when both memory locations are identical, and it is said to be partial otherwise.

### 8.2.2. Aliases

Two distinct virtual addresses are said to be aliases if they map to the same memory location.

### 8.2.3. Multimem Addresses

A multimem address is a virtual address which points to multiple distinct memory locations across devices.

Only `multimem.*` operations are valid on multimem addresses. That is, the behavior of accessing a multimem address in any other memory operation is undefined.

### 8.2.4. Memory Operations on Vector Data Types

The memory consistency model relates operations executed on memory locations with scalar data types, which have a maximum size and alignment of 64 bits. Memory operations with a vector data type are modelled as a set of equivalent memory operations with a scalar data type, executed in an unspecified order on the elements in the vector.

### 8.2.5. Memory Operations on Packed Data Types

A packed data type consists of two values of the same scalar data type, as described in Packed Data Types. These values are accessed in adjacent memory locations. A memory operation on a packed data type is modelled as a pair of equivalent memory operations on the scalar data type, executed in an unspecified order on each element of the packed data.

### 8.2.6. Initialization

Each byte in memory is initialized by a hypothetical write W0 executed before starting any thread in the program. If the byte is included in a program variable, and that variable has an initial value, then W0 writes the corresponding initial value for that byte; else W0 is assumed to have written an unknown but constant value to the byte.

## 8.3. State spaces

The relations defined in the memory consistency model are independent of state spaces. In particular, causality order closes over all memory operations across all the state spaces. But the side-effect of a memory operation in one state space can be observed directly only by operations that also have access to the same state space. This further constrains the synchronizing effect of a memory operation in addition to scope. For example, the synchronizing effect of the PTX instruction `ld.relaxed.shared.sys` is identical to that of `ld.relaxed.shared.cluster`, since no thread outside the same cluster can execute an operation that accesses the same memory location.

## 8.4. Operation types

For simplicity, the rest of the document refers to the following operation types, instead of mentioning specific instructions that give rise to them.

**Table 20 — Operation Types**

| Operation Type | Instruction/Operation |
|---|---|
| atomic operation | `atom` or `red` instruction. |
| read operation | All variants of `ld` instruction and `atom` instruction (but not `red` instruction). |
| write operation | All variants of `st` instruction, and atomic operations if they result in a write. |
| memory operation | A read or write operation. |
| volatile operation | An instruction with `.volatile` qualifier. |
| acquire operation | A memory operation with `.acquire` or `.acq_rel` qualifier. |
| release operation | A memory operation with `.release` or `.acq_rel` qualifier. |
| mmio operation | An `ld` or `st` instruction with `.mmio` qualifier. |
| memory fence operation | A `membar`, `fence.sc` or `fence.acq_rel` instruction. |
| proxy fence operation | A `fence.proxy` or a `membar.proxy` instruction. |
| strong operation | A memory fence operation, or a memory operation with a `.relaxed`, `.acquire`, `.release`, `.acq_rel`, `.volatile`, or `.mmio` qualifier. |
| weak operation | An `ld` or `st` instruction with a `.weak` qualifier. |
| synchronizing operation | A barrier instruction, fence operation, release operation or acquire operation. |

### 8.4.1. mmio Operation

An mmio operation is a memory operation with `.mmio` qualifier specified. It is usually performed on a memory location which is mapped to the control registers of peer I/O devices. It can also be used for communication between threads but has poor performance relative to non-mmio operations.

The semantic meaning of mmio operations cannot be defined precisely as it is defined by the underlying I/O device. For formal specification of semantics of mmio operation from Memory Consistency Model perspective, it is equivalent to the semantics of a strong operation. But it follows a few implementation-specific properties, if it meets the CUDA atomicity requirements at the specified scope:

- Writes are always performed and are never combined within the scope specified.

- Reads are always performed, and are not forwarded, prefetched, combined, or allowed to hit any cache within the scope specified.

As an exception, in some implementations, the surrounding locations may also be loaded. In such cases the amount of data loaded is implementation specific and varies between 32 and 128 bytes in size.

### 8.4.2. volatile Operation

A volatile operation is a memory operation with `.volatile` qualifier specified. The semantics of volatile operations are equivalent to a relaxed memory operation with system-scope but with the following extra implementation-specific constraints:

- The number of volatile instructions (not operations) executed by a program is preserved. Hardware may combine and merge volatile operations issued by multiple different volatile instructions, that is, the number of volatile operations in the program is not preserved.

- Volatile instructions are not re-ordered around other volatile instructions, but the memory operations performed by those instructions may be re-ordered around each other.

> **Note**
>
> PTX volatile operations are intended for compilers to lower volatile read and write operations from CUDA C++, and other programming languages sharing CUDA C++ volatile semantics, to PTX.
>
> Since volatile operations are relaxed at system-scope with extra constraints, prefer using other strong read or write operations (e.g. `ld.relaxed.sys` or `st.relaxed.sys`) for Inter-Thread Synchronization instead, which may deliver better performance.
>
> PTX volatile operations are not suited for Memory Mapped IO (MMIO) because volatile operations do not preserve the number of memory operations performed, and may perform more or less operations than requested in a non-deterministic way. Use `.mmio` operations instead, which strictly preserve the number of operations performed.

## 8.5. Scope

Each strong operation must specify a scope, which is the set of threads that may interact directly with that operation and establish any of the relations described in the memory consistency model. There are four scopes:

**Table 21 — Scopes**

| Scope | Description |
|---|---|
| `.cta` | The set of all threads executing in the same CTA as the current thread. |
| `.cluster` | The set of all threads executing in the same cluster as the current thread. |
| `.gpu` | The set of all threads in the current program executing on the same compute device as the current thread. This also includes other kernel grids invoked by the host program on the same compute device. |
| `.sys` | The set of all threads in the current program, including all kernel grids invoked by the host program on all compute devices, and all threads constituting the host program itself. |

Note that the warp is not a scope; the CTA is the smallest collection of threads that qualifies as a scope in the memory consistency model.

## 8.6. Proxies

A memory proxy, or a proxy is an abstract label applied to a method of memory access. When two memory operations use distinct methods of memory access, they are said to be different proxies.

Memory operations as defined in Operation types use generic method of memory access, i.e. a generic proxy. Other operations such as textures and surfaces all use distinct methods of memory access, also distinct from the generic method.

A proxy fence is required to synchronize memory operations across different proxies. Although virtual aliases use the generic method of memory access, since using distinct virtual addresses behaves as if using different proxies, they require a proxy fence to establish memory ordering.

## 8.7. Morally strong operations

Two operations are said to be morally strong relative to each other if they satisfy all of the following conditions:

- The operations are related in program order (i.e, they are both executed by the same thread), or each operation is strong and specifies a scope that includes the thread executing the other operation.

- Both operations are performed via the same proxy.

- If both are memory operations, then they overlap completely.

Most (but not all) of the axioms in the memory consistency model depend on relations between morally strong operations.

### 8.7.1. Conflict and Data-races

Two overlapping memory operations are said to conflict when at least one of them is a write.

Two conflicting memory operations are said to be in a data-race if they are not related in causality order and they are not morally strong.

### 8.7.2. Limitations on Mixed-size Data-races

A data-race between operations that overlap completely is called a uniform-size data-race, while a data-race between operations that overlap partially is called a mixed-size data-race.

The axioms in the memory consistency model do not apply if a PTX program contains one or more mixed-size data-races. But these axioms are sufficient to describe the behavior of a PTX program with only uniform-size data-races.

**Atomicity of mixed-size RMW operations**

In any program with or without mixed-size data-races, the following property holds for every pair of overlapping atomic operations A1 and A2 such that each specifies a scope that includes the other: Either the read-modify-write operation specified by A1 is performed completely before A2 is initiated, or vice versa. This property holds irrespective of whether the two operations A1 and A2 overlap partially or completely.

## 8.8. Release and Acquire Patterns

Some sequences of instructions give rise to patterns that participate in memory synchronization as described later. The release pattern makes prior operations from the current thread[^1] visible to some operations from other threads. The acquire pattern makes some operations from other threads visible to later operations from the current thread.

A release pattern on a location M consists of one of the following:

- A release operation on M

  E.g.: `st.release [M];` or `atom.release [M];` or `mbarrier.arrive.release [M];`

- Or a release or acquire-release operation on M followed by a strong write on M in program order

  E.g.: `st.release [M]; st.relaxed [M];`

- Or a release or acquire-release memory fence followed by a strong write on M in program order

  E.g.: `fence.release; st.relaxed [M];` or `fence.release; atom.relaxed [M];`

Any memory synchronization established by a release pattern only affects operations occurring in program order before the first instruction in that pattern.

An acquire pattern on a location M consists of one of the following:

- An acquire operation on M

  E.g.: `ld.acquire [M];` or `atom.acquire [M];` or `mbarrier.test_wait.acquire [M];`

- Or a strong read on M followed by an acquire operation on M in program order

  E.g.: `ld.relaxed [M]; ld.acquire [M];`

- Or a strong read on M followed by an acquire memory fence in program order

  E.g.: `ld.relaxed [M]; fence.acquire;` or `atom.relaxed [M]; fence.acquire;`

Any memory synchronization established by an acquire pattern only affects operations occurring in program order after the last instruction in that pattern.

Note that while atomic reductions conceptually perform a strong read as part of its read-modify-write sequence, this strong read does not form an acquire pattern.

E.g.: `red.add [M], 1; fence.acquire;` is not an acquire pattern.

[^1]: For both release and acquire patterns, this effect is further extended to operations in other threads through the transitive nature of causality order.

## 8.9. Ordering of memory operations

The sequence of operations performed by each thread is captured as program order while memory synchronization across threads is captured as causality order. The visibility of the side-effects of memory operations to other memory operations is captured as communication order. The memory consistency model defines contradictions that are disallowed between communication order on the one hand, and causality order and program order on the other.

### 8.9.1. Program Order

The program order relates all operations performed by a thread to the order in which a sequential processor will execute instructions in the corresponding PTX source. It is a transitive relation that forms a total order over the operations performed by the thread, but does not relate operations from different threads.

#### 8.9.1.1. Asynchronous Operations

Some PTX instructions (all variants of `cp.async`, `cp.async.bulk`, `cp.reduce.async.bulk`, `wgmma.mma_async`) perform operations that are asynchronous to the thread that executed the instruction. These asynchronous operations are ordered after prior instructions in the same thread (except in the case of `wgmma.mma_async`), but they are not part of the program order for that thread. Instead, they provide weaker ordering guarantees as documented in the instruction description.

For example, the loads and stores performed as part of a `cp.async` are ordered with respect to each other, but not to those of any other `cp.async` instructions initiated by the same thread, nor any other instruction subsequently issued by the thread with the exception of `cp.async.commit_group` or `cp.async.mbarrier.arrive`. The asynchronous mbarrier arrive-on operation performed by a `cp.async.mbarrier.arrive` instruction is ordered with respect to the memory operations performed by all prior `cp.async` operations initiated by the same thread, but not to those of any other instruction issued by the thread. The implicit mbarrier complete-tx operation that is part of all variants of `cp.async.bulk` and `cp.reduce.async.bulk` instructions is ordered only with respect to the memory operations performed by the same asynchronous instruction, and in particular it does not transitively establish ordering with respect to prior instructions from the issuing thread.

### 8.9.2. Observation Order

Observation order relates a write W to a read R through an optional sequence of atomic read-modify-write operations.

A write W precedes a read R in observation order if:

- R and W are morally strong and R reads the value written by W, or

- For some atomic operation Z, W precedes Z and Z precedes R in observation order.

### 8.9.3. Fence-SC Order

The Fence-SC order is an acyclic partial order, determined at runtime, that relates every pair of morally strong `fence.sc` operations.

### 8.9.4. Memory synchronization

Synchronizing operations performed by different threads synchronize with each other at runtime as described here. The effect of such synchronization is to establish causality order across threads.

- A `fence.sc` operation X synchronizes with a `fence.sc` operation Y if X precedes Y in the Fence-SC order.

- A `bar{.cta}.sync` or `bar{.cta}.red` or `bar{.cta}.arrive` operation synchronizes with a `bar{.cta}.sync` or `bar{.cta}.red` operation executed on the same barrier.

- A `barrier.cluster.arrive` operation synchronizes with a `barrier.cluster.wait` operation.

- A release pattern X synchronizes with an acquire pattern Y, if a write operation in X precedes a read operation in Y in observation order, and the first operation in X and the last operation in Y are morally strong.

**API synchronization**

A synchronizes relation can also be established by certain CUDA APIs.

- Completion of a task enqueued in a CUDA stream synchronizes with the start of the following task in the same stream, if any.

- For purposes of the above, recording or waiting on a CUDA event in a stream, or causing a cross-stream barrier to be inserted due to `cudaStreamLegacy`, enqueues tasks in the associated streams even if there are no direct side effects. An event record task synchronizes with matching event wait tasks, and a barrier arrival task synchronizes with matching barrier wait tasks.

- Start of a CUDA kernel synchronizes with start of all threads in the kernel. End of all threads in a kernel synchronize with end of the kernel.

- Start of a CUDA graph synchronizes with start of all source nodes in the graph. Completion of all sink nodes in a CUDA graph synchronizes with completion of the graph. Completion of a graph node synchronizes with start of all nodes with a direct dependency.

- Start of a CUDA API call to enqueue a task synchronizes with start of the task.

- Completion of the last task queued to a stream, if any, synchronizes with return from `cudaStreamSynchronize`. Completion of the most recently queued matching event record task, if any, synchronizes with return from `cudaEventSynchronize`. Synchronizing a CUDA device or context behaves as if synchronizing all streams in the context, including ones that have been destroyed.

- Returning `cudaSuccess` from an API to query a CUDA handle, such as a stream or event, behaves the same as return from the matching synchronization API.

In addition to establishing a synchronizes relation, the CUDA API synchronization mechanisms above also participate in proxy-preserved base causality order except for the tensormap-proxy which is not acquired from generic-proxy at CUDA Kernel start and must therefore be acquired explicitly using `fence.proxy.tensormap::generic.acquire` when needed.

### 8.9.5. Causality Order

Causality order captures how memory operations become visible across threads through synchronizing operations. The axiom "Causality" uses this order to constrain the set of write operations from which a read operation may read a value.

Relations in the causality order primarily consist of relations in Base causality order[^2], which is a transitive order, determined at runtime.

**Base causality order**

An operation X precedes an operation Y in base causality order if:

- X precedes Y in program order, or

- X synchronizes with Y, or

- For some operation Z,
  - X precedes Z in program order and Z precedes Y in base causality order, or
  - X precedes Z in base causality order and Z precedes Y in program order, or
  - X precedes Z in base causality order and Z precedes Y in base causality order.

**Proxy-preserved base causality order**

A memory operation X precedes a memory operation Y in proxy-preserved base causality order if X precedes Y in base causality order, and:

- X and Y are performed to the same address, using the generic proxy, or

- X and Y are performed to the same address, using the same proxy, and by the same thread block, or

- X and Y are aliases and there is an alias proxy fence along the base causality path from X to Y.

**Causality order**

Causality order combines base causality order with some non-transitive relations as follows:

An operation X precedes an operation Y in causality order if:

- X precedes Y in proxy-preserved base causality order, or

- For some operation Z, X precedes Z in observation order, and Z precedes Y in proxy-preserved base causality order.

[^2]: The transitivity of base causality order accounts for the "cumulativity" of synchronizing operations.

### 8.9.6. Coherence Order

There exists a partial transitive order that relates overlapping write operations, determined at runtime, called the coherence order[^3]. Two overlapping write operations are related in coherence order if they are morally strong or if they are related in causality order. Two overlapping writes are unrelated in coherence order if they are in a data-race, which gives rise to the partial nature of coherence order.

[^3]: Coherence order cannot be observed directly since it consists entirely of write operations. It may be observed indirectly by its use in constraining the set of candidate writes that a read operation may read from.

### 8.9.7. Communication Order

The communication order is a non-transitive order, determined at runtime, that relates write operations to other overlapping memory operations.

- A write W precedes an overlapping read R in communication order if R returns the value of any byte that was written by W.

- A write W precedes a write W' in communication order if W precedes W' in coherence order.

- A read R precedes an overlapping write W in communication order if, for any byte accessed by both R and W, R returns the value written by a write W' that precedes W in coherence order.

Communication order captures the visibility of memory operations — when a memory operation X1 precedes a memory operation X2 in communication order, X1 is said to be visible to X2.

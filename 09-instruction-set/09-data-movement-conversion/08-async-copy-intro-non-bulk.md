## 9.7.9.25. Data Movement and Conversion Instructions: Asynchronous copy

An asynchronous copy operation performs the underlying operation asynchronously in the background, thus allowing the issuing threads to perform subsequent tasks.

An asynchronous copy operation can be a bulk operation that operates on a large amount of data, or a non-bulk operation that operates on smaller sized data. The amount of data handled by a bulk asynchronous operation must be a multiple of 16 bytes.

An asynchronous copy operation typically includes the following sequence:

1. Optionally, reading from the tensormap.
2. Reading data from the source location(s).
3. Writing data to the destination location(s).
4. Writes being made visible to the executing thread or other threads.

### 9.7.9.25.1. Completion Mechanisms for Asynchronous Copy Operations

A thread must explicitly wait for the completion of an asynchronous copy operation in order to access the result of the operation. Once an asynchronous copy operation is initiated, modifying the source memory location or tensor descriptor or reading from the destination memory location before the asynchronous operation completes, exhibits undefined behavior.

This section describes two asynchronous copy operation completion mechanisms supported in PTX: Async-group mechanism and mbarrier-based mechanism.

Asynchronous operations may be tracked by either of the completion mechanisms or both mechanisms. The tracking mechanism is instruction/instruction-variant specific.

#### 9.7.9.25.1.1. Async-group mechanism

When using the async-group completion mechanism, the issuing thread specifies a group of asynchronous operations, called async-group, using a commit operation and tracks the completion of this group using a wait operation. The thread issuing the asynchronous operation must create separate async-groups for bulk and non-bulk asynchronous operations.

A commit operation creates a per-thread async-group containing all prior asynchronous operations tracked by async-group completion and initiated by the executing thread but none of the asynchronous operations following the commit operation. A committed asynchronous operation belongs to a single async-group.

When an async-group completes, all the asynchronous operations belonging to that group are complete and the executing thread that initiated the asynchronous operations can read the result of the asynchronous operations. All async-groups committed by an executing thread always complete in the order in which they were committed. There is no ordering between asynchronous operations within an async-group.

A typical pattern of using async-group as the completion mechanism is as follows:

1. Initiate the asynchronous operations.
2. Group the asynchronous operations into an async-group using a commit operation.
3. Wait for the completion of the async-group using the wait operation.
4. Once the async-group completes, access the results of all asynchronous operations in that async-group.

#### 9.7.9.25.1.2. Mbarrier-based mechanism

A thread can track the completion of one or more asynchronous operations using the current phase of an mbarrier object. When the current phase of the mbarrier object is complete, it implies that all asynchronous operations tracked by this phase are complete, and all threads participating in that mbarrier object can access the result of the asynchronous operations.

The mbarrier object to be used for tracking the completion of an asynchronous operation can be either specified along with the asynchronous operation as part of its syntax, or as a separate operation. For a bulk asynchronous operation, the mbarrier object must be specified in the asynchronous operation, whereas for non-bulk operations, it can be specified after the asynchronous operation.

A typical pattern of using mbarrier-based completion mechanism is as follows:

1. Initiate the asynchronous operations.
2. Set up an mbarrier object to track the asynchronous operations in its current phase, either as part of the asynchronous operation or as a separate operation.
3. Wait for the mbarrier object to complete its current phase using mbarrier.test_wait or mbarrier.try_wait.
4. Once the mbarrier.test_wait or mbarrier.try_wait operation returns True, access the results of the asynchronous operations tracked by the mbarrier object.

### 9.7.9.25.2. Async Proxy

The `cp{.reduce}.async.bulk` operations are performed in the asynchronous proxy (or async proxy).

Accessing the same memory location across multiple proxies needs a cross-proxy fence. For the async proxy, `fence.proxy.async` should be used to synchronize memory between generic proxy and the async proxy.

The completion of a `cp{.reduce}.async.bulk` operation is followed by an implicit generic-async proxy fence. So the result of the asynchronous operation is made visible to the generic proxy as soon as its completion is observed. Async-group OR mbarrier-based completion mechanism must be used to wait for the completion of the `cp{.reduce}.async.bulk` instructions.

### 9.7.9.25.3. Data Movement and Conversion Instructions: Non-bulk copy

#### 9.7.9.25.3.1. Data Movement and Conversion Instructions: cp.async

##### cp.async

Initiates an asynchronous copy operation from one state space to another.

**Syntax**

```
cp.async.ca.shared{::cta}.global{.level::cache_hint}{.level::prefetch_size}
                         [dst], [src], cp-size{, src-size}{, cache-policy} ;
cp.async.cg.shared{::cta}.global{.level::cache_hint}{.level::prefetch_size}
                         [dst], [src], 16{, src-size}{, cache-policy} ;
cp.async.ca.shared{::cta}.global{.level::cache_hint}{.level::prefetch_size}
                         [dst], [src], cp-size{, ignore-src}{, cache-policy} ;
cp.async.cg.shared{::cta}.global{.level::cache_hint}{.level::prefetch_size}
                         [dst], [src], 16{, ignore-src}{, cache-policy} ;

.level::cache_hint =     { .L2::cache_hint }
.level::prefetch_size =  { .L2::64B, .L2::128B, .L2::256B }
cp-size =                { 4, 8, 16 }
```

**Description**

cp.async is a non-blocking instruction which initiates an asynchronous copy operation of data from the location specified by source address operand src to the location specified by destination address operand dst. Operand src specifies a location in the global state space and dst specifies a location in the shared state space.

Operand cp-size is an integer constant which specifies the size of data in bytes to be copied to the destination dst. cp-size can only be 4, 8 and 16.

Instruction cp.async allows optionally specifying a 32-bit integer operand src-size. Operand src-size represents the size of the data in bytes to be copied from src to dst and must be less than cp-size. In such case, remaining bytes in destination dst are filled with zeros. Specifying src-size larger than cp-size results in undefined behavior.

The optional and non-immediate predicate argument ignore-src specifies whether the data from the source location src should be ignored completely. If the source data is ignored then zeros will be copied to destination dst. If the argument ignore-src is not specified then it defaults to False.

Supported alignment requirements and addressing modes for operand src and dst are described in Addresses as Operands.

The mandatory `.async` qualifier indicates that the cp instruction will initiate the memory copy operation asynchronously and control will return to the executing thread before the copy operation is complete. The executing thread can then use async-group based completion mechanism or the mbarrier based completion mechanism to wait for completion of the asynchronous copy operation.

There is no ordering guarantee between two cp.async operations if they are not explicitly synchronized using `cp.async.wait_all` or `cp.async.wait_group` or mbarrier instructions.

As described in Cache Operators, the `.cg` qualifier indicates caching of data only at global level cache L2 and not at L1 whereas `.ca` qualifier indicates caching of data at all levels including L1 cache. Cache operator are treated as performance hints only.

cp.async is treated as a weak memory operation performed in the generic proxy in the Memory Consistency Model.

The `.level::prefetch_size` qualifier is a hint to fetch additional data of the specified size into the respective cache level. The qualifier `.level::prefetch_size` may only be used with `.global` state space.

The `.level::prefetch_size` qualifier is treated as a performance hint only.

When the optional argument cache-policy is specified, the qualifier `.level::cache_hint` is required. cache-policy is a hint to the cache subsystem and may not always be respected. It is treated as a performance hint only, and does not change the memory consistency behavior of the program.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for `.level::cache_hint` and `.level::prefetch_size` qualifiers introduced in PTX ISA version 7.4.

Support for ignore-src operand introduced in PTX ISA version 7.5.

Support for sub-qualifier `::cta` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_80 or higher.

Sub-qualifier `::cta` requires sm_30 or higher.

**Examples**

```ptx
cp.async.ca.shared.global  [shrd],    [gbl + 4], 4;
cp.async.ca.shared::cta.global  [%r0 + 8], [%r1],     8;
cp.async.cg.shared.global  [%r2],     [%r3],     16;

cp.async.cg.shared.global.L2::64B   [%r2],      [%r3],     16;
cp.async.cg.shared.global.L2::128B  [%r0 + 16], [%r1],     16;
cp.async.cg.shared.global.L2::256B  [%r2 + 32], [%r3],     16;

createpolicy.fractional.L2::evict_last.L2::evict_unchanged.b64 cache-policy, 0.25;
cp.async.ca.shared.global.L2::cache_hint [%r2], [%r1], 4, cache-policy;

cp.async.ca.shared.global                   [shrd], [gbl], 4, p;
cp.async.cg.shared.global.L2::cache_hint   [%r0], [%r2], 16, q, cache-policy;
```

#### 9.7.9.25.3.2. Data Movement and Conversion Instructions: cp.async.commit_group

##### cp.async.commit_group

Commits all prior initiated but uncommitted cp.async instructions into a cp.async-group.

**Syntax**

```
cp.async.commit_group ;
```

**Description**

cp.async.commit_group instruction creates a new cp.async-group per thread and batches all prior cp.async instructions initiated by the executing thread but not committed to any cp.async-group into the new cp.async-group. If there are no uncommitted cp.async instructions then cp.async.commit_group results in an empty cp.async-group.

An executing thread can wait for the completion of all cp.async operations in a cp.async-group using cp.async.wait_group.

There is no memory ordering guarantee provided between any two cp.async operations within the same cp.async-group. So two or more cp.async operations within a cp.async-group copying data to the same location results in undefined behavior.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
// Example 1:
cp.async.ca.shared.global [shrd], [gbl], 4;
cp.async.commit_group ; // Marks the end of a cp.async group

// Example 2:
cp.async.ca.shared.global [shrd1],   [gbl1],   8;
cp.async.ca.shared.global [shrd1+8], [gbl1+8], 8;
cp.async.commit_group ; // Marks the end of cp.async group 1

cp.async.ca.shared.global [shrd2],    [gbl2],    16;
cp.async.cg.shared.global [shrd2+16], [gbl2+16], 16;
cp.async.commit_group ; // Marks the end of cp.async group 2
```

#### 9.7.9.25.3.3. Data Movement and Conversion Instructions: cp.async.wait_group / cp.async.wait_all

##### cp.async.wait_group, cp.async.wait_all

Wait for completion of prior asynchronous copy operations.

**Syntax**

```
cp.async.wait_group N;
cp.async.wait_all ;
```

**Description**

cp.async.wait_group instruction will cause executing thread to wait till only N or fewer of the most recent cp.async-groups are pending and all the prior cp.async-groups committed by the executing threads are complete. For example, when N is 0, the executing thread waits on all the prior cp.async-groups to complete. Operand N is an integer constant.

cp.async.wait_all is equivalent to:

```
cp.async.commit_group;
cp.async.wait_group 0;
```

An empty cp.async-group is considered to be trivially complete.

Writes performed by cp.async operations are made visible to the executing thread only after: The completion of cp.async.wait_all, or the completion of cp.async.wait_group on the cp.async-group in which the cp.async belongs to, or mbarrier.test_wait returns True on an mbarrier object which is tracking the completion of the cp.async operation.

There is no ordering between two cp.async operations that are not synchronized with cp.async.wait_all or cp.async.wait_group or mbarrier objects.

cp.async.wait_group and cp.async.wait_all does not provide any ordering and visibility guarantees for any other memory operation apart from cp.async.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

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


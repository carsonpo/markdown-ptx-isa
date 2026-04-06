### 9.7.13.15.10. Parallel Synchronization and Communication Instructions: mbarrier.inval

#### mbarrier.inval

Invalidates the mbarrier object.

**Syntax**

```
mbarrier.inval{.shared{::cta}}.b64 [addr];
```

**Description**

`mbarrier.inval` invalidates the mbarrier object at the location specified by the address operand addr.

An mbarrier object must be invalidated before using its memory location for any other purpose.

Performing any mbarrier operation except `mbarrier.init` on a memory location that does not contain a valid mbarrier object, results in undefined behaviour.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` state space then the behavior is undefined.

Supported addressing modes for operand addr is as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

**PTX ISA Notes**

Introduced in PTX ISA version 7.0.

Support for sub-qualifier `::cta` on `.shared` introduced in PTX ISA version 7.8.

**Target ISA Notes**

Requires sm_80 or higher.

**Examples**

```ptx
.shared .b64 shmem;
.reg    .b64 addr;
.reg    .b32 %r1;
.reg    .pred t0;

// Example 1 :
bar.sync                      0;
@t0 mbarrier.init.b64     [addr], %r1;
// ... other mbarrier operations on addr
bar.sync                      0;
@t0 mbarrier.inval.b64    [addr];


// Example 2 :
bar.cta.sync                  0;
mbarrier.init.shared.b64           [shmem], 12;
// ... other mbarrier operations on shmem
bar.cta.sync                  0;
@t0 mbarrier.inval.shared.b64      [shmem];

// shmem can be reused here for unrelated use :
bar.cta.sync                  0;
st.shared.b64                      [shmem], ...;

// shmem can be re-initialized as mbarrier object :
bar.cta.sync                  0;
@t0 mbarrier.init.shared.b64       [shmem], 24;
// ... other mbarrier operations on shmem
bar.cta.sync                  0;
@t0 mbarrier.inval.shared::cta.b64 [shmem];
```

### 9.7.13.15.11. Parallel Synchronization and Communication Instructions: mbarrier.expect_tx

#### mbarrier.expect_tx

Performs expect-tx operation on the mbarrier object.

**Syntax**

```
mbarrier.expect_tx{.sem.scope}{.space}.b64 [addr], txCount;

.sem   = { .relaxed }
.scope = { .cta, .cluster }
.space = { .shared{::cta}, .shared::cluster }
```

**Description**

A thread executing `mbarrier.expect_tx` performs an expect-tx operation on the mbarrier object at the location specified by the address operand addr. The 32-bit unsigned integer operand txCount specifies the expectCount argument to the expect-tx operation.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` or `.shared::cluster` state space then the behavior is undefined.

Supported addressing modes for operand addr are as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the Memory Consistency Model. The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that directly observe the memory synchronizing effect of this operation, as described in the Memory Consistency Model.

Qualifiers `.sem` and `.scope` must be specified together.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
mbarrier.expect_tx.b64                       [addr], 32;
mbarrier.expect_tx.relaxed.cta.shared.b64    [mbarObj1], 512;
mbarrier.expect_tx.relaxed.cta.shared.b64    [mbarObj2], 512;
```

### 9.7.13.15.12. Parallel Synchronization and Communication Instructions: mbarrier.complete_tx

#### mbarrier.complete_tx

Performs complete-tx operation on the mbarrier object.

**Syntax**

```
mbarrier.complete_tx{.sem.scope}{.space}.b64 [addr], txCount;

.sem   = { .relaxed }
.scope = { .cta, .cluster }
.space = { .shared{::cta}, .shared::cluster }
```

**Description**

A thread executing `mbarrier.complete_tx` performs a complete-tx operation on the mbarrier object at the location specified by the address operand addr. The 32-bit unsigned integer operand txCount specifies the completeCount argument to the complete-tx operation.

`mbarrier.complete_tx` does not involve any asynchronous memory operations and only simulates the completion of an asynchronous memory operation and its side effect of signaling to the mbarrier object.

If no state space is specified then Generic Addressing is used. If the address specified by addr does not fall within the address window of `.shared::cta` or `.shared::cluster` state space then the behavior is undefined.

Supported addressing modes for operand addr are as described in Addresses as Operands. Alignment for operand addr is as described in the Size and alignment of mbarrier object.

The optional `.sem` qualifier specifies a memory synchronizing effect as described in the Memory Consistency Model. The `.relaxed` qualifier does not provide any memory ordering semantics and visibility guarantees.

The optional `.scope` qualifier indicates the set of threads that directly observe the memory synchronizing effect of this operation, as described in the Memory Consistency Model.

Qualifiers `.sem` and `.scope` must be specified together.

**PTX ISA Notes**

Introduced in PTX ISA version 8.0.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
mbarrier.complete_tx.b64             [addr],     32;
mbarrier.complete_tx.shared.b64      [mbarObj1], 512;
mbarrier.complete_tx.relaxed.cta.b64 [addr2],    32;
```


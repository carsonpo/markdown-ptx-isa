## 9.7.13.16. Parallel Synchronization and Communication Instructions: tensormap.cp_fenceproxy

### tensormap.cp_fenceproxy

A fused copy and fence operation.

**Syntax**

```
tensormap.cp_fenceproxy.cp_qualifiers.fence_qualifiers.sync.aligned  [dst], [src], size;

.cp_qualifiers    = { .global.shared::cta }
.fence_qualifiers = { .to_proxy::from_proxy.release.scope }
.to_proxy::from_proxy  = { .tensormap::generic }
.scope            = { .cta, .cluster, .gpu , .sys }
```

**Description**

The `tensormap.cp_fenceproxy` instructions perform the following operations in order:

Copies data of size specified by the size argument, in bytes, from the location specified by the address operand src in shared memory to the location specified by the address operand dst in the global memory, in the generic proxy.

Establishes a uni-directional proxy release pattern on the ordering from the copy operation to the subsequent access performed in the tensormap proxy on the address dst.

The valid value of immediate operand size is 128.

The operands src and dst specify non-generic addresses in `shared::cta` and global state space respectively.

The `.scope` qualifier specifies the set of threads that can directly observe the proxy synchronizing effect of this operation, as described in Memory Consistency Model.

The mandatory `.sync` qualifier indicates that `tensormap.cp_fenceproxy` causes the executing thread to wait until all threads in the warp execute the same `tensormap.cp_fenceproxy` instruction before resuming execution.

The mandatory `.aligned` qualifier indicates that all threads in the warp must execute the same `tensormap.cp_fenceproxy` instruction. In conditionally executed code, an aligned `tensormap.cp_fenceproxy` instruction should only be used if it is known that all threads in the warp evaluate the condition identically, otherwise behavior is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 8.3.

**Target ISA Notes**

Requires sm_90 or higher.

**Examples**

```ptx
// Example: manipulate a tensor-map object and then consume it in cp.async.bulk.tensor

.reg .b64 new_addr;
.global .align 128 .b8 gbl[128];
.shared .align 128 .b8 sMem[128];

cp.async.bulk.shared::cluster.global.mbarrier::complete_tx::bytes [sMem], [gMem], 128, [mbar];
...
try_wait_loop:
mbarrier.try_wait.shared.b64 p, [mbar], state;
@!p bra try_wait_loop;

tensormap.replace.tile.global_address.shared.b1024.b64   [sMem], new_addr;
tensormap.cp_fenceproxy.global.shared::cta.tensormap::generic.release.gpu.sync.aligned
                                                         [gbl], [sMem], 128;
fence.proxy.tensormap::generic.acquire.gpu [gbl], 128;
cp.async.bulk.tensor.1d.shared::cluster.global.tile  [addr0], [gbl, {tc0}], [mbar0];
```

## 9.7.13.17. Parallel Synchronization and Communication Instructions: clusterlaunchcontrol.try_cancel

### clusterlaunchcontrol.try_cancel

Requests cancellation of cluster which is not launched yet.

**Syntax**

```
clusterlaunchcontrol.try_cancel.async{.space}.completion_mechanism{.multicast::cluster::all}.b128 [addr], [mbar];

.completion_mechanism = { .mbarrier::complete_tx::bytes };
.space = { .shared::cta };
```

**Description**

The `clusterlaunchcontrol.try_cancel` instruction requests atomically cancelling the launch of a cluster that has not started running yet. It asynchronously writes an opaque response to shared memory indicating whether the operation succeeded or failed. The completion of the asynchronous operation is tracked using the mbarrier completion mechanism at `.cluster` scope. This instruction accesses its mbarrier operand using generic-proxy.

On success, the opaque response contains the ctaid of the first CTA of the canceled cluster; no other successful response from other `clusterlaunchcontrol.try_cancel` operations from the same grid will contain that id.

The mandatory `.async` qualifier indicates that the instruction will initiate the cancellation operation asynchronously and control will return to the executing thread before the requested operation is complete.

The `.space` qualifier is specified, both operands addr and mbar must be in the `.shared::cta` state space. Otherwise, generic addressing will be assumed for both. The result is undefined if any of address operands do not fall within the address window of `.shared::cta`.

The qualifier `.completion_mechanism` specifies that upon completion of the asynchronous operation, complete-tx operation, with completeCount argument equal to amount of data stored in bytes, will be performed on the mbarrier object specified by the operand mbar.

The executing thread can then use mbarrier instructions to wait for completion of the asynchronous operation. No other synchronization mechanisms described in Memory Consistency Model can be used to guarantee the completion of the asynchronous copy operations.

The `.multicast::cluster::all` qualifier indicates that the response is asynchronously written using weak async-proxy writes to the corresponding local shared memory addr of each CTA in the requesting cluster. The completion of the writes to addr of a particular CTA is signaled via a complete-tx operation to the mbarrier object on the shared memory of that CTA.

The behavior of instruction with `.multicast::cluster::all` qualifier is undefined if any CTA in the cluster is exited.

Operand addr specifies the naturally aligned address of the 16-byte wide shared memory location where the request's response is written.

The response of `clusterlaunchcontrol.try_cancel` instruction will be 16-byte opaque value and will be available at location specified by operand addr. After loading this response into 16-byte register, instruction `clusterlaunchcontrol.query_cancel` can be used to check if request was successful and to retrieve ctaid of the first CTA of the canceled cluster.

If the executing CTA has already observed the completion of a `clusterlaunchcontrol.try_cancel` instruction as failed, then the behavior of issuing a subsequent `clusterlaunchcontrol.try_cancel` instruction is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_100 or higher.

Qualifier `.multicast::cluster::all` is supported on the following architectures:

- sm_100a
- sm_101a (Renamed to sm_110a from PTX ISA version 9.0)
- sm_120a

And is supported on the following family-specific architectures from PTX ISA version 8.8:

- sm_100f or higher in the same family
- sm_101f or higher in the same family (Renamed to sm_110f from PTX ISA version 9.0)
- sm_120f or higher in the same family
- sm_110f or higher in the same family

**Examples**

```ptx
// Assumption: 1D cluster (cluster_ctaid.y/.z == 1) with 1 thread per CTA.

// Current Cluster to be processed: initially the launched cluster:
mov.b32 xctaid, %ctaid.x;

// Establish full synchronization across all CTAs of the cluster for the first iteration.
// Weaker synchronization may suffice depending on initialization sequence.
barrier.cluster.arrive;
barrier.cluster.wait;

// Iteration loop over all cluster CTAs
processCluster:
  mov.u32  %r0, %tid.x;
  setp.u32.eq p0, %r0, 0x0;
  // Elect a leader thread (thread idx 0) for each CTA to arrive and expect_tx at
  // each CTA local shared memory barrier:
  mov.u32  %r0, %tid.x;
  setp.u32.eq p0, %r0, 0x0;
  // All other threads skip to processing the work of the current cluster:
  @!p0 bra processCurrentCluster;

  // All CTAs in the cluster arrive at their local SMEM barrier and set 16B handle tx count:
  mbarrier.arrive.expect_tx.cluster.relaxed.shared::cta.b64 state, [mbar], 16;

  // First CTA in Cluster attempts to cancel a not-yet-started cluster:
  mov.u32  %r0, %cluster_ctaid.x;
  setp.u32.eq p0, %r0, 0x0;
  @p0 clusterlaunchcontrol.try_cancel.async.mbarrier::complete_tx::bytes.multicast::cluster::all.b128 [addr], [mbar];

  processCurrentCluster:
    // ...process current cluster ("xctaid") while cancellation request for next cluster runs asynchronously...

  // After processing current cluster, wait on cancellation request response for next cluster via specified mbarrier:
  waitLoop:
    // .acquire prevents weak handle read ("ld.shared handle, [addr]") from overtaking this mbarrier.try_wait:
    mbarrier.try_wait.cluster.acquire.shared::cta.b64   complete, [mbar], state;
    @!complete bra waitLoop;
   // Cancellation request has completed.

  // Generic-proxy weak read of cancellation request into 16-byte wide register:
  ld.shared.b128 handle, [addr];

  // Check whether cancellation succeeded:
  clusterlaunchcontrol.query_cancel.is_canceled.pred.b128 p, handle;
  // If cancellation request failed, we couldn't cancel any other cluster, so all current cluster CTAs exit.
  @!p ret;

  // Otherwise, cancellation request succeeded.
  // Extract "ctaid" of first cancelled-cluster CTA which we'll process in next "processCluster" loop iteration:
  @p clusterlaunchcontrol.query_cancel.get_first_ctaid.v4.b32.b128 {xctaid, _, _, _},  handle;

  // Release current iteration generic-proxy weak read of handle ("ld.shared handle, [addr]")
  // before next iteration async-proxy write to handle ("clusterlaunchcontrol.try_cancel [addr]")
  fence.proxy.async::generic.release.sync_restrict::shared::cta.cluster;

  // Arrive and wait at the next iteration cluster barrier with relaxed semantics.
  barrier.cluster.arrive.relaxed;
  barrier.cluster.wait;

  // Acquire prior iteration generic-proxy weak read of handle ("ld.shared handle, [addr]")
  // before current iteration async-proxy write to handle ("clusterlaunchcontrol.try_cancel [addr]")
  fence.proxy.async::generic.acquire.sync_restrict::shared::cluster.cluster;

  bra processCluster;
```

## 9.7.13.18. Parallel Synchronization and Communication Instructions: clusterlaunchcontrol.query_cancel

### clusterlaunchcontrol.query_cancel

Queries response of clusterlaunchcontrol.try_cancel operation.

**Syntax**

```
clusterlaunchcontrol.query_cancel.is_canceled.pred.b128 pred, try_cancel_response;

clusterlaunchcontrol.query_cancel.get_first_ctaid.v4.b32.b128 {xdim, ydim, zdim, _},  try_cancel_response;

clusterlaunchcontrol.query_cancel.get_first_ctaid{::dimension}.b32.b128 reg, try_cancel_response;

::dimension = { ::x, ::y, ::z };
```

**Description**

Instruction `clusterlaunchcontrol.query_cancel` can be used to decode opaque response written by instruction `clusterlaunchcontrol.try_cancel`.

After loading response from `clusterlaunchcontrol.try_cancel` instruction into 16-byte register it can be further queried using `clusterlaunchcontrol.query_cancel` instruction as follows:

`clusterlaunchcontrol.query_cancel.is_canceled.pred.b128`: If the cluster is canceled successfully, predicate p is set to true; otherwise, it is set to false.

If the request succeeded, the instruction `clusterlaunchcontrol.query_cancel.get_first_ctaid` extracts the CTA id of the first CTA in the canceled cluster. By default, the instruction returns a `.v4` vector whose first three elements are the x, y and z coordinate of first CTA in canceled cluster. The contents of the 4th element are unspecified. The explicit `.get_first_ctaid::x`, `.get_first_ctaid::y`, or `.get_first_ctaid::z` qualifiers can be used to extract individual x, y or z coordinates into a 32-bit register.

If the request fails the behavior of `clusterlaunchcontrol.query_cancel.get_first_ctaid` is undefined.

**PTX ISA Notes**

Introduced in PTX ISA version 8.6.

**Target ISA Notes**

Requires sm_100 or higher.

**Examples**

```ptx
clusterlaunchcontrol.query_cancel.is_canceled pred.b128 p, handle;

@p clusterlaunchcontrol.query_cancel.get_first_ctaid.v4.b32.b128 {xdim, ydim, zdim, ignr}  handle;

clusterlaunchcontrol.query_cancel.get_first_ctaid::x.b32.b128 reg0, handle;

clusterlaunchcontrol.query_cancel.get_first_ctaid::y.b32.b128 reg1, handle;

clusterlaunchcontrol.query_cancel.get_first_ctaid::z.b32.b128 reg2, handle;
```

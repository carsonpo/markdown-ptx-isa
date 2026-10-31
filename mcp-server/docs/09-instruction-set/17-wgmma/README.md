# 9.7.17. Asynchronous Warpgroup Level Matrix Multiply-Accumulate Instructions

The warpgroup level matrix multiply and accumulate operation has either of the following forms, where matrix D is called accumulator:

- `D = A * B + D`
- `D = A * B`, where the input from accumulator D is disabled.

The `wgmma` instructions perform warpgroup level matrix multiply-and-accumulate operation by having all threads in a warpgroup collectively perform the following actions:

- Load matrices A, B and D into registers or into shared memory.
- Perform the following fence operations:
  - `wgmma.fence` operations to indicate that the register/shared-memory across the warpgroup have been written into.
  - `fence.proxy.async` operation to make the generic proxy operations visible to the async proxy.
- Issue the asynchronous matrix multiply and accumulate operations using the `wgmma.mma_async` operation on the input matrices. The `wgmma.mma_async` operation is performed in the async proxy.
- Create a wgmma-group and commit all the prior outstanding `wgmma.mma_async` operations into the group, by using `wgmma.commit_group` operation.
- Wait for the completion of the required wgmma-group.
- Once the wgmma-group completes, all the `wgmma.mma_async` operations have been performed and completed.

## 9.7.17.1. Warpgroup

A warpgroup is a set of four contiguous warps such that the warp-rank of the first warp is a multiple of 4.

warp-rank of a warp is defined as:

```ptx
(%tid.x + %tid.y * %ntid.x  + %tid.z * %ntid.x * %ntid.y) / 32
```

## Pages

- [9.7.17.2. Matrix Shape](matrix-shapes.md) — supported MxNxK shapes per multiplicand type and sparsity for `wgmma.mma_async`.
- [9.7.17.3. Matrix Data-types](matrix-datatypes.md) — allowed multiplicand and accumulator data-type combinations.
- [9.7.17.4. Async Proxy](async-proxy.md) — the async proxy in which `wgmma.mma_async` executes and the fences it requires.
- [9.7.17.5. Asynchronous Warpgroup Level Matrix Multiply-Accumulate Operation using wgmma.mma_async instruction](mma-async/README.md) — register fragments, shared memory layouts, matrix descriptor and the `wgmma.mma_async` instruction.
- [9.7.17.6. Asynchronous Warpgroup Level Matrix Multiply-Accumulate Operation using wgmma.mma_async.sp instruction](mma-async-sp/README.md) — sparse storage, sparse fragments and the `wgmma.mma_async.sp` instruction.
- [9.7.17.7.1. Asynchronous Multiply-and-Accumulate Instruction: wgmma.fence](wgmma-fence.md) — orders register accesses between `wgmma.mma_async` and other operations.
- [9.7.17.7.2. Asynchronous Multiply-and-Accumulate Instruction: wgmma.commit_group](wgmma-commit-group.md) — commits prior uncommitted `wgmma.mma_async` operations into a wgmma-group.
- [9.7.17.7.3. Asynchronous Multiply-and-Accumulate Instruction: wgmma.wait_group](wgmma-wait-group.md) — waits until the specified number of wgmma-groups are pending.

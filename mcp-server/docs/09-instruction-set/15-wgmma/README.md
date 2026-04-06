# 9.7.15. Asynchronous Warpgroup Level Matrix Multiply-Accumulate Instructions

The warpgroup level matrix multiply and accumulate operation has either of the following forms, where matrix D is called accumulator:

```
D = A * B + D
```

```
D = A * B, where the input from accumulator D is disabled.
```

The wgmma instructions perform warpgroup level matrix multiply-and-accumulate operation by having all threads in a warpgroup collectively perform the following actions:

1. Load matrices A, B and D into registers or into shared memory.

2. Perform the following fence operations:
   - `wgmma.fence` operations to indicate that the register/shared-memory across the warpgroup have been written into.
   - `fence.proxy.async` operation to make the generic proxy operations visible to the async proxy.

3. Issue the asynchronous matrix multiply and accumulate operations using the `wgmma.mma_async` operation on the input matrices. The `wgmma.mma_async` operation is performed in the async proxy.

4. Create a wgmma-group and commit all the prior outstanding `wgmma.mma_async` operations into the group, by using `wgmma.commit_group` operation.

5. Wait for the completion of the required wgmma-group.

Once the wgmma-group completes, all the `wgmma.mma_async` operations have been performed and completed.

## 9.7.15.1. Warpgroup

A warpgroup is a set of four contiguous warps such that the warp-rank of the first warp is a multiple of 4.

warp-rank of a warp is defined as:

```
(%tid.x + %tid.y * %ntid.x  + %tid.z * %ntid.x * %ntid.y) / 32
```

## Subsections

- [9.7.15.2 Matrix Shapes](matrix-shapes.md)
- [9.7.15.3 Matrix Data-types](matrix-datatypes.md)
- [9.7.15.4 Async Proxy](async-proxy.md)
- [9.7.15.5 / 9.7.15.6 / 9.7.15.7 MMA Async Operations](mma-async/)
  - [Register Fragments](mma-async/register-fragments.md)
  - [Shared Memory Matrix Layout](mma-async/shared-memory-layout.md)
  - [Matrix Descriptor Format](mma-async/matrix-descriptor.md)
  - [wgmma Instructions](mma-async/wgmma-instructions.md)

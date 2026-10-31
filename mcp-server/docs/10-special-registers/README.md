# 10. Special Registers

PTX includes a number of predefined, read-only variables, which are visible as special registers and accessed through `mov` or `cvt` instructions.

The special registers are:

- `%tid`
- `%ntid`
- `%laneid`
- `%warpid`
- `%nwarpid`
- `%ctaid`
- `%nctaid`
- `%smid`
- `%nsmid`
- `%gridid`
- `%is_explicit_cluster`
- `%clusterid`
- `%nclusterid`
- `%cluster_ctaid`
- `%cluster_nctaid`
- `%cluster_ctarank`
- `%cluster_nctarank`
- `%lanemask_eq`, `%lanemask_le`, `%lanemask_lt`, `%lanemask_ge`, `%lanemask_gt`
- `%clock`, `%clock_hi`, `%clock64`
- `%pm0`, ..., `%pm7`
- `%pm0_64`, ..., `%pm7_64`
- `%envreg0`, ..., `%envreg31`
- `%globaltimer`, `%globaltimer_lo`, `%globaltimer_hi`
- `%reserved_smem_offset_begin`, `%reserved_smem_offset_end`, `%reserved_smem_offset_cap`, `%reserved_smem_offset<2>`
- `%total_smem_size`
- `%aggr_smem_size`
- `%dynamic_smem_size`
- `%current_graph_exec`
- `%perctamemoryoffset`
- `%perctamemorysize`

## Pages

- [10.1. Special Registers: %tid](tid.md) — Thread identifier within a CTA.
- [10.2. Special Registers: %ntid](ntid.md) — Number of thread IDs per CTA.
- [10.3. Special Registers: %laneid](laneid.md) — Lane identifier within the warp.
- [10.4. Special Registers: %warpid](warpid.md) — Warp identifier within a CTA.
- [10.5. Special Registers: %nwarpid](nwarpid.md) — Maximum number of warp identifiers.
- [10.6. Special Registers: %ctaid](ctaid.md) — CTA identifier within a grid.
- [10.7. Special Registers: %nctaid](nctaid.md) — Number of CTA ids per grid.
- [10.8. Special Registers: %smid](smid.md) — SM identifier on which the thread executes.
- [10.9. Special Registers: %nsmid](nsmid.md) — Maximum number of SM identifiers.
- [10.10. Special Registers: %gridid](gridid.md) — Temporal grid identifier.
- [10.11. Special Registers: %is_explicit_cluster](is_explicit_cluster.md) — Predicate telling whether cluster launch was explicitly specified.
- [10.12. Special Registers: %clusterid](clusterid.md) — Cluster identifier within a grid.
- [10.13. Special Registers: %nclusterid](nclusterid.md) — Number of cluster identifiers per grid.
- [10.14. Special Registers: %cluster_ctaid](cluster_ctaid.md) — CTA identifier within a cluster.
- [10.15. Special Registers: %cluster_nctaid](cluster_nctaid.md) — Number of CTA identifiers per cluster.
- [10.16. Special Registers: %cluster_ctarank](cluster_ctarank.md) — CTA rank in a cluster across all dimensions.
- [10.17. Special Registers: %cluster_nctarank](cluster_nctarank.md) — Number of CTAs in a cluster across all dimensions.
- [10.18. Special Registers: %lanemask_eq](lanemask_eq.md) — Mask with the bit set at the thread's lane number.
- [10.19. Special Registers: %lanemask_le](lanemask_le.md) — Mask with bits set at positions less than or equal to the lane number.
- [10.20. Special Registers: %lanemask_lt](lanemask_lt.md) — Mask with bits set at positions less than the lane number.
- [10.21. Special Registers: %lanemask_ge](lanemask_ge.md) — Mask with bits set at positions greater than or equal to the lane number.
- [10.22. Special Registers: %lanemask_gt](lanemask_gt.md) — Mask with bits set at positions greater than the lane number.
- [10.23. Special Registers: %clock, %clock_hi](clock-clock_hi.md) — 32-bit cycle counter and the upper half of `%clock64`.
- [10.24. Special Registers: %clock64](clock64.md) — 64-bit cycle counter.
- [10.25. Special Registers: %pm0 … %pm7](pm0-pm7.md) — 32-bit performance monitoring counters.
- [10.26. Special Registers: %pm0_64 … %pm7_64](pm0_64-pm7_64.md) — 64-bit performance monitoring counters.
- [10.27. Special Registers: %envreg<32>](envreg.md) — Driver-defined read-only registers.
- [10.28. Special Registers: %globaltimer, %globaltimer_lo, %globaltimer_hi](globaltimer.md) — 64-bit global nanosecond timer and its halves.
- [10.29. Special Registers: %reserved_smem_offset_begin, %reserved_smem_offset_end, %reserved_smem_offset_cap, %reserved_smem_offset_<2>](reserved_smem_offset.md) — Layout of the shared memory region reserved for system software.
- [10.30. Special Registers: %total_smem_size](total_smem_size.md) — Total shared memory allocated for a CTA, in allocation units.
- [10.31. Special Registers: %aggr_smem_size](aggr_smem_size.md) — Aggregated user plus reserved shared memory size.
- [10.32. Special Registers: %dynamic_smem_size](dynamic_smem_size.md) — Dynamically allocated shared memory size.
- [10.33. Special Registers: %current_graph_exec](current_graph_exec.md) — Identifier of the currently executing CUDA device graph.
- [10.34. Special Registers: %perctamemoryoffset](perctamemoryoffset.md) — Base address of the current CTA's per-CTA global memory slice.
- [10.35. Special Registers: %perctamemorysize](perctamemorysize.md) — Size in bytes of the per-CTA global memory slice.

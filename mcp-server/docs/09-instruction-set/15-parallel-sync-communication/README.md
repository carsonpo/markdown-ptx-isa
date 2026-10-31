# 9.7.15. Parallel Synchronization and Communication Instructions

These instructions are:

- `bar{.cta}`, `barrier{.cta}`
- `bar.warp.sync`
- `barrier.cluster`
- `membar`
- `atom`
- `red`
- `red.async`
- `multimem.red.async`
- `vote`
- `match.sync`
- `activemask`
- `redux.sync`
- `griddepcontrol`
- `elect.sync`
- `mbarrier.init`
- `mbarrier.inval`
- `mbarrier.arrive`
- `mbarrier.arrive_drop`
- `mbarrier.test_wait`
- `mbarrier.try_wait`
- `mbarrier.pending_count`
- `mbarrier.check_layout`
- `cp.async.mbarrier.arrive`
- `tensormap.cp_fenceproxy`
- `clusterlaunchcontrol.try_cancel`
- `clusterlaunchcontrol.query_cancel`

## Pages

- [9.7.15.1. Parallel Synchronization and Communication Instructions: bar, barrier](bar-barrier.md) — CTA-level named barriers with sync, arrive and reduction forms.
- [9.7.15.2. Parallel Synchronization and Communication Instructions: bar.warp.sync](bar-warp-sync.md) — Barrier synchronization among the threads of a warp selected by a member mask.
- [9.7.15.3. Parallel Synchronization and Communication Instructions: barrier.cluster](barrier-cluster.md) — Split arrive/wait barrier across all threads of a cluster.
- [9.7.15.4. Parallel Synchronization and Communication Instructions: membar / fence](membar-fence.md) — Thread, operation and proxy fences enforcing memory ordering.
- [9.7.15.5. Parallel Synchronization and Communication Instructions: atom](atom.md) — Atomic read-modify-write operations returning the original value.
- [9.7.15.6. Parallel Synchronization and Communication Instructions: red](red.md) — Atomic reduction operations without a return value.
- [9.7.15.7. Parallel Synchronization and Communication Instructions: red.async](red-async.md) — Asynchronous reduction into shared memory tracked by an mbarrier.
- [9.7.15.8. Parallel Synchronization and Communication Instructions: multimem.red.async](multimem-red-async.md) — Asynchronous reduction on multimem addresses.
- [9.7.15.9. Parallel Synchronization and Communication Instructions: vote (deprecated)](vote-deprecated.md) — Deprecated warp-wide predicate vote.
- [9.7.15.10. Parallel Synchronization and Communication Instructions: vote.sync](vote-sync.md) — Warp-wide predicate vote over a member mask.
- [9.7.15.11. Parallel Synchronization and Communication Instructions: match.sync](match-sync.md) — Broadcast and compare a value across the threads of a warp.
- [9.7.15.12. Parallel Synchronization and Communication Instructions: activemask](activemask.md) — Query the mask of currently active threads in the warp.
- [9.7.15.13. Parallel Synchronization and Communication Instructions: redux.sync](redux-sync.md) — Warp-wide reduction of a value across threads.
- [9.7.15.14. Parallel Synchronization and Communication Instructions: griddepcontrol](griddepcontrol.md) — Control execution of dependent grids.
- [9.7.15.15. Parallel Synchronization and Communication Instructions: elect.sync](elect-sync.md) — Elect a leader thread among a set of threads in the warp.
- [9.7.15.16. Parallel Synchronization and Communication Instructions: mbarrier](mbarrier/README.md) — mbarrier objects: contents, lifecycle, phases, tx-count and the mbarrier instructions.
- [9.7.15.17. Parallel Synchronization and Communication Instructions: tensormap.cp_fenceproxy](tensormap-cp-fenceproxy.md) — Fused copy and proxy fence for tensor-map objects.
- [9.7.15.18. Parallel Synchronization and Communication Instructions: clusterlaunchcontrol.try_cancel](clusterlaunchcontrol-try-cancel.md) — Request cancellation of a not-yet-launched cluster.
- [9.7.15.19. Parallel Synchronization and Communication Instructions: clusterlaunchcontrol.query_cancel](clusterlaunchcontrol-query-cancel.md) — Decode the result of a cluster cancellation request.

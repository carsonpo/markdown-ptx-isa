# 9.7.10. Data Movement and Conversion Instructions

These instructions copy data from place to place, and from state space to state space, possibly converting it from one format to another. `mov`, `ld`, `ldu`, and `st` operate on both scalar and vector types. The `isspacep` instruction is provided to query whether a generic address falls within a particular state space window. The `cvta` instruction converts addresses between generic and const, global, local, or shared state spaces.

Instructions `ld`, `st`, `suld`, and `sust` support optional cache operations.

The Data Movement and Conversion Instructions are:

- `mov`
- `shfl.sync`
- `prmt`
- `ld`
- `ldu`
- `st`
- `st.async`
- `st.bulk`
- `multimem.ld_reduce`, `multimem.st`, `multimem.red`
- `multimem.st.async`
- `prefetch`, `prefetchu`
- `isspacep`
- `cvta`
- `cvt`
- `cvt.pack`
- `cp.async`
- `cp.async.commit_group`
- `cp.async.wait_group`, `cp.async.wait_all`
- `cp.async.bulk`
- `cp.reduce.async.bulk`
- `cp.async.bulk.prefetch`
- `multimem.cp.async.bulk`
- `multimem.cp.reduce.async.bulk`
- `cp.async.bulk.tensor`
- `cp.reduce.async.bulk.tensor`
- `cp.async.bulk.prefetch.tensor`
- `cp.async.bulk.commit_group`
- `cp.async.bulk.wait_group`
- `tensormap.replace`
- `spcompress`
- `spdecompress`

## Pages

- [Cache Operators](cache-operators.md) — Optional cache operators on load and store instructions and their meanings.
- [Cache Eviction Priority Hints](cache-eviction-priority-hints.md) — Optional eviction priority hints on load and store instructions.
- [mov](mov.md) — Set a register from a register, immediate, special register, or the address of a variable or function.
- [mov (vector)](mov-vector.md) — Move vector-to-scalar (pack) or scalar-to-vector (unpack).
- [shfl (deprecated)](shfl-deprecated.md) — Register data shuffle within threads of a warp, without a `.sync` qualifier.
- [shfl.sync](shfl-sync.md) — Register data shuffle within threads of a warp, synchronising on a member mask.
- [prmt](prmt.md) — Permute bytes from a register pair.
- [ld](ld.md) — Load a register variable from an addressable state space variable.
- [ld.global.nc](ld-global-nc.md) — Load a register variable from global state space via the non-coherent cache.
- [ldu](ldu.md) — Load read-only data from an address that is common across threads in the warp.
- [st](st.md) — Store a register variable to an addressable state space variable.
- [st.async](st-async.md) — Asynchronous store to distributed shared memory with mbarrier completion.
- [multimem.st.async](multimem-st-async.md) — Asynchronous store to a multimem address.
- [st.bulk](st-bulk.md) — Initialize a region of shared memory.
- [multimem.ld_reduce, multimem.st, multimem.red](multimem-ld-reduce-st-red.md) — Load-reduce, store and reduction operations on multimem addresses.
- [prefetch, prefetchu](prefetch-prefetchu.md) — Prefetch a line containing a generic address into the specified cache level.
- [applypriority](applypriority.md) — Apply a cache eviction priority to the specified address.
- [applypriority.async.bulk](applypriority-async-bulk.md) — Apply a cache eviction priority to a bulk region of memory.
- [applypriority.async.bulk.tensor](applypriority-async-bulk-tensor.md) — Apply a cache eviction priority to tensor data in memory.
- [discard](discard.md) — Invalidate the data at the specified address without writing it back.
- [createpolicy](createpolicy.md) — Create a cache eviction policy for the specified cache level.
- [isspacep](isspacep.md) — Query whether a generic address falls within a specified state space window.
- [cvta](cvta.md) — Convert addresses between generic and const, global, local, or shared state spaces.
- [cvt](cvt.md) — Convert a value from one type to another.
- [cvt.pack](cvt-pack.md) — Convert two integer values and pack the results together.
- [mapa](mapa.md) — Map the address of a shared variable in the target CTA.
- [getctarank](getctarank.md) — Generate the CTA rank of the address.
- [Asynchronous copy](async-copy/README.md) — Asynchronous data copy instructions, their completion mechanisms and the async proxy.
- [tensormap.replace](tensormap-replace.md) — Modify a field of a tensor-map object.
- [spcompress](spcompress.md) — Compress a structured sparse matrix.
- [spdecompress](spdecompress.md) — Decompress a structured sparse matrix.

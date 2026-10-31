# 9.7.18.10. TensorCore 5th Generation Matrix Multiply and accumulate Operations

The 5th generation of TensorCore operations of shape MxNxK perform matrix multiplication and accumulation of the form:

```ptx
D = A*B+D
```

where:

- the A matrix has shape MxK, in either Tensor Memory or Shared Memory
- the B matrix has shape KxN, in Shared Memory of the current CTA and optionally in peer CTA
- the D matrix is of the shape MxN, in Tensor Memory

Optionally an input predicate can be used to disable the input from the accumulator matrix and the following operation can be performed as

```ptx
D = A*B
```

The matrix multiplication and accumulation operations are categorized into various kinds based on input types and the throughput of the multiplication operation. The following shows the different kinds of MMA operations that are supported:

- `f16` : supports `f16` and `bf16` input types.
- `tf32` : supports `tf32` input types.
- `f8f6f4` : supports all input combinations of `f8`, `f6` and `f4` types.
- `i8` : supports signed and unsigned 8-bit integer input types.
- `mxf8f6f4`/`mxf4` : supports mx-floating points input types.
- `mxf4nvf4` : supports `mxf4` type and a custom NVIDIA floating-point type for inputs where the type of the vector elements is 4 bits and requires a common scaling factor to form the complete floating-point type, similar to other mx-types.

Optionally, the 5th generation of TensorCore MMAs support dense and sparse matrix A. [Sparse Matrices](sparse-matrices.md) describes the details of the sparse matrices.

Some of the MMA-kinds requires scaling of input matrices from memory to form the matrix A and matrix B before performing the MMA operation. [Block Scaling for tcgen05.mma](block-scaling.md) describes the details of the scaling of matrices.

The following table show the various matrices involved in the MMA operations and the memory in which they can reside:

| Matrix Type | Memory |
|-------------|--------|
| A | Tensor Memory OR Shared Memory |
| B | Shared Memory |
| D | Tensor Memory |
| Sparse Meta Data | Tensor Memory, needs B to be in Shared Memory |
| A-Scale / B-Scale | Tensor Memory, needs B to be in Shared Memory |
| B Lookup Metadata | Tensor Memory, needs B to be in Shared Memory |

A sequence of MMA instructions may reuse the same A matrix with a sequence of B matrices or may reuse the same B matrix with a sequence of A matrices. In these patterns the TensorCore may be able to load the unchanged matrix once and reuse it through the sequence without multiple reloads. The A or B matrices are loaded into a TensorCore collector buffer (i.e., special cache).

An MMA instruction has an optional collector qualifier to specify when an A or B matrix is new to the sequence and should be loaded, unchanged within the sequence and should be reused, or the last use in the sequence and should be discarded. The collector qualifier is used to give the TensorCore permission to reuse a previously loaded A or B matrix; however reuse is opportunistic in that the TensorCore may reload a matrix even when it has permission to reuse that matrix. Thus, the source memory of an A or B matrix must not be modified while the MMA instruction using those matrices has not completed - regardless of collector qualifier permissions.

The 5th generation of TensorCore MMAs can be used for general matrix multiplication OR for convolution operations. In case of convolutions, the activations can be stored in either matrix A or matrix B while the weights will be stored in the other matrix.

| Activation Matrix | Weights Matrix | Name of the op | Instruction Name | Collector Buffer Applicability |
|-------------------|----------------|----------------|------------------|--------------------------------|
| A | B | Activation Stationary | (default `tcgen05.mma`) | Collector buffer is applicable on matrix A |
| B | A | Weights Stationary | `.ws` | Collector buffer is applicable on matrix B |

## Pages

- [9.7.18.10.1. Transpose and Negate operations](transpose-and-negate.md) — which MMA-Kinds support transposing and negating matrices A and B, and the N shapes allowed for 8-bit transpose B.
- [9.7.18.10.2. Matrix Layout Organization](matrix-layout-organization.md) — default major-ness of matrices A, B and D by the memory they reside in.
- [9.7.18.10.3. Valid Combinations of Type-Size, Major-ness and Swizzling](valid-combinations-type-size-majorness-swizzling.md) — which swizzling modes are supported for each element size and major-ness.
- [9.7.18.10.4. Packing formats of elements in Tensor and Shared memory](packing-formats.md) — how sub-word, 6-bit and 4-bit elements of matrices A, B and D are packed for each MMA-Kind.
- [9.7.18.10.5. Data Path Layout Organization](data-path-layouts.md) — the Tensor Memory datapath layouts (Layout A through Layout G) selected by M, `.cta_group`, sparsity and `.ws` mode.
- [9.7.18.10.6. Shared Memory Layout and Swizzling](shared-memory-layout-and-swizzling.md) — K-major and MN-major shared memory layouts and their swizzle atoms.
- [9.7.18.10.7. Block Scaling for tcgen05.mma](block-scaling.md) — scaling of matrices A and B by scale factors for the mx-kinds.
- [9.7.18.10.8. Decompression](decompression.md) — optional decompression of matrix B via a lookup table.
- [9.7.18.10.9. Sparse Matrices](sparse-matrices.md) — structured sparsity of matrix A and the layout of the sparsity metadata.
- [9.7.18.10.10. tcgen05.mma](tcgen05-mma.md) — the 5th generation TensorCore matrix multiply-and-accumulate instruction.
- [tcgen05.mma.sp](tcgen05-mma-sp.md) — the sparse-A variant of `tcgen05.mma`.
- [tcgen05.mma.ws](tcgen05-mma-ws.md) — the weights-stationary variant of `tcgen05.mma`.
- [tcgen05.mma.ws.sp](tcgen05-mma-ws-sp.md) — the weights-stationary, sparse-A variant of `tcgen05.mma`.

# 9.7.16.2.1. Matrix Shape

The matrix multiply and accumulate operations support a limited set of shapes for the operand matrices A, B and D. The shapes of all three matrix operands are collectively described by the tuple MxNxK where A is MxK matrix, B is a KxN matrix, and D is a MxN matrix.

Table 39 shows matrix shapes that are supported for the specified types for the `tcgen05.mma` operation.

**Table 39** Various combinations of `.kind` and shapes

| `.kind::*` | Has `.ws` | CTA Group | Sparsity | dtype | atype/btype | Shapes Supported |
|------------|-----------|-----------|----------|-------|-------------|-----------------|
| `.kind::f16` | No `.ws` | 1 | Dense | `.f16` | `.f16` | 64xNxK, 128xNxK; N = {8, 16, 24, … 256} steps of 8; K = 16 |
| | | | Dense | `.f32` | `.f16`, `.bf16` | 64xNxK, 128xNxK; N = {8, 16, 24, … 256} steps of 8; K = 16 |
| | | | Sparse | `.f16` | `.f16` | K = 32 |
| | | | Sparse | `.f32` | `.f16`, `.bf16` | K = 32 |
| | | 2 | Dense | `.f16` | `.f16` | 128xNxK, 256xNxK; N = {16, 32, … 256} steps of 16; K = 16 |
| | | | Dense | `.f32` | `.f16`, `.bf16` | 128xNxK, 256xNxK; N = {16, 32, … 256} steps of 16; K = 16 |
| | | | Sparse | `.f16` | `.f16` | K = 32 |
| | | | Sparse | `.f32` | `.f16`, `.bf16` | K = 32 |
| | `.ws` | 1 | Dense | `.f16` | `.f16` | 32xNxK, 64xNxK, 128xNxK; N = {64, 128, 256}; K = 16 |
| | | | Dense | `.f32` | `.f16`, `.bf16` | 32xNxK, 64xNxK, 128xNxK; N = {64, 128, 256}; K = 16 |
| | | | Sparse | `.f16` | `.f16` | N = {64, 128}; K = 32 |
| | | | Sparse | `.f32` | `.f16`, `.bf16` | N = {64, 128}; K = 32 |
| | | 2 | Either | `.f16` | `.f16` | Invalid |
| | | | Either | `.f32` | `.f16`, `.bf16` | Invalid |
| `.kind::tf32` | No `.ws` | 1 | Dense | `.f32` | `.tf32` | 64xNxK, 128xNxK; N = {8, 16, 24, … 256} steps of 8; K = 8 |
| | | | Sparse | | | K = 16 |
| | | 2 | Dense | `.f32` | `.tf32` | 128xNxK, 256xNxK; N = {16, 32, … 256} steps of 16; K = 8 |
| | | | Sparse | | | K = 16 |
| | `.ws` | 1 | Dense | `.f32` | `.tf32` | 32xNxK, 64xNxK, 128xNxK; N = {64, 128, 256}; K = 8 |
| | | | Sparse | | | N = {64, 128}; K = 16 |
| | | 2 | Dense | | | Invalid |
| | | | Sparse | | | Invalid |
| `.kind::f8f6f4` | No `.ws` | 1 | Dense | `.f32` | `.f16`, `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` | 64xNxK, 128xNxK; N = {8, 16, … 256} steps of 8; K = 32 |
| | | | Sparse | | | K = 64 |
| | | 2 | Dense | `.f32` | `.f16`, `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` | 128xNxK, 256xNxK; N = {16, 32, … 256} steps of 16; K = 32 |
| | | | Sparse | | | K = 64 |
| | `.ws` | 1 | Dense | `.f32` | `.f16`, `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` | 32xNxK, 64xNxK, 128xNxK; N = {64, 128, 256}; K = 32 |
| | | | Sparse | | | N = {64, 128}; K = 64 |
| | | 2 | Dense | | | Invalid |
| | | | Sparse | | | Invalid |
| `.kind::mxf8f6f4` | No `.ws` | 1 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` x (Scale) `.ue8m0` | 128xNxK; N = {8, 16, … 256} steps of 8; K = 32 |
| | | | Sparse | | | K = 64 |
| | | 2 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` x (Scale) `.ue8m0` | 128xNxK, 256xNxK; N = {16, 32, … 256} steps of 16; K = 32 |
| | | | Sparse | | 256xNxK; K = 64 | |
| | `.ws` | 1 | Dense | | | Invalid |
| | | | Sparse | | | Invalid |
| | | 2 | Dense | | | Invalid |
| | | | Sparse | | | Invalid |
| `.kind::i8` | No `.ws` | 1 | Dense | `.s32` | `.s8`, `.u8` | 64xNxK, 128xNxK; N = {8, 16, 24, 32, 48, … 256} steps of 16 after N > 32; K = 32 |
| | | | Sparse | | | K = 64 |
| | | 2 | Dense | `.s32` | `.s8`, `.u8` | 128xNxK, 256xNxK; N = {32, 64, … 256} steps of 32; K = 32 |
| | | | Sparse | | | K = 64 |
| | `.ws` | 1 | Dense | `.s32` | `.s8`, `.u8` | 32xNxK, 64xNxK, 128xNxK; N = {64, 128, 256}; K = 32 |
| | | | Sparse | | | N = {64, 128}; K = 64 |
| | | 2 | Dense | | | Invalid |
| | | | Sparse | | | Invalid |
| `.kind::mxf4` | No `.ws` | 1 | Dense | `.f32` | `.e2m1` x (Scale) `.ue8m0` | 128xNxK; N = {8, 16, … 256} steps of 8; K = 64 |
| | | | Sparse | | | K = 128 |
| | | 2 | Dense | `.f32` | `.e2m1` x (Scale) `.ue8m0` | 128xNxK, 256xNxK, 256xNxK1; N = {16, 32, … 256} steps of 16; K = 64, K1 = 96 |
| | | | Sparse | | 256xNxK; K = 128 | |
| | `.ws` | 1 / 2 | Either | | | Invalid |
| `.kind::mxf4nvf4` | No `.ws` | 1 | Dense | `.f32` | `.e2m1` x (Scale) `.ue8m0`, `.ue4m3` | 128xNxK; N = {8, 16, … 256} steps of 8; K = 64 |
| | | | Sparse | | | K = 128 |
| | | 2 | Dense | `.f32` | `.e2m1` x (Scale) `.ue8m0`, `.ue4m3` | 128xNxK, 256xNxK, 256xNxK1; N = {16, 32, … 256} steps of 16; K = 64, K1 = 96 |
| | | | Sparse | | 256xNxK; K = 128 | |
| | `.ws` | 1 / 2 | Either | | | Invalid |

### 9.7.16.2.1.1. Target ISA Note

K = 96 is only supported for following architecture-specific targets:

- sm_103a.

## 9.7.16.2.2. Specifying Matrix Shape

M and N can be specified in the Instruction descriptor.

K can be specified explicitly if there are multiple values of K supported for a given MMA variant. Otherwise, if K can be uniquely determined as per the Table 39, then K cannot be explicitly specified.

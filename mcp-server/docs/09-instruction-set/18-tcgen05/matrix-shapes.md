# 9.7.18.2. Matrix and Data Movement Shape

There are two kinds of shapes involved.

- Shapes in the data movement operations
- Shapes in the MMA operations

## 9.7.18.2.1. Matrix Shape

The matrix multiply and accumulate operations support a limited set of shapes for the operand matrices A, B and D. The shapes of all three matrix operands are collectively described by the tuple MxNxK where A is MxK matrix, B is a KxN matrix, and D is a MxN matrix.

Table 48 shows matrix shapes that are supported for the specified types for the `tcgen05.mma` operation.

In the source table, the first six columns (`.kind::*`, Has `.ws`, CTA Group, Sparsity, dtype, atype/btype) are grouped under the heading "Various Combinations" and the last three columns (M shapes, N, K) are grouped under the heading "Shapes Supported".

**Table 48** Various combinations of `.kind` and shapes

| `.kind::*` | Has `.ws` | CTA Group | Sparsity | dtype | atype/btype | Shapes Supported: M | Shapes Supported: N | Shapes Supported: K |
|---|---|---|---|---|---|---|---|---|
| `.kind::f16` | No `.ws` | 1 | Dense | `.f16` | `.f16` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 16 |
| `.kind::f16` | No `.ws` | 1 | Dense | `.f32` | `.f16`, `.bf16` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 16 |
| `.kind::f16` | No `.ws` | 1 | Sparse | `.f16` | `.f16` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 32 |
| `.kind::f16` | No `.ws` | 1 | Sparse | `.f32` | `.f16`, `.bf16` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 32 |
| `.kind::f16` | No `.ws` | 2 | Dense | `.f16` | `.f16` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 16 |
| `.kind::f16` | No `.ws` | 2 | Dense | `.f32` | `.f16`, `.bf16` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 16 |
| `.kind::f16` | No `.ws` | 2 | Sparse | `.f16` | `.f16` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 32 |
| `.kind::f16` | No `.ws` | 2 | Sparse | `.f32` | `.f16`, `.bf16` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 32 |
| `.kind::f16` | `.ws` | 1 | Dense | `.f16` | `.f16` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 16 |
| `.kind::f16` | `.ws` | 1 | Dense | `.f32` | `.f16`, `.bf16` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 16 |
| `.kind::f16` | `.ws` | 1 | Sparse | `.f16` | `.f16` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 32 |
| `.kind::f16` | `.ws` | 1 | Sparse | `.f32` | `.f16`, `.bf16` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 32 |
| `.kind::f16` | `.ws` | 2 | Either | `.f16` | `.f16` | Invalid | Invalid | Invalid |
| `.kind::f16` | `.ws` | 2 | Either | `.f32` | `.f16`, `.bf16` | Invalid | Invalid | Invalid |
| `.kind::tf32` | No `.ws` | 1 | Dense | `.f32` | `.tf32` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 8 |
| `.kind::tf32` | No `.ws` | 1 | Sparse | `.f32` | `.tf32` | 64xNxK, 128xNxK | N = {8, 16, 24, … 256} steps of 8 | K = 16 |
| `.kind::tf32` | No `.ws` | 2 | Dense | `.f32` | `.tf32` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 8 |
| `.kind::tf32` | No `.ws` | 2 | Sparse | `.f32` | `.tf32` | 128xNxK, 256xNxK | N = {16, 32, … 256} steps of 16 | K = 16 |
| `.kind::tf32` | `.ws` | 1 | Dense | `.f32` | `.tf32` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 8 |
| `.kind::tf32` | `.ws` | 1 | Sparse | `.f32` | `.tf32` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 16 |
| `.kind::tf32` | `.ws` | 2 | Dense | `.f32` | `.tf32` | Invalid | Invalid | Invalid |
| `.kind::tf32` | `.ws` | 2 | Sparse | `.f32` | `.tf32` | Invalid | Invalid | Invalid |
| `.kind::f8f6f4` | No `.ws` | 1 | Dense | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 64xNxK, 128xNxK, 128xNxK1 | N = {8, 16, … 256} steps of 8 OR N = {16, 32, … 256} steps of 16 | K = 32, K1 = 64 |
| `.kind::f8f6f4` | No `.ws` | 1 | Sparse | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 64xNxK, 128xNxK, 128xNxK1 | N = {8, 16, … 256} steps of 8 OR N = {16, 32, … 256} steps of 16 | K = 64 / 128 |
| `.kind::f8f6f4` | No `.ws` | 2 | Dense | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 128xNxK, 256xNxK, 256xNxK1 | N = {16, 32, … 256} steps of 16 | K = 32, K1 = 64 |
| `.kind::f8f6f4` | No `.ws` | 2 | Sparse | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 128xNxK, 256xNxK, 256xNxK1 | N = {16, 32, … 256} steps of 16 | K = 64 / 128 |
| `.kind::f8f6f4` | `.ws` | 1 | Dense | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 32 / 64 |
| `.kind::f8f6f4` | `.ws` | 1 | Sparse | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 64 / 128 |
| `.kind::f8f6f4` | `.ws` | 2 | Dense | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | Invalid | Invalid | Invalid |
| `.kind::f8f6f4` | `.ws` | 2 | Sparse | `.f32`, `.f16` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` (For K = 64, only `.e4m3` and `.e5m2` are supported.) | Invalid | Invalid | Invalid |
| `.kind::mxf8f6f4` | No `.ws` | 1 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 32 / 64 |
| `.kind::mxf8f6f4` | No `.ws` | 1 | Sparse | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 64 / 128 |
| `.kind::mxf8f6f4` | No `.ws` | 2 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | 128xNxK, 256xNxK, 256xNxK1 | N = {16, 32, … 256} steps of 16 | K = 32, K1 = 64 |
| `.kind::mxf8f6f4` | No `.ws` | 2 | Sparse | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | 256xNxK | N = {16, 32, … 256} steps of 16 | K = 64 / 128 |
| `.kind::mxf8f6f4` | `.ws` | 1 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | Invalid | Invalid | Invalid |
| `.kind::mxf8f6f4` | `.ws` | 1 | Sparse | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | Invalid | Invalid | Invalid |
| `.kind::mxf8f6f4` | `.ws` | 2 | Dense | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | Invalid | Invalid | Invalid |
| `.kind::mxf8f6f4` | `.ws` | 2 | Sparse | `.f32` | `.e4m3`, `.e5m2`, `.e2m3`, `.e3m2`, `.e2m1` X (Scale) `.ue8m0` | Invalid | Invalid | Invalid |
| `.kind::i8` | No `.ws` | 1 | Dense | `.s32` | `.s8`, `.u8` | 64xNxK, 128xNxK | N = {8, 16, 24, 32, 48, … 256} steps of 16 after N > 32 | K = 32 |
| `.kind::i8` | No `.ws` | 1 | Sparse | `.s32` | `.s8`, `.u8` | 64xNxK, 128xNxK | N = {8, 16, 24, 32, 48, … 256} steps of 16 after N > 32 | K = 64 |
| `.kind::i8` | No `.ws` | 2 | Dense | `.s32` | `.s8`, `.u8` | 128xNxK, 256xNxK | N = {32, 64, … 256} steps of 32 | K = 32 |
| `.kind::i8` | No `.ws` | 2 | Sparse | `.s32` | `.s8`, `.u8` | 128xNxK, 256xNxK | N = {32, 64, … 256} steps of 32 | K = 64 |
| `.kind::i8` | `.ws` | 1 | Dense | `.s32` | `.s8`, `.u8` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 32 |
| `.kind::i8` | `.ws` | 1 | Sparse | `.s32` | `.s8`, `.u8` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 64 |
| `.kind::i8` | `.ws` | 2 | Dense | `.s32` | `.s8`, `.u8` | Invalid | Invalid | Invalid |
| `.kind::i8` | `.ws` | 2 | Sparse | `.s32` | `.s8`, `.u8` | Invalid | Invalid | Invalid |
| `.kind::mxf4` | No `.ws` | 1 | Dense | `.f32` | `.e2m1` X (Scale) `.ue8m0` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 64 / 96 |
| `.kind::mxf4` | No `.ws` | 1 | Sparse | `.f32` | `.e2m1` X (Scale) `.ue8m0` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 128 / 192 |
| `.kind::mxf4` | No `.ws` | 2 | Dense | `.f32` | `.e2m1` X (Scale) `.ue8m0` | 128xNxK, 256xNxK, 256xNxK1 | N = {16, 32, … 256} steps of 16 | K = 64, K1 = 96 / 128 |
| `.kind::mxf4` | No `.ws` | 2 | Sparse | `.f32` | `.e2m1` X (Scale) `.ue8m0` | 256xNxK | N = {16, 32, … 256} steps of 16 | K = 128 / 192 |
| `.kind::mxf4` | `.ws` | 1 / 2 | Either | `.f32` | `.e2m1` X (Scale) `.ue8m0` | Invalid | Invalid | Invalid |
| `.kind::mxf4nvf4` | No `.ws` | 1 | Dense | `.f32` | `.e2m1` X (Scale) `.ue8m0`, `.ue4m3`, `.ue5m3` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 64 / 96 |
| `.kind::mxf4nvf4` | No `.ws` | 1 | Sparse | `.f32` | `.e2m1` X (Scale) `.ue8m0`, `.ue4m3`, `.ue5m3` | 128xNxK | N = {8, 16, … 256} steps of 8 | K = 128 / 192 |
| `.kind::mxf4nvf4` | No `.ws` | 2 | Dense | `.f32` | `.e2m1` X (Scale) `.ue8m0`, `.ue4m3`, `.ue5m3` | 128xNxK, 256xNxK, 256xNxK1 | N = {16, 32, … 256} steps of 16 | K = 64, K1 = 96 / 128 |
| `.kind::mxf4nvf4` | No `.ws` | 2 | Sparse | `.f32` | `.e2m1` X (Scale) `.ue8m0`, `.ue4m3`, `.ue5m3` | 256xNxK | N = {16, 32, … 256} steps of 16 | K = 128 / 192 |
| `.kind::mxf4nvf4` | `.ws` | 1 / 2 | Either | `.f32` | `.e2m1` X (Scale) `.ue8m0`, `.ue4m3`, `.ue5m3` | Invalid | Invalid | Invalid |
| `.kind::ti16` | No `.ws` | 1 | Dense | `.s32` | `.s1z4m11` | 64xN1xK, 128xN2xK | N1 = {8, 16, 24, … 256} steps of 8; N2 = {16, 32, … 256} steps of 16 | K = 16 |
| `.kind::ti16` | No `.ws` | 1 | Sparse | `.s32` | `.s1z4m11` | 64xN1xK, 128xN2xK | N1 = {8, 16, 24, … 256} steps of 8; N2 = {16, 32, … 256} steps of 16 | K = 32 |
| `.kind::ti16` | No `.ws` | 2 | Dense | `.s32` | `.s1z4m11` | 128xNxK, 256xNxK | N = {32, 64, … 256} steps of 32 | K = 16 |
| `.kind::ti16` | No `.ws` | 2 | Sparse | `.s32` | `.s1z4m11` | 128xNxK, 256xNxK | N = {32, 64, … 256} steps of 32 | K = 32 |
| `.kind::ti16` | `.ws` | 1 | Dense | `.s32` | `.s1z4m11` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128, 256} | K = 16 |
| `.kind::ti16` | `.ws` | 1 | Sparse | `.s32` | `.s1z4m11` | 32xNxK, 64xNxK, 128xNxK | N = {64, 128} | K = 32 |
| `.kind::ti16` | `.ws` | 2 | Dense | `.s32` | `.s1z4m11` | Invalid | Invalid | Invalid |
| `.kind::ti16` | `.ws` | 2 | Sparse | `.s32` | `.s1z4m11` | Invalid | Invalid | Invalid |

### 9.7.18.2.1.1. Target ISA Note

- K = 96 is only supported for following architecture-specific targets:
  - `sm_103a`.
  - `sm_107a`
- K = 64 for Dense matrix and K = 128 for Sparse matrix with `.kind::f8f6f4`/`.kind::mxf8f6f4` supported on following family-specific architectures:
  - `sm_107f` or higher in the same family
- K = 128 for Dense matrix and K = 192 for Sparse matrix with `.kind::mxf4`/`.kind::mxf4nvf4` supported on following family-specific architectures:
  - `sm_107f` or higher in the same family

## 9.7.18.2.2. Specifying Matrix Shape

M and N can be specified in the [Instruction descriptor](instruction-descriptor.md).

K can be specified explicitly if there are multiple values of K supported for a given MMA variant. Otherwise, if K can be uniquely determined as per the Table 48, then the instruction descriptor bit corresponding to K must be set to 0.

# 9.7.18.4.2. Instruction descriptor

The instruction descriptor describes the shapes, types and other details of all the matrices and the matrix-multiplication-and-accumulation operation. It is a 32-bit value in registers and the exact layout is dependent on the MMA-Kind:

**Table 51** Instruction descriptor format for `.kind::tf32`, `.kind::f16`, `.kind::f8f6f4`, `.kind::i8` and `.kind::ti16`

| Bits | Size (bits) | Description | Values `.kind::tf32` | Values `.kind::f16` | Values `.kind::f8f6f4` | Values `.kind::i8` | Values `.kind::ti16` |
|------|-------------|-------------|----------------------|---------------------|------------------------|--------------------|----------------------|
| 0-1 | 2 | Sparsity selector, if Sparsity is enabled | 0-3 | 0-3 | 0-3 | 0-3 | 0-3 |
| 2 | 1 | Sparsity | Dense = 0; Sparse = 1 | Dense = 0; Sparse = 1 | Dense = 0; Sparse = 1 | Dense = 0; Sparse = 1 | Dense = 0; Sparse = 1 |
| 3 | 1 | Saturate for integer types | 0 (NA) | 0 (NA) | 0 (NA) | No Saturate = 0; Saturate = 1 | 0 (NA) |
| 4-5 | 2 | dtype (Matrix D type) | F32 = 1 | F16 = 0; F32 = 1 | F16 = 0; F32 = 1 | S32 = 2 | S32 = 2 |
| 6 | 1 | Reserved - Must be 0 | 0 | 0 | 0 | 0 | 0 |
| 7-9 | 3 | atype (Matrix A type) | TF32 = 2 | F16 = 0; BF16 = 1 | E4M3 = 0; E5M2 = 1; E2M3 = 3; E3M2 = 4; E2M1 = 5 | Unsigned 8b = 0; Signed 8b = 1 | S1Z4M11 = 3 |
| 10-12 | 3 | btype (Matrix B type) | TF32 = 2 | F16 = 0; BF16 = 1 | E4M3 = 0; E5M2 = 1; E2M3 = 3; E3M2 = 4; E2M1 = 5 | Unsigned 8b = 0; Signed 8b = 1 | S1Z4M11 = 3 |
| 13 | 1 | Negate A Matrix | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 | No Negate = 0 | No Negate = 0; Negate = 1 |
| 14 | 1 | Negate B Matrix | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 | No Negate = 0 | No Negate = 0; Negate = 1 |
| 15 | 1 | Transpose A Matrix | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0 |
| 16 | 1 | Transpose B Matrix | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0; Transpose = 1 | No Transpose = 0 |
| 17-22 | 6 | N, Dimension of Matrix B (3 LSBs not included) | N >> 3 | N >> 3 | N >> 3 | N >> 3 | N >> 3 |
| 23 | 1 | Reserved - Must be 0 | 0 | 0 | 0 | 0 | 0 |
| 24-28 | 5 | M, Dimension of Matrix A (4 LSBs not included) | M >> 4 | M >> 4 | M >> 4 | M >> 4 | M >> 4 |
| 29 | 1 | K Dimension | (Dense K=8 / Sparse K=16) = 0 | (Dense K=16 / Sparse K=32) = 0 | (Dense K=32 / Sparse K=64) = 0; (Dense K=64) = 1 | NA | NA |
| 30-31 | 2 | Maximum shift while attempting B matrix-reuse in `.ws` | no shift = 0; maximum shift of 8 = 1; maximum shift of 16 = 2; maximum shift of 32 = 3 | no shift = 0; maximum shift of 8 = 1; maximum shift of 16 = 2; maximum shift of 32 = 3 | no shift = 0; maximum shift of 8 = 1; maximum shift of 16 = 2; maximum shift of 32 = 3 | no shift = 0; maximum shift of 8 = 1; maximum shift of 16 = 2; maximum shift of 32 = 3 | no shift = 0; maximum shift of 8 = 1; maximum shift of 16 = 2; maximum shift of 32 = 3 |

In case of `.kind::ti16` qualifier, the atype and btype are of type `.s1z4m11` which is a 16-bit signed integer with the range [-2^11 + 1, 2^11 - 1].

**Table 52** Instruction descriptor format for `.kind::mxf8f6f4`

| Bits | Size (bits) | Description | Values `.kind::mxf8f6f4` |
|------|-------------|-------------|--------------------------|
| 0-1 | 2 | Reserved - Must be 0 | 0 |
| 2 | 1 | Sparsity | Dense = 0; Sparse = 1 |
| 3 | 1 | Reserved - Must be 0 | 0 |
| 4-5 | 2 | Matrix B Scale Factor Data ID | 0-3 |
| 6 | 1 | Reserved - Must be 0 | 0 |
| 7-9 | 3 | atype (Matrix A type) | E4M3 = 0; E5M2 = 1; E2M3 = 3; E3M2 = 4; E2M1 = 5 |
| 10-12 | 3 | btype (Matrix B type) | E4M3 = 0; E5M2 = 1; E2M3 = 3; E3M2 = 4; E2M1 = 5 |
| 13 | 1 | Negate A Matrix | No Negate = 0; Negate = 1 |
| 14 | 1 | Negate B Matrix | No Negate = 0; Negate = 1 |
| 15 | 1 | Transpose A Matrix | No Transpose = 0; Transpose = 1 |
| 16 | 1 | Transpose B Matrix | No Transpose = 0; Transpose = 1 |
| 17-22 | 6 | N, Dimension of Matrix B (3 LSBs not included) | N >> 3 |
| 23 | 1 | Scale Matrix Type, for both scale_A / scale_B | UE8M0 = 1 |
| 24-25 | 2 | Reserved - Must be 0 | 0 |
| 26 | 1 | Matrix A Scale Factor Layout | 32 Lane = 0; 128 Lane = 1 |
| 27-28 | 2 | M, Dimension of Matrix A (7 LSBs not included) | M >> 7 |
| 29-30 | 2 | Matrix A Scale Factor Data ID | 0-3 |
| 31 | 1 | K Dimension | (Dense K=32 / Sparse K=64) = 0; (Dense K=64 / Sparse K=128) = 1 |

**Table 53** Instruction descriptor format for `.kind::mxf4` and `.kind::mxf4nvf4`

| Bits | Size (bits) | Description | Values `.kind::mxf4` | Values `.kind::mxf4nvf4` |
|------|-------------|-------------|----------------------|--------------------------|
| 0-1 | 2 | Reserved - Must be 0 | 0 | 0 |
| 2 | 1 | Sparsity | Dense = 0; Sparse = 1 | Dense = 0; Sparse = 1 |
| 3 | 1 | K Dimension | K Dimension upper bit. See description for bit 31. | K Dimension upper bit. See description for bit 31. |
| 4-5 | 2 | Matrix B Scale Factor Data ID | 0 or 2 | 0 or 2 |
| 6 | 1 | Reserved - Must be 0 | 0 | 0 |
| 7-9 | 3 | atype (Matrix A type) | E2M1 = 1 | E2M1 = 1 |
| 10-11 | 2 | btype (Matrix B type) | E2M1 = 1 | E2M1 = 1 |
| 12 | 1 | Sparsity version | v0 = 0, v1 = 1 | v0 = 0, v1 = 1 |
| 13 | 1 | Negate A Matrix | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 |
| 14 | 1 | Negate B Matrix | No Negate = 0; Negate = 1 | No Negate = 0; Negate = 1 |
| 15 | 1 | Transpose A Matrix | No Transpose = 0 | No Transpose = 0 |
| 16 | 1 | Transpose B Matrix | No Transpose = 0 | No Transpose = 0 |
| 17-22 | 6 | N, Dimension of Matrix B (3 LSBs not included) | N >> 3 | N >> 3 |
| 23-24 | 2 | Scale Matrix Type, for both scale_A / scale_B | UE8M0 = 1 | UE4M3 = 0; UE8M0 = 1; UE5M3 = 2 |
| 25 | 1 | Reserved - Must be 0 | 0 | 0 |
| 26 | 1 | Matrix A Scale Factor Layout | 32 Lane = 0; 128 Lane = 1 | 32 Lane = 0; 128 Lane = 1 |
| 27-28 | 2 | M, Dimension of Matrix A (7 LSBs not included) | M >> 7 | M >> 7 |
| 29-30 | 2 | Matrix A Scale Factor Data ID | 0 or 2 | 0 or 2 |
| 31 | 1 | K Dimension | (Dense K=64 / Sparse K=128) = 0; (Dense K=96 / Sparse K=192) = 1; (Dense K=128) = 2 | (Dense K=64 / Sparse K=128) = 0; (Dense K=96 / Sparse K=192) = 1; (Dense K=128) = 2 |

To encode K dimension as 2-bit field use bit 3 as upper-bit while bit 31 serves as lower-bit

## 9.7.18.4.2.1. Target ISA Note

- For `.kind::f16`, `.kind::tf32`, `.kind:f8f6f4`:
  - Bit 29 for K dimension is valid for architecture `sm_107f` or higher in the same family.
- For `.kind::mxf8f6f4`:
  - Bit 26 for Matrix A Scale Factor Layout is valid for `sm_107f` or higher in the same family.
  - Bit 31 for K dimension is valid for architecture `sm_107f` or higher in the same family.
- For `.kind::mxf4`, `.kind::mxf4nvf4`:
  - Bit 3 for K dimension is valid for architecture `sm_107f` or higher in the same family.
  - Bit 12 for sparsity version must map to v0 for architectures `sm_100a`, `sm_103a`, `sm_110a` and to v1 for architecture `sm_107a`, otherwise behavior is undefined.
  - Bit 26 for Matrix A Scale Factor Layout is valid for `sm_107f` or higher in the same family.

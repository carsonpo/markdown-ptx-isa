# 9.7.18.4. Matrix Descriptors

There are three kinds of matrix descriptors used by the tcgen05 family of instructions.

## 9.7.18.4.1. Shared memory descriptor

The shared memory descriptor describes the properties of multiplicand matrix in shared memory including its location in the shared memory of the current CTA. It is a 64-bit value contained in a register with the following layout:

**Table 49** Shared memory descriptor layout

| Bit-field | Size in bits | Description |
|-----------|--------------|-------------|
| 0-14 | 15 | matrix-descriptor-encode (Matrix start address) |
| 15 | 1 | Reserved - Must be 0 |
| 16-30 | 15 | matrix-descriptor-encode (Leading dimension byte offset relative) OR matrix-descriptor-encode (Leading dimension byte address absolute) |
| 31 | 1 | Reserved - Must be 0 |
| 32-45 | 14 | matrix-descriptor-encode (Stride dimension byte offset) |
| 46-48 | 3 | Fixed constant value of 0b001 |
| 49-51 | 3 | Matrix base offset |
| 52 | 1 | Leading dimension stride mode: 0: byte offset relative; 1: byte address absolute |
| 53 | 1 | `lut::b` Matrix B K_Segment start offset in K=128 (48B) block: 0: 0; 1: 24 |
| 54-60 | 7 | Fixed constant value of 0xb00000000 |
| 61-63 | 3 | Specifies the swizzling mode to be used: 0. No swizzling; 1. 128-Byte with 32B atomic swizzling; 2. 128-Byte swizzling; 4. 64-Byte swizzling; 6. 32-Byte swizzling. Note: Values 3, 5 and 7 are invalid |

where `matrix-descriptor-encode(x) = (x & 0x3FFFF) >> 4`

The value of base offset is 0 when the repeating pattern of the specified swizzling mode starts as per shown in Table 50.

When `decompress::lut::b` qualifier is used, the `tcgen05.mma` instruction reads 48 bytes of B matrix from shared memory and stores in the collector buffer. The `tcgen05.mma` instruction needs only 24 bytes (3 * 64 / 8). Based on the value of bit 53 in the shared memory descriptor, either the first or second 24 bytes chunk will be used.

**Table 50** Starting address of repeating pattern for various swizzling modes

| Swizzling mode | Starting address of the repeating pattern |
|----------------|-------------------------------------------|
| 128-Byte swizzle | 1024-Byte boundary |
| 64-Byte swizzle | 512-Byte boundary |
| 32-Byte swizzle | 256-Byte boundary |

Otherwise, the base offset must be a non-zero value, computed using the following formula: `base offset = (pattern start addr >> 0x7) & 0x7`

The following must be 16-byte aligned:

- Matrix start address
- Leading dimension byte offset
- Stride dimension byte offset

### 9.7.18.4.1.1. Target ISA Note

- The byte address mode for the leading dimension stride is supported on `sm_103a`.

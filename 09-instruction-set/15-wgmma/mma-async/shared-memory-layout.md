# 9.7.15.5.1.2. Shared Memory Matrix Layout

If the argument `imm-trans-a` / `imm-trans-b` of the instruction `wgmma.mma_async{.sp}` is 0, then K-major is used for matrix A / B respectively. If the value of argument `imm-trans-a` is 1 then M-major is used for matrix A. If the value of the argument `imm-trans-b` is 1, then N-major is used for matrix B.

In a column-major default BLAS library such as cuBLAS, the matrices A and B with and without transpose can be classified as either K-Major or M-or-N-Major as shown in the following table:

| | Non-Transposed | Transposed |
|---|---|---|
| A | K-major | M-major |
| B | K-major | N-major |

To avoid confusion with A, B, row-major, col-major, transpose, and non-transpose, we will use MN-Major and K-Major throughout this section.

The matrices in the shared memory are made up of one or more "swizzle layout atom". The exact layout of these swizzle atoms depends on the swizzling mode, swizzle-atomicity, and the leading dimension. The layout of the swizzle are shown in Table 38.

**Table 38 Various combinations of swizzling mode, leading dimension and swizzle-atom layout**

| Swizzling mode | Leading Dimension / Major-ness | Swizzle atom layout (128b element) |
|----------------|-------------------------------|-------------------------------------|
| 128B Swizzling Mode | M/N | 8x8 |
| 128B Swizzling Mode | K | 8x8 |
| 64B Swizzling Mode | M/N | 4x8 |
| 64B Swizzling Mode | K | 8x4 |
| 32B Swizzling Mode | M/N | 2x8 |
| 32B Swizzling Mode | K | 8x2 |
| None | M/N | 1x8 |
| None | K | 8x1 |

The above shapes are for elements of size 128 bits. For smaller elements sizes, the same shapes would get multiplied along the leading dimension by a factor of 128/sizeof_bits(Element). For example, 128B MN major swizzle atom would have a shape of (8*(128/32))x8 = 32x8 for tf32 tensor core inputs.

### Examples

The following are some example layouts of MxK or KxN matrices with various swizzling modes, and are in units of 128b elements as shown by each colored cell as shown in Figure 156, Figure 157, Figure 158, Figure 159, Figure 160, Figure 161, Figure 162, Figure 163.

![MN major 128B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-128B-mn.png)

*Figure 156 MN major 128B swizzling*

![K major 128B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-128B-k.png)

*Figure 157 K major 128B swizzling*

![MN major 64B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-64B-mn.png)

*Figure 158 MN major 64B swizzling*

![K major 64B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-64B-k.png)

*Figure 159 K major 64B swizzling*

![MN major 32B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-32B-mn.png)

*Figure 160 MN major 32B swizzling*

![K major 32B swizzling](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-32B-k.png)

*Figure 161 K major 32B swizzling*

![MN major interleaved](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-mn-interleaved.png)

*Figure 162 MN major interleaved*

![K major interleaved](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-k-interleaved.png)

*Figure 163 K major interleaved*

Following are some of the examples of the 128B swizzling layout for tf32 element type.

K-Major: Figure 164

![K major](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-128B-k-tf32.png)

*Figure 164 K major*

MN-Major: Figure 165

![MN major](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-smem-layout-128B-mn-tf32.png)

*Figure 165 MN major*

## 9.7.15.5.1.2.1. Major-ness supported by Strides

There are two strides involved while accessing a matrix from shared memory:

- Leading dimension byte offset
- Stride dimension byte offset

### 9.7.15.5.1.2.1.1. Leading Dimension Byte Offset

The leading dimension byte offset is defined differently for transposed and non-transposed matrices. The leading byte offset is defined as follows for matrices whose element types are normalized to 128-bits:

| Major-ness | Definition |
|------------|------------|
| K-Major | No-Swizzling: the offset from the first column to the second columns of the 8x2 tile in the 128-bit element type normalized matrix.<br>Swizzled layouts: not used, assumed to be 1. |
| MN-Major | Interleave: offset from the first 8 columns to the next 8 columns.<br>Swizzled layouts: offset from the first (swizzle-byte-size/16) rows to the next (swizzle-byte-size/16) rows. |

### 9.7.15.5.1.2.1.2. Stride Dimension Byte Offset

The stride dimension byte offset is defined differently for transposed and non-transposed matrices. The stride dimension byte offset is defined as follows for matrices whose element types are normalized to 128-bits:

| Major-ness | Definition |
|------------|------------|
| K-Major | The offset from the first 8 rows to the next 8 rows. |
| MN-Major | Interleave: offset from the first row to the next row.<br>Swizzled layout: offset from the first 8 columns to the next 8 columns |

### 9.7.15.5.1.2.1.3. Canonical Layouts

In terms of CuTe layouts the canonical layout can be expressed as follows:

| Major-ness | Swizzling mode | Canonical Layout without swizzling | Swizzling on the previous column |
|------------|----------------|-------------------------------------|----------------------------------|
| MN-major | No-swizzling or Interleaved | `((T,1,m),(8,k)):((1,T,SBO),(1T,LBO))` | `Swizzle<0, 4, 3>` |
| MN-major | 32B Swizzling | `((T,2,m),(8,k)):((1,T,LBO),(2T,SBO))` | `Swizzle<1, 4, 3>` |
| MN-major | 64B Swizzling | `((T,4,m),(8,k)):((1,T,LBO),(4T,SBO))` | `Swizzle<2, 4, 3>` |
| MN-major | 128B Swizzling | `((T,8,m),(8,k)):((1,T,LBO),(8T,SBO))` | `Swizzle<3, 4, 3>` |
| K-major | No-swizzling or Interleaved | `((8,m),(T,2k)):((1T,SBO),(1,LBO))` | `Swizzle<0, 4, 3>` |
| K-major | 32B Swizzling | `((8,m),(T,2k)):((2T,SBO),(1,T))` | `Swizzle<1, 4, 3>` |
| K-major | 64B Swizzling | `((8,m),(T,2k)):((4T,SBO),(1,T))` | `Swizzle<2, 4, 3>` |
| K-major | 128B Swizzling | `((8,m),(T,2k)):((8T,SBO),(1,T))` | `Swizzle<3, 4, 3>` |

where

- T = 128 / sizeof-elements-in-bits — T represents scale factor which normalizes matrix element types to 128-bits.
- m represents the number of repeating patterns across rows.
- k represents the number of repeating patterns across columns.

#### Examples

**K-Major, no-swizzling and tf32 type: Figure 166**

![K major, no-swizzling and tf32 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-k-no-swizzle-tf32.png)

*Figure 166 K major, no-swizzling and tf32 type*

the strides and related details are as follows:

```
Exact layout : Swizzle<0,4,3> o ((8,2),(4,4)):((4,32),(1,64))

Canonical Layout :Swizzle<0,4,3> o ((8,m),(T,2k)):((1T,SBO),(1,LBO))
```

| Parameters | Value |
|------------|-------|
| T | 4 |
| m | 2 |
| k | 2 |
| LBO | 64\*sizeof(tf32) |
| SBO | 32\*sizeof(tf32) |
| Encoding of LBO in descriptor | (LBO) >> 4 = 16 |
| Encoding of SBO in descriptor | (SBO) >> 4 = 8 |

**K-Major, 32B swizzling and tf32 type: Figure 167**

![K major, 32B swizzling and tf32 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-k-32B-swizzle-tf32.png)

*Figure 167 K major, 32B swizzling and tf32 type*

the strides and related details are as follows:

```
Exact layout : Swizzle<1,4,3> o ((8,2),(4,4)):((8,64),(1,4))

Canonical Layout :Swizzle<1,4,3> o ((8,m),(T,2k)):((2T,SBO),(1,T))
```

| Parameters | Value |
|------------|-------|
| T | 4 |
| m | 2 |
| k | 2 |
| LBO | NA |
| SBO | 64\*sizeof(tf32) |
| Encoding of LBO in descriptor | 1 (assumed) |
| Encoding of SBO in descriptor | (SBO) >> 4 = 16 |

**MN-Major, no-swizzling and bf16 type: Figure 168**

![MN major, no-swizzling and bf16 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-mn-no-swizzle-bf16.png)

*Figure 168 MN major, no-swizzling and bf16 type*

the strides and related details are as follows:

```
Exact layout : Swizzle<0,4,3> o ((8,1,2),(8,2)):((1,8,64),(8,128))

Canonical Layout :Swizzle<0,4,3> o ((T,1,m),(8,k)):((1,T,SBO),(1T,LBO))
```

| Parameters | Value |
|------------|-------|
| T | 8 |
| m | 2 |
| k | 2 |
| LBO | 128\*sizeof(bf16) |
| SBO | 64\*sizeof(bf16) |
| Encoding of LBO in descriptor | (LBO) >> 4 = 16 |
| Encoding of SBO in descriptor | (SBO) >> 4 = 8 |

**MN-Major, 32B swizzling and bf16 type: Figure 169**

![MN major, 32B swizzling and bf16 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-mn-32B-swizzle-bf16.png)

*Figure 169 MN major, 32B swizzling and bf16 type*

the strides and related details are as follows:

```
Exact layout : Swizzle<1,4,3> o ((8,2,2),(8,2)):((1,8,128),(16,256))

Canonical Layout :Swizzle<1,4,3> o ((T,2,m),(8,k)):((1,T,LBO),(2T,SBO))
```

| Parameters | Value |
|------------|-------|
| T | 8 |
| m | 2 |
| k | 2 |
| LBO | 128\*sizeof(bf16) |
| SBO | 256\*sizeof(bf16) |
| Encoding of LBO in descriptor | (LBO) >> 4 = 16 |
| Encoding of SBO in descriptor | (SBO) >> 4 = 32 |

**MN-Major, 64B swizzling and bf16 type: Figure 170**

![MN major, 64B swizzling and bf16 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/async-warpgroup-mn-64B-swizzle-bf16.png)

*Figure 170 MN major, 64B swizzling and bf16 type*

the strides and related details are as follows:

```
Exact layout : Swizzle<2,4,3> o ((8,4,2),(8,2)):((1,8,256),(32,512))

Canonical Layout :Swizzle<2,4,3> o ((T,4,m),(8,k)):((1,T,LBO),(4T,SBO))
```

| Parameters | Value |
|------------|-------|
| T | 8 |
| m | 2 |
| k | 2 |
| LBO | 256\*sizeof(bf16) |
| SBO | 512\*sizeof(bf16) |
| Encoding of LBO in descriptor | (LBO) >> 4 = 32 |
| Encoding of SBO in descriptor | (SBO) >> 4 = 64 |

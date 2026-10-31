# 9.7.10.28.5. Data Movement and Conversion Instructions: Tensor copy

## 9.7.10.28.5.1. Restriction on Tensor Copy instructions

Following are the restrictions on the types `.b4x16`, `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`:

- `cp.reduce.async.bulk` doesn't support the types `.b4x16`, `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`.
- `cp.async.bulk.tensor` with the direction `.global.shared::cta` doesn't support the type `.b4x16_p64`.
- `cp.async.bulk.tensor` with the direction `.shared::cluster.global` doesn't support the sub-byte types on `sm_120a`.
- OOB-NaN fill mode doesn't support the types `.b4x16`, `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`.
- Box-Size[0] must be exactly:
  - For `b6x16_p32` and `.b6p2x16`:
    - 128B for `.shared::cluster.global` and `.shared::cta.global` directions on `sm_107f`.
    - 64B or 128B for `.global.shared::cta` direction on `sm_107f`.
    - 96B on `sm_100f`.
  - 64B for `b4x16_p64`.
- Tensor-Size[0] must be a multiple of:
  - For `b6x16_p32` and `.b6p2x16`:
    - 128B for `.shared::cluster.global` and `.shared::cta.global` directions on `sm_107f`.
    - 64B or 128B for `.global.shared::cta` direction on `sm_107f`.
    - 96B on `sm_100f`.
  - 64B for `b4x16_p64`.
- For `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`, the first coordinate in the `tensorCoords` argument vector must be a multiple of 128.
- For `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`, the global memory address must be 32B aligned. Additionally, tensor stride in every dimension must be 32B aligned.
- For `.b6x16_p32` and `.b6p2x16`:
  - On `sm_107f`, for `.shared::cluster.global` and `.shared::cta.global` directions, the global memory address must be 32B aligned. Additionally, tensor stride in every dimension must be 32B aligned.
  - On `sm_100f`, the global memory address must be 32B aligned. Additionally, tensor stride in every dimension must be 32B aligned.
- For `.b6x16_p32` and `.b6p2x16`:
  - On `sm_107f`, for `.global.shared::cta` direction, the global memory address must be 16B aligned. Additionally, tensor stride in every dimension must be 16B aligned.
  - On `sm_100f`, the global memory address must be 32B aligned. Additionally, tensor stride in every dimension must be 32B aligned.
- `.b4x16_p64` supports the following swizzling modes:
  - None.
  - 128B (With all potential swizzle atomicity values except: 32B with 8B flip)
- `.b6x16_p32` and `.b6p2x16` supports the following swizzling modes:
  - None.
  - 64-Byte with 16B atomic swizzling on `sm_107f`.
  - 128-Byte with 16B, 32B and 64B atomic swizzling on `sm_107f`
  - 128-Byte (With all potential swizzle atomicity values except: 32B with 8B flip) on `sm_100f`
- `.b6x16_p32` and `.b6p2x16` doesn't support the following swizzling modes:
  - 32-Byte with 16B atomic swizzling
  - 128-Byte with 32B atomic swizzling with 8B flip

Following are the restrictions on the 96B swizzle mode:

- The `.swizzle_atomicity` must be 16B.
- The `.interleave_layout` must not be set.
- Box-Size[0] must be less than or equal to 96B.
- The type must not be among following: `.b4x16_p64`, `.b6x16_p32` and `.b6p2x16`.
- The `.load_mode` must not be set to `.im2col::w::128`.

Following are the restrictions on the 128-byte swizzle mode having 32-byte atomicity with 8-byte flip as sub-mode:

- The copy direction must be `.shared::cluster.global` or otherwise `.shared::cta.global`.
- The `.load_mode` must not be set to `.im2col::w`, `.im2col::w::128`.

Following are the restrictions on the `.global.shared::cta` direction:

- Starting co-ordinates for Bounding Box (`tensorCoords`) must be non-negative with the following exception:
  - For `sm_107f`, starting co-ordinates for Bounding Box (`tensorCoords`) can be negative for `.tile::scatter4` mode.
- The bounding box along the D, W and H dimensions must stay within the tensor boundaries. This implies:
  - Bounding-Box Lower-Corner must be non-negative.
  - Bounding-Box Upper-Corner must be non-positive.

Following are the restrictions for `sm_120a`:

- `cp.async.bulk.tensor` with the direction `.shared::cluster.global` doesn't support:
  - the sub-byte types
  - the qualifier `.swizzle_atomicity`

Following are the restrictions for `sm_103a` while using type `.b6p2x16` on `cp.async.bulk.tensor` with the direction `.global.shared::cta`:

- Box-Size[0] must be exactly either of 48B or 96B.
- The global memory address must be 16B aligned.
- Tensor Stride in every dimension must be 16B aligned.
- The first coordinate in the `tensorCoords` argument vector must be a multiple of 64.
- Tensor-Size[0] must be a multiple of 48B.
- The following swizzle modes are supported:
  - None.
  - 128B (With all potential swizzle atomicity values except: 32B with 8B flip)
  - 64B swizzle with 16B swizzle atomicity

## 9.7.10.28.5.2. Overriding tensor property value

PTX instructions operating on tensor data require an opaque tensor-map object. The tensor-map specifies various properties associated with the tensor. Certain PTX instructions, when qualified with `.override::*` qualifier, ignore a specific property from the tensor-map; instead, the explicit instruction operand's value is used for that property. The following subsection describes semantics around overriding various properties from the tensor-map object.

### 9.7.10.28.5.2.1. Tensor Base Address Override

The optional qualifier `.override::global_address` allows overriding of the tensor base address. When `.override::global_address` is specified, the global memory address present in the opaque `tensorMap` object is ignored and instead the address specified by the explicit 64-bit operand `gAddrToOverride` is used. The `gAddrToOverride` address must be 16B aligned; otherwise, a runtime error is raised. Additionally, the memory address range [`gAddrToOverride`, `gAddrToOverride` + 128 KiB) must be allocated and accessible during execution; otherwise, the behavior is undefined.

### 9.7.10.28.5.2.2. Tensor Attribute Override

The optional qualifier `.override_attribute` allows overriding of tensor attributes. The only attributes that are allowed to be overridden are global dimension (`global_dim`) and global stride (`global_stride`). When the qualifier `.override_attribute` is specified, attribute values from the `tensorMap` object are ignored and values specified via the additional operand `attributeOverrideInfo` are used. The following conditions must be satisfied for valid usage of `.override_attribute` qualifier:

- As part of tensor attributes override, the tensor base address override must also naturally follow. In other words, while using `.override_attribute` qualifier, it is mandatory to also specify `.override::global_address` qualifier.
- The tensor data access mode must be tile. i.e. The qualifier `.load_mode` if specified must be set to `.tile`.
- If specified, the optional `.multicast` qualifier must be `.multicast::cluster::32b`.
- Tensor start coordinates as specified by the operand `tensorCoords` must be zero, otherwise the behavior is undefined.

The `.override_attribute` qualifier can take the following two values: `.override::global_dim` and `.override::global_dim_stride`. For `.1d` tensors, since stride is absent, only `.override::global_dim` is valid. For tensors with dimensionality of at least 2, both dimension and stride must be overridden together, so only `.override::global_dim_stride` is valid. The form of the `attributeOverrideInfo` operand depends on the value used for the `.override_attribute` qualifier and is summarized in the Table 34.

**Table 34** Nature of attributeOverrideInfo

| `.dim` | valid `.override_attribute` qualifier | Nature of `attributeOverrideInfo` argument |
|---|---|---|
| `.1d` | `.override::global_dim` | `tensorSizeToOverride` |
| `.2d` to `.5d` | `.override::global_dim_stride` | `tensorSizeToOverride`, `tensorLowerStrideToOverride`, `tensorUpperStrideToOverride` |

When `.override::global_dim` is used, the operand `tensorSizeToOverride` specifies the new value for dimension. In this case, the operand `tensorSizeToOverride` is a brace-enclosed vector expression comprising singleton 8-bit or otherwise 16-bit register. Note that, when `.b16` register is specified, 8-bit value must be wrapped inside lower half of the register operand. When `.override::global_dim_stride` is specified the operand `tensorSizeToOverride` must be a vector expression with number of 8-bit or otherwise 16-bit register elements exactly matching to the tensor dimensionality as specified by the qualifier `.dim`. Note that, when vector comprising `.b16` register is specified, 8-bit value must be wrapped inside lower half of each of the register operand. In this case, additional operands `tensorLowerStrideToOverride` and `tensorUpperStrideToOverride` specify the new values to be used for tensor lower stride and tensor upper stride respectively. The `tensorLowerStrideToOverride` is a brace-enclosed vector expression comprising of 32-bit registers. The vector size for `tensorLowerStrideToOverride` must be one less than the tensor dimensionality as given by `.dim`. The `tensorUpperStrideToOverride` operand must be single `.b16` register holding at most four 4-bit tensor upper stride values. The total number of 4-bit tensor upper stride values packed within the `tensorUpperStrideToOverride` operand must be one less than the tensor dimensionality given by `.dim` otherwise the behavior is undefined. Any unused bits from `tensorUpperStrideToOverride` can be populated with zero. As an example, when `.dim` is set to `.4d`, lower 12-bits from `tensorUpperStrideToOverride` operand specify tensor upper stride values whereas upper 4-bits can be set to zero.

**Table 35** Operand type and size requirements for each component of attributeOverrideInfo

| Component of `attributeOverrideInfo` | Nature of the operand |
|---|---|
| `tensorSizeToOverride` | Vector expression comprising `.dim` many elements of type `.b8` or `.b16`. For `.b16` register, the value must reside within the lower 8-bits of operand. |
| `tensorLowerStrideToOverride` | Vector expression of size `.dim` - 1 where each element is of type `.b32`. |
| `tensorUpperStrideToOverride` | Single `.b16` packed register storing `.dim` - 1 values. Each value is of type `.b4`. Unused bits must be set to 0. |

For each tensor dimension, the values specified for `tensorLowerStrideToOverride` and `tensorUpperStrideToOverride` are operated as shown in the below equation to compute the effective global stride (`global_stride`) value to be used instead of the one already present in the `tensorMap` object.

```ptx
tensorGlobalStride[i] = ((tensorLowerStrideToOverride[i] + (tensorUpperStrideToOverride[i] << 32)) << 4);
```

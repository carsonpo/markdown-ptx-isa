# 9.7.18.8.3. Tensorcore 5th Generation Instructions: tcgen05.ld

**tcgen05.ld**

Asynchronous collective load from tensor memory into registers.

## Syntax

```ptx
// Base load instruction:

tcgen05.ld.sync.aligned.shape1.num{.pack}.b32    r, [taddr];

tcgen05.ld.sync.aligned.shape2.num{.pack}.b32    r, [taddr], immHalfSplitoff;

.shape1 = { .16x64b, .16x128b, .16x256b, .32x32b }
.shape2 = { .16x32bx2 }
.num    = { .x1, .x2, .x4, .x8, .x16, .x32, .x64, .x128 }
.pack   = { .pack::16b }

// Floating point type load along with reduction :

tcgen05.ld.red.sync.aligned.shape3.num.redOp{.abs}{.NaN}.f32 r, redval, [taddr];

tcgen05.ld.red.sync.aligned.shape4.num.redOp{.abs}{.NaN}.f32 r, redval, [taddr], immHalfSplitoff;

// Integer type load along with reduction :

tcgen05.ld.red.sync.aligned.shape3.num.redOp.type r, redval, [taddr];

tcgen05.ld.red.sync.aligned.shape4.num.redOp.type r, redval, [taddr], immHalfSplitoff;

.shape3 = { .32x32b   }
.shape4 = { .16x32bx2 }
.redOp  = { .min, .max }
.type   = { .u32, .s32 }

tcgen05.ld.spcompress.sync.aligned.shape.num.rowop.spfactor{.abs}.type.idxsize mdata, cdata, [taddr];

tcgen05.ld.red.spcompress.sync.aligned.shape.num.rowop.spfactor{.abs}{.NaN}.type.idxsize mdata, cdata, redval, [taddr];

.shape    = { .32x32b }
.rowop    = { .min, .max }
.type     = { .f32 }
.idxsize  = { .b2 }
.spfactor = { .sp::2:4 }
.num      = { .x4, .x8, .x16, .x32, .x64, .x128 }
```

## Description

Instruction `tcgen05.ld` asynchronously loads data from the Tensor Memory at the location specified by the 32-bit address operand `taddr` into the destination register `r`, collectively across all threads of the warps.

All the threads in the warp must specify the same value of `taddr`, which must be the base address of the collective load operation. Otherwise, the behavior is undefined.

The `.shape` qualifier and the `.num` qualifier together determines the total dimension of the data which is loaded from the Tensor Memory. The `.shape` qualifier indicates the base dimension of data to be accessed as described in the [Data Movement Shape](data-movement-shapes.md). The `.num` qualifier indicates the repeat factor on the base dimension resulting in the total dimension of the data that is accessed.

The shape `.16x32bx2` performs two accesses into Tensor Memory of the shape `.16x32b`. The base address of the first access is specified by `taddr` and the base address of the second access is specified by `taddr+immHalfSplitoff`, where `immHalfSplitoff` is an immediate argument.

The destination operand `r` is a brace-enclosed vector expression consisting of one or more 32-bit registers as per the value of `.shape` and `.num`. The size of the vector for various combinations of `.num` and `.shape` is shown in Table 59.

**Table 59** Various-combinations of .num and .shape

| .num | .shape: `.16x32bx2` / `.16x64b` / `.32x32b` | .shape: `.16x128b` | .shape: `.16x256b` |
|---|---|---|---|
| `.x1` | 1 | 2 | 4 |
| `.x2` | 2 | 4 | 8 |
| `.x4` | 4 | 8 | 16 |
| `.x8` | 8 | 16 | 32 |
| `.x16` | 16 | 32 | 64 |
| `.x32` | 32 | 64 | 128 |
| `.x64` | 64 | 128 | NA |
| `.x128` | 128 | NA | NA |

The qualifier `.red` specifies that the reduction operation specified by `.redOp` is performed on the data that is loaded across columns in each lane. The result of the reduction operation is written into the corresponding thread's 32-bit destination register operand `redVal`. When `.red` qualifier is specified, `.num` modifier must be at least `.x2`.

If `.abs` qualifier is specified, the absolute values of the loaded data are considered for the reduction operation. If `.NaN` qualifier is specified, the result of the reduction operation is canonical NaN if either of the inputs to the reduction operation is NaN.

When the qualifier `.spcompress` is specified the instruction performs in-line spcompress operation while loading the data from the Tensor Memory. The compression factor is specified by the qualifier `.spfactor`. The only allowed value for `.spfactor` is `.sp::2:4` resulting in 2:4 compression for the data loaded from the Tensor Memory. In this case, half of the data as read from the Tensor Memory is stored to the vector operand `cdata` while corresponding metadata information depicting indices for the chosen elements is stored in the vector operand `mdata`. The size of each data element is given by `.type` and must be `.f32`. The size for the resulting metadata index for each data element is given by `.idxsize` and must always be `.b2`. The `.rowop` along with the optional `.abs` qualifier together specifies the criterion to select the two elements per group of four elements. When the qualifier `.red` is specified along with the `.spcompress` qualifier, the same `.rowop` along with the optional `.abs` qualifier also specifies the reduction operator. However, note that in such cases, if `.NaN` qualifier is specified, it is applicable only to the reduction part of the operation (`.red` portion) and it does not apply to the spcompress part of the operation. This is because fundamentally spcompress operation always preserves the NaN in the output. The operands `mdata`, `cdata` are brace-enclosed vector expression consisting of one or more `.b32` registers. The expected vector size for each of the operand can be computed based on the Table 60.

**Table 60** Expected vector size for various operands

| Operand | Vector Size |
|---|---|
| `mdata` | ceil(num / 32) |
| `cdata` | num / 2 |

The optional qualifier `.pack::16b` can be used to pack two 16-bit elements from adjacent columns into a single 32-bit element during the load as shown in the section [Packing and Unpacking](tensor-memory-load-store-rules.md).

The mandatory `.sync` qualifier indicates that `tcgen05.ld` causes the executing thread to wait until all threads in the warp execute the same `tcgen05.ld` instruction before resuming execution.

The mandatory `.aligned` qualifier indicates that all threads in the warp must execute the same `tcgen05.ld` instruction. In conditionally executed code, a `tcgen05.ld` instruction should only be used if it is known that all threads in the warp evaluate the condition identically, otherwise behavior is undefined.

The behavior of `tcgen05.ld` is undefined if all threads do not use the same values of `taddr`, or if any thread in the warp has exited.

The instruction `tcgen05.ld` is performed asynchronously and more details are specified in the section [Memory Consistency Model for 5th generation of TensorCore operations](memory-consistency.md).

## PTX ISA Notes

Introduced in PTX ISA version 8.6.

`tcgen05.ld.red` is introduced in PTX ISA version 8.8.

`tcgen05.ld{.red}.spcompress` is introduced in PTX ISA version 9.4.

## Target ISA Notes

Supported on following architectures:

- `sm_100a`
- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_100f` or higher in the same family
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
- `sm_110f` or higher in the same family

`tcgen05.ld.red` is supported on following architectures:

- `sm_101a` (Renamed to `sm_110a` from PTX ISA version 9.0)
- And is supported on following family-specific architectures from PTX ISA version 8.8:
  - `sm_101f` or higher in the same family (Renamed to `sm_110f` from PTX ISA version 9.0)
  - `sm_103f` or higher in the same family
- `sm_110f` or higher in the same family

`tcgen05.ld{.red}.spcompress` is supported on following architectures:

- `sm_107a`

## Examples

```ptx
tcgen05.ld.sync.aligned.32x32b.x2.b32     {r0, r1}, [taddr1];

tcgen05.ld.sync.aligned.16x128b.x4.b32    {r0, r1, r2, r3, r4, r5, r6, r7}, [taddr2];

tcgen05.ld.red.sync.aligned.16x32bx2.x8.u32.max {r0, r1, r2, r3, r4, r5, r6, r7},
                                                 redVal, [taddr3], 16;
tcgen05.ld.red.spcompress.sync.aligned.32x32b.x32.max.sp::2:4.abs.f32.b2
                                          {mdata_0}, {r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15},
                                          redval, [taddr];
```

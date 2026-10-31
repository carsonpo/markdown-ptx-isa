# 5.5. Tensors

A tensor is a multi-dimensional matrix structure in the memory. Tensor is defined by the following properties:

- Dimensionality
- Dimension sizes across each dimension
- Individual element types
- Tensor stride across each dimension

PTX supports instructions which can operate on the tensor data. PTX Tensor instructions include:

- Copying data between global and shared memories
- Reducing the destination tensor data with the source.

The Tensor data can be operated on by various `wmma.mma`, `mma` and `wgmma.mma_async` instructions.

PTX Tensor instructions treat the tensor data in the global memory as a multi-dimensional structure and treat the data in the shared memory as a linear data.

## 5.5.1. Tensor Dimension, size and format

Tensors can have dimensions: 1D, 2D, 3D, 4D or 5D.

Each dimension has a size which represents the number of elements along the dimension. The elements can have one the following types:

- Bit-sized type: `.b32`, `.b64`
- Sub-byte types: `.b4x16`, `.b4x16_p64`, `.b6x16_p32`, `.b6p2x16`
- Integer: `.u8`, `.u16`, `.u32`, `.s32`, `.u64`, `.s64`
- Floating point and alternate floating point: `.f16`, `.bf16`, `.tf32`, `.f32`, `.f64` (rounded to nearest even).

Tensor can have padding at the end in each of the dimensions to provide alignment for the data in the subsequent dimensions. Tensor stride can be used to specify the amount of padding in each dimension.

### 5.5.1.1. Sub-byte Types

#### 5.5.1.1.1. Padding and alignment of the sub-byte types

The sub-byte types are expected to packed contiguously in the global memory and the Tensor copy instruction will expand them by appending empty spaces as shown below:

- Type `.b4x16`: With this type, there is no padding involved and the packed sixteen `.b4` elements in a 64-bits container is copied as is between the shared memory and the global memory.

- Type `.b4x16_p64`: With this type, sixteen contiguous 4-bits of data is copied from global memory to the shared memory with the append of 64-bits of padding as shown in Figure 5

  ![Layout for .b4x16_p64](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-dimension-size-format-sub-bytes-padding-align-b4-16-p64.png)

  **Figure 5** Layout for `.b4x16_p64`

  The padded region that gets added is un-initialized.

- Type `.b6x16_p32`: With this type, sixteen 6-bits of data is copied from global memory to the shared memory with an append of 32-bits of padding as shown in Figure 6

  ![Layout for .b6x16_p32](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-dimension-size-format-sub-bytes-padding-align-b6-16-p32.png)

  **Figure 6** Layout for `.b6x16_p32`

  The padded region that gets added is un-initialized.

- Type `.b6p2x16`: With this type, sixteen elements, each containing 6-bits of data at the LSB and 2-bits of padding at the MSB, are copied from shared memory into the global memory by discarding the 2-bits of padding data and packing the 6-bits data contiguously as shown in Figure 7

  ![Layout for .b6p2x16](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-dimension-size-format-sub-bytes-padding-align-b6-p2-16.png)

  **Figure 7** Layout for `.b6p2x16`

In case of `.b6x16_p32` and `.b4x16_p64`, the padded region that gets added is un-initialized.

The types `.b6x16_p32` and `.b6p2x16` share the same encoding value in the descriptor (value 15) as the two types are applicable for different types of tensor copy operations:

| Type | Valid Tensor Copy Direction |
|------|-----------------------------|
| `.b6x16_p32` | `.shared::cluster.global`, `.shared::cta.global` |
| `.b6p2x16` | `.global.shared::cta` |

## 5.5.2. Tensor Access Modes

Tensor data can be accessed in two modes:

- Tiled mode:

  In tiled mode, the source multi-dimensional tensor layout is preserved at the destination.

- Im2col mode:

  In im2col mode, the elements in the Bounding Box of the source tensor are rearranged into columns at the destination. Refer [here](#554-im2col-mode) for more details.

## 5.5.3. Tiled Mode

This section talks about how Tensor and Tensor access work in tiled mode.

### 5.5.3.1. Bounding Box

A tensor can be accessed in chunks known as Bounding Box. The Bounding Box has the same dimensionality as the tensor they are accessing into. Size of each bounding Box must be a multiple of 16 bytes. The address of the bounding Box must also be aligned to 16 bytes.

Bounding Box has the following access properties:

- Bounding Box dimension sizes
- Out of boundary access mode
- Traversal strides

The tensor-coordinates, specified in the PTX tensor instructions, specify the starting offset of the bounding box. Starting offset of the bounding box along with the rest of the bounding box information together are used to determine the elements which are to be accessed.

### 5.5.3.2. Traversal-Stride

While the Bounding Box is iterating the tensor across a dimension, the traversal stride specifies the exact number of elements to be skipped. If no jump over is required, default value of 1 must be specified.

The traversal stride in dimension 0 can be used for the Interleave layout. For non-interleaved layout, the traversal stride in dimension 0 must always be 1.

Figure 8 illustrates tensor, tensor size, tensor stride, Bounding Box size and traversal stride.

![Tiled mode bounding box, tensor size and traversal stride](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-tiled-mode-bounding-box-example.png)

**Figure 8** Tiled mode bounding box, tensor size and traversal stride

### 5.5.3.3. Out of Boundary Access

PTX Tensor operation can detect and handle the case when the Bounding Box crosses the tensor boundary in any dimension. There are 2 modes:

- Zero fill mode:

  Elements in the Bounding Box which fall outside of the tensor boundary are set to 0.

- OOB-NaN fill mode:

  Elements in the Bounding Box which fall outside of the tensor boundary are set to a special NaN called OOB-NaN.

Figure 9 shows an example of the out of boundary access.

![Out of boundary access](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-oob-access.png)

**Figure 9** Out of boundary access

### 5.5.3.4. .tile::scatter4 and .tile::gather4 modes

These modes are similar to the tiled mode with restriction that these modes work only on 2D tensor data. `Tile::scatter4` and `Tile::gather4` modes are used to access multiple non-contiguous rows of tensor data.

In `Tile::scatter4` mode single 2D source tensor is divided into four rows in the 2D destination tensor. In `Tile::gather4` mode four rows in the source 2D tensor are combined to form single 2D destination tensor.

These modes work on four rows and hence the instruction will take:

- four tensor coordinates across the dimension 0
- one tensor coordinate across the dimension 1

The interleave layout is not supported for `.tile::scatter4` and `.tile::gather4` modes.

All other constraints and rules of the tile mode apply to these modes as well.

#### 5.5.3.4.1. Bounding Box

For `Tile::scatter4` and `Tile::gather4` modes, four request coordinates will form four Bounding Boxes in the tensor space.

Figure 10 shows an example of the same with start coordinates (1, 2), (1, 5), (1, 0) and (1, 9).

The size of the bounding box in the dimension 0 represents the length of the rows. The size of the bounding box in the dimension 1 must be one.

![tiled::scatter4/tiled::gather4 mode bounding box example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tiled-scatter4-gather4-bounding-box.png)

**Figure 10** tiled::scatter4/tiled::gather4 mode bounding box example

## 5.5.4. im2col mode

Im2col mode supports the following tensor dimensions : 3D, 4D and 5D. In this mode, the tensor data is treated as a batch of images with the following properties:

- N : number of images in the batch
- D, H, W : size of a 3D image (depth, height and width)
- C: channels per image element

The above properties are associated with 3D, 4D and 5D tensors as follows:

| Dimension | N/D/H/W/C applicability |
|-----------|-------------------------|
| 3D | NWC |
| 4D | NHWC |
| 5D | NDHWC |

### 5.5.4.1. Bounding Box

In im2col mode, the Bounding Box is defined in DHW space. Boundaries along other dimensions are specified by Pixels-per-Column and Channels-per-Pixel parameters as described below.

The dimensionality of the Bounding Box is two less than the tensor dimensionality.

The following properties describe how to access of the elements in im2col mode:

- Bounding-Box Lower-Corner
- Bounding-Box Upper-Corner
- Pixels-per-Column
- Channels-per-Pixel

Bounding-box Lower-Corner and Bounding-box Upper-Corner specify the two opposite corners of the Bounding Box in the DHW space. Bounding-box Lower-Corner specifies the corner with the smallest coordinate and Bounding-box Upper-Corner specifies the corner with the largest coordinate.

Bounding-box Upper- and Lower-Corners are 16-bit signed values whose limits varies across the dimensions and are as shown below:

| | 3D | 4D | 5D |
|--|----|----|----|
| Upper- / Lower- Corner sizes | [-2^15, 2^15-1] | [-2^7, 2^7-1] | [-2^4, 2^4-1] |

Figure 11 and Figure 12 show the Upper-Corners and Lower-Corners.

![im2col mode bounding box example 1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-mode-bounding-box1.png)

**Figure 11** im2col mode bounding box example 1

![im2col mode bounding box example 2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-mode-bounding-box2.png)

**Figure 12** im2col mode bounding box example 2

The Bounding-box Upper- and Lower-Corners specify only the boundaries and not the number of elements to be accessed. Pixels-per-Column specifies the number of elements to be accessed in the NDHW space.

Channels-per-Pixel specifies the number of elements to access across the C dimension.

The tensor coordinates, specified in the PTX tensor instructions, behaves differently in different dimensions:

- Across N and C dimensions: specify the starting offsets along the dimension, similar to the tiled mode.
- Across DHW dimensions: specify the location of the convolution filter base in the tensor space. The filter corner location must be within the bounding box.

The im2col offsets, specified in the PTX tensor instructions in im2col mode, are added to the filter base coordinates to determine the starting location in the tensor space from where the elements are accessed.

The size of the im2col offsets varies across the dimensions and their valid ranges are as shown below:

| | 3D | 4D | 5D |
|--|----|----|----|
| im2col offsets range | [0, 2^16-1] | [0, 2^8-1] | [0, 2^5-1] |

Following are some examples of the im2col mode accesses:

- Example 1 (Figure 13):

  ```
  Tensor Size[0] = 64
  Tensor Size[1] = 9
  Tensor Size[2] = 14
  Tensor Size[3] = 64
  Pixels-per-Column = 64
  channels-per-pixel = 8
  Bounding-Box Lower-Corner W = -1
  Bounding-Box Lower-Corner H = -1
  Bounding-Box Upper-Corner W = -1
  Bounding-Box Upper-Corner H = -1.

  tensor coordinates = (7, 7, 4, 0)
  im2col offsets : (0, 0)
  ```

  ![im2col mode example 1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-mode-example1.png)

  **Figure 13** im2col mode example 1

- Example 2 (Figure 14):

  ```
  Tensor Size[0] = 64
  Tensor Size[1] = 9
  Tensor Size[2] = 14
  Tensor Size[3] = 64
  Pixels-per-Column = 64
  channels-per-pixel = 8
  Bounding-Box Lower-Corner W = 0
  Bounding-Box Lower-Corner H = 0
  Bounding-Box Upper-Corner W = -2
  Bounding-Box Upper-Corner H = -2

  tensor coordinates = (7, 7, 4, 0)
  im2col offsets: (2, 2)
  ```

  ![im2col mode example 2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-mode-example2.png)

  **Figure 14** im2col mode example 2

### 5.5.4.2. Traversal Stride

The traversal stride, in im2col mode, does not impact the total number of elements (or pixels) being accessed unlike the tiled mode. Pixels-per-Column determines the total number of elements being accessed, in im2col mode.

The number of elements traversed along the D, H and W dimensions is strided by the traversal stride for that dimension.

The following example with Figure 15 illustrates accesses with traversal-strides:

```
Tensor Size[0] = 64
Tensor Size[1] = 8
Tensor Size[2] = 14
Tensor Size[3] = 64
Traversal Stride = 2
Pixels-per-Column = 32
channels-per-pixel = 16
Bounding-Box Lower-Corner W = -1
Bounding-Box Lower-Corner H = -1
Bounding-Box Upper-Corner W = -1
Bounding-Box Upper-Corner H = -1.
Tensor coordinates in the instruction = (7, 7, 5, 0)
Im2col offsets in the instruction : (1, 1)
```

![im2col mode traversal stride example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-mode-example3.png)

**Figure 15** im2col mode traversal stride example

### 5.5.4.3. Out of Boundary Access

In im2col mode, when the number of requested pixels in NDHW space specified by Pixels-per-Column exceeds the number of available pixels in the image batch then out-of-bounds access is performed.

Similar to tiled mode, zero fill or OOB-NaN fill can be performed based on the Fill-Mode specified.

## 5.5.5. im2col::w, im2col_no_offs::w and im2col::w::128 modes

These modes are similar to the im2col mode with the restriction that elements are accessed across the W dimension only while keeping the H and D dimension constant.

All the constraints and rules of the im2col mode apply to these modes as well. Note that for these modes, the legal [Swizzling Modes](06-tensor-swizzling-and-tensormap.md) is required. In other words, swizzling mode must not be set to (i) no swizzle and (ii) 128-byte swizzle mode with 32-byte atomicity with 8-byte flip.

The number of elements accessed in the `im2col::w::128` mode is fixed and is equal to 128. The number of elements accessed in the `im2col::w` and `im2col_no_offs::w` modes depend on the Pixels-per-Column field in the TensorMap.

### 5.5.5.1. Bounding Box

In these modes, the size of the bounding box in D and H dimensions are 1.

The D and H dimensions in the tensor coordinates argument in the PTX instruction specify the position of the bounding box in the tensor space.

The Bounding-Box Lower-Corner-W and Bounding-Box Upper-Corner-W specify the two opposite corners of the Bounding Box in the W dimension.

The W dimension in the tensor coordinates argument in the PTX instruction specify the location of the first element that is to be accessed in the bounding box.

Number of pixels loaded in `im2col::w` mode and number of pixels stored or otherwise reduced in `im2col_no_offs::w` mode is specified by Pixels-per-Column in the TensorMap. Number of pixels loaded in `im2col::w::128` mode is always 128. So, Pixels-per-Column is ignored in `im2col::w::128` mode.

Figure 16 shows an example of the `im2col::w` and `im2col::w:128` modes.

![im2col::w and im2col::w::128 modes example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example.png)

**Figure 16** im2col::w and im2col::w::128 modes example

The first element can lie outside of the Bounding Box in the W-dimension only and only on the left side of the Bounding Box. Figure 17 shows of an example of this.

![im2col::w and im2col::w::128 modes first element outside Bounding Box example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example2.png)

**Figure 17** im2col::w and im2col::w::128 modes first element outside Bounding Box example

For `im2col_no_offs::w` mode, since the tensor data is being stored or otherwise reduced to global memory, the bounding box must always stay within the tensor boundary limit. In other words, the numeric value for Lower-Corner-W must be non-negative while the value for Upper-Corner-W must be non-positive. In this mode, it also naturally follows that the negative values for tensor coordinates would result in illegal out-of-bounds access and runtime error is raised in such cases. Additionally, note that once out of boundary access is detected, subsequent pixel operations would not be performed even if the total count of the pixel operated is less than the Pixels-per-Column value specified in the TensorMap.

Figure 18 shows an example of the `im2col_no_offs::w` mode.

![im2col_no_offs::w mode example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-w-no-offs-mode-example.png)

**Figure 18** im2col_no_offs::w mode example

### 5.5.5.2. Traversal Stride

This is similar to im2col mode with the exception of that the number of elements traversed along only the W dimension is strided by the traversal stride as specified in the TensorMap.

### 5.5.5.3. wHalo

In `im2col::w` mode, the `wHalo` argument in the PTX instruction specifies how many filter halo elements must be loaded at the end of the image.

In `im2col::w::128` mode, the halo elements are loaded after every 32 elements in the bounding box along the W dimension. The `wHalo` argument in the PTX instruction specifies how many halo elements must be loaded after every 32 elements.

Note that for `im2col_no_offs::w` mode, it is illegal to explicitly specify `wHalo` value and instead it always defaults to 0.

Following is an example of `.im2col::w` mode access:

```
Tensor Size [0] = 128
Tensor Size [1] = 9
Tensor Size [2] = 7
Tensor Size [3] = 64
Pixels-per-column = 128
Channels-per-pixel = 64
Bounding Box Lower Corner W = 0
Bounding Box Upper Corner W = 0

Tensor Coordinates in the instruction = (7, 2, 3, 0)
wHalo in the instruction = 2 (as 3x3 convolution filter is used)
```

A tensor copy operation with the above parameters loads 128 pixels and the two halo pixels as shown in Figure 19.

![tensor copy operation with im2col::w mode example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example3.png)

**Figure 19** tensor copy operation with im2col::w mode example

The halo pixels are always loaded in the shared memory next to the main row pixels as shown in Figure 19.

Following is an example of `.im2col::w::128` mode access:

```
Tensor Size [0] = 128
Tensor Size [1] = 9
Tensor Size [2] = 7
Tensor Size [3] = 64
Channels-per-pixel = 64
Bounding Box Lower Corner W = 0
Bounding Box Upper Corner W = 0

Tensor Coordinates in the instruction = (7, 2, 3, 0)
wHalo in the instruction = 2 (as 3x3 convolution filter is used)
```

A tensor copy operation with the above parameters loads 128 elements such that after every 32 elements, `wHalo` number of elements are loaded as shown in Figure 20.

![tensor copy operation with im2col::w::128 mode example](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example4.png)

**Figure 20** tensor copy operation with im2col::w::128 mode example

### 5.5.5.4. wOffset

In the convolution calculations, the same elements along the W dimension are reused for different locations within the convolution filter footprint. Based on the number of times a pixel is used, the pixels may be loaded into different shared memory buffers. Each buffer can be loaded by a separate tensor copy operation.

The `wOffset` argument in the tensor copy and prefetch instruction adjusts the source pixel location for each buffer. The exact position of the buffer is adjusted along the W dimension using the following formula:

```
Bounding Box Lower Corner W += wOffset
Bounding Box Upper Corner W += wOffset
W += wOffset
```

Note that for `im2col_no_offs::w` mode, it is illegal to explicitly specify `wOffset` value and instead it always defaults to 0.

Following are examples of tensor copy to multiple buffers with various `wHalo` and `wOffset` values:

Example 1:

```
Tensor Size [0] = 128
Tensor Size [1] = 9
Tensor Size [2] = 67
Tensor Size [3] = 64
Pixels-per-Column = 128
Channels-per-pixel = 64
Bounding Box Lower Corner W = -1
Bounding Box Upper Corner W = 0
Traversal Stride = 2

Tensor Coordinates in the instruction = (7, 2, -1, 0)

Shared memory buffer 1:
   wHalo = 1
   wOffset = 0

Shared memory buffer 2:
   wHalo = 0
   wOffset = 1
```

![tensor copy operation to buffer 1 of Example 1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example5.png)

**Figure 21** tensor copy operation to buffer 1 of Example 1

![tensor copy operation to buffer 2 of Example 1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example6.png)

**Figure 22** tensor copy operation to buffer 2 of Example 1

Example 2:

```
Tensor Size [0] = 128
Tensor Size [1] = 7
Tensor Size [2] = 7
Tensor Size [3] = 64
Pixels-per-Column = 128
Channels-per-pixel = 64
Bounding Box Lower Corner W = -1
Bounding Box Upper Corner W = -1
Traversal Stride = 3

Tensor Coordinates in the instruction = (7, 2, -1, 0)

Shared memory buffer 1:
   wHalo = 0
   wOffset = 0

Shared memory buffer 2:
   wHalo = 0
   wOffset = 1

Shared memory buffer 3:
   wHalo = 0
   wOffset = 2
```

![tensor copy operation to buffer 1 of Example 2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example7.png)

**Figure 23** tensor copy operation to buffer 1 of Example 2

![tensor copy operation to buffer 2 of Example 2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example8.png)

**Figure 24** tensor copy operation to buffer 2 of Example 2

![tensor copy operation to buffer 3 of Example 2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tensor-im2col-w-w128-modes-example9.png)

**Figure 25** tensor copy operation to buffer 3 of Example 2

## 5.5.6. Interleave layout

Tensor can be interleaved and the following interleave layouts are supported:

- No interleave (NDHWC)
- 8 byte interleave (NC/8DHWC8) : C8 utilizes 16 bytes in memory assuming 2B per channel.
- 16 byte interleave (NC/16HWC16) : C16 utilizes 32 bytes in memory assuming 4B per channel.

The C information is organized in slices where sequential C elements are grouped in 16 byte or 32 byte quantities.

If the total number of channels is not a multiple of the number of channels per slice, then the last slice must be padded with zeros to make it complete 16B or 32B slice.

Interleaved layouts are supported only for the dimensionalities : 3D, 4D and 5D.

The interleave layout is not supported for `.im2col::w` and `.im2col::w::128` modes.

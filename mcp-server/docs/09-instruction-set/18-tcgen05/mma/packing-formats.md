# 9.7.18.10.4. Packing formats of elements in Tensor and Shared memory

## 9.7.18.10.4.1. Packing format for matrix D in Tensor Memory

The sub-word elements of matrix D are expected not to be packed within a 32-bit Tensor Memory word. For example, if the type of elements of the matrix D is 16 bits then a Tensor Memory word would contain a single 16-bit element in its lower 16 bits.

## 9.7.18.10.4.2. Packing format for matrix A and B

The 6-bit and 4-bit floating point types have different packing format requirements for different MMA kinds in both Tensor memory and Shared memory. The requirements are as follows.

## 9.7.18.10.4.3. Packing format used for matrix A by .kind::mxf8f6f4 in Tensor Memory

The supported combination of the container size and the individual floating point type elements supports are listed in Table 66

**Table 66** Valid Combinations of Container size and floating point types

| Individual floating point type element | Container size | Dense K dimension (number of elements) |
|----------------------------------------|----------------|----------------------------------------|
| FP4 | 8-bits | 32 |
| FP6 | 6-bits | 64 |
| FP6 | 8-bits (with 2-bits padding in each byte) | 32 |
| FP8 | 8-bits | 32 |

The 8-bit or 6-bit containers must be contiguously packed in a 32-bit Tensor Memory word. For example, if the type of elements of the matrix A is 6 bits and uses 8-bit container then 4 consecutive A elements should be packed in one 32-bit Tensor Memory word.

- 4-bit packing format in an 8-bit container as shown in Figure 202

  ![4-bit packing format with type E2M1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-tmem-dig1.png)

  **Figure 202** 4-bit packing format with type E2M1

- 6-bit packing format in an 8-bit container

  - Type E3M2 as shown in Figure 203

    ![6-bit packing format in an 8-bit container with type E3M2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-tmem-dig2.png)

    **Figure 203** 6-bit packing format in an 8-bit container with type E3M2

  - Type E2M3 as shown in Figure 204

    ![6-bit packing format in an 8-bit container with type E2M3](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-tmem-dig3.png)

    **Figure 204** 6-bit packing format in an 8-bit container with type E2M3

- 6-bit packing format in an 6-bit container

  - Type E3M2 as shown in Figure 205

    ![6-bit packing format in an 6-bit container with type E3M2](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-tmem-dig4.png)

    **Figure 205** 6-bit packing format in an 6-bit container with type E3M2

  - Type E2M3 as shown in Figure 206

    ![6-bit packing format in an 6-bit container with type E2M3](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-tmem-dig5.png)

    **Figure 206** 6-bit packing format in an 6-bit container with type E2M3

## 9.7.18.10.4.4. Packing format used for matrix A and B by .kind::mxf8f6f4 in Shared Memory

The 4-bit and 6-bit floating point elements in shared memory must be contiguously packed and based on the Dense-K dimension, padding may be needed:

| Dense-K dimension | Padding needed after 16 elements |
|-------------------|----------------------------------|
| 32 | Yes |
| 64 | No |

- 4-bit packing format with padding as shown in Figure 207

  ![4-bit packing format with padding](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-smem-dig1.png)

  **Figure 207** 4-bit packing format with padding

- 6-bit packing format with padding as shown in Figure 208

  ![6-bit packing format with padding](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-smem-dig2.png)

  **Figure 208** 6-bit packing format with padding

- 6-bit packing format without padding as shown in Figure 209

  ![6-bit packing format without padding](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf8f6f4-smem-dig3.png)

  **Figure 209** 6-bit packing format without padding

## 9.7.18.10.4.5. Packing format used for matrix A by .kind::mxf4 and .kind::mxf4nvf4 in Tensor Memory

Two 4-bit floating point type elements must be packed in an 8-bit container in Tensor memory as shown in Figure 210 for `mxf4`.

![4-bit packing format with type E2M1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-packing-formats-mxf4-tmem-dig1.png)

**Figure 210** 4-bit packing format with type E2M1

## 9.7.18.10.4.6. Packing format used for matrix A and B by .kind::mxf4 and .kind::mxf4nvf4 in Shared Memory

The packing format for 4-bit floating point elements in shared memory is to pack two 4-bit elements in a 8-bit container, with no padding.

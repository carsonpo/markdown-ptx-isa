# 9.7.18.9. Tensor Memory Data Movement Instructions

Data from the shared memory can be copied asynchronously to the Tensor Memory using the [Tensorcore 5th Generation Instructions: tcgen05.cp](tcgen05-cp.md) operation.

## 9.7.18.9.1. Optional Decompression

Optionally, during the copy, a vector of 4-bit and 6-bit custom floating point types can be decompressed into 8-bit types.

### 9.7.18.9.1.1. Decompression of 4-bit floating point to 8-bit type

A contiguous set of 16 elements of 4-bits each followed by 8 bytes of padding can be converted into 16 elements of 8-bits each as shown in Figure 197.

![Decompression from 4-bit to 8-bit](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompression-4b8b.png)

**Figure 197** Decompression from 4-bit to 8-bit

The individual 4-bit to 8-bit decompression would look like as shown in Figure 198.

![Individual decompression from 4-bit to 8-bit](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompression-4b8b-individual.png)

**Figure 198** Individual decompression from 4-bit to 8-bit

### 9.7.18.9.1.2. Decompression of 6-bit floating point to 8-bit type

A contiguous set of 16 elements of 6-bits each followed by 4 bytes of padding is decompressed into 16 elements of 8-bits each as shown in Figure 199.

![Decompression from 6-bit to 8-bit](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompression-6b8b.png)

**Figure 199** Decompression from 6-bit to 8-bit

The individual 6-bit to 8-bit decompression for types E3M2 and E2M3 is shown in Figure 200 and Figure 201 respectively.

![Individual decompression from 6-bit to 8-bit for E3M2 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompression-6b8b-individual1.png)

**Figure 200** Individual decompression from 6-bit to 8-bit for E3M2 type

![Individual decompression from 6-bit to 8-bit for E2M3 type](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-decompression-6b8b-individual2.png)

**Figure 201** Individual decompression from 6-bit to 8-bit for E2M3 type

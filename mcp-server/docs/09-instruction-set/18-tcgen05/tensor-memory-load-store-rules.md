# 9.7.18.8. Tensor Memory and Register Load/Store Instructions

The threads of the CTA can perform the loads and stores to the Tensor Memory of the CTA and move data between registers and Tensor Memory. The loads and stores of data can be performed in certain shapes as specified in the [Matrix and Data Movement Shape](matrix-shapes.md) section.

## 9.7.18.8.1. Access restrictions

Not all threads of the CTA can access the entire Tensor Memory via the `tcgen05.ld` and `tcgen05.st` operations.

The Tensor Memory of a CTA is divided into 4 equal chunks such that each warp of a warpgroup in the CTA can access a chunk of the Tensor Memory. All the columns of the Tensor Memory can be accessed by all the four warps of a warpgroup. A lane of the Tensor Memory can be accessed by a single warp in the warpgroup. The following table describes the access restriction.

| ID of the warp within the warpgroup | Accessible Lanes |
|---|---|
| 0 | 0-31 |
| 1 | 32-63 |
| 2 | 64-95 |
| 3 | 96-127 |

## 9.7.18.8.2. Packing and Unpacking

Optionally, the following pack and unpack operations can be performed during the load and store:

- Packing: two 16-bit chunks can be packed into a single 32-bit chunk in the register in `tcgen05.ld`
- Unpacking: a single 32-bit chunk in the register can be unpacked into two 16-bit chunks in `tcgen05.st`

as shown in the Figure 196.

![Pack/Unpack operations for tcgen05 ld/st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-ld-st-pack-unpack.png)

**Figure 196** Pack/Unpack operations for tcgen05 ld/st

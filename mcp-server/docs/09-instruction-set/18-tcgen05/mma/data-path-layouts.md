# 9.7.18.10.5. Data Path Layout Organization

Different MMA variants access the tensor memory with different layout organization. The following table lists the various layouts:

| M | cta_group | A-Sparsity | Is `.ws` mode | Datapath organization | Layout ID | Tensor Memory Datapath Lane Alignment |
|---|-----------|------------|---------------|-----------------------|-----------|---------------------------------------|
| 32 | `::1` | Either | Yes | 1x4 | Layout G | 0 |
| 64 | `::1` | Either | Yes | 2x2 | Layout E | 0 |
| 64 | `::1` | Either | No | 4x1 (1/2 datapath utilized) | Layout F | 0 or 16 |
| 128 | `::1` | Either | Either | 4x1 | Layout D | 0 |
| 128 | `::2` | Dense | N/A | 2x2 | Layout B | 0 |
| 128 | `::2` | Sparse | N/A | 4x1 (1/2 datapath utilized) | Layout C | 0 or 16 |
| 256 | `::2` | Either | N/A | 4x1 | Layout A | 0 |

The layouts which utilize only half the datapath lanes, i.e., Layout F and Layout C, must use the same Tensor Memory lane alignment across matrices A, D and the sparsity metadata matrix.

The following shows the warps that can access the Tensor Memory regions via [`tcgen05.ld`](../tcgen05-ld.md) / [`tcgen05.st`](../tcgen05-st.md) along with the addresses for various Tensor Memory Layouts.

## 9.7.18.10.5.1. Layout A (M = 256)

Layout organization for M = 256 is shown in Figure 211.

![Layout organization for M = 256](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-a1.png)

**Figure 211** Layout organization for M = 256

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 212

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-a2.png)

**Figure 212** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.2. Layout B (M = 128 + cta_group::2 + Dense A matrix)

Layout organization for M = 128 + `.cta_group::2` + Dense A matrix is shown in Figure 213.

![Layout organization for M = 128 + .cta_group::2 + Dense A matrix](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-b1.png)

**Figure 213** Layout organization for M = 128 + `.cta_group::2` + Dense A matrix

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 214

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-b2.png)

**Figure 214** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.3. Layout C (M = 128 + cta_group::2 + Sparse A matrix)

Layout organization for M = 128 + `.cta_group::2` + Sparse A matrix is shown in Figure 215.

![Layout organization for M = 128 + .cta_group::2 + Sparse A matrix](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-c1.png)

**Figure 215** Layout organization for M = 128 + `.cta_group::2` + Sparse A matrix

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 216

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-c2.png)

**Figure 216** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.4. Layout D (M = 128 + cta_group::1)

Layout organization for M = 128 + `.cta_group::1` is shown in Figure 217.

![Layout organization for M = 128 + .cta_group::1](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-d1.png)

**Figure 217** Layout organization for M = 128 + `.cta_group::1`

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 218

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-d2.png)

**Figure 218** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.5. Layout E (M = 64 + .ws mode)

Layout organization for M = 64 + `.ws` mode is shown in Figure 219.

![Layout organization for M = 64 + .ws mode](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-e1.png)

**Figure 219** Layout organization for M = 64 + `.ws` mode

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 220

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-e2.png)

**Figure 220** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.6. Layout F (M = 64 + non .ws mode)

Layout organization for M = 64 + non `.ws` mode is shown in Figure 221.

![Layout organization for M = 64 + non .ws mode](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-f1.png)

**Figure 221** Layout organization for M = 64 + non `.ws` mode

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 222

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-f2.png)

**Figure 222** Addresses to use in `tcgen05.ld` / `tcgen05.st`

## 9.7.18.10.5.7. Layout G (M = 32)

Layout organization for M = 32 is shown in Figure 223.

![Layout organization for M = 32](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-g1.png)

**Figure 223** Layout organization for M = 32

Addresses for the above region to be used in `tcgen05.ld` / `tcgen05.st` is shown in Figure 224

![Addresses to use in tcgen05.ld / tcgen05.st](https://docs.nvidia.com/cuda/parallel-thread-execution/_images/tcgen05-data-path-layout-g2.png)

**Figure 224** Addresses to use in `tcgen05.ld` / `tcgen05.st`

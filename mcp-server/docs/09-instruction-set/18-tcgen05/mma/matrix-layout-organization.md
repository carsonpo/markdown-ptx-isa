# 9.7.18.10.2. Matrix Layout Organization

Table 64 describes the major-ness used for different matrices.

**Table 64** Major-ness for different matrices

| Matrix | Residing in Memory | Default Major-ness |
|--------|--------------------|--------------------|
| D | Tensor Memory | Row-Major |
| A | Tensor Memory | Row-Major |
| A | Shared Memory | Depends on swizzling mode. Refer [Shared Memory Layout and Swizzling](shared-memory-layout-and-swizzling.md) |
| B | Shared Memory | Depends on swizzling mode. Refer [Shared Memory Layout and Swizzling](shared-memory-layout-and-swizzling.md) |

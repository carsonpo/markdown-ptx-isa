# 9.7.18.10.3. Valid Combinations of Type-Size, Major-ness and Swizzling

**Table 65** Valid Combinations of Type-Size, Major-ness and Swizzling

| Type-Size | Major-ness | Matrix | Supported Swizzle |
|-----------|------------|--------|-------------------|
| 4-bit, 6-bit, 8-bit, 16-bit, 32-bit | Row | A | All swizzling modes |
| 4-bit, 6-bit, 8-bit, 16-bit, 32-bit | Column | B | All swizzling modes |
| 8-bit, 16-bit | Column (transpose) | A | All except 128B swizzling with 32B atomicity |
| 8-bit, 16-bit | Row (transpose) | B | All except 128B swizzling with 32B atomicity |
| 32-bit | Column (transpose) | A | Only 128B swizzling with 32B atomicity |
| 32-bit | Row (transpose) | B | Only 128B swizzling with 32B atomicity |

# 11. Directives

PTX directives are statements that begin with a dot (`.`) and carry information to the PTX assembler and the optimizing backend rather than executing on the GPU. They are grouped into eight families: PTX module directives (`.version`, `.target`, `.address_size`), kernel and function directives (`.entry`, `.func`, `.alias`), control flow directives (`.branchtargets`, `.calltargets`, `.callprototype`), performance-tuning directives (`.maxnreg`, `.maxntid`, `.reqntid`, `.minnctapersm`, `.maxnctapersm`, `.pragma`, `.abi_preserve`, `.abi_preserve_control`, `.minperctamemory`), debugging directives (`.dwarf`, `.section`, `.file`, `.loc`, `.loc_intermediate`, `.nv_intermediate_source_section`), linking directives (`.extern`, `.visible`, `.weak`, `.common`), cluster dimension directives (`.reqnctapercluster`, `.explicitcluster`, `.maxclusterrank`), and miscellaneous directives (`.blocksareclusters`, `.language`).

## Pages

- [11.1. PTX Module Directives](01-module/README.md) — `.version`, `.target` and `.address_size`, which open every PTX module.
- [11.2. Specifying Kernel Entry Points and Functions](02-kernel-function/README.md) — `.entry`, `.func` and `.alias` for declaring kernels and device functions.
- [11.3. Control Flow Directives](03-control-flow/README.md) — `.branchtargets`, `.calltargets` and `.callprototype` for indirect branches and calls.
- [11.4. Performance-Tuning Directives](04-performance-tuning/README.md) — register, thread-count, occupancy, ABI-preservation and pragma hints for the backend compiler.
- [11.5. Debugging Directives](05-debugging/README.md) — directives that carry DWARF debug information through PTX modules.
- [11.6. Linking Directives](06-linking/README.md) — `.extern`, `.visible`, `.weak` and `.common` symbol linkage.
- [11.7. Cluster Dimension Directives](07-cluster-dimension/README.md) — directives that specify or constrain cluster dimensions of a kernel.
- [11.8. Miscellaneous Directives](08-miscellaneous/README.md) — `.blocksareclusters` and `.language`.

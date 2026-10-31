# 11.4. Performance-Tuning Directives

To provide a mechanism for low-level performance tuning, PTX supports the following directives, which pass information to the optimizing backend compiler.

- `.maxnreg`
- `.maxntid`
- `.reqntid`
- `.minnctapersm`
- `.maxnctapersm` (deprecated)
- `.pragma`
- `.abi_preserve`
- `.abi_preserve_control`
- `.minperctamemory`

The `.maxnreg` directive specifies the maximum number of registers to be allocated to a single thread; the `.maxntid` directive specifies the maximum number of threads in a thread block (CTA); the `.reqntid` directive specifies the required number of threads in a thread block (CTA); and the `.minnctapersm` directive specifies a minimum number of thread blocks to be scheduled on a single multiprocessor (SM). These can be used, for example, to throttle the resource requirements (e.g., registers) to increase total thread count and provide a greater opportunity to hide memory latency. The `.minnctapersm` directive can be used together with either the `.maxntid` or `.reqntid` directive to trade-off registers-per-thread against multiprocessor utilization without needed to directly specify a maximum number of registers. This may achieve better performance when compiling PTX for multiple devices having different numbers of registers per SM.

Device function directives `.abi_preserve` and `.abi_preserve_control` specify number of data and control registers from callee save registers that a function must preserve for its caller. This can be considered to be the number of general purpose and control registers live in the caller when function is called. Control registers refer to the number of divergent program points that happen in the calltree leading to current function call.

Currently, the `.maxnreg`, `.maxntid`, `.reqntid`, and `.minnctapersm` directives may be applied per-entry and must appear between an `.entry` directive and its body. The directives take precedence over any module-level constraints passed to the optimizing backend. A warning message is generated if the directives' constraints are inconsistent or cannot be met for the specified target device.

A general `.pragma` directive is supported for passing information to the PTX backend. The directive passes a list of strings to the backend, and the strings have no semantics within the PTX virtual machine model. The interpretation of `.pragma` values is determined by the backend implementation and is beyond the scope of the PTX ISA. Note that `.pragma` directives may appear at module (file) scope, at entry-scope, or as statements within a kernel or device function body.

## Pages

- [11.4.1. Performance-Tuning Directives: .maxnreg](maxnreg.md) — maximum number of registers that can be allocated per thread.
- [11.4.2. Performance-Tuning Directives: .maxntid](maxntid.md) — maximum number of threads in the thread block (CTA).
- [11.4.3. Performance-Tuning Directives: .reqntid](reqntid.md) — required number of threads in the thread block (CTA).
- [11.4.4. Performance-Tuning Directives: .minnctapersm](minnctapersm.md) — minimum number of CTAs per SM.
- [11.4.5. Performance-Tuning Directives: .maxnctapersm (deprecated)](maxnctapersm.md) — maximum number of CTAs per SM; replaced by `.minnctapersm`.
- [11.4.6. Performance-Tuning Directives: .noreturn](noreturn.md) — indicate that a function does not return to its caller.
- [11.4.7. Performance-Tuning Directives: .pragma](pragma.md) — pass directive strings to the PTX backend compiler.
- [11.4.8. Performance-Tuning Directives: .abi_preserve](abi_preserve.md) — number of general purpose registers callers of a function must preserve.
- [11.4.9. Performance-Tuning Directives: .abi_preserve_control](abi_preserve_control.md) — number of control registers callers of a function must preserve.
- [11.4.10. Performance-Tuning Directives: .minperctamemory](minperctamemory.md) — minimum per-CTA global memory required by a kernel.

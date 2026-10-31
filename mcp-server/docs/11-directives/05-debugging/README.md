# 11.5. Debugging Directives

DWARF-format debug information is passed through PTX modules using the following directives:

- `@@DWARF`
- `.section`
- `.file`
- `.loc`
- `.loc_intermediate`
- `.nv_intermediate_source_section`

The `.section` directive was introduced in PTX ISA version 2.0 and replaces the `@@DWARF` syntax. The `@@DWARF` syntax was deprecated in PTX ISA version 2.0 but is supported for legacy PTX ISA version 1.x code.

Beginning with PTX ISA version 3.0, PTX files containing DWARF debug information should include the `.target debug` platform option. This forward declaration directs PTX compilation to retain mappings for source-level debugging.

## Pages

- [11.5.1. Debugging Directives: @@dwarf](dwarf.md) — Legacy DWARF-format information (deprecated, replaced by `.section`).
- [11.5.2. Debugging Directives: .section](section.md) — PTX section definition holding DWARF lines.
- [11.5.3. Debugging Directives: .file](file.md) — Associates a source file name with an integer index.
- [11.5.4. Debugging Directives: .loc](loc.md) — Source file location for subsequent PTX instructions.
- [11.5.5. Debugging Directives: .loc_intermediate](loc_intermediate.md) — Intermediate-language source file location for the following instruction.
- [11.5.6. Debugging Directives: .nv_intermediate_source_section](nv_intermediate_source_section.md) — Embed intermediate IR source code in the PTX module.

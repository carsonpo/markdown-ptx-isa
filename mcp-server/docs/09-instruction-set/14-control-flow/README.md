# 9.7.14. Control Flow Instructions

The following PTX instructions and syntax are for controlling execution in a PTX program:

- `{}`
- `@`
- `bra`
- `call`
- `ret`
- `exit`

## Pages

- [9.7.14.1. Control Flow Instructions: {}](braces.md) — Curly braces group instructions and delimit variable scope.
- [9.7.14.2. Control Flow Instructions: @](at.md) — Guard predicate for predicated execution of an instruction.
- [9.7.14.3. Control Flow Instructions: bra](bra.md) — Branch to a label, optionally conditional and optionally uniform.
- [9.7.14.4. Control Flow Instructions: brx.idx](brx-idx.md) — Branch to a label selected by index from a `.branchtargets` list.
- [9.7.14.5. Control Flow Instructions: call](call.md) — Direct and indirect function calls, recording the return location.
- [9.7.14.6. Control Flow Instructions: ret](ret.md) — Return from a function to the instruction after the call.
- [9.7.14.7. Control Flow Instructions: exit](exit.md) — Terminate the executing thread.

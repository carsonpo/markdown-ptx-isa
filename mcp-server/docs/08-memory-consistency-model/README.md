# 8. Memory Consistency Model

The memory consistency model specifies the ordering and visibility guarantees that PTX provides for memory operations executed by threads on NVIDIA GPUs. It defines the vocabulary (scopes, proxies, strong and weak operations, morally strong relations, release and acquire patterns), the ordering relations (program order, observation order, fence-SC order, causality, coherence and communication order) and the axioms that every execution must satisfy, together with litmus-test examples and special cases.

## Pages

- [8. Memory Consistency Model · 8.1–8.9](01-scope-operations-types-ordering.md) — scope and applicability, memory operations, state spaces, operation types (`mmio`, `volatile`), scopes, proxies, morally strong operations and data races, release/acquire patterns, and the ordering relations
- [8.10. Axioms · 8.11. Special Cases](02-axioms-special-cases.md) — coherence, fence-SC, atomicity, no-thin-air, sequential consistency per location and causality axioms with litmus tests, plus the reduction special case

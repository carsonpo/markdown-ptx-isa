# 11.7. Cluster Dimension Directives

The following directives specify information about clusters:

- `.reqnctapercluster`
- `.explicitcluster`
- `.maxclusterrank`

The `.reqnctapercluster` directive specifies the number of CTAs in the cluster. The `.explicitcluster` directive specifies that the kernel should be launched with explicit cluster details. The `.maxclusterrank` directive specifies the maximum number of CTAs in the cluster.

The cluster dimension directives can be applied only on kernel functions.

## Pages

- [11.7.1. Cluster Dimension Directives: .reqnctapercluster](reqnctapercluster.md) — Declare the number of CTAs in the cluster.
- [11.7.2. Cluster Dimension Directives: .explicitcluster](explicitcluster.md) — Declare that the kernel must be launched with explicit cluster dimensions.
- [11.7.3. Cluster Dimension Directives: .maxclusterrank](maxclusterrank.md) — Declare the maximum number of CTAs that can be part of the cluster.

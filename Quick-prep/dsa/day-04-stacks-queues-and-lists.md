# Day 4: Trees and Graphs

## Trees

**1. Binary tree and DFS**

Each node has up to two children; preorder visits node-left-right, inorder left-node-right, postorder left-right-node.

**2. BFS and levels**

A queue visits nodes by distance from the root; use for level-order views or the shallowest matching level.

```text
		 A        BFS: A, B, C, D
		/ \
	  B   C
	 /
	D
```

**3. Tree properties**

Height, depth, diameter, and path sums use subtree results plus a rule for combining children.

**4. BST and LCA**

A BST orders values by subtree ranges; lowest common ancestor is the deepest node shared by target paths.

[Tree basics](../../DSA/dsa-lectures/day-31-binary-tree-fundamentals-and-dfs.md) | [BFS](../../DSA/dsa-lectures/day-32-level-order-traversal-bfs-and-views.md) | [Depth/paths](../../DSA/dsa-lectures/day-33-tree-depth-diameter-and-path-sums.md) | [BST](../../DSA/dsa-lectures/day-34-binary-search-trees-crud-and-validation.md) | [LCA/serialization](../../DSA/dsa-lectures/day-35-lowest-common-ancestor-and-serialization.md)

## Graphs

**1. Graph representation**

Adjacency lists store neighbors efficiently for sparse graphs; matrices make edge lookup direct but use `O(V^2)` space.

**2. BFS and DFS**

With adjacency lists, each traversal is `O(V + E)`; BFS gives shortest paths by edge count in unweighted graphs.

**3. Cycles and topological order**

Directed/undirected cycle checks need different state; topological sort orders dependencies only in a DAG.

**4. Connected components**

Start a traversal at each unvisited vertex to count disconnected regions.

[Representation](../../DSA/dsa-lectures/day-36-graph-representations-and-modeling.md) | [BFS](../../DSA/dsa-lectures/day-37-graph-traversal-bfs-and-shortest-path.md) | [DFS](../../DSA/dsa-lectures/day-38-graph-traversal-dfs-and-components.md) | [Cycles](../../DSA/dsa-lectures/day-39-cycle-detection-directed-and-undirected.md) | [Topological sort](../../DSA/dsa-lectures/day-40-topological-sort-kahns-and-dfs.md)

## Tricky points

1. **Trees**

**1.1 Recursion depth**

A skewed tree has height `O(n)` and can overflow the JavaScript call stack.

**1.2 BST validation**

Every node must satisfy inherited lower/upper bounds, not only compare with its parent.

**1.3 Serialization**

Preserve absent-child markers if the encoding must reconstruct tree shape.

2. **Graphs**

**2.1 Visited timing**

Mark on enqueue for BFS to prevent duplicate queue entries.

**2.2 Cycle state**

Directed checks need current-path/finished distinctions; undirected checks must ignore the parent edge.

**2.3 Topological sort**

A valid order exists only for a DAG; fewer output vertices indicates a cycle.
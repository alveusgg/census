export class Node<T> {
  id: number;
  children: Set<Node<T>>;
  parent?: Node<T>;
  data: T;

  constructor(id: number, data: T) {
    this.id = id;
    this.children = new Set();
    this.data = data;
  }

  add(child: Node<T>) {
    this.children.add(child);
    child.parent = this;
  }

  isRoot(): this is this & { parent: undefined } {
    return this.parent === undefined;
  }

  isLeaf() {
    return this.children.size === 0;
  }

  getById(id: number): Node<T> | undefined {
    if (this.id === id) return this;
    for (const child of this.children) {
      const result = child.getById(id);
      if (result) return result;
    }
    return;
  }

  getAncestors(): Node<T>[] {
    const ancestors: Node<T>[] = [];
    let current: Node<T> | undefined = this;
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    return ancestors;
  }

  getLeafs(): Node<T>[] {
    if (this.isLeaf()) return [this];
    const leafs: Node<T>[] = [];
    for (const child of this.children) {
      leafs.push(...child.getLeafs());
    }
    return leafs;
  }

  path(): number[] {
    const ancestors = this.getAncestors();
    return ancestors.map(ancestor => ancestor.id);
  }
}

const getCommonAncestor = <T>(a: Node<T>, b: Node<T>) => {
  const ancestors = new Set(a.getAncestors());
  let current: Node<T> | undefined = b;
  while (current) {
    if (ancestors.has(current)) return current;
    current = current.parent;
  }
  return a;
};

export const getMinimizedTree = <T>(tree: Node<T>) => {
  const leaves = tree.getLeafs();
  let common = leaves.reduce((acc, leaf) => getCommonAncestor(acc, leaf));
  if (common.isLeaf() && common.parent) return common.parent;
  return common;
};

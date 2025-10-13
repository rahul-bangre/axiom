import type { RuntimeValue } from "../runtime/value.ts";
import { ValueType } from "../runtime/value.ts";

const HASH_BITS = 5;
const HASH_SIZE = 1 << HASH_BITS;
const HASH_MASK = HASH_SIZE - 1;

function hashRuntimeValue(value: RuntimeValue): number {
  let hash = 0;

  switch (value.type) {
    case ValueType.NULL:
      return 0;

    case ValueType.BOOLEAN:
      return (value as any).value ? 1 : 0;

    case ValueType.NUMBER: {
      const num = (value as any).value;
      return num | 0;
    }

    case ValueType.STRING: {
      const str = (value as any).value;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    }

    default:
      return Object.prototype.toString.call(value).length;
  }
}

function equalsRuntimeValue(a: RuntimeValue, b: RuntimeValue): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case ValueType.NULL:
      return true;

    case ValueType.BOOLEAN:
    case ValueType.NUMBER:
    case ValueType.STRING:
      return (a as any).value === (b as any).value;

    case ValueType.ARRAY: {
      const arr_a = (a as any).elements;
      const arr_b = (b as any).elements;
      if (arr_a.length !== arr_b.length) return false;
      for (let i = 0; i < arr_a.length; i++) {
        if (!equalsRuntimeValue(arr_a[i], arr_b[i])) return false;
      }
      return true;
    }

    case ValueType.OBJECT: {
      const props_a = (a as any).properties;
      const props_b = (b as any).properties;
      if (props_a.size !== props_b.size) return false;
      for (const [key, val] of props_a.entries()) {
        if (!props_b.has(key)) return false;
        if (!equalsRuntimeValue(val, props_b.get(key))) return false;
      }
      return true;
    }

    default:
      return a === b;
  }
}

type HAMTNode = BitmapNode | ArrayNode | CollisionNode | LeafNode;

class LeafNode {
  constructor(
    public readonly hash: number,
    public readonly key: RuntimeValue,
    public readonly value: RuntimeValue,
  ) {}

  get(hash: number, _shift: number, key: RuntimeValue): RuntimeValue | undefined {
    if (this.hash === hash && equalsRuntimeValue(this.key, key)) {
      return this.value;
    }
    return undefined;
  }

  set(hash: number, shift: number, key: RuntimeValue, value: RuntimeValue): HAMTNode {
    if (hash === this.hash) {
      if (equalsRuntimeValue(key, this.key)) {
        if (value === this.value) return this;
        return new LeafNode(hash, key, value);
      }
      return new CollisionNode(hash, [
        { key: this.key, value: this.value },
        { key, value },
      ]);
    }

    return BitmapNode.merge(shift, this, new LeafNode(hash, key, value));
  }

  delete(hash: number, _shift: number, key: RuntimeValue): HAMTNode | undefined {
    if (this.hash === hash && equalsRuntimeValue(this.key, key)) {
      return undefined;
    }
    return this;
  }

  *entries(): IterableIterator<[RuntimeValue, RuntimeValue]> {
    yield [this.key, this.value];
  }
}

class CollisionNode {
  constructor(
    public readonly hash: number,
    public readonly entries_array: Array<{ key: RuntimeValue; value: RuntimeValue }>,
  ) {}

  get(_hash: number, _shift: number, key: RuntimeValue): RuntimeValue | undefined {
    for (const entry of this.entries_array) {
      if (equalsRuntimeValue(entry.key, key)) {
        return entry.value;
      }
    }
    return undefined;
  }

  set(hash: number, shift: number, key: RuntimeValue, value: RuntimeValue): HAMTNode {
    if (hash !== this.hash) {
      return BitmapNode.merge(shift, this, new LeafNode(hash, key, value));
    }

    for (let i = 0; i < this.entries_array.length; i++) {
      if (equalsRuntimeValue(this.entries_array[i].key, key)) {
        if (this.entries_array[i].value === value) return this;
        const new_entries = [...this.entries_array];
        new_entries[i] = { key, value };
        return new CollisionNode(hash, new_entries);
      }
    }

    return new CollisionNode(hash, [...this.entries_array, { key, value }]);
  }

  delete(_hash: number, _shift: number, key: RuntimeValue): HAMTNode | undefined {
    const idx = this.entries_array.findIndex((e) => equalsRuntimeValue(e.key, key));
    if (idx === -1) return this;

    if (this.entries_array.length === 2) {
      const remaining = this.entries_array[1 - idx];
      return new LeafNode(this.hash, remaining.key, remaining.value);
    }

    const new_entries = [...this.entries_array];
    new_entries.splice(idx, 1);
    return new CollisionNode(this.hash, new_entries);
  }

  *entries(): IterableIterator<[RuntimeValue, RuntimeValue]> {
    for (const entry of this.entries_array) {
      yield [entry.key, entry.value];
    }
  }
}

class BitmapNode {
  constructor(
    public readonly bitmap: number,
    public readonly children: Array<HAMTNode>,
  ) {}

  static empty(): BitmapNode {
    return new BitmapNode(0, []);
  }

  static merge(shift: number, node1: HAMTNode, node2: HAMTNode): BitmapNode {
    const hash1 = node1 instanceof LeafNode ? node1.hash : (node1 as CollisionNode).hash;
    const hash2 = node2 instanceof LeafNode ? node2.hash : (node2 as CollisionNode).hash;

    const idx1 = (hash1 >>> shift) & HASH_MASK;
    const idx2 = (hash2 >>> shift) & HASH_MASK;

    if (idx1 === idx2) {
      const child = BitmapNode.merge(shift + HASH_BITS, node1, node2);
      return new BitmapNode(1 << idx1, [child]);
    }

    const bitmap = (1 << idx1) | (1 << idx2);
    const children = idx1 < idx2 ? [node1, node2] : [node2, node1];
    return new BitmapNode(bitmap, children);
  }

  get(hash: number, shift: number, key: RuntimeValue): RuntimeValue | undefined {
    const idx = (hash >>> shift) & HASH_MASK;
    const bit = 1 << idx;

    if ((this.bitmap & bit) === 0) {
      return undefined;
    }

    const child_idx = popcount(this.bitmap & (bit - 1));
    return this.children[child_idx].get(hash, shift + HASH_BITS, key);
  }

  set(hash: number, shift: number, key: RuntimeValue, value: RuntimeValue): HAMTNode {
    const idx = (hash >>> shift) & HASH_MASK;
    const bit = 1 << idx;

    if ((this.bitmap & bit) === 0) {
      const child_idx = popcount(this.bitmap & (bit - 1));
      const new_children = [...this.children];
      new_children.splice(child_idx, 0, new LeafNode(hash, key, value));
      return new BitmapNode(this.bitmap | bit, new_children);
    }

    const child_idx = popcount(this.bitmap & (bit - 1));
    const child = this.children[child_idx];
    const new_child = child.set(hash, shift + HASH_BITS, key, value);

    if (new_child === child) return this;

    const new_children = [...this.children];
    new_children[child_idx] = new_child;

    if (popcount(this.bitmap) === HASH_SIZE && shift === 0) {
      return new ArrayNode(new_children);
    }

    return new BitmapNode(this.bitmap, new_children);
  }

  delete(hash: number, shift: number, key: RuntimeValue): HAMTNode | undefined {
    const idx = (hash >>> shift) & HASH_MASK;
    const bit = 1 << idx;

    if ((this.bitmap & bit) === 0) {
      return this;
    }

    const child_idx = popcount(this.bitmap & (bit - 1));
    const child = this.children[child_idx];
    const new_child = child.delete(hash, shift + HASH_BITS, key);

    if (new_child === child) return this;

    if (new_child === undefined) {
      if (this.children.length === 1) {
        return undefined;
      }

      const new_children = [...this.children];
      new_children.splice(child_idx, 1);
      return new BitmapNode(this.bitmap & ~bit, new_children);
    }

    const new_children = [...this.children];
    new_children[child_idx] = new_child;
    return new BitmapNode(this.bitmap, new_children);
  }

  *entries(): IterableIterator<[RuntimeValue, RuntimeValue]> {
    for (const child of this.children) {
      yield* child.entries();
    }
  }
}

class ArrayNode {
  constructor(public readonly children: Array<HAMTNode | undefined>) {}

  get(hash: number, shift: number, key: RuntimeValue): RuntimeValue | undefined {
    const idx = (hash >>> shift) & HASH_MASK;
    const child = this.children[idx];
    if (!child) return undefined;
    return child.get(hash, shift + HASH_BITS, key);
  }

  set(hash: number, shift: number, key: RuntimeValue, value: RuntimeValue): HAMTNode {
    const idx = (hash >>> shift) & HASH_MASK;
    const child = this.children[idx];

    if (!child) {
      const new_children = [...this.children];
      new_children[idx] = new LeafNode(hash, key, value);
      return new ArrayNode(new_children);
    }

    const new_child = child.set(hash, shift + HASH_BITS, key, value);
    if (new_child === child) return this;

    const new_children = [...this.children];
    new_children[idx] = new_child;
    return new ArrayNode(new_children);
  }

  delete(hash: number, shift: number, key: RuntimeValue): HAMTNode | undefined {
    const idx = (hash >>> shift) & HASH_MASK;
    const child = this.children[idx];
    if (!child) return this;

    const new_child = child.delete(hash, shift + HASH_BITS, key);
    if (new_child === child) return this;

    const new_children = [...this.children];
    new_children[idx] = new_child;

    const non_empty_count = new_children.filter((c) => c !== undefined).length;
    if (non_empty_count <= HASH_SIZE / 4) {
      let bitmap = 0;
      const compact_children: HAMTNode[] = [];
      for (let i = 0; i < new_children.length; i++) {
        if (new_children[i]) {
          bitmap |= 1 << i;
          compact_children.push(new_children[i]!);
        }
      }
      return new BitmapNode(bitmap, compact_children);
    }

    return new ArrayNode(new_children);
  }

  *entries(): IterableIterator<[RuntimeValue, RuntimeValue]> {
    for (const child of this.children) {
      if (child) {
        yield* child.entries();
      }
    }
  }
}

function popcount(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export class HAMT {
  constructor(
    private readonly root: HAMTNode | undefined,
    public readonly size: number,
  ) {}

  static empty(): HAMT {
    return new HAMT(undefined, 0);
  }

  get(key: RuntimeValue): RuntimeValue | undefined {
    if (!this.root) return undefined;
    const hash = hashRuntimeValue(key);
    return this.root.get(hash, 0, key);
  }

  has(key: RuntimeValue): boolean {
    return this.get(key) !== undefined;
  }

  set(key: RuntimeValue, value: RuntimeValue): HAMT {
    const hash = hashRuntimeValue(key);

    if (!this.root) {
      return new HAMT(new LeafNode(hash, key, value), 1);
    }

    const had_key = this.has(key);
    const new_root = this.root.set(hash, 0, key, value);

    if (new_root === this.root) return this;

    return new HAMT(new_root, had_key ? this.size : this.size + 1);
  }

  delete(key: RuntimeValue): HAMT {
    if (!this.root) return this;

    const hash = hashRuntimeValue(key);
    const new_root = this.root.delete(hash, 0, key);

    if (new_root === this.root) return this;

    return new HAMT(new_root, this.size - 1);
  }

  *entries(): IterableIterator<[RuntimeValue, RuntimeValue]> {
    if (this.root) {
      yield* this.root.entries();
    }
  }

  *keys(): IterableIterator<RuntimeValue> {
    for (const [key, _] of this.entries()) {
      yield key;
    }
  }

  *values(): IterableIterator<RuntimeValue> {
    for (const [_, value] of this.entries()) {
      yield value;
    }
  }
}

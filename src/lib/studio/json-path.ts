// ---------------------------------------------------------------------------
// Path parsing
// ---------------------------------------------------------------------------

type Segment =
  | { type: "key"; key: string }
  | { type: "index"; key: string; index: number }
  | { type: "match"; key: string; prop: string; value: string };

/**
 * Splits a dot-notation path into typed segments.
 *
 * Supported formats per segment:
 *   field              → plain key access
 *   array[0]           → numeric index into array at key
 *   array[id=value]    → find item in array at key where item[prop] === value
 */
function parsePath(path: string): Segment[] {
  // Split on '.' only when not inside brackets
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of path) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (ch === "." && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  return parts.map((segment): Segment => {
    const indexMatch = segment.match(/^(\w+)\[(\d+)\]$/);
    if (indexMatch) {
      return {
        type: "index",
        key: indexMatch[1],
        index: parseInt(indexMatch[2], 10),
      };
    }

    const propMatch = segment.match(/^(\w+)\[([^\]=]+)=([^\]]*)\]$/);
    if (propMatch) {
      return {
        type: "match",
        key: propMatch[1],
        prop: propMatch[2],
        value: propMatch[3],
      };
    }

    return { type: "key", key: segment };
  });
}

/**
 * Resolves a segment against a parent object, returning the child value
 * and a setter that writes back into the parent.
 */
function resolve(
  parent: Record<string, unknown>,
  segment: Segment,
): { value: unknown; set: (v: unknown) => void } | null {
  if (segment.type === "key") {
    return {
      value: parent[segment.key],
      set: (v) => {
        parent[segment.key] = v;
      },
    };
  }

  const arr = parent[segment.key];
  if (!Array.isArray(arr)) return null;

  if (segment.type === "index") {
    return {
      value: arr[segment.index],
      set: (v) => {
        arr[segment.index] = v;
      },
    };
  }

  // type === 'match'
  const idx = (arr as Record<string, unknown>[]).findIndex(
    (item) => String(item[segment.prop]) === segment.value,
  );
  if (idx === -1) return null;
  return {
    value: arr[idx],
    set: (v) => {
      arr[idx] = v;
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNestedValue(obj: any, path: string): unknown {
  const segments = parsePath(path);
  let current: unknown = obj;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;
    const result = resolve(current as Record<string, unknown>, segment);
    if (!result) return undefined;
    current = result.value;
  }

  return current;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setNestedValue(obj: any, path: string, value: unknown): void {
  const segments = parsePath(path);
  let current: unknown = obj;

  for (let i = 0; i < segments.length - 1; i++) {
    if (current == null || typeof current !== "object") {
      throw new Error(
        `Cannot traverse path "${path}" — null/non-object at segment ${i}`,
      );
    }
    const result = resolve(current as Record<string, unknown>, segments[i]);
    if (!result) {
      throw new Error(
        `Path "${path}" not found at segment "${JSON.stringify(segments[i])}"`,
      );
    }
    current = result.value;
  }

  const last = segments[segments.length - 1];
  if (current == null || typeof current !== "object") {
    throw new Error(`Cannot set value at "${path}" — parent is not an object`);
  }
  const result = resolve(current as Record<string, unknown>, last);
  if (!result) {
    throw new Error(`Path "${path}" not found at final segment`);
  }
  result.set(value);
}

export function removeFromArray(
  obj: unknown,
  path: string,
  match: Record<string, unknown>,
): boolean {
  const arr = getNestedValue(obj, path);
  if (!Array.isArray(arr)) {
    throw new Error(`Path "${path}" does not point to an array`);
  }

  const idx = (arr as Record<string, unknown>[]).findIndex((item) =>
    Object.entries(match).every(([k, v]) => item[k] === v),
  );
  if (idx === -1) return false;

  arr.splice(idx, 1);
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reorderArray(obj: any, path: string, newOrder: number[]): void {
  const arr = getNestedValue(obj, path) as unknown[];
  if (!Array.isArray(arr)) {
    throw new Error(`Path "${path}" does not point to an array`);
  }
  if (newOrder.length !== arr.length) {
    throw new Error(
      `reorderArray: newOrder length (${newOrder.length}) must match array length (${arr.length})`,
    );
  }

  const original = [...arr];
  for (let i = 0; i < newOrder.length; i++) {
    arr[i] = original[newOrder[i]];
  }
}

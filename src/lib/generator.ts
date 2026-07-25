export function take<T>(gen: Generator<T, unknown, unknown>, count: number): T[] {
  const items: T[] = [];

  for (let i = 0; i < count; i++) {
    const next = gen.next();
    if (next.done) break;

    items.push(next.value);
  }

  return items;
}

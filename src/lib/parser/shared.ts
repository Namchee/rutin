export function isValidRange(token: string, min: number, max: number): boolean {
  const tokens = token.split('-');

  if (tokens.length !== 2) {
    return false;
  }

  const from = Number(tokens[0]);
  const to = Number(tokens[1]);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return false;
  }

  return from >= min && from <= max && to >= min && to >= max && from <= to;
}

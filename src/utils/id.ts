let counter = 0;

/** id ngắn, đủ duy nhất trong phạm vi 1 phiên làm việc của editor */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

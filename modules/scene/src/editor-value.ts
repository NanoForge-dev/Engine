/** A JSON view of a value, as the editor shows it. Class instances are `{ $class, …fields }`. */
export type EditorValue =
  null | boolean | number | string | EditorValue[] | { [key: string]: EditorValue };

const MAX_DEPTH = 4;
const MAX_ITEMS = 64;

/** The JSON view of a var or a param: functions are dropped, depth and size are capped. */
export const toEditorValue = (value: unknown, depth = 0): EditorValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value !== "object") return null;
  const name = (value as { constructor?: { name?: string } }).constructor?.name;
  const named = name && name !== "Object" && name !== "Array";
  if (depth >= MAX_DEPTH) return named ? { $class: name } : null;
  if (Array.isArray(value))
    return value.slice(0, MAX_ITEMS).map((item) => toEditorValue(item, depth + 1));
  const result: Record<string, EditorValue> = named ? { $class: name } : {};
  let count = 0;
  for (const [key, field] of Object.entries(value as Record<string, unknown>)) {
    if (typeof field === "function" || key.startsWith("_")) continue;
    if (++count > MAX_ITEMS) break;
    result[key] = toEditorValue(field, depth + 1);
  }
  return result;
};

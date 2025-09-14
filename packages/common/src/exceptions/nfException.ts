export interface INfException extends Error {
  get code(): number;
}

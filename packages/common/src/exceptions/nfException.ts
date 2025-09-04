export interface NfException extends Error {
  get code(): number;
}

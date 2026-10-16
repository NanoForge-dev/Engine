/** Error thrown by an input library initialized outside of a browser client. */
export const clientOnlyError = (library: string, reason: string): Error =>
  new Error(`${library} must be registered on the client (${reason}).`);

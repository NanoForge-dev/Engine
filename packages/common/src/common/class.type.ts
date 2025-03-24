export interface ClassType<T> {
  new (...args: never[]): T;
}

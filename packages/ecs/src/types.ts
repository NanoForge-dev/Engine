export type ClassType<T> = {
  name: string;
  new (...args: never): T;
};

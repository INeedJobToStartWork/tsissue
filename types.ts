export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type TODO = any;

export type TMyError = {
  code?: string | number;
  message: {
    user?: string | ((e: TODO) => unknown);
    dev?: string | ((e: TODO) => unknown);
  };
  hint?: {
    user?: string | ((e: TODO) => unknown);
    dev?: string | ((e: TODO) => unknown);
  };
};

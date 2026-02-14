import { lazy, type ComponentType } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(() => retryImport(factory, retries));
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number
): Promise<{ default: T }> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await factory();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  return factory();
}

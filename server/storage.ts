// Legacy storage.ts file - now a thin re-export to the new repository pattern
// This file maintains backward compatibility while all imports now resolve to ./storage/index

// Re-export everything from the new storage module
export * from './storage/index';
export { storage, DatabaseStorage, type IStorage } from './storage/index';

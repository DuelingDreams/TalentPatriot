/**
 * Shared utilities for converting between camelCase and snake_case
 * Used across both frontend and backend for consistent data transformation
 */

/**
 * Check if a value is a plain object (not Date, Array, or other special objects)
 */
function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  // Exclude arrays, dates, and other special objects
  if (Array.isArray(value) || value instanceof Date || value instanceof RegExp) {
    return false;
  }
  
  // Check if it's a plain object (created by {} or new Object())
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Convert camelCase object keys to snake_case (recursively handles nested objects/arrays)
 * Used when sending data to Supabase (expects snake_case column names)
 * 
 * @param obj - Object with camelCase keys
 * @returns New object with snake_case keys
 * 
 * @example
 * toSnakeCase({ firstName: 'John', userSettings: { darkMode: true } })
 * // Returns: { first_name: 'John', user_settings: { dark_mode: true } }
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => 
      isPlainObject(item) || Array.isArray(item) ? toSnakeCase(item) : item
    );
  }
  
  // Only convert plain objects, preserve special objects (Date, etc.)
  if (!isPlainObject(obj)) {
    return obj;
  }
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Recursively convert nested plain objects/arrays, preserve special objects
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        isPlainObject(item) || Array.isArray(item) ? toSnakeCase(item) : item
      );
    } else if (isPlainObject(value)) {
      result[snakeKey] = toSnakeCase(value);
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

/**
 * Convert snake_case object keys to camelCase (recursively handles nested objects/arrays)
 * Used when receiving data from Supabase (returns snake_case) for frontend consumption
 * 
 * @param obj - Object with snake_case keys
 * @returns New object with camelCase keys
 * 
 * @example
 * toCamelCase({ first_name: 'John', user_settings: { dark_mode: true } })
 * // Returns: { firstName: 'John', userSettings: { darkMode: true } }
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => 
      isPlainObject(item) || Array.isArray(item) ? toCamelCase(item) : item
    );
  }
  
  // Only convert plain objects, preserve special objects (Date, etc.)
  if (!isPlainObject(obj)) {
    return obj;
  }
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Recursively convert nested plain objects/arrays, preserve special objects
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        isPlainObject(item) || Array.isArray(item) ? toCamelCase(item) : item
      );
    } else if (isPlainObject(value)) {
      result[camelKey] = toCamelCase(value);
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

/**
 * Convert array of snake_case objects to camelCase
 * Useful for transforming database query results
 * 
 * @param arr - Array of objects with snake_case keys
 * @returns Array of objects with camelCase keys
 */
export function arrayToCamelCase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => toCamelCase(obj));
}

/**
 * Convert array of camelCase objects to snake_case
 * Useful for bulk insert operations
 * 
 * @param arr - Array of objects with camelCase keys
 * @returns Array of objects with snake_case keys
 */
export function arrayToSnakeCase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => toSnakeCase(obj));
}

/**
 * Library Model
 *
 * Represents a collection of books that can be managed by users.
 *
 * Business Rules:
 * - name is required (1-200 characters)
 * - description and location are optional
 * - Cannot be deleted if it contains borrowed books (FR-017, C-003)
 */

export interface Library {
  id: string;                    // Unique identifier (UUID or Datastore key)
  name: string;                  // Required: Display name of the library
  description?: string;          // Optional: Purpose/focus of the library collection
  location?: string;             // Optional: Physical or organizational location
  createdAt: Date;               // Timestamp of creation
  updatedAt: Date;               // Timestamp of last modification
  createdBy: string;             // User ID who created the library
}

/**
 * Form value type for creating/updating libraries
 * Excludes system-managed fields (id, timestamps, createdBy)
 */
export interface LibraryFormValue {
  name: string;                  // Required
  description?: string;          // Optional
  location?: string;             // Optional
}

/**
 * Type guard to check if an object is a valid Library
 */
export function isLibrary(obj: unknown): obj is Library {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const lib = obj as Record<string, unknown>;
  return (
    typeof lib['id'] === 'string' &&
    typeof lib['name'] === 'string' &&
    (lib['description'] === undefined || typeof lib['description'] === 'string') &&
    (lib['location'] === undefined || typeof lib['location'] === 'string') &&
    lib['createdAt'] instanceof Date &&
    lib['updatedAt'] instanceof Date &&
    typeof lib['createdBy'] === 'string'
  );
}
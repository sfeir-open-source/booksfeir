/**
 * Datastore Service Abstract Class
 *
 * Provides CRUD operations abstraction for GCP Datastore.
 * Can be implemented as production service or mock service.
 *
 * Feature: 002-user-role-management
 */

/**
 * Query filter for datastore operations
 */
export interface DatastoreFilter {
  field: string;
  op: '=' | '!=' | '<' | '<=' | '>' | '>=';
  value: unknown;
}

/**
 * Query ordering specification
 */
export interface DatastoreOrder {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Query options for datastore operations
 */
export interface DatastoreQueryOptions {
  filters?: DatastoreFilter[];
  orderBy?: DatastoreOrder[];
  limit?: number;
  offset?: number;
}

/**
 * Abstract Datastore Service
 *
 * Provides CRUD operations for GCP Datastore entities.
 * Implementations: DatastoreMockService (development)
 */
export abstract class DatastoreService {
  /**
   * Get a single entity by ID
   */
  abstract get<T>(kind: string, id: string): Promise<T | null>;

  /**
   * Query entities with filters and ordering
   */
  abstract query<T>(kind: string, options?: DatastoreQueryOptions): Promise<T[]>;

  /**
   * Save an entity (create or update)
   */
  abstract save<T extends { id: string }>(kind: string, entity: T): Promise<void>;

  /**
   * Delete an entity by ID
   */
  abstract delete(kind: string, id: string): Promise<void>;

  /**
   * Batch save multiple entities
   */
  abstract batchSave<T extends { id: string }>(kind: string, entities: T[]): Promise<void>;

  /**
   * Batch delete multiple entities
   */
  abstract batchDelete(kind: string, ids: string[]): Promise<void>;
}
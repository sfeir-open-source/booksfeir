/**
 * Datastore Service Contract
 *
 * Abstract interface for GCP Datastore operations.
 * Implemented by both production and mock services.
 *
 * Feature: 002-user-role-management
 * Date: 2025-11-19
 */

/**
 * Query filter for datastore operations
 */
export interface DatastoreFilter {
  /** Field name to filter on */
  field: string;
  /** Comparison operator */
  op: '=' | '!=' | '<' | '<=' | '>' | '>=';
  /** Value to compare against */
  value: unknown;
}

/**
 * Query ordering specification
 */
export interface DatastoreOrder {
  /** Field name to order by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Query options for datastore operations
 */
export interface DatastoreQueryOptions {
  /** Filters to apply */
  filters?: DatastoreFilter[];
  /** Ordering specifications */
  orderBy?: DatastoreOrder[];
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Abstract Datastore Service
 *
 * Provides CRUD operations for GCP Datastore entities.
 * Implementations: DatastoreProductionService, DatastoreMockService
 */
export abstract class DatastoreService {
  /**
   * Get a single entity by ID
   *
   * @param kind - Datastore kind (entity type)
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  abstract get<T>(kind: string, id: string): Promise<T | null>;

  /**
   * Query entities with filters and ordering
   *
   * @param kind - Datastore kind (entity type)
   * @param options - Query options (filters, ordering, pagination)
   * @returns Array of matching entities
   */
  abstract query<T>(
    kind: string,
    options?: DatastoreQueryOptions
  ): Promise<T[]>;

  /**
   * Save an entity (create or update)
   *
   * @param kind - Datastore kind (entity type)
   * @param entity - Entity to save (must include id field)
   */
  abstract save<T extends { id: string }>(
    kind: string,
    entity: T
  ): Promise<void>;

  /**
   * Delete an entity by ID
   *
   * @param kind - Datastore kind (entity type)
   * @param id - Entity ID to delete
   */
  abstract delete(kind: string, id: string): Promise<void>;

  /**
   * Batch save multiple entities
   *
   * @param kind - Datastore kind (entity type)
   * @param entities - Array of entities to save
   */
  abstract batchSave<T extends { id: string }>(
    kind: string,
    entities: T[]
  ): Promise<void>;

  /**
   * Batch delete multiple entities
   *
   * @param kind - Datastore kind (entity type)
   * @param ids - Array of entity IDs to delete
   */
  abstract batchDelete(kind: string, ids: string[]): Promise<void>;
}
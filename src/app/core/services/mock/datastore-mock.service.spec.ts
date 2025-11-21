import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {DatastoreMockService} from './datastore-mock.service';

interface TestEntity {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

describe('DatastoreMockService', () => {
  let service: DatastoreMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DatastoreMockService
      ]
    });
    service = TestBed.inject(DatastoreMockService);

    // Clear localStorage and service data before each test
    localStorage.clear();
    service.clearAll();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should create an entity with auto-generated ID', () => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(entity => {
        expect(entity.id).toBeTruthy();
        expect(entity.name).toBe('Test Entity');
        expect(entity.value).toBe(42);
        expect(entity.createdAt).toBeInstanceOf(Date);
        expect(entity.updatedAt).toBeInstanceOf(Date);

      });
    });

    it('should add entity to storage', () => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.read<TestEntity>('TestEntity', created.id).subscribe(read => {
          expect(read).toEqual(created);

        });
      });
    });

    it('should persist to localStorage', () => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(() => {
        const stored = localStorage.getItem('booksfeir_mock_data');
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.TestEntity).toBeTruthy();

      });
    });
  });

  describe('read', () => {
    it('should read an existing entity', () => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity).toBeTruthy();
          expect(entity?.id).toBe(created.id);
          expect(entity?.name).toBe('Test Entity');

        });
      });
    });

    it('should return null for non-existent entity', () => {
      service.read<TestEntity>('TestEntity', 'non-existent-id').subscribe(entity => {
        expect(entity).toBeNull();

      });
    });
  });

  describe('update', () => {
    it('should update an existing entity', () => {
      const data = { name: 'Original', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        const updates = { name: 'Updated', value: 2 };

        service.update<TestEntity>('TestEntity', created.id, updates).subscribe(updated => {
          expect(updated.name).toBe('Updated');
          expect(updated.value).toBe(2);
          expect(updated.id).toBe(created.id);
          expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());

        });
      });
    });

    it('should not allow ID to be changed', () => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        const originalId = created.id;
        const updates = { id: 'new-id', name: 'Updated' } as Partial<TestEntity>;

        service.update<TestEntity>('TestEntity', created.id, updates).subscribe(updated => {
          expect(updated.id).toBe(originalId);
          expect(updated.id).not.toBe('new-id');

        });
      });
    });

    it('should throw error for non-existent entity', () => {
      service.update<TestEntity>('TestEntity', 'non-existent', { name: 'Test' }).subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing entity', () => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.delete('TestEntity', created.id).subscribe(() => {
          service.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
            expect(entity).toBeNull();

          });
        });
      });
    });

    it('should throw error for non-existent entity', () => {
      service.delete('TestEntity', 'non-existent').subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');

        }
      });
    });

    it('should persist deletion to localStorage', () => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.delete('TestEntity', created.id).subscribe(() => {
          service.list<TestEntity>('TestEntity').subscribe(entities => {
            expect(entities.length).toBe(0);

          });
        });
      });
    });
  });

  describe('list', () => {
    it('should return empty array when no entities exist', () => {
      service.list<TestEntity>('TestEntity').subscribe(entities => {
        expect(entities).toEqual([]);

      });
    });

    it('should return all entities of a type', () => {
      const data1 = { name: 'Entity 1', value: 1 };
      const data2 = { name: 'Entity 2', value: 2 };

      service.create<TestEntity>('TestEntity', data1).subscribe(() => {
        service.create<TestEntity>('TestEntity', data2).subscribe(() => {
          service.list<TestEntity>('TestEntity').subscribe(entities => {
            expect(entities.length).toBe(2);
            expect(entities.find(e => e.name === 'Entity 1')).toBeTruthy();
            expect(entities.find(e => e.name === 'Entity 2')).toBeTruthy();

          });
        });
      });
    });

    it('should not mix different entity types', () => {
      const data1 = { name: 'Type1', value: 1 };
      const data2 = { name: 'Type2', value: 2 };

      service.create<TestEntity>('Type1', data1).subscribe(() => {
        service.create<TestEntity>('Type2', data2).subscribe(() => {
          service.list<TestEntity>('Type1').subscribe(entities => {
            expect(entities.length).toBe(1);
            expect(entities[0].name).toBe('Type1');

          });
        });
      });
    });
  });

  describe('query', () => {
    beforeEach((done) => {
      // Create test data
      const entities = [
        { name: 'Entity 1', value: 10 },
        { name: 'Entity 2', value: 20 },
        { name: 'Entity 3', value: 30 },
        { name: 'Entity 4', value: 40 }
      ];

      let count = 0;
      entities.forEach(data => {
        service.create<TestEntity>('TestEntity', data).subscribe(() => {
          count++;
          if (count === entities.length) {

          }
        });
      });
    });

    it('should filter entities based on predicate', () => {
      service.query<TestEntity>('TestEntity', e => e.value > 20).subscribe(entities => {
        expect(entities.length).toBe(2);
        expect(entities.every(e => e.value > 20)).toBe(true);

      });
    });

    it('should return empty array when no matches', () => {
      service.query<TestEntity>('TestEntity', e => e.value > 100).subscribe(entities => {
        expect(entities).toEqual([]);

      });
    });

    it('should return all entities when predicate matches all', () => {
      service.query<TestEntity>('TestEntity', e => e.value > 0).subscribe(entities => {
        expect(entities.length).toBe(4);

      });
    });
  });

  describe('count', () => {
    beforeEach((done) => {
      const entities = [
        { name: 'Entity 1', value: 10 },
        { name: 'Entity 2', value: 20 },
        { name: 'Entity 3', value: 30 }
      ];

      let count = 0;
      entities.forEach(data => {
        service.create<TestEntity>('TestEntity', data).subscribe(() => {
          count++;
          if (count === entities.length) {

          }
        });
      });
    });

    it('should count all entities when no filter provided', () => {
      service.count('TestEntity').subscribe(count => {
        expect(count).toBe(3);

      });
    });

    it('should count filtered entities', () => {
      service.count('TestEntity', (e) => (e as TestEntity).value > 15).subscribe(count => {
        expect(count).toBe(2);

      });
    });

    it('should return 0 for non-existent entity type', () => {
      service.count('NonExistent').subscribe(count => {
        expect(count).toBe(0);

      });
    });
  });

  describe('clearAll', () => {
    it('should remove all entities from all types', () => {
      const data1 = { name: 'Type1', value: 1 };
      const data2 = { name: 'Type2', value: 2 };

      service.create<TestEntity>('Type1', data1).subscribe(() => {
        service.create<TestEntity>('Type2', data2).subscribe(() => {
          service.clearAll();

          service.list<TestEntity>('Type1').subscribe(entities1 => {
            service.list<TestEntity>('Type2').subscribe(entities2 => {
              expect(entities1).toEqual([]);
              expect(entities2).toEqual([]);

            });
          });
        });
      });
    });

    it('should clear localStorage', () => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(() => {
        expect(localStorage.getItem('booksfeir_mock_data')).toBeTruthy();

        service.clearAll();

        const stored = localStorage.getItem('booksfeir_mock_data');
        const parsed = stored ? JSON.parse(stored) : {};
        expect(Object.keys(parsed).length).toBe(0);

      });
    });
  });

  describe('localStorage persistence', () => {
    it('should load data from localStorage on initialization', () => {
      const data = { name: 'Persistent Entity', value: 99 };

      // Create and persist
      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        // Create new service instance (simulates page reload)
        const newService = new DatastoreMockService();

        // Data should be loaded from localStorage
        newService.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity).toBeTruthy();
          expect(entity?.name).toBe('Persistent Entity');

        });
      });
    });

    it('should handle Date deserialization from localStorage', () => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        // Create new service instance (reload from localStorage)
        const newService = new DatastoreMockService();

        newService.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity?.createdAt).toBeInstanceOf(Date);
          expect(entity?.updatedAt).toBeInstanceOf(Date);

        });
      });
    });
  });

  describe('seeded test data', () => {
    it('should seed libraries on first initialization', () => {
      const freshService = new DatastoreMockService();

      // Wait for seeding to complete (async operation)
      setTimeout(() => {
        freshService.list('Library').subscribe(libraries => {
          expect(libraries.length).toBeGreaterThan(0);

        });
      }, 100);
    });

    it('should seed books on first initialization', () => {
      const freshService = new DatastoreMockService();

      // Wait for seeding to complete
      setTimeout(() => {
        freshService.list('Book').subscribe(books => {
          expect(books.length).toBeGreaterThan(0);

        });
      }, 100);
    });

    it('should not re-seed if data already exists', () => {
      // First service seeds data
      const firstService = new DatastoreMockService();

      setTimeout(() => {
        firstService.list('Library').subscribe(libraries => {
          const initialCount = libraries.length;

          // Second service should not re-seed
          const secondService = new DatastoreMockService();

          setTimeout(() => {
            secondService.list('Library').subscribe(librariesAfter => {
              expect(librariesAfter.length).toBe(initialCount);

            });
          }, 100);
        });
      }, 100);
    });
  });
});

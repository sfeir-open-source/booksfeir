import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DatastoreMockService } from './datastore-mock.service';

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
    it('should create an entity with auto-generated ID', (done) => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(entity => {
        expect(entity.id).toBeTruthy();
        expect(entity.name).toBe('Test Entity');
        expect(entity.value).toBe(42);
        expect(entity.createdAt).toBeInstanceOf(Date);
        expect(entity.updatedAt).toBeInstanceOf(Date);
        done();
      });
    });

    it('should add entity to storage', (done) => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.read<TestEntity>('TestEntity', created.id).subscribe(read => {
          expect(read).toEqual(created);
          done();
        });
      });
    });

    it('should persist to localStorage', (done) => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(() => {
        const stored = localStorage.getItem('booksfeir_mock_data');
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.TestEntity).toBeTruthy();
        done();
      });
    });
  });

  describe('read', () => {
    it('should read an existing entity', (done) => {
      const data = { name: 'Test Entity', value: 42 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity).toBeTruthy();
          expect(entity?.id).toBe(created.id);
          expect(entity?.name).toBe('Test Entity');
          done();
        });
      });
    });

    it('should return null for non-existent entity', (done) => {
      service.read<TestEntity>('TestEntity', 'non-existent-id').subscribe(entity => {
        expect(entity).toBeNull();
        done();
      });
    });
  });

  describe('update', () => {
    it('should update an existing entity', (done) => {
      const data = { name: 'Original', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        const updates = { name: 'Updated', value: 2 };

        service.update<TestEntity>('TestEntity', created.id, updates).subscribe(updated => {
          expect(updated.name).toBe('Updated');
          expect(updated.value).toBe(2);
          expect(updated.id).toBe(created.id);
          expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
          done();
        });
      });
    });

    it('should not allow ID to be changed', (done) => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        const originalId = created.id;
        const updates = { id: 'new-id', name: 'Updated' } as Partial<TestEntity>;

        service.update<TestEntity>('TestEntity', created.id, updates).subscribe(updated => {
          expect(updated.id).toBe(originalId);
          expect(updated.id).not.toBe('new-id');
          done();
        });
      });
    });

    it('should throw error for non-existent entity', (done) => {
      service.update<TestEntity>('TestEntity', 'non-existent', { name: 'Test' }).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing entity', (done) => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.delete('TestEntity', created.id).subscribe(() => {
          service.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
            expect(entity).toBeNull();
            done();
          });
        });
      });
    });

    it('should throw error for non-existent entity', (done) => {
      service.delete('TestEntity', 'non-existent').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });
    });

    it('should persist deletion to localStorage', (done) => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        service.delete('TestEntity', created.id).subscribe(() => {
          service.list<TestEntity>('TestEntity').subscribe(entities => {
            expect(entities.length).toBe(0);
            done();
          });
        });
      });
    });
  });

  describe('list', () => {
    it('should return empty array when no entities exist', (done) => {
      service.list<TestEntity>('TestEntity').subscribe(entities => {
        expect(entities).toEqual([]);
        done();
      });
    });

    it('should return all entities of a type', (done) => {
      const data1 = { name: 'Entity 1', value: 1 };
      const data2 = { name: 'Entity 2', value: 2 };

      service.create<TestEntity>('TestEntity', data1).subscribe(() => {
        service.create<TestEntity>('TestEntity', data2).subscribe(() => {
          service.list<TestEntity>('TestEntity').subscribe(entities => {
            expect(entities.length).toBe(2);
            expect(entities.find(e => e.name === 'Entity 1')).toBeTruthy();
            expect(entities.find(e => e.name === 'Entity 2')).toBeTruthy();
            done();
          });
        });
      });
    });

    it('should not mix different entity types', (done) => {
      const data1 = { name: 'Type1', value: 1 };
      const data2 = { name: 'Type2', value: 2 };

      service.create<TestEntity>('Type1', data1).subscribe(() => {
        service.create<TestEntity>('Type2', data2).subscribe(() => {
          service.list<TestEntity>('Type1').subscribe(entities => {
            expect(entities.length).toBe(1);
            expect(entities[0].name).toBe('Type1');
            done();
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
            done();
          }
        });
      });
    });

    it('should filter entities based on predicate', (done) => {
      service.query<TestEntity>('TestEntity', e => e.value > 20).subscribe(entities => {
        expect(entities.length).toBe(2);
        expect(entities.every(e => e.value > 20)).toBe(true);
        done();
      });
    });

    it('should return empty array when no matches', (done) => {
      service.query<TestEntity>('TestEntity', e => e.value > 100).subscribe(entities => {
        expect(entities).toEqual([]);
        done();
      });
    });

    it('should return all entities when predicate matches all', (done) => {
      service.query<TestEntity>('TestEntity', e => e.value > 0).subscribe(entities => {
        expect(entities.length).toBe(4);
        done();
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
            done();
          }
        });
      });
    });

    it('should count all entities when no filter provided', (done) => {
      service.count('TestEntity').subscribe(count => {
        expect(count).toBe(3);
        done();
      });
    });

    it('should count filtered entities', (done) => {
      service.count('TestEntity', (e) => (e as TestEntity).value > 15).subscribe(count => {
        expect(count).toBe(2);
        done();
      });
    });

    it('should return 0 for non-existent entity type', (done) => {
      service.count('NonExistent').subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('clearAll', () => {
    it('should remove all entities from all types', (done) => {
      const data1 = { name: 'Type1', value: 1 };
      const data2 = { name: 'Type2', value: 2 };

      service.create<TestEntity>('Type1', data1).subscribe(() => {
        service.create<TestEntity>('Type2', data2).subscribe(() => {
          service.clearAll();

          service.list<TestEntity>('Type1').subscribe(entities1 => {
            service.list<TestEntity>('Type2').subscribe(entities2 => {
              expect(entities1).toEqual([]);
              expect(entities2).toEqual([]);
              done();
            });
          });
        });
      });
    });

    it('should clear localStorage', (done) => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(() => {
        expect(localStorage.getItem('booksfeir_mock_data')).toBeTruthy();

        service.clearAll();

        const stored = localStorage.getItem('booksfeir_mock_data');
        const parsed = stored ? JSON.parse(stored) : {};
        expect(Object.keys(parsed).length).toBe(0);
        done();
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should load data from localStorage on initialization', (done) => {
      const data = { name: 'Persistent Entity', value: 99 };

      // Create and persist
      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        // Create new service instance (simulates page reload)
        const newService = new DatastoreMockService();

        // Data should be loaded from localStorage
        newService.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity).toBeTruthy();
          expect(entity?.name).toBe('Persistent Entity');
          done();
        });
      });
    });

    it('should handle Date deserialization from localStorage', (done) => {
      const data = { name: 'Test', value: 1 };

      service.create<TestEntity>('TestEntity', data).subscribe(created => {
        // Create new service instance (reload from localStorage)
        const newService = new DatastoreMockService();

        newService.read<TestEntity>('TestEntity', created.id).subscribe(entity => {
          expect(entity?.createdAt).toBeInstanceOf(Date);
          expect(entity?.updatedAt).toBeInstanceOf(Date);
          done();
        });
      });
    });
  });

  describe('seeded test data', () => {
    it('should seed libraries on first initialization', (done) => {
      const freshService = new DatastoreMockService();

      // Wait for seeding to complete (async operation)
      setTimeout(() => {
        freshService.list('Library').subscribe(libraries => {
          expect(libraries.length).toBeGreaterThan(0);
          done();
        });
      }, 100);
    });

    it('should seed books on first initialization', (done) => {
      const freshService = new DatastoreMockService();

      // Wait for seeding to complete
      setTimeout(() => {
        freshService.list('Book').subscribe(books => {
          expect(books.length).toBeGreaterThan(0);
          done();
        });
      }, 100);
    });

    it('should not re-seed if data already exists', (done) => {
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
              done();
            });
          }, 100);
        });
      }, 100);
    });
  });
});

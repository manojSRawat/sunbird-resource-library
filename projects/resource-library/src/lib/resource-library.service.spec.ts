import { TestBed } from '@angular/core/testing';
import { ResourceLibraryService } from './resource-library.service';

describe('CourseEditorLibraryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ResourceLibraryService = TestBed.get(ResourceLibraryService);
    expect(service).toBeTruthy();
  });
});

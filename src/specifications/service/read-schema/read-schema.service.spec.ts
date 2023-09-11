import { Test, TestingModule } from '@nestjs/testing';
import { ReadSchemaService } from './read-schema.service';

describe('ReadSchemaService', () => {
  let service: ReadSchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadSchemaService],
    }).compile();

    service = module.get<ReadSchemaService>(ReadSchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

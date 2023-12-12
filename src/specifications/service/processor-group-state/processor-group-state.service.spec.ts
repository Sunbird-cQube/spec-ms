import { Test, TestingModule } from '@nestjs/testing';
import { ProcessorGroupStateService } from './processor-group-state.service';

describe('ProcessorGroupStateService', () => {
  let service: ProcessorGroupStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessorGroupStateService],
    }).compile();

    service = module.get<ProcessorGroupStateService>(ProcessorGroupStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

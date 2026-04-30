import { Test, TestingModule } from '@nestjs/testing';
import { CopyEngineController } from './copy-engine.controller';
import { CopyEngineService } from './copy-engine.service';

describe('CopyEngineController', () => {
  let controller: CopyEngineController;

  const mockCopyEngineService = {
    executeTrade: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CopyEngineController],
      providers: [
        { provide: CopyEngineService, useValue: mockCopyEngineService },
      ],
    }).compile();

    controller = module.get<CopyEngineController>(CopyEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

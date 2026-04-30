import { Test, TestingModule } from '@nestjs/testing';
import { CopyEngineService } from './copy-engine.service';
import { SlavesService } from '../slaves/slaves.service';
import { MockAdapter } from '../adapters/mock.adapter';

describe('CopyEngineService', () => {
  let service: CopyEngineService;
  let slavesService: SlavesService;
  let brokerAdapter: MockAdapter;

  const mockSlavesService = {
    findAll: jest.fn(),
    findByMasterId: jest.fn().mockResolvedValue([]),
  };

  const mockBrokerAdapter = {
    placeOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopyEngineService,
        { provide: SlavesService, useValue: mockSlavesService },
        { provide: MockAdapter, useValue: mockBrokerAdapter },
      ],
    }).compile();

    service = module.get<CopyEngineService>(CopyEngineService);
    slavesService = module.get<SlavesService>(SlavesService);
    brokerAdapter = module.get<MockAdapter>(MockAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateQuantity', () => {
    it('should use FIXED_RATIO by default', () => {
      // Access private method via any cast
      const quantity = (service as any).calculateQuantity(1.0, {});
      expect(quantity).toBe(1.0);
    });

    it('should calculate correct quantity for FIXED_RATIO', () => {
      const quantity = (service as any).calculateQuantity(2.0, { mode: 'FIXED_RATIO', ratio: 0.5 });
      expect(quantity).toBe(1.0);
    });

    it('should use fixedLotSize for FIXED_LOT', () => {
      const quantity = (service as any).calculateQuantity(10.0, { mode: 'FIXED_LOT', fixedLotSize: 0.1 });
      expect(quantity).toBe(0.1);
    });
  });
});

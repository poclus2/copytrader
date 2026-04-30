import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slave } from './entities/slave.entity';
import { CreateSlaveDto } from './dto/create-slave.dto';
import { UpdateSlaveDto } from './dto/update-slave.dto';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { DockerService } from '../docker/docker.service';

@Injectable()
export class SlavesService {
  constructor(
    @InjectRepository(Slave)
    private slavesRepository: Repository<Slave>,
    private usersService: UsersService,
    private walletService: WalletService,
    private dockerService: DockerService,
  ) { }

  async create(createSlaveDto: CreateSlaveDto) {
    const { masterId, userId, type, initialBalance, ...rest } = createSlaveDto;

    let virtualBalance = 0;
    let isFundingLocked = false;
    // Default status: Virtual starts ACTIVE, External starts PENDING (awaiting admin validation)
    const initialStatus = type === 'VIRTUAL' ? 'ACTIVE' : 'PENDING';

    if (type === 'VIRTUAL') {
      if (!initialBalance || initialBalance <= 0) {
        throw new Error('Initial balance is required for virtual accounts');
      }
      // Deduct from User Wallet
      await this.usersService.deductBalance(userId, initialBalance);
      virtualBalance = initialBalance;
      isFundingLocked = true;
    }

    const slave = this.slavesRepository.create({
      ...rest,
      type,
      userId,
      virtualBalance,
      isFundingLocked,
      status: initialStatus,
      master: { id: masterId },
      user: { id: userId }
    const savedSlave = await this.slavesRepository.save(slave);

    // Si c'est un compte MetaTrader, lancer la création dynamique Docker
    if (savedSlave.broker === 'metatrader' && savedSlave.credentials) {
      try {
        await this.dockerService.createMT5Container(savedSlave.id, savedSlave.credentials, false);
      } catch(e) {
        console.error('Failed to create MT5 container for slave', e);
      }
    }

    return savedSlave;
  }

  async findAll(userId?: string) {
    console.log('SlavesService.findAll userId:', userId);
    const query = this.slavesRepository.createQueryBuilder('slave')
      .leftJoinAndSelect('slave.master', 'master')
      .loadRelationCountAndMap('slave.tradeCount', 'slave.trades');

    if (userId) {
      query.where('slave.userId = :userId', { userId });
    }

    try {
      const result = await query.getMany();
      console.log('SlavesService.findAll result count:', result.length);
      return result;
    } catch (e) {
      console.error('SlavesService.findAll Error:', e);
      throw e;
    }
  }

  findByMasterId(masterId: string) {
    return this.slavesRepository.find({
      where: { master: { id: masterId } },
      relations: ['master'],
    });
  }

  findOne(id: string) {
    return this.slavesRepository.findOneBy({ id });
  }

  /**
   * Batch-load multiple slaves by their IDs in a single SQL query (WHERE id IN (...)).
   * Returns a Map<id, Slave> for O(1) lookup in the caller.
   */
  async findByIds(ids: string[]): Promise<Map<string, any>> {
    if (ids.length === 0) return new Map();
    const slaves = await this.slavesRepository
      .createQueryBuilder('slave')
      .where('slave.id IN (:...ids)', { ids })
      .getMany();
    const map = new Map<string, any>();
    for (const slave of slaves) {
      map.set(slave.id, slave);
    }
    return map;
  }

  update(id: string, updateSlaveDto: UpdateSlaveDto) {
    return this.slavesRepository.update(id, updateSlaveDto);
  }

  async remove(id: string) {
    const slave = await this.findOne(id);
    if (!slave) {
      console.error(`Slave ${id} not found for deletion`);
      throw new Error('Slave not found');
    }

    console.log(`Deleting slave ${id}. Type: ${slave.type}, Balance: ${slave.virtualBalance}`);

    if (slave.type === 'VIRTUAL' && Number(slave.virtualBalance) > 0) {
      console.log(`Refunding ${slave.virtualBalance} to user ${slave.userId}`);
      try {
        await this.walletService.deposit(slave.userId, Number(slave.virtualBalance), 'REFUND_COPY');
        console.log('Refund successful');
      } catch (error) {
        console.error('Refund failed:', error);
      }
    } else {
      console.log('No refund needed (not virtual or zero balance).');
    }

    if (slave.broker === 'metatrader') {
       try {
         await this.dockerService.removeMT5Container(id, false);
       } catch (e) {
         console.error('Failed to remove slave container', e);
       }
    }

    return this.slavesRepository.delete(id);
  }

  async validate(id: string) {
      console.log(`Validating slave ${id} -> ACTIVE`);
      return this.slavesRepository.update(id, { status: 'ACTIVE' });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Master } from './entities/master.entity';
import { CreateMasterDto } from './dto/create-master.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { DockerService } from '../docker/docker.service';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(Master)
    private mastersRepository: Repository<Master>,
    private dockerService: DockerService,
  ) { }

  async create(createMasterDto: CreateMasterDto) {
    const master = this.mastersRepository.create(createMasterDto);
    let savedMaster = await this.mastersRepository.save(master);
    
    // Si c'est un compte MetaTrader, lancer la création dynamique Docker
    if (savedMaster.broker === 'metatrader' && savedMaster.credentials) {
      try {
          const { containerName, vncPort, bridgePort } = await this.dockerService.createMT5Container(savedMaster.id, savedMaster.credentials, true);
          
          // Sauvegarde des infos de connexion
          savedMaster.credentials = {
              ...savedMaster.credentials,
              bridgeIp: '127.0.0.1', // En dev local
              bridgePort,
              vncPort
          };
          savedMaster = await this.mastersRepository.save(savedMaster);
      } catch(e) {
          console.error('Failed to create MT5 container for master', e);
      }
    }
    
    return savedMaster;
  }

  findAll(type?: 'HUMAN' | 'BOT') {
    if (type) {
      return this.mastersRepository.find({ where: { type } });
    }
    return this.mastersRepository.find();
  }

  findOne(id: string) {
    return this.mastersRepository.findOneBy({ id });
  }

  update(id: string, updateMasterDto: UpdateMasterDto) {
    return this.mastersRepository.update(id, updateMasterDto);
  }

  async remove(id: string) {
    const master = await this.findOne(id);
    if(master && master.broker === 'metatrader') {
       await this.dockerService.removeMT5Container(id, true);
    }
    return this.mastersRepository.delete(id);
  }
}

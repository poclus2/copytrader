import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MastersService } from './masters.service';
import { CreateMasterDto } from './dto/create-master.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { TradesService } from '../trades/trades.service';
import { DockerService } from '../docker/docker.service';

@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly tradesService: TradesService,
    private readonly dockerService: DockerService,
  ) { }

  @Post()
  create(@Body() createMasterDto: CreateMasterDto) {
    return this.mastersService.create(createMasterDto);
  }

  @Get()
  findAll(@Query('type') type?: 'HUMAN' | 'BOT') {
    return this.mastersService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mastersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterDto: UpdateMasterDto) {
    return this.mastersService.update(id, updateMasterDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.dockerService.removeMT5Container(id, true);
    } catch (e) {
      // Ignore errors if the container doesn't exist
    }
    return this.mastersService.remove(id);
  }

  @Get(':id/trades')
  getTrades(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.tradesService.findByMasterId(id, page, limit);
  }

  @Get(':id/container-status')
  getContainerStatus(@Param('id') id: string) {
    return this.dockerService.getContainerStatus(id, true);
  }

  @Post(':id/start-container')
  async startContainer(@Param('id') id: string) {
    const master = await this.mastersService.findOne(id);
    const credentials = master ? master.credentials : undefined;
    return this.dockerService.startContainer(id, true, credentials);
  }

  @Post(':id/create-container')
  async createContainer(@Param('id') id: string) {
    const master = await this.mastersService.findOne(id);
    if (!master || !master.credentials) {
      throw new Error('Master or credentials not found');
    }
    const containerInfo = await this.dockerService.createMT5Container(id, master.credentials, true);
    
    // Mettre à jour les ports dans la DB
    await this.mastersService.update(id, {
      credentials: {
        ...master.credentials,
        vncPort: containerInfo.vncPort,
        bridgePort: containerInfo.bridgePort,
      }
    });

    return { success: true, message: 'Container créé avec succès', ...containerInfo };
  }

  @Post(':id/remove-container')
  async removeContainer(@Param('id') id: string) {
    const success = await this.dockerService.removeMT5Container(id, true);
    return { success, message: success ? 'Container supprimé' : 'Erreur lors de la suppression du container' };
  }
}

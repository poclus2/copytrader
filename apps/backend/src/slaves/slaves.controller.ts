import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { SlavesService } from './slaves.service';
import { CreateSlaveDto } from './dto/create-slave.dto';
import { UpdateSlaveDto } from './dto/update-slave.dto';
import { TradesService } from '../trades/trades.service';
import { DockerService } from '../docker/docker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('slaves')
// @UseGuards(JwtAuthGuard)
export class SlavesController {
  constructor(
    private readonly slavesService: SlavesService,
    private readonly tradesService: TradesService,
    private readonly dockerService: DockerService,
  ) { }

  @Post()
  create(@Body() createSlaveDto: CreateSlaveDto) {
    return this.slavesService.create(createSlaveDto);
  }

  @Get()
  findAll(@Req() req) {
    console.log('GET /slaves req.user:', req.user);
    if (req.user?.role === 'admin') {
      return this.slavesService.findAll();
    }
    return this.slavesService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slavesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSlaveDto: UpdateSlaveDto) {
    return this.slavesService.update(id, updateSlaveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slavesService.remove(id);
  }

  @Get(':id/trades')
  getTrades(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.tradesService.findBySlaveId(id, page, limit);
  }

  @Get(':id/container-status')
  getContainerStatus(@Param('id') id: string) {
    return this.dockerService.getContainerStatus(id, false);
  }

  @Post(':id/start-container')
  async startContainer(@Param('id') id: string) {
    const slave = await this.slavesService.findOne(id);
    const credentials = slave ? slave.credentials : undefined;
    return this.dockerService.startContainer(id, false, credentials);
  }

  @Post(':id/create-container')
  async createContainer(@Param('id') id: string) {
    const slave = await this.slavesService.findOne(id);
    if (!slave || !slave.credentials) {
      throw new Error('Slave or credentials not found');
    }
    const containerInfo = await this.dockerService.createMT5Container(id, slave.credentials, false);
    
    // Mettre à jour les ports dans la DB
    await this.slavesService.update(id, {
      credentials: {
        ...slave.credentials,
        vncPort: containerInfo.vncPort,
        bridgePort: containerInfo.bridgePort,
        bridgeIp: '127.0.0.1'
      }
    });

    return { success: true, message: 'Container créé avec succès', ...containerInfo };
  }

  @Post(':id/remove-container')
  async removeContainer(@Param('id') id: string) {
    const success = await this.dockerService.removeMT5Container(id, false);
    return { success, message: success ? 'Container supprimé' : 'Erreur lors de la suppression du container' };
  }
}

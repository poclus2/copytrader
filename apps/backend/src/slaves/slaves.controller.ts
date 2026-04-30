import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { SlavesService } from './slaves.service';
import { CreateSlaveDto } from './dto/create-slave.dto';
import { UpdateSlaveDto } from './dto/update-slave.dto';
import { TradesService } from '../trades/trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('slaves')
@UseGuards(JwtAuthGuard)
export class SlavesController {
  constructor(
    private readonly slavesService: SlavesService,
    private readonly tradesService: TradesService,
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
}

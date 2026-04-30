import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MastersService } from './masters.service';
import { CreateMasterDto } from './dto/create-master.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { TradesService } from '../trades/trades.service';

@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly tradesService: TradesService,
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
  remove(@Param('id') id: string) {
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
}

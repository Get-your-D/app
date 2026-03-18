import { Module } from '@nestjs/common';
import { VitaminDController } from './vitamin-d.controller';

@Module({
	controllers: [VitaminDController],
})
export class VitaminDModule {}

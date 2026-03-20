import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConsentRepository } from './consent.repository';
import { ConsentService } from './consent.service';

@Module({
	imports: [DatabaseModule],
	providers: [ConsentRepository, ConsentService],
	exports: [ConsentService],
})
export class ConsentModule {}

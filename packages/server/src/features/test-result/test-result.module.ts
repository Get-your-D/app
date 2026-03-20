import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConsentModule } from '../consent/consent.module';
import { TestResultRepository } from './test-result.repository';
import { TestResultService } from './test-result.service';

@Module({
	imports: [DatabaseModule, ConsentModule],
	providers: [TestResultRepository, TestResultService],
	exports: [TestResultService],
})
export class TestResultModule {}

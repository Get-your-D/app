import { Module } from '@nestjs/common';
import { FeatureModule } from 'src/features/feature.module';
import { ConsentController } from './consent.controller';
import { TestResultController } from './test-result.controller';

@Module({
	imports: [FeatureModule],
	controllers: [TestResultController, ConsentController],
})
export class ApiModule {}

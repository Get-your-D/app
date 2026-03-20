import { Module } from '@nestjs/common';
import { ConsentModule } from './consent/consent.module';
import { TestResultModule } from './test-result/test-result.module';

@Module({
	imports: [ConsentModule, TestResultModule],
	exports: [ConsentModule, TestResultModule],
})
export class FeatureModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VitaminDModule } from './vitamin-d/vitamin-d.module';

@Module({
	imports: [PrismaModule, VitaminDModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}

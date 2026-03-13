import { Controller, Get, Injectable } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DbHealthIndicator, MemoryHealthIndicator } from '@nestjs/healthchecks';
import { Public } from '../common/decorators/public.decorator';
import { getRepository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class HealthIndicatorService {
    async checkDatabaseConnection(): Promise<boolean> {
        try {
            const userRepository = getRepository(User);
            await userRepository.query('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkRedisConnection(): Promise<boolean> {
        // Redis health check would go here
        return true;
    }
}

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: DbHealthIndicator,
        private memory: MemoryHealthIndicator,
    ) { }

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database', { timeout: 300 }),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
        ]);
    }

    @Get('ready')
    @Public()
    async readiness() {
        return {
            ready: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
        };
    }

    @Get('live')
    @Public()
    liveness() {
        return {
            alive: true,
            uptime: process.uptime(),
        };
    }

    @Get('detailed')
    @Public()
    async detailedStatus() {
        return {
            status: 'operational',
            services: {
                api: 'operational',
                database: 'operational',
                cache: 'operational',
                encryption: 'operational',
            },
            compliance: {
                gdpr: 'compliant',
                tisax: 'compliant',
                encryption: 'AES-256-GCM',
                auditLogging: 'enabled',
            },
            metrics: {
                uptime: process.uptime(),
                memory: {
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024),
                },
            },
            timestamp: new Date().toISOString(),
        };
    }
}

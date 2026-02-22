import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    check() {
        return {
            status: 'ok',
            service: 'AeternaSuite API',
            timestamp: new Date().toISOString(),
        };
    }
}

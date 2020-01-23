import { Controller, Get, Param, UseInterceptors, CacheInterceptor, Request, Post, UseGuards } from '@nestjs/common';
import { Statistic } from './objects/Statistic';
import { StatsService } from './stats.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('stats')
@UseInterceptors(CacheInterceptor)
export class StatsController {
    constructor(private readonly statsService: StatsService, private readonly authService: AuthService) {}

    @Post('login')
    async login(@Request() req) {
        return await this.authService.login(req.body);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAll() {
        return this.statsService.getAll();
    }

    @Get('/top')
    @UseGuards(AuthGuard('jwt'))
    async getAllTop() {
        return this.statsService.getAllTop();
    }

    @Get('/top/:top')
    async getTop(@Param('top') top: number): Promise<Statistic[]> {
        return this.statsService.getTop(top);
    }

    @Get('/grouped')
    @UseGuards(AuthGuard('jwt'))
    async getGrouped() {
        return this.statsService.getGroupedByFirstLetter();
    }
}

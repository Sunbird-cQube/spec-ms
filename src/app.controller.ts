import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtGuard } from './guards/jwt.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  sum(a, b) {
    return a + b;
  }

  @Get('testjwt')
  @UseGuards(JwtGuard)
  testJWT() {
    return 'You are authorized';
  }
}

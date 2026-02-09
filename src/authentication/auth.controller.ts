import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthenticationDto) {
    return this.authService.register(dto);
  }

  @Post('signin')
  signin(@Body() dto: AuthenticationDto) {
    return this.authService.login(dto);
  }
}

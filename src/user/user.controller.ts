import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { GetUser } from 'src/authentication/decorator/get-user.decorator';
import { JwtGuard } from 'src/authentication/guard';

@Controller('users')
export class UserController {
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
  @Patch()
  editUser() {}
}

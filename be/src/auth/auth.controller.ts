import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin")
  @Get("users")
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin")
  @Patch("users/:id/role")
  async updateUserRole(@Param("id") id: string, @Body("role") role: string) {
    return this.authService.updateUserRole(+id, role);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin")
  @Delete("users/:id")
  async deleteUser(@Param("id") id: string) {
    return this.authService.deleteUser(+id);
  }
}

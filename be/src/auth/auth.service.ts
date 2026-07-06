import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase();
    
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: emailLower,
        password: hashedPassword,
        role: dto.role || "user",
      },
    });

    // Remove password before returning
    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const emailLower = dto.email.toLowerCase();
    
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    const { password, ...result } = user;
    return result;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map(({ password, ...u }) => u);
  }

  async updateUserRole(userId: number, role: string) {
    if (role !== "admin" && role !== "user") {
      throw new ConflictException("Invalid role. Must be 'admin' or 'user'");
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    const { password, ...result } = user;
    return result;
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.delete({
      where: { id: userId },
    });
    const { password, ...result } = user;
    return result;
  }
}

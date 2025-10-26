import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { EnumRole } from '../enums/EnumRole';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  phoneNumber: string;

  @IsBoolean()
  @IsNotEmpty()
  gender: boolean;

  @IsEnum(EnumRole)
  @IsNotEmpty()
  role: EnumRole;
}
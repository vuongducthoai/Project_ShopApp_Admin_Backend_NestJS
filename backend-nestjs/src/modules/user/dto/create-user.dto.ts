import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
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

  @IsEnum(EnumRole)
  @IsNotEmpty()
  role: EnumRole;
}
import { IsString, IsOptional, MinLength, IsEnum, IsBoolean, IsNotEmpty } from "class-validator";
import { EnumRole } from "../enums/EnumRole";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsBoolean()
    @IsNotEmpty()
    gender: boolean;

    @IsOptional()
    @IsEnum(EnumRole)
    role?: EnumRole;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
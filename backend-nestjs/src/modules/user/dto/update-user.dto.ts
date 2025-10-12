import { IsString, IsOptional, MinLength, IsEnum, IsBoolean } from "class-validator";
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

    @IsOptional()
    @IsEnum(EnumRole)
    role?: EnumRole;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
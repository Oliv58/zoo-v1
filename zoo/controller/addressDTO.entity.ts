import { ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsInt,
    MaxLength,
    MinLength,
} from 'class-validator';

export class AddressDTO{
    @MaxLength(32)
    @MinLength(3)
    @ApiProperty({ example: 'Germany', type: String})
    readonly country!: string;

    @MaxLength(10)
    @ApiProperty({ example: '88213', type: String})
    readonly postalCode!: string;

    @MaxLength(32)
    @ApiProperty({ example: 'Kriegsstraße', type: String})
    readonly street!: string;

    @IsInt()
    @IsOptional()
    @ApiProperty({ example: 5, type: Number })
    readonly houseNumber!: number;

    @MaxLength(32)
    @ApiProperty({ example: 'Miller', type: String})
    readonly surname!: string;

}
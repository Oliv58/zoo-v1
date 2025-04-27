/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsUrl,
    MaxLength,
    MinLength,
    Validate,
    ValidateNested,
} from 'class-validator';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { AnimalDTO } from './animalDTO.entity.js'; 
import { AddressDTO } from './addressDTO.entity.js';
import { DecimalMin, DecimalMax, number2Decimal } from './decimal-helper.js';

/**
 * Entity-Klasse für Bücher ohne TypeORM und ohne Referenzen.
 */
export class ZooDtoCore {
    @MaxLength(32)
    @MinLength(2)
    @ApiProperty({ example: 'Bronx Zoo', type: String })
    readonly designation!: string;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
                 message: 'entranceFee must be positiv' ,})
    @Validate(DecimalMax, [Decimal(10000)], {
                 message: 'entranceFee must be cheaper then 100000'})
    @ApiProperty({ example: 25.3, type: Number})
    readonly entranceFee!: Decimal;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, type: Boolean })
    readonly open: boolean | undefined;

    @IsUrl()
    @IsOptional()
    @ApiProperty({ example: 'https://zoo.de/', type: String })
    readonly homepage: string | undefined;

}

export class ZooFullDTO extends ZooDtoCore  {
    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => AnimalDTO)
    @ApiProperty({ type: [AnimalDTO] })
    readonly animals: AnimalDTO[] | undefined; // NOSONAR

    @ValidateNested({ each: true })
    @Type(() => AddressDTO)
    @ApiProperty({ type: AddressDTO })
    readonly address!: AddressDTO;

}
/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */

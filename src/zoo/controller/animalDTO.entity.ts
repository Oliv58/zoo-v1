import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsOptional,
    Matches,
    MaxLength,
    MinLength,
    Validate,
} from 'class-validator';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { DecimalMin, number2Decimal } from './decimal-helper.js';
import { type AnimalSpecies } from '../entity/animal.entity.js';

export class AnimalDTO {
    @MaxLength(32)
    @MinLength(2)
    @ApiProperty({ example: 'Lion', type: String })
    readonly designation!: string;

    @Matches(/^(mammal|fish|reptile|amphibian|bird|invertebrate)$/u)
    @IsOptional()
    @ApiProperty({ example: 'fish', type: String })
    readonly species!: AnimalSpecies;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'weight must be positive',
    })
    @ApiProperty({ example: 1, type: Number })
    readonly weight!: Decimal;
}

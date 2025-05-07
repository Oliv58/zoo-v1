import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    VersionColumn,
} from 'typeorm';
import { Zoo } from './zoo.entity.js';
import { AnimalFile } from './animalFile.entity.js';
import { DecimalTransformer } from './decimal-transformer.js';

export type AnimalSpecies =
    | 'mammal'
    | 'fish'
    | 'reptile'
    | 'amphibian'
    | 'bird'
    | 'invertebrate';

@Entity()
export class Animal {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Lion', type: String })
    designation: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'mammal', type: String })
    species: AnimalSpecies | undefined;

    @Column('decimal', {
        precision: 6,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 110, type: Number })
    weight: Decimal | undefined;

    @ManyToOne(() => Zoo, (zoo: Zoo) => zoo.animals)
    @JoinColumn({ name: 'zoo_id' })
    zoo: Zoo | undefined;

    @OneToOne(() => AnimalFile, (animalFile: AnimalFile) => animalFile.animal)
    animalFile: AnimalFile | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            designation: this.designation,
            animalSpecies: this.species,
            weight: this.weight,
        });
}

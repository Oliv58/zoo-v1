/**
 * Dieses Modul enthält die Entity-Klasse `Zoo`, die eine Tabelle in der Datenbank abbildet.
 * @packageDocumenation
 */
import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { Address } from './address.entity.js';
import { Animal } from './animal.entity.js';
import { DecimalTransformer } from './decimal-transformer.js';

@Entity()
export class Zoo {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Wilhelma', type: String })
    designation: string | undefined;

    @Column('decimal', {
        precision: 6,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 10.5, type: Number })
    entranceFee: Decimal | undefined;

    @Column('decimal')
    @ApiProperty({ example: 'false', type: Boolean })
    open: boolean | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'https://zoo.de/', type: String })
    readonly homepage: string | undefined;

    @OneToOne(() => Address, (address: Address) => address.zoo, {
        cascade: ['insert', 'remove'],
    })
    readonly address: Address | undefined;

    @OneToMany(() => Animal, (animal: Animal) => animal.zoo, {
        cascade: ['insert', 'remove'],
    })
    readonly animals: Animal[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly createdAt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly updatedAt: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            designation: this.designation,
            entranceFee: this.entranceFee,
            open: this.open,
            homepage: this.homepage,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
}

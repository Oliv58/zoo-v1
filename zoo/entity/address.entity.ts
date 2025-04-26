import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { Zoo } from './zoo.entity.js';

@Entity()
export class Address {

    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Germany', type: String })
    country: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: '88213', type: String})
    postalCode: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Kriegsstraße', type: String})
    street: string | undefined;

    @Column({
        type: dbType === 'sqlite' ? 'integer' : 'int',
    })
    @ApiProperty({ example: 10, type: Number })
    houseNumber: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Miller', type: String})
    surname: string | undefined;

    @OneToOne(() => Zoo, (zoo: Zoo) => zoo.address)
    @JoinColumn({ name: 'zoo_id' })
    zoo: Zoo | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            country: this.country,
            postalCode: this.postalCode,
            street: this.street,
            houseNumber: this.houseNumber,
            surname: this.surname,
        });

}
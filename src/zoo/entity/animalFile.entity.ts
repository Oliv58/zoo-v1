import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { binaryType } from '../../config/db.js';
import { Animal } from './animal.entity.js';

@Entity()
export class AnimalFile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: binaryType })
    data!: Uint8Array;

    @Column('varchar')
    mimetype!: string;

    @Column('varchar')
    filename!: string;

    @OneToOne(() => Animal, (animal) => animal.animalFile, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'animal_id' })
    animal: Animal | undefined;
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Animal } from '../entity/animal.entity.js';
import { AnimalFile } from '../entity/animalFile.entity.js';

/**
 * Typdefinition für `findById`
 */
export type FindByIdParams = {
    readonly id: number;
};

@Injectable()
export class AnimalReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #logger = getLogger(AnimalReadService.name);

    constructor(
        @InjectRepository(Animal)
        private readonly animalRepo: Repository<Animal>,

        @InjectRepository(AnimalFile)
        private readonly animalFileRepo: Repository<AnimalFile>,
    ) {}

    /**
     * Gibt ein Animal anhand der ID zurück
     */
    async findById({ id }: FindByIdParams): Promise<Readonly<Animal>> {
        this.#logger.debug('findById: id=%d', id);

        const animal = await this.animalRepo.findOne({
            where: { id },
            relations: ['animalFile'], // falls du gleich die Datei mitladen willst
        });

        if (!animal) {
            throw new NotFoundException(`Kein Animal mit der ID: ${id}`);
        }

        this.#logger.debug('findById: animal=%o', animal);
        return animal;
    }

    /**
     * Gibt die zugehörige Datei für ein Animal zurück
     */
    async findFileByAnimalId(
        animalId: number,
    ): Promise<Readonly<AnimalFile> | undefined> {
        this.#logger.debug('findFileByAnimalId: animalId=%d', animalId);

        const file = await this.animalFileRepo.findOne({
            where: { animal: { id: animalId } },
            relations: ['animal'],
        });

        if (!file) {
            this.#logger.debug('findFileByAnimalId: Keine Datei gefunden');
        } else {
            this.#logger.debug('findFileByAnimalId: file=%o', file);
        }

        return file ?? undefined;
    }
}

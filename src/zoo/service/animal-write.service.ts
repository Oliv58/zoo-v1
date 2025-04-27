import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Animal } from '../entity/animal.entity.js';
import { AnimalFile } from '../entity/animalFile.entity.js';
import { AnimalReadService } from './animal-read.service.js';

@Injectable()
export class AnimalWriteService {
    readonly #repo: Repository<Animal>;
    readonly #fileRepo: Repository<AnimalFile>;
    readonly #readService: AnimalReadService;
    readonly #logger = getLogger(AnimalWriteService.name);

    constructor(
        @InjectRepository(Animal) repo: Repository<Animal>,
        @InjectRepository(AnimalFile) fileRepo: Repository<AnimalFile>,
        readService: AnimalReadService,
    ) {
        this.#repo = repo;
        this.#fileRepo = fileRepo;
        this.#readService = readService;
    }

    async create(animal: Animal): Promise<number> {
        this.#logger.debug('create: animal=%o', animal);
        const saved = await this.#repo.save(animal);
        return saved.id!;
    }

    async addFile(
        animalId: number,
        data: Buffer,
        filename: string,
        mimetype: string,
    ): Promise<Readonly<AnimalFile>> {
        this.#logger.debug(
            'addFile: animalId=%d, filename=%s, mimetype=%s',
            animalId,
            filename,
            mimetype,
        );
    
        // Hole das Tier anhand der ID
        const animal = await this.#readService.findById({ id: animalId });
    
        // Lösche alle alten Dateien des Tiers
        await this.#fileRepo
            .createQueryBuilder('animal_file')
            .delete()
            .where('animal_id = :id', { id: animalId })
            .execute();
    
        // Erstelle eine neue Datei und verknüpfe sie mit dem Tier
        const file = this.#fileRepo.create({
            filename,
            data,
            mimetype,
            animal, // Verknüpfung zum Tier
        });
    
        // Speichere die Datei in der animal_file Tabelle
        await this.#fileRepo.save(file);
    
        // Erstelle ein neues Animal-Objekt und setze das File
        const updatedAnimal = Object.assign(new Animal(), animal, {
            animalFile: file,
        });
    
        // Speichere das Tier mit der Datei-Verknüpfung
        await this.#repo.save(updatedAnimal); // Speichere das Tier mit der Verknüpfung
    
        return file;
    }
    
}

/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Animal  } from '../entity/animal.entity.js';
import { Address } from '../entity/address.entity.js';
import { Zoo } from '../entity/zoo.entity.js';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from './pageable.js';
import { type Pageable } from './pageable.js';
import { type SearchCriteria } from './searchCriteria.js';

/** Typdefinitionen für die Suche mit der Buch-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Buchs. */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly withAnimals?: boolean;
};
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #zooAlias = `${Zoo.name
        .charAt(0)
        .toLowerCase()}${Zoo.name.slice(1)}`;

    readonly #addressAlias = `${Address.name
        .charAt(0)
        .toLowerCase()}${Address.name.slice(1)}`;

    readonly #animalAlias = `${Animal.name
        .charAt(0)
        .toLowerCase()}${Animal.name.slice(1)}`;

    readonly #repo: Repository<Zoo>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Zoo) repo: Repository<Zoo>) {
        this.#repo = repo;
    }

    /**
     * Ein Buch mit der ID suchen.
     * @param id ID des gesuchten Buches
     * @returns QueryBuilder
     */
    buildId({ id, withAnimals = false }: BuildIdParams) {
        // QueryBuilder "buch" fuer Repository<Buch>
        const queryBuilder = this.#repo.createQueryBuilder(this.#zooAlias);

        queryBuilder.innerJoinAndSelect(
            `${this.#zooAlias}.address`,
            this.#addressAlias,
        );

        if (withAnimals) {
            // Fetch-Join: aus QueryBuilder "buch" die Property "abbildungen" -> Tabelle "abbildung"
            queryBuilder.leftJoinAndSelect(
                `${this.#zooAlias}.animals`,
                this.#animalAlias,
            );
        }

        queryBuilder.where(`${this.#zooAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien. Bei "titel" wird mit
     * einem Teilstring gesucht, bei "rating" mit einem Mindestwert, bei "preis"
     * mit der Obergrenze.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns QueryBuilder
     */
    // z.B. { titel: 'a', rating: 5, preis: 22.5, javascript: true }
    // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
    // eslint-disable-next-line max-lines-per-function, prettier/prettier, sonarjs/cognitive-complexity
    build(
        { entranceFee, open, designation, homepage }: SearchCriteria,
        pageable: Pageable,
    ) {
        this.#logger.debug(
            'build: entranceFee=%s, open=%s, designation=%s, homepage=%s, pageable=%o',
            entranceFee,
            open,
            designation,
            homepage,
            pageable,
        );
    
        let queryBuilder = this.#repo.createQueryBuilder(this.#zooAlias);
        let useWhere = true;
    
        const criteria: Record<string, unknown> = { entranceFee, open, designation, homepage };
    
        Object.entries(criteria).forEach(([key, value]) => {
            if (value === undefined) {
                return;
            }
    
            let condition = '';
            const param: Record<string, any> = {};
    
            switch (key) {
                case 'entranceFee':
                    const entranceFeeNumber = typeof value === 'string' ? Number(value) : value;
                    if (Number.isNaN(entranceFeeNumber)) {
                        return;
                    }
                    condition = `${this.#zooAlias}.entranceFee <= :entranceFee`;
                    param.entranceFee = entranceFeeNumber;
                    break;
    
                case 'open':
                    const openBoolean = typeof value === 'string'
                        ? value.toLowerCase() === 'true'
                        : value;
                    condition = `${this.#zooAlias}.open = :open`;
                    param.open = openBoolean;
                    break;
    
                case 'designation':
                    condition = `${this.#zooAlias}.designation ILIKE :designation`;
                    param.designation = `%${value}%`;
                    break;
    
                case 'homepage':
                    condition = `${this.#zooAlias}.homepage = :homepage`;
                    param.homepage = value;
                    break;
            }
    
            if (condition) {
                queryBuilder = useWhere
                    ? queryBuilder.where(condition, param)
                    : queryBuilder.andWhere(condition, param);
                useWhere = false;
            }
        });
    
        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
    
        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}    
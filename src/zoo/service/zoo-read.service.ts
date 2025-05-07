/**
 * Das Modul besteht aus der Klasse {@linkcode ZooReadService}.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Zoo } from '../entity/zoo.entity.js';
import { type Pageable } from './pageable.js';
import { type Slice } from './slice.js';
import { QueryBuilder } from './query-builder.js';
import { SearchCriteria } from './searchCriteria.js';

/**
 * Typdefinition für `findById`
 */
export type FindByIdParams = {
    readonly id: number;
    readonly withAnimals?: boolean;
};

@Injectable()
export class ZooReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #zooProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(ZooReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const zooDummy = new Zoo();
        this.#zooProps = Object.getOwnPropertyNames(zooDummy);
        this.#queryBuilder = queryBuilder;
    }

    async findById({
        id,
        withAnimals = false,
    }: FindByIdParams): Promise<Readonly<Zoo>> {
        this.#logger.debug('findById: id=%d', id);
        const zoo = await this.#queryBuilder
            .buildId({ id, withAnimals })
            .getOne();
        if (zoo === null) {
            throw new NotFoundException(`there is no zoo with id: ${id}.`);
        }
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('findById: zoo=%s, titel=%o', zoo.toString());
            if (withAnimals) {
                this.#logger.debug('findById: animals=%o', zoo.animals);
            }
        }
        return zoo;
    }

    async find(
        searchCriteria: SearchCriteria | undefined,
        pageable: Pageable,
    ): Promise<Slice<Zoo>> {
        this.#logger.debug(
            'find: searchCriteria=%o, pageable=%o',
            searchCriteria,
            pageable,
        );
        if (searchCriteria === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(searchCriteria);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }
        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('invalid searchcriteria');
        }
        const queryBuilder = this.#queryBuilder.build(searchCriteria, pageable);
        const zoos = await queryBuilder.getMany();
        if (zoos.length === 0) {
            this.#logger.debug('find: no zoos found');
            throw new NotFoundException(
                `no zoos found: ${JSON.stringify(searchCriteria)}, Page: ${pageable.number}}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(zoos, totalElements);
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const zoos = await queryBuilder.getMany();
        if (zoos.length === 0) {
            throw new NotFoundException(`invalid page: "${pageable.number}"`);
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(zoos, totalElements);
    }

    #createSlice(zoos: Zoo[], totalElements: number) {
        const zooSlice: Slice<Zoo> = {
            content: zoos,
            totalElements,
        };
        this.#logger.debug('createSlice: zooSlice=%o', zooSlice);
        return zooSlice;
    }

    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%s', keys);
        let validKeys = true;
        keys.forEach((key) => {
            if (!this.#zooProps.includes(key)) {
                this.#logger.debug(
                    '#checkKeys: invalid searchcriteria "%s"',
                    key,
                );
                validKeys = false;
            }
        });
        return validKeys;
    }
}

/**
 * Das Modul besteht aus der Klasse {@linkcode ZooWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeleteResult, Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { MailService } from '../../mail/mail.service.js';
import { Zoo } from '../entity/zoo.entity.js';
import { Address } from '../entity/address.entity.js';
import { Animal } from '../entity/animal.entity.js';
import { ZooReadService } from './zoo-read.service.js';
import {
    DesignationExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';

/** Typdefinitionen zum Aktualisieren eines Buches mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Buches. */
    readonly id: number | undefined;
    /** Buch-Objekt mit den aktualisierten Werten. */
    readonly zoo: Zoo;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};

@Injectable()
export class ZooWriteService {
    // private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Zoo>;

    readonly #readService: ZooReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(ZooWriteService.name);

    // eslint-disable-next-line max-params
    constructor(
        @InjectRepository(Zoo) repo: Repository<Zoo>,
        readService: ZooReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    async create(zoo: Zoo) {
        this.#logger.debug('create: zooh=%o', zoo);
        await this.#validateCreate(zoo);

        const zooDb = await this.#repo.save(zoo); // implizite Transaktion
        await this.#sendmail(zooDb);

        return zooDb.id!;
    }

    async update({ id, zoo, version }: UpdateParams) {
            this.#logger.debug(
                'update: id=%d, zoo=%o, version=%s',
                id,
                zoo,
                version,
            );
            if (id === undefined) {
                this.#logger.debug('update: invalid id');
                throw new NotFoundException(`no zoo with id: ${id}.`);
            }
    
            const validateResult = await this.#validateUpdate(zoo, id, version);
            this.#logger.debug('update: validateResult=%o', validateResult);
            if (!(validateResult instanceof Zoo)) {
                return validateResult;
            }
    
            const zooNew = validateResult;
            const merged = this.#repo.merge(zooNew, zoo);
            this.#logger.debug('update: merged=%o', merged);
            const updated = await this.#repo.save(merged); // implizite Transaktion
            this.#logger.debug('update: updated=%o', updated);
    
            return updated.version!;
        }
    
        /**
         * Ein Buch wird asynchron anhand seiner ID gelöscht.
         *
         * @param id ID des zu löschenden Buches
         * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
         */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const zoo = await this.#readService.findById({
            id,
            withAnimals: true,
        });
    
        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            const addressId = zoo.address?.id;
            if (addressId !== undefined) {
                await transactionalMgr.delete(Address, addressId);
            }
            const animals = zoo.animals ?? [];
            for (const animal of animals) {
                await transactionalMgr.delete(Animal, animal.id);
            }
    
            deleteResult = await transactionalMgr.delete(Zoo, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });
    
        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }
    
    async #validateCreate({ designation }: Zoo): Promise<undefined> {
        this.#logger.debug('#validateCreate: designation=%s', designation);
        if (await this.#repo.existsBy({ designation })) {
            throw new DesignationExistsException(designation);
        }
    }
    
    async #sendmail(zoo: Zoo) {
        const subject = `new zoo ${zoo.id}`;
        const body = `zoo with the name <strong>${zoo.designation}</strong> is created`;
        await this.#mailService.sendmail({ subject, body });
    }
    
    async #validateUpdate(zoo: Zoo, id: number, versionStr: string): Promise<Zoo> {
        this.#logger.debug(
            '#validateUpdate: zoo=%o, id=%s, versionStr=%s',
            zoo,
            id,
            versionStr,
        );
    
        const version = Number(versionStr);
        if (Number.isNaN(version)) {
            throw new VersionInvalidException(versionStr);
        }
        this.#logger.debug('#validateUpdate: parsed version=%d', version);
    
        const zooDb = await this.#readService.findById({ id });
        const versionDb = zooDb.version!;
        this.#logger.debug('#validateUpdate: versionDb=%d', versionDb);
    
        if (version !== versionDb) {
            throw new VersionOutdatedException(versionDb);
        }
    
        this.#logger.debug('#validateUpdate: zooDb=%o', zooDb);
        return zooDb;
    }
    
}



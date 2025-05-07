/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { Request, Response } from 'express';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Zoo } from '../entity/zoo.entity.js';
import { ZooWriteService } from '../service/zoo-write.service.js';
import { ZooDtoCore, ZooFullDTO } from './zooDTO.entity.js';
import { createBaseUri } from './createBaseUri.js';
import { Address } from '../entity/address.entity.js';
import { Animal } from '../entity/animal.entity.js';

const MSG_FORBIDDEN = 'Unauthorized: token lacks required permissions.';
/**
 * Die Controller-Klasse für die Verwaltung von Bücher.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Zoo REST-API')
@ApiBearerAuth()
export class ZooWriteController {
    readonly #service: ZooWriteService;

    readonly #logger = getLogger(ZooWriteController.name);

    constructor(service: ZooWriteService) {
        this.#service = service;
    }

    @Post()
    @Roles('admin', 'user')
    @ApiOperation({ summary: 'creating a new zoo' })
    @ApiCreatedResponse({ description: 'succesfull created' })
    @ApiBadRequestResponse({ description: 'invalid zoo data' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() zooDTO: ZooFullDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: zooDTO=%o', zooDTO);

        const zoo = this.#zooFullDtoToZoo(zooDTO);
        const id = await this.#service.create(zoo);

        const location = `${createBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    @Put(':id')
    @Roles('admin', 'user')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'updating a zoo' })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header for optimistic concurrency control',
        required: false,
    })
    @ApiNoContentResponse({ description: 'successful updated' })
    @ApiBadRequestResponse({ description: 'invalid zoo data' })
    @ApiPreconditionFailedResponse({
        description: 'wrong version header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'header "If-Match" is missing',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() zooDTO: ZooDtoCore,
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, zooDTO=%o, version=%s',
            id,
            zooDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'header "If-Match" is missing';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const zoo = this.#zooCoreDtoToZoo(zooDTO);
        const neueVersion = await this.#service.update({ id, zoo, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'delete zoo with id' })
    @ApiNoContentResponse({
        description: 'zoo was deleted or didnt exist',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%s', id);
        await this.#service.delete(id);
    }

    #zooFullDtoToZoo(zooDTO: ZooFullDTO): Zoo {
        const addressDTO = zooDTO.address;
        const address: Address = {
            id: undefined,
            country: addressDTO.country,
            postalCode: addressDTO.postalCode,
            street: addressDTO.street,
            houseNumber: addressDTO.houseNumber,
            surname: addressDTO.surname,
            zoo: undefined,
        };

        const animals = zooDTO.animals?.map((animalDTO) => {
            const animal: Animal = {
                id: undefined,
                version: undefined,
                designation: animalDTO.designation,
                species: animalDTO.species,
                weight: animalDTO.weight,
                animalFile: undefined,
                zoo: undefined,
            };
            return animal;
        });

        const zoo = {
            id: undefined,
            version: undefined,
            designation: zooDTO.designation,
            entranceFee: Decimal(zooDTO.entranceFee),
            open: zooDTO.open,
            homepage: zooDTO.homepage,
            address,
            animals,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        zoo.address.zoo = zoo;
        zoo.animals?.forEach((animal) => {
            animal.zoo = zoo;
        });

        return zoo;
    }

    #zooCoreDtoToZoo(zooDto: ZooDtoCore): Zoo {
        return {
            id: undefined,
            version: undefined,
            designation: zooDto.designation,
            entranceFee: Decimal(zooDto.entranceFee),
            open: zooDto.open,
            homepage: zooDto.homepage,
            address: undefined,
            animals: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
/* eslint-enable max-lines */

/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    ParseIntPipe,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Zoo } from '../entity/zoo.entity.js';
import { type SearchCriteria } from '../service/searchCriteria.js';   
import { createPage } from './page.js';
import { createPageable } from '../service/pageable.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';
import { ZooReadService } from '../service/zoo-read.service.js';

export class ZooQuery implements SearchCriteria{
    @ApiProperty({ required: false })
    declare readonly designation?: string;

    @ApiProperty({ required: false })
    declare readonly entranceFee?: number;

    @ApiProperty({ required: false })
    declare readonly open?: boolean;

    @ApiProperty({ required: false })
    declare size?: string;

    @ApiProperty({ required: false })
    declare page?: string;
}

@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Zoo REST-API')
export class ZooReadController {
    readonly #service: ZooReadService;

    readonly #logger = getLogger(ZooReadController.name);
    
    constructor(service: ZooReadService) {
        this.#service = service;
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Searching with Zoo-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header for conditional GET requests, e.g., "0" ',
        required: false,
    })
    @ApiOkResponse({ description: 'Zoo was found' })
    @ApiNotFoundResponse({ description: 'No zoo found for the given ID' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'this zoo was is already downloaded',
    })
    async getById(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Req() req: Request,
        @Query('withAnimals') withAnimals: string | undefined,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<Zoo | undefined>>{
        this.#logger.debug('getById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }
        
        const withAnimalsBool = withAnimals === 'true';

        const zoo = await this.#service.findById({ id, withAnimals: withAnimalsBool });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): zoo=%s', zoo.toString());
            this.#logger.debug('getById(): titel=%o', zoo.address);
        }

        const versionDb = zoo.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        this.#logger.debug('getById: zoo=%o', zoo);
        return res.json(zoo);
    }

    @Get()
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Büchern' })
    async get(
        @Query() query: ZooQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<Zoo[] | undefined>> {
        this.#logger.debug('get: query=%o', query);
    
        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
       }
    
        const { page, size } = query;
        delete query['page'];
        delete query['size'];
        this.#logger.debug('get: page=%s, size=%s', page, size);
    
        const keys = Object.keys(query) as (keyof ZooQuery)[];
        keys.forEach((key) => {
            if (query[key] === undefined) {
                delete query[key];
            }
        });
        this.#logger.debug('get: query=%o', query);
    
        const pageable = createPageable({ number: page, size });
        const zooSlice = await this.#service.find(query, pageable);
        const zooPage = createPage(zooSlice, pageable);
        this.#logger.debug('get: zooPage=%o', zooPage);
    
        return res.json(zooPage).send();
    }
}
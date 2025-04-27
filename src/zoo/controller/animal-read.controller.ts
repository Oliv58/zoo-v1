import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    ParseIntPipe,
    Req,
    Res,
    StreamableFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { Readable } from 'node:stream';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { AnimalReadService } from '../service/animal-read.service.js';  
import { Animal } from '../entity/animal.entity.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

@Controller(paths.animal)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Animal REST-API')
export class AnimalReadController {
    readonly #service: AnimalReadService;

    readonly #logger = getLogger(AnimalReadController.name);
    
    constructor(service: AnimalReadService) {
        this.#service = service;
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Searching with Animal-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header for conditional GET requests, e.g., "0" ',
        required: false,
    })
    @ApiOkResponse({ description: 'animal was found' })
    @ApiNotFoundResponse({ description: 'No animal found for the given ID' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'this animal was is already downloaded',
    })
    async getById(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<Animal | undefined>>{
        this.#logger.debug('getById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const animal = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): zoo=%s', animal.toString());
        }

        const versionDb = animal.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        this.#logger.debug('getById: animal=%o', animal);
        return res.json(animal);
    }

    @Get('/file/:id')
    @Public()
    @ApiOperation({ description: 'Search for file by animal-ID' })
    @ApiParam({
        name: 'id',
        description: 'e.g. 1',
    })
    @ApiNotFoundResponse({ description: 'No data for this animal-ID' })
    @ApiOkResponse({ description: 'Data was found' })
    async getFileById(
        @Param('id') idStr: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        this.#logger.debug('getFileById: animalId:%s', idStr);

        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Animal-ID ${idStr} invalid`);
        }

        const animalFile = await this.#service.findFileByAnimalId(id);
        if (animalFile?.data === undefined) {
            throw new NotFoundException('No data was found');
        }

        const stream = Readable.from(animalFile.data);
        res.contentType(animalFile.mimetype ?? 'image/png').set({
            'Content-Disposition': `inline; filename="${animalFile.filename}"`, // eslint-disable-line @typescript-eslint/naming-convention
        });

        return new StreamableFile(stream);
    }
}

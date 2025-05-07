// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { entities } from './entity/entities.js';
import { QueryBuilder } from './service/query-builder.js';
import { AnimalReadController } from './controller/animal-read.controller.js';
import { ZooReadController } from './controller/zoo-read.controller.js';
import { ZooWriteController } from './controller/zoo-write.controller.js';
import { AnimalWriteController } from './controller/animal-write.controller.js';
import { ZooReadService } from './service/zoo-read.service.js';
import { ZooWriteService } from './service/zoo-write.service.js';
import { AnimalReadService } from './service/animal-read.service.js';
import { AnimalWriteService } from './service/animal-write.service.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [
        ZooReadController,
        ZooWriteController,
        AnimalReadController,
        AnimalWriteController,
    ],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        ZooReadService,
        ZooWriteService,
        AnimalReadService,
        AnimalWriteService,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [
        ZooReadService,
        ZooWriteService,
        AnimalReadService,
        AnimalWriteService,
    ],
})
export class ZooModule {}

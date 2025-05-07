// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { beforeAll, describe, expect, inject, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { Decimal } from 'decimal.js';
import { ZooReadService } from '../../src/zoo/service/zoo-read.service.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';
import { ZooFullDTO } from '../../src/zoo/controller/zooDTO.entity.js';

const token = inject('tokenRest');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuerZoo: Omit<ZooFullDTO, 'entranceFee'> & {
    entranceFee: number;
} = {
    designation: 'Wildlife Zoo',
    entranceFee: 15,
    open: false,
    homepage: 'wildlifereserve.org',
    address: {
        country: 'Austria',
        postalCode: '50201',
        street: 'Getreidegasse',
        houseNumber: 12,
        surname: 'Müller',
    },
    animals: [
        {
            designation: 'Amsel',
            species: 'bird',
            weight: new Decimal(1.2),
        },
    ],
};

const neuerZooInvalid: Record<string, unknown> = {
    designation: 6,
    entranceFee: 'keine Zahl',
    open: false,
    homepage: 'wildlifereserve.org',
    address: {
        country: 'Austria',
        postalCode: '50201',
        street: 'Getreidegasse',
        houseNumber: 12,
        surname: 'Müller',
    },
};
const neuerZooDesignationExistiert: ZooFullDTO = {
    designation: 'Wildlife Reserve',
    entranceFee: new Decimal(15),
    open: false,
    homepage: 'wildlifereserve.org',
    address: {
        country: 'Austria',
        postalCode: '50201',
        street: 'Getreidegasse',
        houseNumber: 12,
        surname: 'Müller',
    },
    animals: [
        {
            designation: 'Amsel',
            species: 'bird',
            weight: new Decimal(1.2),
        },
    ],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('POST /rest', () => {
    let client: AxiosInstance;
    const restURL = `${baseURL}/rest`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('new zoo', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '',
            neuerZoo,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(ZooReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test.concurrent('new Zoo with invalid data', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^designation /u), // Erwartet, dass designation eine gültige Länge hat
            expect.stringMatching(/^entranceFee /u), // Erwartet, dass entranceFee eine gültige Zahl ist
            expect.stringMatching(/^open /u), // Erwartet, dass open ein Boolean ist
            expect.stringMatching(/^homepage /u), // Erwartet, dass homepage eine gültige URL ist
            expect.stringMatching(/^address.country/), // Erwartet, dass country innerhalb von address validiert wird
            expect.stringMatching(/^address.postalCode/), // Erwartet, dass postalCode innerhalb von address validiert wird
            expect.stringMatching(/^address.street/), // Erwartet, dass street innerhalb von address validiert wird
            expect.stringMatching(/^address.houseNumber/), // Erwartet, dass houseNumber innerhalb von address validiert wird
            expect.stringMatching(/^address.surname/),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuerZooInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    test.concurrent('new zoo but the designation already exists', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<ErrorResponse> = await client.post(
            '',
            neuerZooDesignationExistiert,
            { headers },
        );

        // then
        const { data } = response;

        const { message, statusCode } = data;

        expect(message).toStrictEqual(expect.stringContaining('Designation'));
        expect(statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    test.concurrent('new zoo without token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuerZoo,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent('new zoo with invalid token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuerZoo,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent.todo('invalid token');
});

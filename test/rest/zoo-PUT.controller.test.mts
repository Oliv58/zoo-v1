// Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type ZooDtoCore } from '../../src/zoo/controller/zooDTO.entity.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

const token = inject('tokenRest');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaenderterZoo: Omit<ZooDtoCore, 'entranceFee'> & {
    entranceFee: number;
} = {
    designation: 'Berliner Zoo',
    entranceFee: 12,
    open: true,
    homepage: 'https://geaendert.put.rest',
};

const idVorhanden = '30';

const geaenderterZooIdNichtVorhanden: Omit<ZooDtoCore, 'entranceFee'> & {
    entranceFee: number;
} = {
    designation: 'Frankfurter Zoo',
    entranceFee: 11,
    open: true,
    homepage: 'https://geaendert.put.rest',
};
const idNichtVorhanden = '999999';

const geaenderterZooInvalid: Omit<ZooDtoCore, 'entranceFee'> & {
    entranceFee: number;
} = {
    designation: 'a', // Entspricht dem 'designation' Feld im DTO
    entranceFee: -1, // Entspricht dem 'entranceFee' Feld im DTO, als Decimal
    open: true, // Optional, entsprechend dem DTO
    homepage: 'https://geaendert.put.rest', // Optional, entsprechend dem DTO
};

const veralteterZoo: Omit<ZooDtoCore, 'entranceFee'> & {
    entranceFee: number;
} = {
    designation: 'Ravensburger Zoo', // Entspricht dem 'designation' Feld im DTO
    entranceFee: 24, // Entspricht dem 'entranceFee' Feld im DTO, als Decimal
    open: true, // Optional, entsprechend dem DTO
    homepage: 'https://geaendert.put.rest', // Optional, entsprechend dem DTO
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('PUT /rest/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('change existing zoo', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '0';

        // when
        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaenderterZoo,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('change non-existing zoo', async () => {
        // given
        const url = `/rest/${idNichtVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '0';

        // when
        const { status }: AxiosResponse<string> = await client.put(
            url,
            geaenderterZooIdNichtVorhanden,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);
    });

    test('change existing zoo with invalid data', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        const expectedMsg = [
            expect.stringMatching(/^designation /u),
            expect.stringMatching(/^entranceFee /u),
        ];

        // when
        const { status, data }: AxiosResponse<Record<string, any>> =
            await client.put(url, geaenderterZooInvalid, { headers });

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    test('change existing zoo without a version', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaenderterZoo,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('header "If-Match" is missing');
    });

    test('change existing zoo with old version', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.put(
            url,
            veralteterZoo,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);

        const { message, statusCode } = data;

        expect(message).toMatch(/Versionsnummer/u);
        expect(statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
    });

    test('change existing zoo without token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterZoo,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('change existing zoo with invalid token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterZoo,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});

-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- docker compose exec postgres bash
-- psql --dbname=buch --username=buch --file=/scripts/create-table-buch.sql

-- text statt varchar(n):
-- "There is no performance difference among these three types, apart from a few extra CPU cycles
-- to check the length when storing into a length-constrained column"
-- ggf. CHECK(char_length(nachname) <= 255)

-- Indexe mit pgAdmin auflisten: "Query Tool" verwenden mit
--  SELECT   tablename, indexname, indexdef, tablespace
--  FROM     pg_indexes
--  WHERE    schemaname = 'buch'
--  ORDER BY tablename, indexname;

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION zoo;

ALTER ROLE zoo SET search_path = 'zoo';

-- https://www.postgresql.org/docs/current/sql-createtype.html
-- https://www.postgresql.org/docs/current/datatype-enum.html
CREATE TYPE animalSpecies AS ENUM ('mammal', 'fish', 'reptile', 'amphibian', 'bird', 'invertebrate');

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html
CREATE TABLE IF NOT EXISTS zoo (
                  -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS
                  -- impliziter Index fuer Primary Key
                  -- "GENERATED ALWAYS AS IDENTITY" gemaess SQL-Standard
                  -- entspricht SERIAL mit generierter Sequenz buch_id_seq
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE zoospace,
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#id-1.5.4.6.6
    version       integer NOT NULL DEFAULT 0,
                  -- impliziter Index als B-Baum durch UNIQUE
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS
    designation   text NOT NULL UNIQUE,
    entrance_fee  decimal(6,2) NOT NULL,
    open          boolean NOT NULL DEFAULT FALSE,
    homepage      text,
    created_at    timestamp NOT NULL DEFAULT NOW(),
    updated_at    timestamp NOT NULL DEFAULT NOW()
) TABLESPACE zoospace;

CREATE TABLE IF NOT EXISTS address (
    id           integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE zoospace,
    country      text NOT NULL,
    postal_code  text NOT NULL,
    street       text NOT NULL,
    house_number integer NOT NULL,
    surname      text NOT NULL,
    zoo_id       integer NOT NULL UNIQUE USING INDEX TABLESPACE zoospace REFERENCES zoo
) TABLESPACE zoospace;


CREATE TABLE IF NOT EXISTS animal (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE zoospace,
    version         integer NOT NULL DEFAULT 0,
    designation     text NOT NULL,
    species         animalSpecies,
    weight          decimal(7,2) NOT NULL,
    zoo_id          integer NOT NULL REFERENCES zoo
) TABLESPACE zoospace;
CREATE INDEX IF NOT EXISTS animal_zoo_id_idx ON animal(zoo_id) TABLESPACE zoospace;

CREATE TABLE IF NOT EXISTS animal_file (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE zoospace,
    data            bytea NOT NULL,
    filename        text NOT NULL,
    mimetype        text,
    animal_id       integer NOT NULL REFERENCES animal
) TABLESPACE zoospace;


-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION zoo;

ALTER ROLE zoo SET search_path = 'zoo';

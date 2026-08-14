-- Remove Zitadel mapping data to prevent any deployment or validation errors and ensure a clean state
DELETE FROM "external_mapping" WHERE "provider" = 'ZITADEL';

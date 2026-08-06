-- AlterTable
ALTER TABLE `companies` ADD COLUMN `client_modules` VARCHAR(255) NOT NULL DEFAULT 'unit,detection,certificate';

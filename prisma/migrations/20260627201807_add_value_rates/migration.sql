-- CreateTable
CREATE TABLE `venfle_value_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Tarifa estándar',
    `cubicInchRate` DOUBLE NOT NULL DEFAULT 0.0,
    `volumetricWeightRate` DOUBLE NOT NULL DEFAULT 0.0,
    `airSurchargePercent` DOUBLE NOT NULL DEFAULT 0.0,
    `seaSurchargePercent` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

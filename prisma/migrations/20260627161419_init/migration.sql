-- CreateTable
CREATE TABLE `venfle_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `venfle_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venfle_clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `guideNumber` VARCHAR(191) NOT NULL,
    `lockerDate` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'DISPATCHED', 'DELIVERED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `venfle_clients_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venfle_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trackingNumber` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `length` DOUBLE NULL,
    `width` DOUBLE NULL,
    `height` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `volume` DOUBLE NULL,
    `isAir` BOOLEAN NOT NULL DEFAULT false,
    `isSea` BOOLEAN NOT NULL DEFAULT false,
    `clientId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `venfle_items_trackingNumber_key`(`trackingNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `venfle_items` ADD CONSTRAINT `venfle_items_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `venfle_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

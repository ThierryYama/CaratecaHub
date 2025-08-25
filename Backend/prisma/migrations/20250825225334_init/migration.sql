-- CreateTable
CREATE TABLE `Categoria` (
    `idCategoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `faixaIdadeMin` INTEGER NULL,
    `faixaIdadeMax` INTEGER NULL,
    `genero` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `pesoMin` DECIMAL(5, 2) NULL,
    `pesoMax` DECIMAL(5, 2) NULL,
    `graduacaoMin` VARCHAR(191) NULL,
    `graduacaoMax` VARCHAR(191) NULL,

    PRIMARY KEY (`idCategoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `comment` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `chain_id`                      INT NOT NULL,
    `contract_address`              VARCHAR(42) NOT NULL,
    `signer_address`                VARCHAR(42) NOT NULL,
    `text`                          TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `score`                         INT DEFAULT 1,
    `parent_id`                     INT DEFAULT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY (`chain_id`, `contract_address`)
);

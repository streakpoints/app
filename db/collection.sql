CREATE TABLE `collection` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `chain_id`                      INT NOT NULL,
    `contract_address`              VARCHAR(42) NOT NULL,
    `name`                          TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `num_comments`                  INT DEFAULT 0,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `one_of` (`chain_id`, `contract_address`)
);

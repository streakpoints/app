CREATE TABLE `excluded_collections` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `chain_id`                      INT NOT NULL,
    `contract_address`              VARCHAR(42) NOT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
);

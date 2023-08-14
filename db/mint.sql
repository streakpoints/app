CREATE TABLE `mint` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `chain_id`                      INT NOT NULL,
    `contract_address`              VARCHAR(42) NOT NULL,
    `token_id`                      VARCHAR(78) NOT NULL,
    `recipient`                     VARCHAR(42) NOT NULL,
    `value_gwei`                    BIGINT NOT NULL DEFAULT 0,
    `block_num`                     INT NOT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `one_of` (`chain_id`, `contract_address`, `token_id`),
    INDEX `feed` (`create_time`, `chain_id`, `contract_address`, `recipient`),
    INDEX `chain_block` (`chain_id`, `block_num`),
    INDEX `collections` (`contract_address`),
    INDEX `owners` (`recipient`)
);

CREATE TABLE `twitter_account_rule` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `twitter_account_id`            varchar(20) DEFAULT NULL,
    `eth_address`                   varchar(42) DEFAULT NULL,
    `token_id`                      varchar(78) DEFAULT NULL,
    `is_allowed`                    bool DEFAULT TRUE,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
);

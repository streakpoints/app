CREATE TABLE `account_verification` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `account_id`                    int NOT NULL,
    `phone_hash`                    varchar(132) NOT NULL,
    `verified`                      boolean DEFAULT FALSE,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `one_per_account` (`phone_hash`)
);

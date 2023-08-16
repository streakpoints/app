CREATE TABLE `ens` (
    `address`                       VARCHAR(42) NOT NULL,
    `name`                          VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_check_time`               datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`address`),
    KEY (`name`)
);

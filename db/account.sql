CREATE TABLE `account` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `address`                       varchar(42) NOT NULL,
    `verified`                      boolean DEFAULT FALSE,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,
    `login_time`                    datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `one_of` (`address`)
);

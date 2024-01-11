CREATE TABLE `checkin` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `address`                       varchar(42) NOT NULL,
    `epoch`                         int NOT NULL,
    `streak`                        int NOT NULL,
    `points`                        int NOT NULL,
    `sp`                            int DEFAULT NULL,
    `referrer`                      varchar(42) NOT NULL,
    `txid`                          varchar(66) NOT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `one_checkin_max` (`address`, `epoch`)
);

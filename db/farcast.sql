CREATE TABLE `farcast` (
    `id`                            int NOT NULL AUTO_INCREMENT,
    `hash`                          varchar(42) NOT NULL,
    `txid`                          varchar(66) NOT NULL,
    `status`                        varchar(4) NOT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
);

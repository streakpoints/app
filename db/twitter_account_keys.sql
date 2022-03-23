CREATE TABLE `twitter_account_keys` (
    `twitter_account_id`            varchar(20) NOT NULL,
    `access_key`                    varchar(255) DEFAULT NULL,
    `access_secret`                 varchar(255) DEFAULT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`twitter_account_id`)
);

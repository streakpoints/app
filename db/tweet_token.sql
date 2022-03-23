CREATE TABLE `tweet_token` (
    `tweet_id`                      varchar(20) DEFAULT NULL,
    `twitter_account_id`            varchar(20) DEFAULT NULL,
    `authorized_token_id`           varchar(78) DEFAULT NULL,
    `authorized_address`            varchar(42) NOT NULL,
    `token_id`                      varchar(78) NOT NULL,
    `token_uri`                     varchar(2048) NOT NULL,
    `token_memo`                    text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `token_royalty`                 decimal(5,2) NOT NULL,
    `token_address`                 varchar(42) NOT NULL,
    `token_signer`                  varchar(42) NOT NULL,
    `token_signature`               varchar(132) NOT NULL,
    `token_txid`                    varchar(66) DEFAULT NULL,
    `create_time`                   datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`token_id`)
);


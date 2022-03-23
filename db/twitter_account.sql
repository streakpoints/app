CREATE TABLE `twitter_account` (
    `id`                            varchar(20) NOT NULL,
    `handle`                        varchar(20) DEFAULT NULL,
    `name`                          varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description`                   varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `profile_image_url`             varchar(300) DEFAULT NULL,
    `verified`                      bool DEFAULT FALSE,
    `protected`                     bool DEFAULT FALSE,
    `nft_channel_active`            bool DEFAULT FALSE,
    
    PRIMARY KEY (`id`)
);

FROM php:8.2-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    default-mysql-client \
    ca-certificates \
    && update-ca-certificates \
    && docker-php-ext-install pdo pdo_mysql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chmod -R 775 storage bootstrap/cache

CMD sh -c "php artisan storage:link || true && php artisan migrate --force && php artisan config:clear && php artisan route:clear && php artisan cache:clear && php artisan config:cache && php -S 0.0.0.0:${PORT} -t public"

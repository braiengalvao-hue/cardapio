FROM php:8.2-apache

# Ativar mod_rewrite do Apache
RUN a2enmod rewrite

# Instalar extensao PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copiar configuracao do Apache para permitir .htaccess
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Copiar projeto
COPY . /var/www/html/

# Permissoes
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

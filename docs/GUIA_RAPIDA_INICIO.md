# 🚀 Guía Rápida de Inicio - Sistema POS

## ¡Bienvenido a su Sistema POS!

Esta guía está diseñada para que pueda comenzar a usar el sistema en **menos de 30 minutos**, tanto en un entorno local de desarrollo como en un servidor de producción para acceso remoto.

**⚠️ Requisito del Sistema**: Este sistema está diseñado exclusivamente para **Linux** (Ubuntu/Debian recomendado). No es compatible con Windows o macOS para producción.

---

## 📋 Antes de Elegir su Opción

### 🔍 ¿Cuál Opción Elegir?

| Característica      | Entorno Local (Linux)               | Servidor de Producción (Linux)           |
| ------------------- | ----------------------------------- | ---------------------------------------- |
| **Ubicación**       | Su computadora Linux                | Servidor dedicado remoto                 |
| **Acceso**          | Solo desde su PC                    | Desde cualquier dispositivo con internet |
| **Usuarios**        | 1 usuario local                     | Múltiples usuarios remotos               |
| **Configuración**   | 15-30 minutos                       | 45-60 minutos                            |
| **Costo**           | Gratis                              | Costo de servidor (~$5-20/mes)           |
| **Uso recomendado** | Pruebas, desarrollo, tienda pequeña | Negocio real, múltiples empleados        |

### ✅ Requisitos Generales

**Para ambas opciones:**

- **Sistema Operativo**: Ubuntu 20.04+ o Debian 11+ (Linux)
- **Navegador**: Chrome, Firefox, o Edge (actualizado)
- **Conexión**: Internet para activación inicial
- **Información**: RNC, datos de empresa, NCF (para producción)

> **⚠️ Importante**: Este sistema está diseñado para ejecutarse en servidores Linux. Para desarrollo local, use Ubuntu nativo, WSL2 en Windows, VirtualBox/VMware, o una máquina Linux dedicada.

### 🔧 Entornos de Desarrollo vs Producción

**Entorno de Desarrollo:**

- Para probar y desarrollar nuevas funcionalidades
- Base de datos local (`dev.db`)
- URLs locales (`localhost`)
- Recarga automática de código
- Errores detallados para debugging
- Datos de prueba incluidos

**Entorno de Producción:**

- Para uso comercial real
- Base de datos de producción (`prod.db`)
- URLs con dominio y HTTPS
- Optimizado para rendimiento
- Configuración de seguridad avanzada
- Copias de seguridad automáticas
- Notificaciones por email

**⚠️ Nunca use configuraciones de desarrollo en producción!**

### 🎯 Información que Necesitará Preparar

1. **Información de su Empresa**:
   - Nombre legal de la empresa
   - RNC (Registro Nacional del Contribuyente)
   - Dirección completa
   - Teléfono y email

2. **Secuencias NCF** (obligatorio para producción, opcional para desarrollo):
   - Números de comprobantes fiscales de la DGII
   - Fechas de expiración

3. **Productos Iniciales** (opcional):
   - Lista de productos para cargar
   - Precios y códigos de barras

---

# 💻 Opción A: Instalación en Entorno Local Linux (Desarrollo)

**Tiempo estimado**: 15-30 minutos
**Acceso**: Solo desde su computadora
**Ideal para**: Pruebas, aprendizaje, tienda pequeña
**Sistema**: Linux (Ubuntu/Debian)
**Entorno**: Desarrollo local con recarga automática

**Tiempo estimado**: 15-30 minutos
**Acceso**: Solo desde su computadora
**Ideal para**: Pruebas, aprendizaje, tienda pequeña
**Sistema**: Linux (Ubuntu/Debian)

## Requisitos Específicos

- **Sistema Operativo**: Ubuntu 20.04+ o Debian 11+
- **RAM**: 4GB mínimo
- **Espacio**: 2GB libre
- **Permisos**: Usuario con sudo

## 🛠️ Instalación Paso a Paso - Local

### Paso 1: Instalar Node.js (5 minutos)

```bash
# Actualizar sistema
sudo apt update

# Instalar curl (necesario para descargar Node.js)
sudo apt install -y curl

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verificar instalación:**

```bash
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x
```

### Paso 2: Instalar Git (2 minutos)

```bash
sudo apt install -y git
```

**Verificar:**

```bash
git --version
```

### Paso 3: Descargar el Sistema (3 minutos)

```bash
# Abrir terminal
# En Ubuntu/Debian: Ctrl + Alt + T

# Copiar y pegar:
git clone https://github.com/gntech-dev/pos.git
cd pos-system
```

### Paso 4: Instalar Dependencias (5 minutos)

```bash
npm install --legacy-peer-deps
```

### Paso 5: Configurar Base de Datos (2 minutos)

```bash
# Ejecutar migraciones
npm run db:migrate

# Cargar datos iniciales
npm run db:seed
```

### Paso 6: Iniciar el Sistema (2 minutos)

```bash
npm run dev
```

### Paso 7: Acceder al Sistema

Abra su navegador y vaya a: **http://localhost:3000**

**Credenciales iniciales:**

- Usuario: `admin`
- Contraseña: `admin123`

> **⚠️ Importante:** Cambie la contraseña inmediatamente

### Paso 8: Configurar Variables de Entorno para Desarrollo Local (3 minutos)

```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar configuración de desarrollo
nano .env
```

**Contenido del archivo .env para desarrollo local:**

```env
# Base de datos - Base de datos local para desarrollo
DATABASE_URL="file:./dev.db"

# Autenticación - URLs locales únicamente
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="desarrollo-local-clave-secreta-temporal-cambiar-en-produccion"

# Entorno - Modo desarrollo (recarga automática, errores detallados)
NODE_ENV="development"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Puerto de desarrollo
PORT=3000

# Email - Opcional en desarrollo (puede dejarse vacío)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

**¿Qué hace esto?**

- Configura base de datos SQLite local para desarrollo
- Establece URLs para desarrollo local
- Puerto 3000 para acceso desde navegador
- Modo desarrollo con recarga automática

**Diferencias Desarrollo vs Producción:**

- **Base de datos**: `dev.db` vs `prod.db`
- **URLs**: `localhost` vs dominio real con HTTPS
- **Secretos**: Secretos simples vs secretos seguros generados
- **NODE_ENV**: `development` vs `production`
- **Email**: Opcional vs requerido para notificaciones

## ⚙️ Configuración Inicial - Local

Siga los mismos pasos que en la sección de configuración más abajo, pero use:

- **URL del sistema**: `http://localhost:3000`
- **Base de datos**: Se crea automáticamente en su PC

### Verificación de Instalación de Desarrollo

```bash
# Verificar que la aplicación está ejecutándose
curl http://localhost:3000

# Verificar que la base de datos se creó
ls -la dev.db

# Verificar tablas de la base de datos
sqlite3 dev.db ".tables"

# Probar API de login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Solución de Problemas - Desarrollo

**❌ "npm install" falla**

```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**❌ "Error de conexión a base de datos"**

```bash
# Verificar si existe el archivo de base de datos
ls -la dev.db

# Reiniciar base de datos
npm run db:migrate
npm run db:seed
```

**❌ "Puerto 3000 ya está en uso"**

```bash
# Matar proceso que usa el puerto 3000
sudo lsof -ti:3000 | xargs kill -9

# O usar puerto diferente
npm run dev -- -p 3001
```

---

# 🌐 Opción B: Despliegue en Servidor Linux (Producción - Acceso Remoto)

**Tiempo estimado**: 45-60 minutos
**Acceso**: Desde cualquier dispositivo con internet
**Ideal para**: Negocio real, múltiples empleados
**Sistema**: Linux únicamente (Ubuntu recomendado)
**Entorno**: Producción con optimizaciones de rendimiento y seguridad

## Requisitos Específicos

- **Servidor**: VPS o dedicado (DigitalOcean, AWS, Linode, etc.)
- **Sistema Operativo**: Ubuntu 20.04+ (recomendado) o Debian 11+
- **RAM**: 2GB mínimo, 4GB recomendado
- **Espacio**: 20GB mínimo
- **Dominio**: Opcional pero recomendado
- **Acceso**: SSH al servidor

> **⚠️ Importante**: Este sistema requiere un servidor Linux. No es compatible con Windows Server.

### Paso 1: Conectar al Servidor (2 minutos)

```bash
# Conectar via SSH (reemplaza con tu IP/servidor)
ssh usuario@tu-servidor.com
# O si es root:
ssh root@tu-servidor.com
```

**¿Qué hace esto?**

- Establece conexión segura con tu servidor
- Todo el trabajo se hace en el servidor remoto

### Paso 2: Preparar el Servidor (5 minutos)

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip ufw
```

**¿Qué hace esto?**

- Actualiza el sistema operativo
- Instala herramientas necesarias para el despliegue

### Paso 3: Instalar Node.js (3 minutos)

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x
```

**¿Qué hace esto?**

- Instala Node.js versión 20 (LTS)
- Verifica que esté correctamente instalado

### Paso 4: Instalar PM2 (2 minutos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalación
pm2 --version

# Configurar PM2 para auto-inicio
pm2 startup
# Sigue las instrucciones que aparecen
```

**¿Qué hace esto?**

- Instala PM2 para manejar la aplicación en producción
- Configura que la aplicación inicie automáticamente al reiniciar el servidor

### Paso 5: Instalar Nginx (3 minutos)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Verificar instalación
sudo systemctl status nginx
```

**¿Qué hace esto?**

- Instala Nginx como servidor web reverso
- Nginx manejará las conexiones HTTP/HTTPS

### Paso 6: Configurar Firewall (2 minutos)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH, HTTP y HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Verificar estado
sudo ufw status
```

**¿Qué hace esto?**

- Configura firewall básico
- Permite acceso a SSH, HTTP (80) y HTTPS (443)

### Paso 7: Descargar la Aplicación (3 minutos)

```bash
# Crear directorio para la aplicación
sudo mkdir -p /opt/pos-system
sudo chown $USER:$USER /opt/pos-system
cd /opt/pos-system

# Clonar el repositorio
git clone https://github.com/gntech-dev/pos.git .
```

**¿Qué hace esto?**

- Crea directorio dedicado para la aplicación
- Descarga todo el código fuente

### Paso 8: Instalar Dependencias (5 minutos)

```bash
# Instalar dependencias de Node.js
npm install --legacy-peer-deps --production
```

**¿Qué hace esto?**

- Instala todas las librerías necesarias
- `--production` instala solo dependencias de producción

### Paso 9: Configurar Variables de Entorno (5 minutos)

```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar configuración de producción
nano .env
```

**Contenido del archivo .env:**

```env
# Base de datos - Base de datos de producción
DATABASE_URL="file:./prod.db"

# Autenticación - URLs de producción con HTTPS
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-clave-super-secreta-muy-larga-aqui-min-32-caracteres"

# Entorno - Modo producción (optimizado para rendimiento)
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://tu-dominio.com"

# Puerto interno (Nginx maneja el puerto 80/443)
PORT=3000

# Email - Requerido para notificaciones y recibos
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"
EMAIL_FROM="noreply@tu-dominio.com"
```

**¿Qué hace esto?**

- Configura la base de datos para producción
- Establece URLs de producción con HTTPS
- Configura email para notificaciones comerciales
- Optimiza para rendimiento y seguridad

**Configuración de Producción vs Desarrollo:**

- **Base de datos**: `prod.db` (separada de desarrollo)
- **URLs**: Dominio real con HTTPS obligatorio
- **Secretos**: Generar con `openssl rand -base64 32`
- **NODE_ENV**: `production` para optimización
- **Email**: Configurar SMTP para negocio real
- Configura secreto seguro para autenticación

> **⚠️ IMPORTANTE:** Genera un NEXTAUTH_SECRET seguro. Puedes usar: `openssl rand -base64 32`

### Paso 10: Configurar Base de Datos (3 minutos)

```bash
# Ejecutar migraciones
npm run db:migrate

# Cargar datos iniciales
npm run db:seed
```

**¿Qué hace esto?**

- Crea todas las tablas de la base de datos
- Carga datos básicos del sistema

### Paso 11: Construir la Aplicación (5 minutos)

```bash
# Construir para producción
npm run build
```

**¿Qué hace esto?**

- Optimiza el código para producción
- Crea archivos estáticos optimizados

### Paso 12: Configurar PM2 (3 minutos)

```bash
# Copiar configuración de PM2
cp config/ecosystem.config.example.js ecosystem.config.js

# Editar configuración PM2
nano ecosystem.config.js
```

**Contenido del archivo ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'npm start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      error_file: '/opt/pos-system/logs/err.log',
      out_file: '/opt/pos-system/logs/out.log',
      log_file: '/opt/pos-system/logs/combined.log',
      time: true,
    },
  ],
}
```

**¿Qué hace esto?**

- Configura cómo PM2 manejará la aplicación
- Define logs y reinicio automático

### Paso 13: Configurar Email (2 minutos)

```bash
# Copiar configuración de email
cp config/email-config.example.json email-config.json

# Editar configuración de email
nano email-config.json
```

**Configura tu SMTP en email-config.json:**

```json
{
  "host": "smtp.gmail.com",
  "port": "587",
  "secure": false,
  "tls": true,
  "timeout": "30000",
  "user": "tu-email@gmail.com",
  "senderName": "Sistema POS - Tu Negocio",
  "password": "tu-contraseña-de-aplicación"
}
```

**¿Qué hace esto?**

- Configura el envío de emails para facturas y notificaciones
- Usa Gmail u otro proveedor SMTP

### Paso 14: Crear Directorio de Logs (1 minuto)

```bash
# Crear directorio para logs
mkdir -p logs
```

### Paso 15: Iniciar la Aplicación (2 minutos)

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Verificar estado
pm2 status
```

**¿Qué hace esto?**

- Inicia la aplicación en segundo plano
- Guarda configuración para reinicio automático
- Verifica que esté ejecutándose

### Paso 16: Configurar Nginx (5 minutos)

```bash
# Crear configuración de sitio
sudo nano /etc/nginx/sites-available/pos-system
```

**Contenido del archivo de configuración:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para archivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**¿Qué hace esto?**

- Configura Nginx como proxy reverso
- Maneja conexiones HTTP al puerto 3000 interno

### Paso 16: Habilitar Sitio y Reiniciar Nginx (2 minutos)

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl reload nginx
```

**¿Qué hace esto?**

- Activa la configuración del sitio
- Reinicia Nginx para aplicar cambios

### Paso 17: Configurar SSL (Opcional pero Recomendado - 5 minutos)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d tu-dominio.com

# Seguir las instrucciones en pantalla
```

**¿Qué hace esto?**

- Instala certificado SSL gratuito de Let's Encrypt
- Configura HTTPS automáticamente

---

## ⚙️ Configuración Inicial de la Aplicación

### Paso 1: Acceder al Sistema

Abra su navegador y vaya a:

- **Con SSL**: `https://tu-dominio.com`
- **Sin SSL**: `http://tu-dominio.com`

### Paso 2: Primer Login

**Usuario:** `admin`  
**Contraseña:** `admin123`

> **⚠️ IMPORTANTE:** Cambie esta contraseña inmediatamente.

### Paso 3: Configurar Empresa

1. Vaya a **Configuración** → **Empresa**
2. Complete:
   - Nombre legal
   - RNC
   - Dirección
   - Teléfono y email
3. Guarde

### Paso 4: Configurar NCF (Obligatorio)

1. Vaya a **Configuración** → **NCF**
2. Agregue sus secuencias de la DGII:
   - Tipo (B01, B02, etc.)
   - Rango de números
   - Fecha de expiración
3. Guarde

### Paso 5: Cambiar Contraseña

1. Vaya a **Configuración** → **Mi Perfil**
2. Cambie la contraseña por una segura

### 🛡️ Paso 18: Seguridad Adicional (Recomendado)

```bash
# Instalar fail2ban para protección contra ataques
sudo apt install -y fail2ban

# Iniciar y habilitar fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Proteger archivo de base de datos
chmod 600 prod.db

# Configurar logrotate para logs
sudo nano /etc/logrotate.d/pos-system
```

**Contenido de /etc/logrotate.d/pos-system:**

```
/opt/pos-system/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 $USER $USER
}
```

```bash
# Probar configuración
sudo logrotate -f /etc/logrotate.d/pos-system
```

**¿Qué hace esto?**

- Instala protección contra ataques de fuerza bruta
- Configura rotación automática de logs
- Protege permisos del archivo de base de datos

### 🌐 Configuración de Dominio (Opcional)

Si tiene un dominio, configure DNS:

1. **Apunte el dominio a la IP del servidor** en la configuración DNS
2. **Actualice configuración nginx** con su dominio real
3. **Actualice .env** con URLs del dominio

### 📧 Configuración de Email (Opcional)

Configure SMTP para notificaciones y recibos:

```bash
# Editar archivo .env
nano .env
```

Agregar configuración de email:

```env
# Configuración SMTP
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="noreply@tudominio.com"
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-contraseña-de-aplicación"
```

### ⚡ Optimización de Rendimiento

```bash
# Habilitar compresión gzip en nginx
sudo nano /etc/nginx/nginx.conf
# Agregar: gzip on; gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Reiniciar nginx
sudo systemctl restart nginx

# Clustering PM2 (para alto tráfico)
pm2 start ecosystem.config.js -i max
```

---

## 👥 Crear Usuarios

### Paso 1: Acceder a Gestión de Usuarios

1. Vaya a **Configuración** → **Usuarios**

### Paso 2: Crear Usuario

1. Haga clic en **"Nuevo Usuario"**
2. Complete:
   - Nombre de usuario
   - Nombre completo
   - Rol (Gerente, Cajero)
   - Contraseña temporal
3. Guarde

### Paso 3: Repetir para Todos los Usuarios

Cree cuentas para todos sus empleados.

---

## 📦 Agregar Productos

### Paso 1: Ir a Inventario

1. Haga clic en **"Inventario"** → **"Productos"**

### Paso 2: Agregar Producto

1. Haga clic en **"Agregar Producto"**
2. Complete información básica
3. Guarde

### Paso 3: Importar Productos (Opcional)

Si tiene muchos productos, considere importar desde Excel.

---

## 💾 Configurar Backup Automático

### Paso 1: Crear Script de Backup

```bash
# Crear archivo de backup
nano /opt/pos-system/backup.sh
```

**Contenido del script:**

```bash
#!/bin/bash

BACKUP_DIR="/opt/pos-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pos_backup_$DATE.db"

mkdir -p $BACKUP_DIR

# Detener aplicación
pm2 stop pos-system

# Copiar base de datos
cp prod.db $BACKUP_FILE

# Iniciar aplicación
pm2 start pos-system

# Limpiar backups antiguos (mantener últimos 30)
find $BACKUP_DIR -name "pos_backup_*.db" -mtime +30 -delete

echo "Backup completado: $BACKUP_FILE"
```

### Paso 2: Hacer Ejecutable

```bash
chmod +x backup.sh
```

### Paso 3: Programar Backup Diario

```bash
# Editar crontab
crontab -e

# Agregar esta línea para backup diario a las 2 AM:
0 2 * * * /opt/pos-system/backup.sh
```

---

## 🎯 Verificación Final

### Checklist de Producción

- [ ] ✅ Servidor accesible via dominio
- [ ] ✅ SSL configurado (HTTPS)
- [ ] ✅ Aplicación ejecutándose (pm2 status)
- [ ] ✅ Nginx funcionando (sudo systemctl status nginx)
- [ ] ✅ Firewall activo (sudo ufw status)
- [ ] ✅ Backup automático configurado
- [ ] ✅ Información de empresa configurada
- [ ] ✅ NCF configurados
- [ ] ✅ Al menos un usuario adicional creado
- [ ] ✅ Contraseña admin cambiada

### Comandos de Verificación

```bash
# Verificar aplicación
pm2 status

# Verificar Nginx
sudo systemctl status nginx

# Verificar logs
pm2 logs pos-system --lines 20

# Verificar backup
ls -la /opt/pos-system/backups/
```

---

## 🚨 Solución de Problemas en Producción

### Aplicación no inicia

```bash
# Ver logs
pm2 logs pos-system

# Reiniciar
pm2 restart pos-system
```

### Sitio web no carga

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl reload nginx

# Verificar puerto
netstat -tlnp | grep :80
```

### Base de datos bloqueada

```bash
# Reiniciar aplicación
pm2 restart pos-system
```

### SSL no funciona

```bash
# Renovar certificado
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📊 Monitoreo y Mantenimiento

### Comandos Útiles

```bash
# Ver estado del sistema
pm2 monit

# Ver logs en tiempo real
pm2 logs pos-system --follow

# Reiniciar aplicación
pm2 restart pos-system

# Ver uso de recursos
htop
```

### Actualizaciones

```bash
# Actualizar aplicación
cd /opt/pos-system
git pull origin main
npm install --legacy-peer-deps --production
npm run build
pm2 restart pos-system
```

---

## 🎉 ¡Su Sistema Está Listo!

Ahora puede:

- ✅ Procesar ventas desde cualquier dispositivo
- ✅ Gestionar inventario en tiempo real
- ✅ Generar reportes fiscales automáticamente
- ✅ Mantener backup automático
- ✅ Escalar según crezca su negocio

**¿Necesita ayuda?** Contacte a soporte técnico.

---

## 📞 Soporte y Contacto

- **Email**: soporte@gntech.dev
- **Teléfono**: (809) 555-POS1
- **Documentación Completa**: [docs/](docs/) folder

---

**GNTech - Tecnología para su Éxito Empresarial**

_Guía actualizada: Diciembre 2025_

### Paso 2: Instalar Dependencias (5 minutos)

```bash
# Copiar y pegar:

npm install --legacy-peer-deps
```

**¿Qué hace esto?**

- Descarga todas las herramientas necesarias
- Puede tomar unos minutos dependiendo de su conexión

### Paso 3: Configurar Base de Datos (2 minutos)

```bash
# Copiar y pegar:

npm run db:migrate
npm run db:seed
```

**¿Qué hace esto?**

- Crea las tablas de la base de datos
- Carga datos iniciales (usuario admin, configuraciones básicas)

### Paso 4: Iniciar el Sistema (1 minuto)

```bash
# Copiar y pegar:

npm run dev
```

**¿Qué hace esto?**

- Inicia el servidor web
- El sistema estará listo en http://localhost:3000

---

## 🔐 Primer Acceso al Sistema

### Paso 1: Abrir en el Navegador

1. Abra Chrome, Firefox, o Edge
2. Vaya a: **http://localhost:3000**
3. Verá la página de login

### Paso 2: Iniciar Sesión por Primera Vez

**Usuario:** `admin`  
**Contraseña:** `admin123`

> **⚠️ Importante:** Cambie esta contraseña inmediatamente por seguridad.

### Paso 3: Cambiar Contraseña

1. Después de login, vaya a **Configuración** (⚙️)
2. Seleccione **"Mi Perfil"**
3. Haga clic en **"Cambiar Contraseña"**
4. Ingrese nueva contraseña segura (mínimo 8 caracteres)

---

## ⚙️ Configuración Inicial (10 minutos)

### Paso 1: Configurar Información de Empresa

1. Vaya a **Configuración** → **Empresa**
2. Complete los campos:
   - **Nombre**: Nombre legal de su empresa
   - **RNC**: Su número de Registro Nacional del Contribuyente
   - **Dirección**: Dirección completa
   - **Teléfono**: Número de contacto
   - **Email**: Correo electrónico

3. Haga clic en **"Guardar"**

### Paso 2: Configurar Impuestos

1. En **Configuración** → **Impuestos**
2. Configure:
   - **ITBIS**: Generalmente 18%
   - **Exenciones**: Si aplica alguna

### Paso 3: Configurar NCF (Importante)

1. Vaya a **Configuración** → **NCF**
2. Si tiene secuencias de la DGII:
   - Haga clic en **"Agregar Secuencia"**
   - Seleccione tipo (B01, B02, etc.)
   - Ingrese rango de números
   - Fecha de expiración

3. Si no tiene NCF aún:
   - Puede continuar, pero no podrá facturar hasta obtenerlos
   - Contacte a la DGII para solicitar secuencias

---

## 📦 Agregar sus Primeros Productos

### Paso 1: Ir al Inventario

1. Haga clic en **"Inventario"** en el menú lateral
2. Seleccione **"Productos"**

### Paso 2: Agregar Producto

1. Haga clic en **"Agregar Producto"**
2. Complete:
   - **Nombre**: Nombre descriptivo
   - **Precio**: Precio de venta
   - **Stock**: Cantidad inicial
   - **Categoría**: Grupo del producto

3. Haga clic en **"Guardar"**

### Paso 3: Repetir para Más Productos

Agregue al menos 5-10 productos para empezar.

> **💡 Tip:** Puede agregar más detalles después, lo básico es suficiente para comenzar.

---

## 👥 Agregar Clientes (Opcional)

### Paso 1: Ir a Clientes

1. Haga clic en **"Clientes"** en el menú lateral

### Paso 2: Agregar Cliente

1. Haga clic en **"Agregar Cliente"**
2. Complete:
   - **Nombre**: Nombre completo
   - **RNC/Cédula**: Para validación automática
   - **Teléfono**: Número de contacto

3. Haga clic en **"Guardar"**

---

## 💰 Procesar su Primera Venta

### Paso 1: Ir al POS

1. Haga clic en **"POS"** en el menú lateral
2. Verá la interfaz de punto de venta

### Paso 2: Agregar Productos

**Opción A: Buscar por nombre**

1. Haga clic en el campo de búsqueda
2. Escriba parte del nombre del producto
3. Seleccione de la lista

**Opción B: Navegar por categorías**

1. Haga clic en las pestañas de categorías
2. Seleccione el producto

### Paso 3: Procesar Pago

1. Verifique los productos en el carrito (derecha)
2. Seleccione método de pago:
   - **Efectivo**: Ingrese monto recibido
   - **Tarjeta**: Seleccione tipo
3. Haga clic en **"Procesar Venta"**

### Paso 4: Imprimir Recibo

1. El sistema generará automáticamente el NCF
2. Haga clic en **"Imprimir Recibo"**
3. Configure impresora si es necesario

---

## 📊 Ver Reportes Básicos

### Paso 1: Ir a Reportes

1. Haga clic en **"Reportes"** en el menú lateral

### Paso 2: Ver Reporte de Ventas

1. Seleccione **"Ventas"**
2. Configure fechas (última semana)
3. Haga clic en **"Generar Reporte"**

### Paso 3: Exportar (Opcional)

1. Haga clic en **"Exportar PDF"**
2. Guarde el archivo

---

## 👤 Crear Usuarios Adicionales

### Paso 1: Ir a Configuración de Usuarios

1. Vaya a **Configuración** → **Usuarios**

### Paso 2: Crear Usuario

1. Haga clic en **"Nuevo Usuario"**
2. Complete:
   - **Nombre de usuario**: Para login
   - **Nombre completo**: Nombre real
   - **Rol**: Cajero, Gerente, etc.
   - **Contraseña**: Temporal

3. Haga clic en **"Crear"**

> **Nota:** El usuario podrá cambiar su contraseña al primer login.

---

## 💾 Crear Primer Backup

### Paso 1: Ir a Backup

1. Haga clic en **"Backup"** en el menú lateral

### Paso 2: Crear Backup

1. Haga clic en **"Crear Backup"**
2. Seleccione **"Completo"**
3. Haga clic en **"Iniciar"**

### Paso 3: Descargar

1. Cuando termine, haga clic en **"Descargar"**
2. Guarde en lugar seguro (USB, nube, etc.)

---

## 🎯 Próximos Pasos Recomendados

### Semana 1: Operaciones Básicas

- [ ] Completar catálogo de productos (mínimo 50 productos)
- [ ] Agregar clientes principales
- [ ] Crear usuarios para todo el personal
- [ ] Realizar ventas de prueba
- [ ] Configurar impresora

### Semana 2: Optimización

- [ ] Configurar todas las secuencias NCF
- [ ] Establecer categorías de productos
- [ ] Configurar alertas de inventario
- [ ] Establecer precios y descuentos

### Semana 3: Reportes y Análisis

- [ ] Generar reportes semanales
- [ ] Analizar productos más vendidos
- [ ] Revisar márgenes de ganancia
- [ ] Configurar reportes automáticos

### Mes 1: Avanzado

- [ ] Configurar cotizaciones
- [ ] Establecer sistema de devoluciones
- [ ] Integrar con email
- [ ] Configurar backup automático

---

## 🆘 Solución de Problemas Comunes

### "No puedo iniciar sesión"

- Verifique usuario y contraseña
- Asegúrese de que no haya espacios extra
- Intente con otro navegador

### "Error de base de datos"

```bash
# En terminal:
rm prisma/dev.db-journal
npm run dev
```

### "Puerto ocupado"

```bash
# Cambie puerto:
PORT=3001 npm run dev
# Acceda en http://localhost:3001
```

### "No se imprimen recibos"

- Verifique conexión de impresora
- Configure impresora en **Configuración** → **Impresoras**
- Pruebe impresión de prueba

### "Errores de NCF"

- Verifique secuencias configuradas
- Confirme fechas de expiración
- Contacte DGII si necesita nuevas secuencias

---

## 📞 ¿Necesita Ayuda?

Si tiene problemas siguiendo esta guía:

### Soporte Inmediato

- **Email**: soporte@gntech.dev
- **Teléfono**: (809) 555-POS1 (7671)
- **Horas**: Lunes-Viernes 8AM-6PM

### Información a Proporcionar

Cuando contacte soporte, incluya:

- Mensaje de error exacto
- Paso donde ocurre el problema
- Sistema operativo y navegador
- Captura de pantalla (si aplica)

---

## ✅ Checklist de Verificación

Use esta lista para confirmar que todo está configurado:

- [ ] ✅ Instalación completada
- [ ] ✅ Primer login exitoso
- [ ] ✅ Contraseña cambiada
- [ ] ✅ Información de empresa configurada
- [ ] ✅ NCF configurados (o en proceso)
- [ ] ✅ Al menos 5 productos agregados
- [ ] ✅ Primera venta procesada
- [ ] ✅ Recibo impreso
- [ ] ✅ Backup creado
- [ ] ✅ Usuario adicional creado

---

## 🎉 ¡Felicitaciones!

Ha completado la configuración básica de su Sistema POS. Ahora puede:

- ✅ Procesar ventas eficientemente
- ✅ Mantener control de inventario
- ✅ Generar facturas con NCF válidas
- ✅ Obtener reportes de ventas
- ✅ Gestionar clientes y productos

**¿Listo para el siguiente nivel?** Consulte la [Guía del Usuario Completa](./USER_GUIDE.md) para funciones avanzadas.

---

**GNTech - Tecnología para su Éxito Empresarial**

_Esta guía se actualiza regularmente. Última actualización: Diciembre 2025_

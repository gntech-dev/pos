# 🚀 Guía Rápida de Inicio - Sistema POS

## ¡Bienvenido a su Sistema POS!

Esta guía está diseñada para que pueda comenzar a usar el sistema en **menos de 30 minutos**, incluso si es su primera vez con un sistema de punto de venta.

---

## 📋 Antes de Empezar

### ✅ Requisitos Mínimos

- **Computadora**: Windows 10+, macOS 10.15+, o Ubuntu 18.04+
- **Navegador**: Chrome, Firefox, o Edge (actualizado)
- **Conexión**: Internet para activación inicial
- **Tiempo**: 15-30 minutos para configuración inicial

### 🎯 Lo que Necesitará Preparar

Antes de instalar, reúna esta información:

1. **Información de su Empresa**:
   - Nombre legal de la empresa
   - RNC (Registro Nacional del Contribuyente)
   - Dirección completa
   - Teléfono y email

2. **Secuencias NCF** (si ya las tiene):
   - Números de comprobantes fiscales de la DGII
   - Fechas de expiración

3. **Productos Iniciales** (opcional):
   - Lista de productos para cargar
   - Precios y códigos de barras

---

## 🛠️ Instalación Paso a Paso

### Paso 1: Descargar el Sistema (2 minutos)

```bash
# Abrir terminal/línea de comandos
# Copiar y pegar este comando:

git clone https://github.com/gntech-dev/pos.git
cd pos-system
```

**¿Qué hace esto?**
- Descarga todos los archivos del sistema
- Entra a la carpeta del proyecto

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

*Esta guía se actualiza regularmente. Última actualización: Diciembre 2025*
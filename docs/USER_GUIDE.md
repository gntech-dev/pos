# Guía del Usuario - Sistema POS

## Introducción

Bienvenido al **Sistema de Punto de Venta (POS)** diseñado específicamente para empresas dominicanas. Este sistema cumple con todas las normativas de la Dirección General de Impuestos Internos (DGII), incluyendo la gestión de NCF, validación de RNC y reportes fiscales.

Esta guía está diseñada para usuarios principiantes y proporciona instrucciones detalladas paso a paso para utilizar todas las funciones del sistema.

### ¿Qué es un Sistema POS?

Un Sistema de Punto de Venta es una herramienta digital que permite:
- Procesar ventas de manera eficiente
- Gestionar inventario en tiempo real
- Generar facturas electrónicas válidas fiscalmente
- Mantener registros precisos para cumplimiento tributario
- Generar reportes detallados de ventas y ganancias

### Características Principales

- ✅ **Cumplimiento DGII**: NCF, validación RNC, reportes fiscales
- ✅ **Gestión de Inventario**: Control de stock, alertas de bajo inventario
- ✅ **Gestión de Clientes**: Validación automática de RNC y cédula
- ✅ **Múltiples Tipos de Venta**: Facturas de crédito fiscal, consumo, gubernamental
- ✅ **Reportes Avanzados**: Ventas, inventario, clientes, fiscales
- ✅ **Impresión**: Recibos térmicos y facturas A4
- ✅ **Backup y Restauración**: Seguridad de datos
- ✅ **Interfaz Intuitiva**: Fácil de usar para principiantes

## Primeros Pasos

### Requisitos del Sistema

Antes de comenzar, asegúrese de tener:

- **Navegador Web**: Chrome, Firefox, Safari o Edge (versión reciente)
- **Conexión a Internet**: Para sincronización con DGII y envío de correos
- **Impresora**: Para imprimir recibos (opcional pero recomendado)
- **Lector de Código de Barras**: Para escaneo rápido de productos (opcional)

### Acceso al Sistema

#### Paso 1: Abrir el Navegador
1. Abra su navegador web preferido
2. En la barra de direcciones, escriba la URL del sistema POS
   - **Desarrollo**: `http://localhost:3000`
   - **Producción**: La URL proporcionada por su administrador

#### Paso 2: Iniciar Sesión
1. En la página de login, verá dos campos:
   - **Usuario**: Su nombre de usuario asignado
   - **Contraseña**: Su contraseña

2. Ingrese sus credenciales
3. Haga clic en el botón **"Iniciar Sesión"**

> **💡 Consejos para Principiantes:**
> - Si no recuerda su contraseña, contacte al administrador del sistema
> - Asegúrese de que la tecla Caps Lock esté desactivada
> - Las contraseñas distinguen entre mayúsculas y minúsculas

#### Paso 3: Verificación de Acceso
Después de iniciar sesión correctamente:
- Será redirigido al dashboard principal
- Verá el menú lateral con las opciones disponibles
- Su nombre de usuario aparecerá en la esquina superior derecha

### Entendiendo los Roles de Usuario

El sistema tiene diferentes niveles de acceso según su rol. Cada rol está diseñado para responsabilidades específicas dentro del negocio.

#### 👑 **Administrador**
**Responsabilidades**: Configuración completa del sistema, gestión de usuarios, seguridad.

**Capacidades Detalladas:**
- ✅ **Gestión de Usuarios**: Crear, editar, eliminar usuarios y asignar roles
- ✅ **Configuración del Sistema**: Ajustes generales, empresa, NCF, email
- ✅ **Acceso Completo**: Todas las funciones del sistema sin restricciones
- ✅ **Reportes Avanzados**: Todos los reportes incluyendo financieros y fiscales
- ✅ **Backup y Restauración**: Copias de seguridad y recuperación de datos
- ✅ **Configuración de Seguridad**: Contraseñas, permisos, auditoría
- ✅ **Integraciones**: Configuración de servicios externos (email, etc.)

**Uso Típico**: Propietario del negocio, gerente general, administrador de TI.

#### 👔 **Gerente**
**Responsabilidades**: Supervisión diaria, control de inventario, análisis de ventas.

**Capacidades Detalladas:**
- ✅ **Procesamiento de Ventas**: Todas las funciones de venta y facturación
- ✅ **Gestión de Inventario**: Agregar, editar, eliminar productos y categorías
- ✅ **Control de Clientes**: Gestión completa de base de datos de clientes
- ✅ **Cotizaciones y Presupuestos**: Crear y gestionar cotizaciones
- ✅ **Devoluciones y Reembolsos**: Procesar todas las operaciones de devolución
- ✅ **Reportes Completos**: Ventas, inventario, clientes, rentabilidad
- ✅ **Dashboard Ejecutivo**: Vista completa del estado del negocio
- ✅ **Configuración de Productos**: Precios, descuentos, promociones
- ❌ **Gestión de Usuarios**: No puede crear/editar usuarios
- ❌ **Configuración del Sistema**: Solo lectura de configuraciones críticas

**Uso Típico**: Gerente de tienda, supervisor de ventas, encargado de inventario.

#### 🧑‍💼 **Cajero**
**Responsabilidades**: Procesamiento eficiente de ventas en el punto de venta.

**Capacidades Detalladas:**
- ✅ **Procesamiento de Ventas**: Escanear productos, aplicar descuentos, cobrar
- ✅ **Búsqueda de Productos**: Buscar productos por nombre, SKU o código de barras
- ✅ **Gestión de Clientes**: Buscar clientes existentes, aplicar descuentos por cliente
- ✅ **Impresión de Recibos**: Imprimir facturas térmicas y enviar por email
- ✅ **Vista de Inventario**: Consultar stock disponible (solo lectura)
- ✅ **Reportes Básicos**: Ventas del día, productos más vendidos
- ✅ **Cambio de Contraseña**: Gestionar su propia contraseña
- ❌ **Modificación de Productos**: No puede agregar/editar productos
- ❌ **Configuración de Precios**: No puede cambiar precios o descuentos
- ❌ **Gestión de Usuarios**: Sin acceso
- ❌ **Reportes Avanzados**: Sin acceso a reportes financieros detallados
- ❌ **Backup/Restauración**: Sin acceso

**Uso Típico**: Cajero de tienda, vendedor en mostrador, operador de POS.

#### 📋 **Matriz de Permisos Detallada**

| Función | Administrador | Gerente | Cajero |
|---------|---------------|---------|--------|
| **Ventas** | | | |
| Procesar ventas | ✅ | ✅ | ✅ |
| Aplicar descuentos | ✅ | ✅ | ✅ |
| Enviar facturas por email | ✅ | ✅ | ✅ |
| Devoluciones | ✅ | ✅ | ❌ |
| **Inventario** | | | |
| Ver productos | ✅ | ✅ | ✅ |
| Agregar productos | ✅ | ✅ | ❌ |
| Editar productos | ✅ | ✅ | ❌ |
| Eliminar productos | ✅ | ❌ | ❌ |
| Control de stock | ✅ | ✅ | ❌ |
| **Clientes** | | | |
| Ver clientes | ✅ | ✅ | ✅ |
| Agregar clientes | ✅ | ✅ | ❌ |
| Editar clientes | ✅ | ✅ | ❌ |
| Validar RNC | ✅ | ✅ | ✅ |
| **Reportes** | | | |
| Dashboard | ✅ | ✅ | ✅ |
| Reportes de ventas | ✅ | ✅ | ✅ |
| Reportes de inventario | ✅ | ✅ | ❌ |
| Reportes financieros | ✅ | ✅ | ❌ |
| Reportes fiscales DGII | ✅ | ✅ | ❌ |
| **Configuración** | | | |
| Configuración empresa | ✅ | ❌ | ❌ |
| Configuración NCF | ✅ | ❌ | ❌ |
| Configuración email | ✅ | ❌ | ❌ |
| Gestión de usuarios | ✅ | ❌ | ❌ |
| Backup | ✅ | ❌ | ❌ |

> **💡 Consejos sobre Roles:**
> - **Asigne el rol mínimo necesario** para cada usuario (principio de menor privilegio)
> - **El rol de Cajero** es ideal para empleados de primera línea
> - **El rol de Gerente** es perfecto para supervisores y encargados
> - **Reserve Administrador** solo para personal de confianza con conocimientos técnicos
> - **Los roles se pueden cambiar** en cualquier momento por un administrador

## Navegación por el Sistema

### Menú Principal

El menú lateral izquierdo contiene todas las funciones principales:

- **🏠 Dashboard**: Vista general del negocio
- **💰 POS**: Procesar ventas
- **📦 Inventario**: Gestionar productos
- **👥 Clientes**: Base de datos de clientes
- **📄 Cotizaciones**: Crear presupuestos
- **🔄 Devoluciones**: Procesar reembolsos
- **📊 Reportes**: Análisis y reportes
- **⚙️ Configuración**: Ajustes del sistema
- **💾 Backup**: Copias de seguridad

### Barra Superior

En la parte superior derecha encontrará:
- **Notificaciones**: Alertas importantes
- **Usuario**: Menú desplegable con opciones personales
- **Cerrar Sesión**: Para salir del sistema de forma segura

## Dashboard - Vista General

El dashboard es la página principal que se carga al iniciar sesión.

### Información Mostrada

1. **Métricas del Día**:
   - Ventas totales del día
   - Ingresos generados
   - Número de transacciones
   - Impuestos recaudados (ITBIS)

2. **Alertas de Inventario**:
   - Productos con stock bajo
   - Productos agotados
   - Alertas de expiración

3. **Transacciones Recientes**:
   - Últimas ventas procesadas
   - Estado de cada transacción

4. **Productos Más Vendidos**:
   - Ranking de productos por popularidad
   - Cantidades vendidas

### Navegación Rápida

Desde el dashboard puede acceder rápidamente a:
- Procesar una nueva venta
- Ver productos con bajo stock
- Generar reportes diarios
- Gestionar clientes

## Gestión de Ventas

### Procesamiento de una Venta Básica

#### Paso 1: Acceder al Módulo POS
1. Haga clic en **"POS"** en el menú lateral
2. Se abrirá la interfaz de punto de venta

#### Paso 2: Buscar Productos
Existen varias formas de agregar productos:

**Opción A: Búsqueda por Nombre**
1. Haga clic en el campo de búsqueda
2. Escriba el nombre del producto
3. Seleccione de la lista desplegable

**Opción B: Escaneo de Código de Barras**
1. Enfoque el lector en el código de barras
2. El producto se agregará automáticamente

**Opción C: Navegación por Categorías**
1. Haga clic en las pestañas de categorías
2. Seleccione el producto deseado

#### Paso 3: Agregar al Carrito
1. Una vez seleccionado el producto, haga clic en **"Agregar"**
2. El producto aparecerá en el carrito a la derecha
3. Puede ajustar la cantidad usando los botones + y -

#### Paso 4: Información del Cliente (Opcional)
1. Haga clic en **"Agregar Cliente"**
2. Busque por nombre, RNC o cédula
3. Seleccione el cliente de la lista

> **Nota**: Para facturas de crédito fiscal, la información del cliente es obligatoria.

#### Paso 5: Seleccionar Tipo de Factura
Elija el tipo apropiado según el cliente:

- **B01 - Crédito Fiscal**: Para empresas (incluye ITBIS)
- **B02 - Consumo**: Para consumidores finales
- **B15 - Gubernamental**: Para entidades gubernamentales

#### Paso 6: Aplicar Descuentos (Opcional)
1. Haga clic en el ícono de descuento junto al producto
2. Ingrese el porcentaje o monto de descuento
3. El sistema recalculará automáticamente

#### Paso 7: Procesar el Pago
1. Revise el total en la sección de pago
2. Seleccione el método de pago:
   - Efectivo
   - Tarjeta de crédito/débito
   - Transferencia bancaria
   - Mixto (combinación de métodos)

3. Si paga en efectivo, ingrese el monto recibido
4. El sistema calculará el cambio automáticamente

#### Paso 8: Finalizar la Venta
3. Haga clic en **"Procesar Venta"**
4. El sistema generará el NCF automáticamente
5. Se mostrará un resumen de la transacción
6. Haga clic en **"Imprimir Recibo"** si es necesario

### Historial de Ventas y Envío por Email

#### Ver Historial de Ventas
1. Haga clic en **"Ventas"** en el menú lateral
2. Verá una lista de todas las ventas procesadas
3. Use los filtros para buscar ventas específicas:
   - Por fecha
   - Por número de NCF
   - Por cliente
   - Por cajero

#### Enviar Factura por Email
1. En la lista de ventas, haga clic en el botón **"⋮"** (más opciones)
2. Seleccione **"Enviar por Email"**
3. Ingrese la dirección de email del destinatario
4. Elija el tipo de documento:
   - **Factura**: Formato profesional A4 con detalles completos
   - **Recibo**: Formato térmico simplificado

5. Haga clic en **"Enviar"**
6. El sistema generará automáticamente un PDF profesional
7. Se enviará por email con el asunto apropiado

> **💡 Tip**: Las facturas por email incluyen toda la información fiscal, NCF, y tienen el mismo formato profesional que las impresas.

### Gestión de Devoluciones

#### Paso 1: Acceder a Devoluciones
1. Haga clic en **"Devoluciones"** en el menú lateral

#### Paso 2: Buscar la Venta Original
1. Use el campo de búsqueda para encontrar la venta
2. Puede buscar por:
   - Número de NCF
   - Nombre del cliente
   - Fecha de la venta

#### Paso 3: Seleccionar Productos a Devolver
1. Marque los productos que desea devolver
2. Ajuste las cantidades si es necesario
3. Especifique el motivo de la devolución

#### Paso 4: Procesar la Devolución
1. Haga clic en **"Procesar Devolución"**
2. El sistema generará una nota de crédito
3. Se actualizará el inventario automáticamente

## Gestión de Inventario

### Agregar un Nuevo Producto

#### Paso 1: Acceder al Inventario
1. Haga clic en **"Inventario"** en el menú lateral
2. Seleccione la pestaña **"Productos"**

#### Paso 2: Crear Producto
1. Haga clic en **"Agregar Producto"**
2. Complete la información requerida:

**Información Básica:**
- **Nombre**: Nombre descriptivo del producto
- **Código/SKU**: Identificador único
- **Descripción**: Detalles adicionales (opcional)

**Precios y Costos:**
- **Precio de Venta**: Precio al público
- **Costo**: Precio de compra (para márgenes)
- **Precio Mínimo**: Precio mínimo permitido (opcional)

**Inventario:**
- **Stock Inicial**: Cantidad actual
- **Stock Mínimo**: Nivel para alertas
- **Unidad de Medida**: Pieza, kg, litro, etc.

**Categorización:**
- **Categoría**: Grupo del producto
- **Proveedor**: Empresa proveedora
- **Código de Barras**: Para escaneo (opcional)

#### Paso 3: Configurar Opciones Avanzadas
1. **Impuestos**: Configure si aplica ITBIS y porcentaje
2. **Lotes**: Para productos con fechas de expiración
3. **Imágenes**: Suba fotos del producto (opcional)

#### Paso 4: Guardar el Producto
1. Revise toda la información
2. Haga clic en **"Guardar"**
3. El producto estará disponible para ventas

### Gestión de Categorías

#### Crear una Nueva Categoría
1. En la sección de inventario, vaya a **"Categorías"**
2. Haga clic en **"Nueva Categoría"**
3. Ingrese nombre y descripción
4. Asigne un color para identificación visual
5. Guarde los cambios

### Alertas de Inventario

El sistema le notificará automáticamente cuando:
- Un producto llegue al stock mínimo
- Un producto se agote completamente
- Un lote esté próximo a expirar

Para ver todas las alertas:
1. Vaya al dashboard
2. Revise la sección **"Alertas de Inventario"**
3. Haga clic en cualquier alerta para ver detalles

## Gestión de Clientes

### Agregar un Nuevo Cliente

#### Paso 1: Acceder a Clientes
1. Haga clic en **"Clientes"** en el menú lateral

#### Paso 2: Crear Cliente
1. Haga clic en **"Agregar Cliente"**
2. Complete la información:

**Información Personal:**
- **Nombre Completo**: Nombre y apellidos
- **Tipo**: Persona física o jurídica
- **RNC**: Para empresas (válido para DGII)
- **Cédula**: Para individuos

**Información de Contacto:**
- **Teléfono**: Número de contacto
- **Email**: Dirección de correo electrónico
- **Dirección**: Dirección completa

**Información Fiscal:**
- **Exento de ITBIS**: Si aplica exoneración
- **Límite de Crédito**: Monto máximo de crédito (opcional)

#### Paso 3: Validación Automática
1. Al ingresar RNC o cédula, el sistema validará automáticamente
2. Si hay errores, se mostrará una advertencia
3. Para RNC, se consultará la base de datos de DGII

#### Paso 4: Guardar Cliente
1. Revise toda la información
2. Haga clic en **"Guardar"**
3. El cliente estará disponible para ventas

### Búsqueda de Clientes

Para encontrar clientes existentes:
1. Use el campo de búsqueda
2. Puede buscar por nombre, RNC, cédula o teléfono
3. Seleccione de la lista de resultados

## Cotizaciones

### Crear una Nueva Cotización

#### Paso 1: Acceder a Cotizaciones
1. Haga clic en **"Cotizaciones"** en el menú lateral

#### Paso 2: Nueva Cotización
1. Haga clic en **"Nueva Cotización"**

#### Paso 3: Agregar Productos
1. Busque y agregue productos como en una venta normal
2. Ajuste cantidades y precios si es necesario

#### Paso 4: Información del Cliente
1. Seleccione o agregue el cliente destinatario

#### Paso 5: Configurar Validez
1. Establezca fecha de expiración
2. Agregue notas o términos especiales

#### Paso 6: Guardar y Enviar
1. Guarde la cotización
2. Opcionalmente, envíe por email al cliente

### Convertir Cotización en Venta

Cuando el cliente acepte la cotización:
1. Abra la cotización
2. Haga clic en **"Convertir a Venta"**
3. El sistema creará una venta con los mismos productos
4. Procese el pago normalmente

## Reportes y Análisis

### Tipos de Reportes Disponibles

#### Reportes de Ventas
- **Resumen de Ventas**: Totales por período
- **Ventas por Fecha**: Análisis diario
- **Ventas por Cliente**: Historial de compras
- **Ventas por Producto**: Rendimiento de productos

#### Reportes de Inventario
- **Niveles de Stock**: Estado actual del inventario
- **Movimientos de Inventario**: Entradas y salidas
- **Productos por Categoría**: Análisis por grupos

#### Reportes de Clientes
- **Lista de Clientes**: Base de datos completa
- **Clientes Activos**: Con compras recientes
- **Historial de Compras**: Detalle por cliente

#### Reportes DGII
- **Formulario 606**: Compras y servicios
- **Formulario 607**: Ventas
- **Formulario 608**: ITBIS

### Generar un Reporte

#### Paso 1: Acceder a Reportes
1. Haga clic en **"Reportes"** en el menú lateral

#### Paso 2: Seleccionar Tipo
1. Elija la categoría de reporte
2. Seleccione el reporte específico

#### Paso 3: Configurar Filtros
1. **Rango de Fechas**: Período a analizar
2. **Filtros Adicionales**: Cliente, producto, categoría
3. **Agrupamiento**: Diario, semanal, mensual

#### Paso 4: Generar Reporte
1. Haga clic en **"Generar Reporte"**
2. Revise los resultados en pantalla

#### Paso 5: Exportar Reporte
1. **PDF**: Para impresión o archivo
2. **Excel/CSV**: Para análisis en hoja de cálculo

> **💡 Tip**: Los reportes PDF mantienen el formato correcto, incluyendo números como cantidades (no moneda) donde corresponde.

## Configuración del Sistema

### Configuración Básica

#### Información de la Empresa
1. Vaya a **"Configuración"** > **"Empresa"**
2. Complete:
   - Nombre de la empresa
   - RNC de la empresa
   - Dirección completa
   - Información de contacto

#### Configuración de Impuestos
1. Configure el porcentaje de ITBIS
2. Establezca reglas de exoneración
3. Configure tipos de NCF disponibles

### Gestión de Usuarios (Solo Administrador)

#### Crear Nuevo Usuario
1. Vaya a **"Configuración"** > **"Usuarios"**
2. Haga clic en **"Nuevo Usuario"**
3. Complete:
   - Nombre de usuario
   - Contraseña inicial
   - Rol asignado
   - Información personal

#### Gestionar Permisos
1. Seleccione un usuario existente
2. Modifique permisos según sea necesario
3. Guarde los cambios

## Gestión de NCF

### Entendiendo los NCF

Los NCF (Números de Comprobante Fiscal) son obligatorios en República Dominicana:

- **B01**: Crédito Fiscal (empresas)
- **B02**: Consumo (consumidores finales)
- **B14**: Regímenes Especiales
- **B15**: Gubernamental
- **B16**: Exportaciones

### Monitoreo de NCF

#### Ver Estado de Secuencias
1. Vaya a **"Configuración"** > **"NCF"**
2. Revise el estado de cada secuencia
3. Verifique fechas de expiración

#### Alertas Automáticas
El sistema alertará cuando:
- Una secuencia esté próxima a agotarse
- Una secuencia esté a punto de expirar
- No haya secuencias disponibles

### Solicitar Nuevas Secuencias

Cuando necesite nuevas secuencias:
1. Contacte a la DGII
2. Solicite nuevas secuencias según su RNC
3. Configure las nuevas secuencias en el sistema

## Backup y Seguridad

### Crear Copia de Seguridad

#### Paso 1: Acceder a Backup
1. Haga clic en **"Backup"** en el menú lateral

#### Paso 2: Crear Backup
1. Haga clic en **"Crear Backup"**
2. Seleccione tipo:
   - **Completo**: Toda la base de datos
   - **Incremental**: Solo cambios recientes

#### Paso 3: Descargar Backup
1. Espere a que se complete el proceso
2. Haga clic en **"Descargar"**
3. Guarde el archivo en lugar seguro

### Restaurar Datos

#### Importante: Solo en caso de emergencia
1. Vaya a **"Restaurar"**
2. Suba el archivo de backup
3. Seleccione qué datos restaurar
4. Confirme la operación

> **⚠️ Advertencia**: La restauración sobrescribirá datos existentes. Asegúrese de tener un backup adicional antes de restaurar.

## Impresión y Dispositivos

### Configuración de Impresoras

#### Impresora Térmica
1. Conecte la impresora USB o de red
2. Configure en **"Configuración"** > **"Impresoras"**
3. Seleccione tipo de impresora (ESC/POS)
4. Pruebe la impresión

#### Impresora A4
1. Configure como impresora predeterminada del sistema
2. Seleccione plantillas de factura
3. Configure márgenes y formato

### Tipos de Impresión

- **Recibo Térmico**: Para ventas rápidas
- **Factura A4**: Para clientes empresariales
- **Cotizaciones**: Con formato profesional

## Solución de Problemas

### Problemas Comunes

#### No puedo iniciar sesión
- Verifique usuario y contraseña
- Asegúrese de que Caps Lock esté desactivado
- Contacte al administrador si la cuenta está bloqueada

#### Error al procesar venta
- Verifique que haya NCF disponibles
- Confirme que el cliente esté correctamente registrado
- Revise conexión a internet para validación DGII

#### Problemas de impresión
- Verifique conexión de impresora
- Confirme que esté encendida y con papel
- Pruebe impresión de prueba

#### Productos no aparecen en búsqueda
- Verifique que estén en stock
- Confirme que no estén marcados como inactivos
- Revise filtros de categoría

### Soporte Técnico

Si necesita ayuda adicional:
1. Contacte al administrador del sistema
2. Proporcione detalles del error
3. Incluya capturas de pantalla si es posible

## Mejores Prácticas

### Seguridad
- Cambie contraseñas regularmente
- No comparta credenciales
- Cierre sesión al terminar
- Monitoree logs de actividad

### Operaciones Diarias
- Realice backups diarios
- Verifique alertas de inventario
- Confirme secuencias NCF
- Revise reportes semanales

### Mantenimiento
- Mantenga software actualizado
- Limpie base de datos periódicamente
- Archive datos antiguos
- Realice mantenimiento preventivo

## Glosario de Términos

- **NCF**: Número de Comprobante Fiscal
- **ITBIS**: Impuesto sobre Transferencias de Bienes Industrializados y Servicios
- **DGII**: Dirección General de Impuestos Internos
- **RNC**: Registro Nacional del Contribuyente
- **POS**: Point of Sale (Punto de Venta)
- **SKU**: Stock Keeping Unit (Unidad de mantenimiento de stock)
- **ESC/POS**: Protocolo estándar para impresoras térmicas

---

**Versión del Documento**: 2.0
**Última Actualización**: Diciembre 2025
**Sistema**: POS v1.0

Para más información, contacte a soporte técnico.
# ❓ Preguntas Frecuentes (FAQ) - Sistema POS

## 📋 Índice de Preguntas

### [🚀 Primeros Pasos](#-primeros-pasos)
### [🔐 Acceso y Seguridad](#-acceso-y-seguridad)
### [💰 Ventas y Facturación](#-ventas-y-facturación)
### [📦 Inventario y Productos](#-inventario-y-productos)
### [👥 Clientes](#-clientes)
### [📊 Reportes](#-reportes)
### [🖨️ Impresión](#️-impresión)
### [💾 Backup y Datos](#-backup-y-datos)
### [⚙️ Configuración](#️-configuración)
### [🚨 Problemas Técnicos](#-problemas-técnicos)
### [💰 Precios y Licencias](#-precios-y-licencias)

---

## 🚀 Primeros Pasos

### ¿Qué es un Sistema POS?

**Respuesta:** Un Sistema de Punto de Venta (POS) es una herramienta digital que permite gestionar ventas, inventario, clientes y reportes de manera eficiente. Nuestro sistema está específicamente diseñado para empresas dominicanas con cumplimiento total de las normativas de la DGII.

### ¿Necesito conocimientos técnicos para usar el sistema?

**Respuesta:** No, el sistema está diseñado para ser intuitivo. Si puede usar un teléfono inteligente o computadora básica, puede usar nuestro POS. Incluimos guías paso a paso y soporte técnico.

### ¿Cuánto tiempo toma configurar el sistema?

**Respuesta:** La configuración básica toma 15-30 minutos. Puede estar procesando ventas en menos de 1 hora. La configuración completa (productos, clientes, usuarios) puede tomar 1-2 días dependiendo del tamaño de su negocio.

### ¿Puedo usar el sistema sin conexión a internet?

**Respuesta:** Actualmente requiere internet para algunas funciones como validación de RNC con DGII. Estamos trabajando en modo offline completo para 2026.

---

## 🔐 Acceso y Seguridad

### ¿Cómo recupero mi contraseña?

**Respuesta:** Contacte al administrador del sistema. No hay recuperación automática por email aún. Estamos trabajando en esta función.

### ¿Puedo tener múltiples usuarios?

**Respuesta:** Sí, el sistema soporta múltiples usuarios con diferentes roles:
- **Administrador**: Control total
- **Gerente**: Ventas, inventario, reportes
- **Cajero**: Solo procesamiento de ventas

### ¿Es seguro el sistema?

**Respuesta:** Sí, implementamos múltiples capas de seguridad:
- Contraseñas encriptadas
- Sesiones seguras con JWT
- Control de acceso por roles
- Auditoría completa de acciones
- Backup automático

### ¿Cómo cambio mi contraseña?

**Respuesta:** Vaya a Configuración → Mi Perfil → Cambiar Contraseña. Use una contraseña segura (mínimo 8 caracteres con letras, números y símbolos).

---

## 💰 Ventas y Facturación

### ¿Qué tipos de facturas puedo emitir?

**Respuesta:** El sistema genera automáticamente los tipos requeridos por DGII:
- **B01**: Crédito Fiscal (empresas con ITBIS)
- **B02**: Consumo (clientes finales)
- **B15**: Gubernamental (entidades estatales)

### ¿Cómo funciona la validación de RNC?

**Respuesta:** Al ingresar un RNC, el sistema consulta automáticamente la base de datos de la DGII para validar que existe y está activo. Esto previene errores en facturación.

### ¿Puedo procesar pagos mixtos?

**Respuesta:** Sí, puede combinar métodos de pago en una misma venta:
- Efectivo + Tarjeta
- Múltiples tarjetas
- Anticipos + Pago final

### ¿Qué pasa si se va la luz durante una venta?

**Respuesta:** El sistema guarda automáticamente cada paso. Si se interrumpe, puede recuperar la venta desde el último punto guardado.

---

## 📦 Inventario y Productos

### ¿Cuántos productos puedo tener?

**Respuesta:** No hay límite técnico. El sistema está diseñado para manejar miles de productos. Recomendamos empezar con sus productos más vendidos.

### ¿Puedo usar códigos de barras?

**Respuesta:** Sí, el sistema soporta:
- Escaneo de códigos de barras
- Generación automática de códigos
- Códigos personalizados
- Múltiples formatos (EAN-13, UPC, etc.)

### ¿Cómo manejo productos con expiración?

**Respuesta:** Puede configurar:
- Fechas de expiración por lote
- Alertas automáticas de productos próximos a vencer
- Control de inventario por lotes
- Reportes de productos expirados

### ¿Puedo tener variantes de productos?

**Respuesta:** Actualmente no, pero puede crear productos separados. Estamos planeando soporte para variantes (tallas, colores) en futuras versiones.

---

## 👥 Clientes

### ¿Es obligatorio registrar clientes?

**Respuesta:** No para ventas B02 (consumo). Sí obligatorio para ventas B01 (crédito fiscal) según normativas DGII.

### ¿Cómo valido cédulas y RNC?

**Respuesta:** El sistema valida automáticamente contra bases de datos oficiales. Para cédulas valida formato y existencia. Para RNC valida contra DGII.

### ¿Puedo tener clientes sin RNC?

**Respuesta:** Sí, pero solo podrá emitir facturas B02. Para B01 necesita RNC válido.

### ¿Cómo busco clientes existentes?

**Respuesta:** Puede buscar por:
- Nombre
- RNC
- Cédula
- Teléfono
- Email

---

## 📊 Reportes

### ¿Qué reportes están disponibles?

**Respuesta:** El sistema incluye:
- **Ventas**: Diarias, semanales, mensuales
- **Inventario**: Niveles de stock, movimientos
- **Clientes**: Historial de compras
- **DGII**: Formularios 606, 607, 608
- **Productos**: Más vendidos, rentabilidad

### ¿Puedo exportar reportes?

**Respuesta:** Sí, a múltiples formatos:
- PDF (para impresión)
- Excel/CSV (para análisis)
- Email automático (próximamente)

### ¿Los reportes incluyen ITBIS?

**Respuesta:** Sí, todos los reportes fiscales incluyen breakdown completo de ITBIS, retenciones y exoneraciones.

### ¿Puedo programar reportes automáticos?

**Respuesta:** Actualmente manuales. Estamos desarrollando reportes automáticos por email para 2026.

---

## 🖨️ Impresión

### ¿Qué impresoras soporta?

**Respuesta:** 
- **Térmicas**: ESC/POS (Epson, Star, etc.)
- **A4**: Cualquier impresora estándar
- **Red**: Impresoras de red
- **USB**: Conexión directa

### ¿Cómo configuro una impresora?

**Respuesta:** Vaya a Configuración → Impresoras → Agregar Impresora. Seleccione tipo y puerto de conexión.

### ¿Puedo personalizar los recibos?

**Respuesta:** Sí, puede configurar:
- Logo de empresa
- Información adicional
- Formatos de fecha
- Mensajes personalizados

### ¿Qué pasa si no tengo impresora?

**Respuesta:** Puede operar sin impresora inicialmente. Los recibos se pueden enviar por email o mostrar en pantalla.

---

## 💾 Backup y Datos

### ¿Cómo hago backup?

**Respuesta:** Vaya a Backup → Crear Backup. Puede elegir:
- **Completo**: Toda la base de datos
- **Incremental**: Solo cambios recientes

### ¿Con qué frecuencia debo hacer backup?

**Respuesta:** Recomendamos:
- Diario: Backup automático
- Semanal: Backup manual completo
- Antes de cambios importantes: Backup manual

### ¿Dónde se guardan los backups?

**Respuesta:** 
- Local: En el servidor
- Nube: Sincronización automática (próximamente)
- USB: Exportación manual

### ¿Puedo restaurar datos?

**Respuesta:** Sí, pero solo con ayuda técnica. La restauración sobrescribe datos existentes, por lo que debe hacerse con cuidado.

---

## ⚙️ Configuración

### ¿Cómo configuro mi empresa?

**Respuesta:** Vaya a Configuración → Empresa e ingrese:
- Nombre legal
- RNC
- Dirección completa
- Información de contacto

### ¿Cómo configuro NCF?

**Respuesta:** Vaya a Configuración → NCF → Agregar Secuencia. Ingrese:
- Tipo (B01, B02, etc.)
- Rango de números
- Fecha de expiración

### ¿Puedo cambiar configuraciones después?

**Respuesta:** La mayoría sí, pero cambios en NCF requieren reinicio. Siempre haga backup antes de cambios importantes.

### ¿Cómo configuro impuestos?

**Respuesta:** En Configuración → Impuestos configure:
- Porcentaje de ITBIS
- Reglas de exoneración
- Retenciones

---

## 🚨 Problemas Técnicos

### "Error de conexión a base de datos"

**Solución:**
```bash
# Cierre todas las conexiones
rm prisma/dev.db-journal
npm run dev
```

### "Puerto 3000 ya está en uso"

**Solución:**
```bash
# Use otro puerto
PORT=3001 npm run dev
# Acceda en http://localhost:3001
```

### "No se imprimen recibos"

**Solución:**
- Verifique conexión de impresora
- Configure en Configuración → Impresoras
- Pruebe impresión de prueba

### "Errores de NCF"

**Solución:**
- Verifique secuencias configuradas
- Confirme fechas de expiración
- Contacte DGII para nuevas secuencias

### "Sistema lento"

**Solución:**
- Cierre otras aplicaciones
- Verifique conexión a internet
- Contacte soporte si persiste

---

## 💰 Precios y Licencias

### ¿Cuánto cuesta el sistema?

**Respuesta:** El sistema se ofrece en diferentes planes:
- **Básico**: RD$5,000/mes - Hasta 1,000 productos
- **Profesional**: RD$15,000/mes - Hasta 10,000 productos
- **Empresarial**: RD$35,000/mes - Productos ilimitados

### ¿Hay período de prueba?

**Respuesta:** Sí, ofrecemos 30 días de prueba gratuita con todas las funciones habilitadas.

### ¿Qué incluye la licencia?

**Respuesta:** 
- Software completo
- Actualizaciones
- Soporte técnico
- Backup en nube
- Capacitación inicial

### ¿Puedo cancelar en cualquier momento?

**Respuesta:** Sí, puede cancelar con 30 días de anticipación. Sus datos permanecen disponibles para exportación.

---

## 📞 ¿No encontró su pregunta?

### Canales de Soporte

- **📧 Email**: soporte@gntech.dev
- **💬 Chat**: Integrado en la aplicación
- **📞 Teléfono**: (809) 555-POS1 (7671)
- **📚 Documentación**: [docs/](docs/) completa

### Información Útil para Soporte

Cuando contacte soporte, incluya:
- Mensaje de error exacto
- Pasos para reproducir el problema
- Sistema operativo y navegador
- Versión del sistema
- Capturas de pantalla

---

## 🔄 Actualizaciones

Esta FAQ se actualiza regularmente. Última actualización: **Diciembre 2025**

¿Tiene una pregunta que no está aquí? [Contáctenos](mailto:soporte@gntech.dev) y la agregaremos.

---

**GNTech - Tecnología para su Éxito Empresarial**  
*Respuestas claras para su tranquilidad*
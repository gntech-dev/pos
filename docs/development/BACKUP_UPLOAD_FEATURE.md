# 📤 Nueva Funcionalidad: Subir Backups

## 📋 Resumen

Se ha agregado una nueva funcionalidad al módulo de backup que permite **subir archivos de backup existentes** al sistema. Esta característica permite importar backups desde otros sistemas o restaurar backups previamente descargados.

## ✨ Características Principales

### 🔐 **Seguridad**
- ✅ Validación de autenticación (solo usuarios ADMIN)
- ✅ Validación de permisos por rol
- ✅ Validación de archivos de backup
- ✅ Tamaño máximo de archivo: 500MB
- ✅ Solo archivos con extensión `.backup`

### 📁 **Gestión de Archivos**
- ✅ Validación automática de estructura de backup
- ✅ Soporte para backups encriptados y no encriptados
- ✅ Detección automática de compresión
- ✅ Generación automática de metadatos
- ✅ Prevención de conflictos de nombres

### 🖥️ **Interfaz de Usuario**
- ✅ Drag & drop para selección de archivos
- ✅ Validación en tiempo real
- ✅ Progreso de subida visual
- ✅ Feedback claro con emojis y mensajes
- ✅ Integración con la lista de backups existente

## 🚀 Cómo Usar la Funcionalidad

### Paso 1: Acceder al Módulo
1. Inicia sesión como usuario **ADMIN**
2. Ve a `/backup` desde el menú lateral

### Paso 2: Subir un Backup
1. **Localiza la sección "📤 Subir Backup Existente"**
2. **Haz clic en "Seleccionar Archivo de Backup"**
3. **Navega y selecciona tu archivo `.backup`**
4. **Revisa la información del archivo seleccionado**
5. **Haz clic en "📤 Subir Backup"**

### Paso 3: Verificar la Subida
1. **El backup aparecerá en la lista "📋 Backups Existentes"**
2. **Se mostrará con el tipo "Subido" (etiqueta morada)**
3. **Incluirá el nombre original del archivo**
4. **Podrás descargarlo, restaurarlo o eliminarlo normalmente**

## 🔧 Detalles Técnicos

### API Endpoint
**Ruta:** `POST /api/backup/upload`

### Parámetros de Entrada
- `backup` (File): Archivo de backup a subir
  - Formato: `.backup`
  - Tamaño máximo: 500MB
  - Tipo MIME: Cualquier tipo de archivo

### Validaciones Implementadas

#### 1. **Validación de Autenticación**
```typescript
const session = await getSessionFromCookie()
if (!session || session.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### 2. **Validación de Archivo**
```typescript
// Extensión
if (!file.name.endsWith('.backup')) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
}

// Tamaño
if (file.size > 500 * 1024 * 1024) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 })
}
```

#### 3. **Validación de Estructura**
```typescript
const validation = await validateBackup(buffer, true)
if (!validation.valid) {
  // Intenta sin encriptación
  const validationUnencrypted = await validateBackup(buffer, false)
  if (!validationUnencrypted.valid) {
    return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 })
  }
}
```

### Proceso de Subida

1. **Validación del archivo**
2. **Lectura del buffer**
3. **Validación de estructura de backup**
4. **Generación de nombre único**
5. **Guardado en `/backups/`**
6. **Creación de metadatos**
7. **Respuesta exitosa**

### Estructura de Metadatos Generados

```json
{
  "id": "uploaded-1734368171000",
  "name": "backup-name-uploaded-2025-12-16",
  "type": "uploaded",
  "size": 1048576,
  "compressed": true,
  "encrypted": true,
  "createdAt": "2025-12-16T19:16:11.000Z",
  "createdBy": "admin",
  "components": [],
  "retention": {
    "keepUntil": "2026-01-15T19:16:11.000Z",
    "autoDelete": true
  },
  "status": "completed",
  "uploaded": true,
  "originalFileName": "mi-backup.backup"
}
```

## 🎯 Casos de Uso

### 1. **Migración entre Sistemas**
- Subir backup desde sistema anterior
- Restaurar datos en nuevo entorno

### 2. **Recuperación de Desastres**
- Importar backup desde almacenamiento externo
- Recuperar datos perdidos

### 3. **Sincronización de Datos**
- Subir backup desde otro servidor
- Mantener consistencia entre entornos

### 4. **Desarrollo y Pruebas**
- Importar backup de producción para pruebas
- Crear entornos de desarrollo con datos reales

## 🛡️ Medidas de Seguridad

### Validaciones Múltiples
1. **Autenticación:** Usuario debe estar logueado
2. **Autorización:** Usuario debe tener rol ADMIN
3. **Archivo:** Validación de tipo, tamaño y nombre
4. **Contenido:** Validación de estructura de backup

### Prevención de Errores
- ✅ Nombres únicos para evitar conflictos
- ✅ Validación de integridad del backup
- ✅ Manejo robusto de errores
- ✅ Logging detallado para debugging

### Límites y Restricciones
- **Tamaño máximo:** 500MB por archivo
- **Formato:** Solo archivos `.backup`
- **Permisos:** Solo usuarios ADMIN
- **Retención:** 30 días por defecto

## 📊 Interfaz de Usuario

### Componentes Visuales

#### 1. **Sección de Subida**
- Título: "📤 Subir Backup Existente"
- Input de archivo con validación
- Información del archivo seleccionado
- Botón de subida con estado de carga

#### 2. **Lista de Backups**
- Nueva columna "Tipo" con etiquetas de color
- Indicador visual para backups subidos (📤)
- Nombre original del archivo entre paréntesis
- Acciones disponibles: Descargar, Restaurar, Eliminar

### Estados de la Interfaz

#### 1. **Sin archivo seleccionado**
- Botón "Subir Backup" deshabilitado
- Mensaje de ayuda visible

#### 2. **Archivo seleccionado**
- Información del archivo mostrada
- Botón "Subir Backup" habilitado
- Opción para cambiar archivo

#### 3. **Subiendo archivo**
- Botón con texto "Subiendo Backup..."
- Barra de progreso (preparada para implementación futura)
- Botón deshabilitado durante la subida

#### 4. **Subida completada**
- Alerta de éxito
- Archivo aparece en lista de backups
- Formulario se limpia automáticamente

## 🔄 Integración con Funcionalidades Existentes

### Backups Creados vs Subidos

| Característica | Creados | Subidos |
|----------------|---------|---------|
| Descargar | ✅ | ✅ |
| Restaurar | ✅ | ✅ |
| Eliminar | ✅ | ✅ |
| Encriptación | Configurable | Detectada |
| Compresión | Configurable | Detectada |
| Tipo | Completo/Parcial | Subido |
| Metadatos | Generados | Generados |
| Nombre | Personalizado | Único con timestamp |

### Flujo de Trabajo Completo

```
[Crear Backup] ←→ [Subir Backup]
       ↓                    ↓
[Lista de Backups] ←→ [Lista de Backups]
       ↓                    ↓
[Descargar] ←→ [Descargar]
       ↓                    ↓
[Restaurar] ←→ [Restaurar]
       ↓                    ↓
[Eliminar] ←→ [Eliminar]
```

## 🧪 Pruebas y Validación

### Casos de Prueba

#### 1. **Validación de Archivo**
- ✅ Archivo `.backup` válido
- ❌ Archivo con extensión incorrecta
- ❌ Archivo demasiado grande
- ❌ Archivo corrupto

#### 2. **Validación de Permisos**
- ✅ Usuario ADMIN puede subir
- ❌ Usuario sin autenticación
- ❌ Usuario sin permisos ADMIN

#### 3. **Integración con Sistema**
- ✅ Backup aparece en lista
- ✅ Se puede descargar
- ✅ Se puede restaurar
- ✅ Se puede eliminar

## 📝 Registro de Cambios

### Versión 1.0 (16 de Diciembre, 2025)
- ✅ Agregado API endpoint `/api/backup/upload`
- ✅ Agregado UI de subida en `/backup`
- ✅ Implementadas validaciones de seguridad
- ✅ Integración con sistema de backups existente
- ✅ Documentación completa

## 🎯 Próximas Mejoras

### Versión 1.1 (Planificada)
- [ ] Barra de progreso real con porcentaje
- [ ] Subida múltiple de archivos
- [ ] Validación de checksum
- [ ] Compresión durante subida
- [ ] Notificaciones push

### Versión 1.2 (Futuro)
- [ ] Subida desde URL remota
- [ ] Validación incremental
- [ ] Compresión inteligente
- [ ] Backup automático de subida

## 📞 Soporte

### Resolución de Problemas

#### Error: "Unauthorized"
- **Causa:** Usuario no autenticado o sin permisos
- **Solución:** Iniciar sesión como usuario ADMIN

#### Error: "Invalid file type"
- **Causa:** Archivo no tiene extensión `.backup`
- **Solución:** Seleccionar archivo con extensión correcta

#### Error: "File too large"
- **Causa:** Archivo mayor a 500MB
- **Solución:** Comprimir backup o dividir en partes

#### Error: "Invalid backup file"
- **Causa:** Archivo corrupto o formato incorrecto
- **Solución:** Verificar integridad del archivo de backup

### Contacto
- **Documentación:** Ver archivos en `/docs/`
- **Logs:** Revisar consola del navegador y servidor
- **Testing:** Usar archivos de backup válidos conocidos

---

**Fecha de implementación:** 16 de Diciembre, 2025  
**Desarrollado por:** Sistema POS Development Team  
**Estado:** ✅ Completado y Funcional
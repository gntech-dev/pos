# 🔧 Solución de Problemas: Backup Upload

## ❌ Error Encontrado

```
❌ Error de conexión al subir backup. Verifica que estés conectado.
SyntaxError: Unexpected token '<', "<html>
<h"... is not valid JSON
```

## 🔍 Diagnóstico

Este error indica que:
1. **El servidor no está corriendo** en el puerto 3000
2. **La API no es accesible** desde tu navegador
3. **El endpoint `/api/backup/upload` no existe** o no está funcionando

## ✅ Soluciones Paso a Paso

### Paso 1: Verificar que el Servidor esté Corriendo

```bash
# En la terminal, navega al directorio del proyecto
cd pos-system

# Inicia el servidor de desarrollo
npm run dev
```

**Resultado esperado:**
```
Local:    http://localhost:3000/
Network:  http://192.168.x.x:3000/
```

### Paso 2: Verificar el Puerto

Si estás usando un proxy o tunneling, asegúrate de que:
- El puerto 3000 esté correctamente configurado
- El proxy esté enrutando las requests a `/api/backup/upload`

### Paso 3: Verificar la API Directly

Prueba acceder directamente a:
```
http://localhost:3000/api/backup/upload
```

**Deberías ver:**
```json
{
  "message": "Use POST to upload a backup file",
  "requirements": {
    "fileType": ".backup",
    "maxSize": "500MB",
    "authentication": "Required",
    "permissions": "ADMIN role required"
  }
}
```

### Paso 4: Verificar Autenticación

Asegúrate de que:
1. **Estás logueado** como usuario `admin`
2. **Tienes rol ADMIN** (necesario para upload)
3. **La sesión está activa**

### Paso 5: Verificar Logs del Servidor

Revisa los logs en la terminal donde ejecutaste `npm run dev`:
- ¿Hay errores de compilación?
- ¿El servidor inicia correctamente?
- ¿Hay errores 404 para `/api/backup/upload`?

## 🛠️ Soluciones Específicas por Problema

### Problema: "Cannot GET /api/backup/upload"
**Causa:** El servidor no está corriendo o el endpoint no se compiló
**Solución:**
```bash
# Reinicia el servidor
npm run dev
```

### Problema: "Unauthorized"
**Causa:** No estás autenticado o no tienes permisos
**Solución:**
1. Ve a `/login`
2. Ingresa: `admin` / `admin123`
3. Confirma que estás en el dashboard
4. Intenta subir el backup nuevamente

### Problema: "Network Error" o "Failed to fetch"
**Causa:** Problemas de CORS o proxy
**Solución:**
1. Verifica que el servidor esté en `localhost:3000`
2. Si usas un proxy, asegúrate de que las APIs no estén siendo bloqueadas
3. Intenta acceder directamente sin proxy

### Problema: "Port 3000 is already in use"
**Causa:** Otro proceso está usando el puerto
**Solución:**
```bash
# Encuentra el proceso que usa el puerto 3000
lsof -ti:3000

# Mata el proceso
kill -9 $(lsof -ti:3000)

# O usa un puerto diferente
npm run dev -- --port 3001
```

## 🔧 Debugging Avanzado

### 1. Verificar que el Endpoint Existe

Crea un archivo `test-api.js`:
```javascript
fetch('http://localhost:3000/api/backup/upload')
  .then(response => response.json())
  .then(data => console.log('API funciona:', data))
  .catch(error => console.error('API no funciona:', error));
```

### 2. Verificar Headers de la Request

En el navegador (F12 → Console):
```javascript
fetch('/api/backup/upload', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => console.log('Status:', response.status))
.catch(error => console.error('Error:', error));
```

### 3. Verificar Network Tab

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Intenta subir el backup
4. Busca la request a `/api/backup/upload`
5. ¿Qué status code obtienes?
6. ¿Qué response obtienes?

## 📋 Checklist de Verificación

- [ ] Servidor corriendo en `npm run dev`
- [ ] Puerto 3000 disponible
- [ ] Usuario logueado como `admin`
- [ ] API accesible en `/api/backup/upload`
- [ ] No hay errores en la consola del servidor
- [ ] No hay errores 404 en Network tab
- [ ] Headers correctos en la request

## 🚨 Comandos de Emergencia

Si nada funciona, prueba:

```bash
# 1. Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# 2. Limpiar cache de Next.js
rm -rf .next
npm run dev

# 3. Verificar que el archivo existe
ls -la app/api/backup/upload/
```

## 📞 Si el Problema Persiste

### Verificar Estructura de Archivos
```bash
# Debe existir:
pos-system/app/api/backup/upload/route.ts
pos-system/app/backup/page.tsx
```

### Verificar Logs Detallados
```bash
# Ejecutar con logs detallados
DEBUG=* npm run dev
```

### Test Manual de la API
```bash
# Usar curl para probar
curl -X GET http://localhost:3000/api/backup/upload
```

## ✅ Confirmación de Funcionamiento

Una vez solucionado, deberías ver:

1. **Servidor corriendo** sin errores
2. **API respondiendo** con JSON válido
3. **Upload funcionando** con mensaje de éxito
4. **Backup apareciendo** en la lista con tipo "Subido"

---

**Última actualización:** 16 de Diciembre, 2025  
**Estado:** Guía de troubleshooting lista para usar
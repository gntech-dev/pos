# Sistema de Monitoreo de Expiración NCF

## Descripción General

Este sistema implementa un monitoreo completo y automático del estado de las secuencias de Números de Comprobantes Fiscales (NCF) para cumplir con los requisitos de la DGII en República Dominicana.

## Características Implementadas

### 🔍 Monitoreo en Tiempo Real
- **API de Monitoreo**: `/api/ncf/monitor` - Estado completo de todas las secuencias NCF
- **API de Alertas**: `/api/ncf/alerts` - Alertas automáticas por problemas críticos
- **Verificación Manual**: Capacidad de ejecutar verificaciones manuales
- **Dashboard Integrado**: Widget de alertas en el panel principal

### 🚨 Sistema de Alertas
- **Niveles de Severidad**:
  - 🔴 **DANGER**: Secuencias expiradas o agotadas (crítico)
  - 🟠 **CRITICAL**: Expira en 7 días o menos (urgente)
  - 🟡 **WARNING**: Expira en 30 días o stock bajo (precaución)
  - 🟢 **NONE**: Estado normal

### 📊 Estados de Secuencia NCF
- **EXPIRED**: Secuencia ha expirado
- **EXHAUSTED**: Secuencia agotada (sin números disponibles)
- **EXPIRING_SOON**: Próxima a expirar
- **LOW_STOCK**: Pocos números disponibles
- **NORMAL**: Funcionamiento normal

## Arquitectura del Sistema

### Base de Datos
El sistema utiliza la tabla `NCFSequence` existente con los campos:
- `expiryDate`: Fecha de expiración de la secuencia
- `currentNumber`: Último número utilizado
- `endNumber`: Último número de la secuencia
- `isActive`: Estado de activación

### APIs Implementadas

#### 1. Monitor de Estado (`/api/ncf/monitor`)
```typescript
GET /api/ncf/monitor
// Respuesta: Estado completo de todas las secuencias

POST /api/ncf/monitor/check  
// Ejecuta verificación manual y genera alertas
```

#### 2. Sistema de Alertas (`/api/ncf/alerts`)
```typescript
GET /api/ncf/alerts
// Respuesta: Lista de alertas activas

POST /api/ncf/alerts/check
// Simula cron job para verificación automática
```

### Interfaz de Usuario

#### Página de Monitor (`/ncf-monitor`)
- **Vista Tabular**: Estado detallado de todas las secuencias
- **Indicadores Visuales**: Códigos de color por severidad
- **Barras de Progreso**: Porcentaje de uso de cada secuencia
- **Acciones Rápidas**: Verificación manual y configuración
- **Sección de Alertas**: Problemas que requieren atención inmediata

#### Dashboard Integrado
- **Widget de Estado**: Resumen rápido del estado NCF
- **Alertas Críticas**: Muestra las 3 alertas más importantes
- **Acceso Directo**: Link rápido al monitor completo

## Tipos de NCF Soportados

| Tipo | Descripción | Uso |
|------|-------------|-----|
| **B01** | Crédito Fiscal | Empresas con RNC |
| **B02** | Consumidor Final | Ventas a consumidores |
| **B14** | Régimen Especial | Operaciones especiales |
| **B15** | Gubernamental | Entidades gubernamentales |
| **B16** | Exportación | Exportaciones |

## Lógica de Alertas

### Por Expiración
- **30+ días**: Sin alerta
- **8-30 días**: WARNING (precaución)
- **1-7 días**: CRITICAL (urgente)
- **Expirado**: DANGER (crítico)

### Por Stock
- **100+ números**: Sin alerta
- **21-99 números**: WARNING (stock bajo)
- **1-20 números**: CRITICAL (stock muy bajo)
- **0 números**: DANGER (agotado)

## Funcionalidades Avanzadas

### 1. Verificación Automática
- Sistema preparado para cron jobs
- Logs de auditoría para cada verificación
- Alertas automáticas configurables

### 2. Integración con Auditoría
- Cada verificación se registra en `AuditLog`
- Tracking de usuario y timestamp
- Historial de acciones

### 3. Validación en Tiempo Real
- Verificación durante generación de NCF
- Bloqueo automático de secuencias expiradas
- Manejo de errores detallado

## Configuración

### Permisos de Acceso
- **Administradores y Gerentes**: Acceso completo al monitor y alertas
- **Cajeros**: Solo visualización de estado básico (en dashboard)

### Configuración de Alertas
Las alertas se pueden personalizar modificando los umbrales en:
- `/api/ncf/monitor/route.ts` (líneas 60-85)
- `/api/ncf/alerts/route.ts` (líneas 45-95)

## Uso del Sistema

### Para Administradores
1. **Acceder al Monitor**: Menu lateral → "Monitor NCF"
2. **Verificar Estado**: Botón "Verificar Ahora"
3. **Revisar Alertas**: Sección de alertas críticas
4. **Configurar Secuencias**: Link a configuración NCF

### Para Gerentes
1. **Dashboard**: Revisar widget de estado NCF
2. **Alertas**: Ver sección de alertas críticas
3. **Acciones**: Acceder al monitor para detalles

## API de Integración

### Ejemplo de Respuesta del Monitor
```json
{
  "data": [
    {
      "type": "B01",
      "prefix": "B01",
      "currentNumber": 150,
      "endNumber": 1000,
      "expiryDate": "2025-12-31T23:59:59.999Z",
      "isActive": true,
      "daysLeft": 16,
      "status": "EXPIRING_SOON",
      "remaining": 850,
      "percentageUsed": 15.0,
      "alertLevel": "WARNING"
    }
  ],
  "summary": {
    "totalSequences": 5,
    "activeSequences": 5,
    "expiredSequences": 0,
    "expiringSequences": 1,
    "lowStockSequences": 0,
    "exhaustedSequences": 0,
    "criticalAlerts": 0,
    "warningAlerts": 1,
    "dangerAlerts": 0
  }
}
```

### Ejemplo de Alertas
```json
{
  "data": [
    {
      "type": "EXPIRING_SOON",
      "message": "La secuencia NCF B01 expira en 5 días. RENOVACIÓN URGENTE REQUERIDA.",
      "severity": "CRITICAL",
      "sequenceType": "B01",
      "daysLeft": 5,
      "remaining": 850,
      "actionRequired": true,
      "autoGenerated": true
    }
  ],
  "summary": {
    "total": 1,
    "danger": 0,
    "critical": 1,
    "warning": 0,
    "info": 0
  }
}
```

## Beneficios del Sistema

### ✅ Cumplimiento DGII
- Prevención automática de uso de NCF expirados
- Monitoreo proactivo de fechas de vencimiento
- Alertas tempranas para renovación

### ✅ Continuidad Operativa
- Evita interrupciones en la generación de facturas
- Planificación anticipada de renovaciones
- Reducción de riesgos operacionales

### ✅ Gestión Administrativa
- Visibilidad completa del estado NCF
- Reportes detallados para toma de decisiones
- Historial de auditoría completo

## Próximas Mejoras

1. **Notificaciones por Email**: Integración con sistema de email
2. **Notificaciones SMS**: Alertas críticas por mensaje
3. **Dashboard Avanzado**: Gráficos de tendencias y predicciones
4. **API Pública**: Integración con sistemas externos
5. **Backup Automático**: Respaldo de configuraciones NCF

---

**Fecha de Implementación**: Diciembre 2025
**Versión**: 1.0
**Estado**: ✅ Completamente Implementado
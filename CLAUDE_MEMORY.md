# Memoria de desarrollo - Fluxon Logistics

Este documento sirve como registro histórico del desarrollo de la aplicación Fluxon Logistics, para facilitar la continuidad entre sesiones con Claude.

## Estado actual del proyecto

**Fecha última actualización: 08/04/2025**

### Resumen del proyecto
Fluxon Logistics es una aplicación de gestión logística para seguimiento de pedidos, desde su creación hasta su entrega. Inicialmente desarrollada como una aplicación web local que utilizaba localStorage para demostración, ahora está siendo conectada a Supabase como backend. La aplicación ya ha sido desplegada en Vercel y está disponible online.

### Progreso completado

1. **Desarrollo inicial de la aplicación**
   - Interfaz de usuario responsiva para dispositivos móviles y web
   - Sistema de autenticación con roles específicos (Maestro, Vendedor, Bodega, Conductor, Tesorería)
   - Gestión de pedidos, productos, usuarios y notificaciones
   - Funcionalidades PWA (Progressive Web App)

2. **Despliegue en Vercel**
   - La aplicación está desplegada y funcionando en Vercel
   - Accesible desde cualquier dispositivo

3. **Integración con Supabase**
   - Configuración de la conexión a Supabase (`supabase-config.js`)
   - Creación de tablas en PostgreSQL (`create_tables.sql`)
   - Implementación de Row Level Security (RLS) (`enable_rls.sql`)
   - Configuración del sistema de autenticación (`create_auth_users.sql`)

### Pendientes y próximos pasos

1. **Testing de integración con Supabase**
   - Probar inicio de sesión con usuarios de Supabase
   - Verificar CRUD en todas las tablas
   - Comprobar que las políticas RLS funcionan correctamente

2. **Actualización del despliegue**
   - Actualizar la versión desplegada en Vercel para usar Supabase
   - Configurar variables de entorno en Vercel si es necesario

3. **Migración de datos**
   - Implementar funcionalidad para cargar datos desde Supabase en lugar de localStorage
   - Asegurar sincronización entre cliente y servidor

4. **Mejoras de UX/UI**
   - Indicadores de estado de conexión
   - Manejo de errores de red
   - Implementación de caché para funcionamiento offline

## Roles de usuario y funcionalidades

Consultar el [README.md](./README.md) para información detallada sobre:

### Roles de usuario
- **Usuario Maestro**: Administración completa del sistema (admin/admin123)
- **Usuario Vendedor**: Creación y seguimiento de pedidos (vendedor/vendedor123)
- **Usuario Bodega**: Asignación de conductores a pedidos (bodega/bodega123)
- **Usuario Conductor**: Gestión y actualización de entregas (conductor/conductor123)
- **Usuario Tesorería**: Gestión de pagos de pedidos (tesoreria/tesoreria123)

### Flujo de trabajo principal
1. El vendedor crea un pedido con estado "Buscando Conductor"
2. El usuario de bodega asigna un conductor
3. El conductor confirma la recepción y cambia el estado a "En Proceso de Entrega"
4. Al entregar, el conductor actualiza el estado según el tipo de pago
5. Si es contraentrega, el usuario de tesorería confirma el pago para finalizar el pedido

## Sesiones de trabajo anteriores

### Sesión 1-3: Desarrollo inicial de la aplicación
- Creación de la estructura básica de la aplicación
- Implementación de la UI/UX según los requisitos del cliente
- Desarrollo del sistema de gestión de pedidos, productos y usuarios
- Implementación de la autenticación local con localStorage
- Despliegue de la aplicación en Vercel

### Sesión 4: Integración con Supabase (07/04/2025)
- Configuración de la conexión a Supabase
- Creación de scripts SQL para la base de datos
- Implementación de Row Level Security (RLS)
- Configuración del sistema de autenticación
- Organización del repositorio y documentación
- Pendiente: Prueba de la integración completa y actualización del despliegue

### Sesión 5: Mejora de notificaciones e integración con Supabase (08/04/2025)
- Mejora del widget de solicitud de permisos de notificaciones (responsive y centrado)
- Integración completa de notificaciones con Supabase
- Creación de la tabla preferencias_usuario para almacenar configuraciones
- Implementación de persistencia de preferencias de notificaciones
- Modificación de la lógica para guardar y leer notificaciones desde Supabase
- Mejora de UX en la interfaz de notificaciones

## Notas técnicas importantes

### Arquitectura de la aplicación
- Frontend: HTML5, CSS3, JavaScript vanilla
- Backend: Supabase (PostgreSQL, Auth)
- Hosting: Vercel
- Almacenamiento: Supabase para producción, localStorage como fallback

### Sistema de autenticación
- Formato de email en Supabase: `username@app.com`
- Roles de usuario: maestro, vendedor, bodega, conductor, tesorería
- Método principal: Supabase Auth
- Método de respaldo: Autenticación directa contra tabla usuarios

### Estructura de la base de datos
- `usuarios`: Almacena información de los usuarios
- `productos`: Catálogo de productos
- `pedidos`: Información principal de pedidos
- `detalles_pedido`: Productos en cada pedido
- `historial_pedidos`: Registro de cambios de estado
- `notificaciones`: Sistema de notificaciones a usuarios
- `preferencias_usuario`: Almacena configuraciones específicas de cada usuario (tema, preferencias de notificaciones, etc.)

### Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado
- Políticas básicas para:
  - SELECT: Permitir lectura a usuarios autenticados
  - INSERT: Controlar quién puede crear registros
  - UPDATE: Controlar quién puede modificar registros

## Credenciales de prueba
- **Usuario Maestro**: admin / admin123
- **Usuario Vendedor**: vendedor / vendedor123
- **Usuario Bodega**: bodega / bodega123
- **Usuario Conductor**: conductor / conductor123
- **Usuario Tesorería**: tesoreria / tesoreria123

## Recursos y documentación
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de configuración Supabase](./SUPABASE_SETUP.md)
- [Documentación de Vercel](https://vercel.com/docs)
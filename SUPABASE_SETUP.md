# Configuración de Supabase para Fluxon Logistics

Este documento te guiará paso a paso para configurar Supabase con la aplicación Fluxon Logistics.

## Pasos para la configuración

### 1. Crear un proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.io/)
2. Haz clic en "New Project"
3. Completa los detalles del proyecto:
   - Nombre: Fluxon Logistics
   - Base de datos: Crea una contraseña segura
   - Región: Selecciona la más cercana a tus usuarios
4. Haz clic en "Create New Project"

### 2. Configurar la estructura de la base de datos

1. Una vez que el proyecto se haya creado, ve a la sección "SQL Editor"
2. Crea un nuevo query
3. Copia el contenido del archivo `sql/create_tables.sql`
4. Ejecuta el query para crear todas las tablas necesarias

### 3. Habilitar Row Level Security (RLS) y crear políticas

1. En el SQL Editor, crea otro nuevo query
2. Copia el contenido del archivo `sql/enable_rls.sql`
3. Ejecuta el query para habilitar RLS y configurar las políticas de seguridad

### 4. Crear usuarios en el sistema de autenticación

1. En el SQL Editor, crea otro nuevo query
2. Copia el contenido del archivo `sql/create_auth_users.sql`
3. Ejecuta el query para crear los usuarios en el sistema de autenticación de Supabase

### 5. Configurar la aplicación

1. Ve a la sección "Settings" → "API" en el dashboard de Supabase
2. Verifica que `supabase-config.js` contenga los valores correctos:
   - URL del proyecto: El valor de `URL` en la página de API
   - Clave anon/public: El valor de `anon` `public` que aparece en la página de API
3. La clave del service_role NO debe incluirse en el código del cliente por seguridad.

## Estructura de tablas

- **usuarios**: Almacena la información de los usuarios del sistema
- **productos**: Catálogo de productos disponibles
- **pedidos**: Información principal de los pedidos
- **detalles_pedido**: Productos incluidos en cada pedido
- **historial_pedidos**: Registro de cambios de estado de los pedidos
- **comentarios_pedido**: Comentarios realizados en cada pedido
- **notificaciones**: Notificaciones para los usuarios

## Credenciales de prueba

Usuarios creados automáticamente:

- **Usuario Maestro**: admin / admin123
- **Usuario Vendedor**: vendedor / vendedor123
- **Usuario Bodega**: bodega / bodega123
- **Usuario Conductor**: conductor / conductor123
- **Usuario Tesorería**: tesoreria / tesoreria123

## Row Level Security (RLS)

Se han configurado políticas para:

1. Proteger los datos garantizando que solo usuarios autenticados pueden acceder
2. Usuarios solo pueden ver sus propias notificaciones
3. Solo usuarios con rol adecuado pueden modificar datos
4. El historial de pedidos no puede ser modificado una vez creado

## Solución de problemas

Si encuentras errores durante la configuración:

1. **Error de tipo de datos**: Asegúrate de que los IDs en las tablas coincidan con los esperados en las políticas
2. **Error al crear usuarios**: Verifica que tienes permisos suficientes (service_role)
3. **Problemas de conexión**: Confirma que la URL y clave API son correctas
4. **Errores de RLS**: Si no puedes acceder a los datos, puede que necesites ajustar las políticas

Para soporte adicional, puedes revisar la [documentación de Supabase](https://supabase.com/docs).
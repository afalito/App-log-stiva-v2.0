-- Script para eliminar todas las tablas existentes
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística
-- Usar este script con PRECAUCIÓN ya que ELIMINARÁ TODOS LOS DATOS

-- Primero desactivar RLS para permitir la eliminación
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historial_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS detalles_pedido DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios_pedido DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas de RLS existentes
-- (Esto es importante para evitar conflictos al recrear las tablas)
DROP POLICY IF EXISTS "Los usuarios autenticados pueden ver todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden modificar su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios maestros pueden crear usuarios" ON usuarios;
DROP POLICY IF EXISTS "Todos los usuarios pueden ver los productos" ON productos;
DROP POLICY IF EXISTS "Los usuarios maestros pueden modificar productos" ON productos;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden crear notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Todos los usuarios pueden ver los pedidos" ON pedidos;
DROP POLICY IF EXISTS "Los vendedores pueden crear pedidos" ON pedidos;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar pedidos según su rol" ON pedidos;
DROP POLICY IF EXISTS "Todos los usuarios pueden ver historial de pedidos" ON historial_pedidos;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden agregar al historial" ON historial_pedidos;
DROP POLICY IF EXISTS "Nadie puede modificar el historial" ON historial_pedidos;

-- Eliminar las tablas en orden para evitar errores de dependencia
-- (Las tablas con claves foráneas deben eliminarse primero)
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS comentarios_pedido CASCADE;
DROP TABLE IF EXISTS historial_pedidos CASCADE;
DROP TABLE IF EXISTS detalles_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Para verificar que todas las tablas se han eliminado correctamente, puedes ejecutar:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
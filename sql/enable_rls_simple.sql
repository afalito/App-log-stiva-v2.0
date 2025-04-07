-- Script para habilitar Row Level Security (RLS) en Supabase (VERSIÓN SIMPLIFICADA)
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística
-- Esta versión solo configura las tablas principales

-- Habilitar RLS en las tablas principales
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla USUARIOS - SELECT
CREATE POLICY "Los usuarios autenticados pueden ver todos los usuarios" 
ON usuarios FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para la tabla USUARIOS - INSERT
CREATE POLICY "Los usuarios autenticados pueden insertar usuarios"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para la tabla USUARIOS - UPDATE
CREATE POLICY "Los usuarios autenticados pueden actualizar usuarios"
ON usuarios FOR UPDATE
TO authenticated
USING (true);

-- Políticas para la tabla PRODUCTOS - SELECT
CREATE POLICY "Todos los usuarios pueden ver los productos" 
ON productos FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para la tabla PRODUCTOS - INSERT
CREATE POLICY "Los usuarios autenticados pueden insertar productos"
ON productos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para la tabla PRODUCTOS - UPDATE
CREATE POLICY "Los usuarios autenticados pueden actualizar productos"
ON productos FOR UPDATE
TO authenticated
USING (true);

-- Políticas para la tabla NOTIFICACIONES - SELECT
CREATE POLICY "Todos los usuarios pueden ver notificaciones" 
ON notificaciones FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para la tabla NOTIFICACIONES - INSERT
CREATE POLICY "Los usuarios autenticados pueden crear notificaciones" 
ON notificaciones FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para la tabla NOTIFICACIONES - UPDATE
CREATE POLICY "Los usuarios autenticados pueden actualizar notificaciones" 
ON notificaciones FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas para la tabla PEDIDOS - SELECT
CREATE POLICY "Todos los usuarios pueden ver los pedidos" 
ON pedidos FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para la tabla PEDIDOS - INSERT
CREATE POLICY "Los usuarios autenticados pueden crear pedidos" 
ON pedidos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para la tabla PEDIDOS - UPDATE
CREATE POLICY "Los usuarios pueden actualizar pedidos" 
ON pedidos FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas para la tabla HISTORIAL_PEDIDOS - SELECT
CREATE POLICY "Todos los usuarios pueden ver historial de pedidos" 
ON historial_pedidos FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para la tabla HISTORIAL_PEDIDOS - INSERT
CREATE POLICY "Los usuarios autenticados pueden agregar al historial" 
ON historial_pedidos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para la tabla HISTORIAL_PEDIDOS - UPDATE
CREATE POLICY "Los usuarios autenticados pueden actualizar historial"
ON historial_pedidos FOR UPDATE
TO authenticated
USING (true);
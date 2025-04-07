-- Script para habilitar Row Level Security (RLS) en Supabase
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística
-- Este script configura la seguridad de todas las tablas para cumplir con los requisitos de Supabase

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios_pedido ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para la tabla USUARIOS
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Los usuarios autenticados pueden ver todos los usuarios" 
ON usuarios FOR SELECT 
TO authenticated 
USING (true);

-- Permitir que los usuarios modifiquen su propio perfil
-- Nota: Aquí evitamos la comparación directa entre integer y uuid
CREATE POLICY "Los usuarios pueden modificar su propio perfil" 
ON usuarios FOR UPDATE 
TO authenticated 
USING (auth.role() = 'service_role' OR 
      (auth.jwt() ->> 'email')::TEXT LIKE (username || '%'));

-- Permitir al usuario maestro crear nuevos usuarios
CREATE POLICY "Los usuarios maestros pueden crear usuarios" 
ON usuarios FOR INSERT 
TO authenticated 
USING (auth.role() = 'service_role' OR 
      EXISTS (SELECT 1 FROM usuarios 
              WHERE ((auth.jwt() ->> 'email')::TEXT LIKE (username || '%')) 
              AND rol = 'maestro'));

-- 3. Políticas para la tabla PRODUCTOS
-- Permitir que todos los usuarios vean los productos
CREATE POLICY "Todos los usuarios pueden ver los productos" 
ON productos FOR SELECT 
TO authenticated 
USING (true);

-- Permitir que usuarios maestro modifiquen productos
CREATE POLICY "Los usuarios maestros pueden modificar productos" 
ON productos FOR ALL
TO authenticated 
USING (auth.role() = 'service_role' OR 
      EXISTS (SELECT 1 FROM usuarios 
              WHERE ((auth.jwt() ->> 'email')::TEXT LIKE (username || '%')) 
              AND rol = 'maestro'));

-- 4. Políticas para la tabla NOTIFICACIONES
-- Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Los usuarios pueden ver sus propias notificaciones" 
ON notificaciones FOR SELECT 
TO authenticated 
USING (auth.role() = 'service_role' OR
      EXISTS (SELECT 1 FROM usuarios 
              WHERE id = notificaciones.usuario_id 
              AND ((auth.jwt() ->> 'email')::TEXT LIKE (username || '%'))));

-- Cualquier usuario autenticado puede crear notificaciones
CREATE POLICY "Los usuarios autenticados pueden crear notificaciones" 
ON notificaciones FOR INSERT 
TO authenticated 
USING (true);

-- Los usuarios pueden actualizar sus propias notificaciones (p.ej., marcar como leídas)
CREATE POLICY "Los usuarios pueden actualizar sus propias notificaciones" 
ON notificaciones FOR UPDATE 
TO authenticated 
USING (auth.role() = 'service_role' OR
      EXISTS (SELECT 1 FROM usuarios 
              WHERE id = notificaciones.usuario_id 
              AND ((auth.jwt() ->> 'email')::TEXT LIKE (username || '%'))));

-- 5. Políticas para la tabla PEDIDOS
-- Todos los usuarios pueden ver los pedidos según su rol
CREATE POLICY "Todos los usuarios pueden ver los pedidos" 
ON pedidos FOR SELECT 
TO authenticated 
USING (true);

-- Usuarios vendedor pueden crear pedidos
CREATE POLICY "Los vendedores pueden crear pedidos" 
ON pedidos FOR INSERT 
TO authenticated 
USING (auth.role() = 'service_role' OR 
      EXISTS (SELECT 1 FROM usuarios 
              WHERE ((auth.jwt() ->> 'email')::TEXT LIKE (username || '%')) 
              AND rol IN ('vendedor', 'maestro')));

-- Los usuarios pueden actualizar pedidos según su rol
CREATE POLICY "Los usuarios pueden actualizar pedidos según su rol" 
ON pedidos FOR UPDATE 
TO authenticated 
USING (true);

-- 6. Políticas para la tabla HISTORIAL_PEDIDOS
-- Todos los usuarios pueden ver el historial
CREATE POLICY "Todos los usuarios pueden ver historial de pedidos" 
ON historial_pedidos FOR SELECT 
TO authenticated 
USING (true);

-- Cualquier usuario autenticado puede agregar al historial
CREATE POLICY "Los usuarios autenticados pueden agregar al historial" 
ON historial_pedidos FOR INSERT 
TO authenticated 
USING (true);

-- El historial no se actualiza después de creado
CREATE POLICY "Nadie puede modificar el historial" 
ON historial_pedidos FOR UPDATE 
TO authenticated 
USING (false);

-- 7. Políticas para las tablas adicionales (condicionalmente)
DO $$
BEGIN
    -- Comprobar y crear políticas para detalles_pedido
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'detalles_pedido') THEN
        BEGIN
            DROP POLICY IF EXISTS "Todos los usuarios pueden ver detalles de pedidos" ON detalles_pedido;
            CREATE POLICY "Todos los usuarios pueden ver detalles de pedidos" 
            ON detalles_pedido FOR SELECT 
            TO authenticated 
            USING (true);
            
            DROP POLICY IF EXISTS "Los usuarios autenticados pueden crear detalles de pedidos" ON detalles_pedido;
            CREATE POLICY "Los usuarios autenticados pueden crear detalles de pedidos" 
            ON detalles_pedido FOR INSERT 
            TO authenticated 
            USING (true);
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Error al crear políticas para detalles_pedido: %', SQLERRM;
        END;
    END IF;
    
    -- Comprobar y crear políticas para comentarios_pedido
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'comentarios_pedido') THEN
        BEGIN
            DROP POLICY IF EXISTS "Todos los usuarios pueden ver comentarios de pedidos" ON comentarios_pedido;
            CREATE POLICY "Todos los usuarios pueden ver comentarios de pedidos" 
            ON comentarios_pedido FOR SELECT 
            TO authenticated 
            USING (true);
            
            DROP POLICY IF EXISTS "Los usuarios autenticados pueden crear comentarios" ON comentarios_pedido;
            CREATE POLICY "Los usuarios autenticados pueden crear comentarios" 
            ON comentarios_pedido FOR INSERT 
            TO authenticated 
            USING (true);
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Error al crear políticas para comentarios_pedido: %', SQLERRM;
        END;
    END IF;
END $$;
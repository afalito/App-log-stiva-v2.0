-- Script para crear usuarios en Fluxon Logistics
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística

-- ⚠️ NOTA IMPORTANTE: Ya no usamos Supabase Auth, solo la tabla 'usuarios'
-- Este script se mantiene por documentación histórica y no debe ejecutarse

-- La siguiente función ya no se utiliza porque no usamos el sistema de autenticación de Supabase,
-- sino nuestra propia tabla usuarios. No es necesario ejecutar este script.

/*
CREATE OR REPLACE FUNCTION create_auth_users() RETURNS void AS $$
DECLARE
    user_id UUID;
    user_record RECORD;
BEGIN
    RAISE NOTICE 'Esta función ya no se utiliza porque no usamos Supabase Auth';
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- No ejecutar
-- SELECT create_auth_users();
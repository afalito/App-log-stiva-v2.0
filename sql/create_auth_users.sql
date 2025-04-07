-- Script para crear usuarios en el sistema de autenticación de Supabase
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística
-- Este script crea los usuarios de ejemplo para autenticación

-- IMPORTANTE: Ejecuta este script desde el SQLEditor de Supabase
-- usando los privilegios de "service_role"

-- La función para crear usuarios en auth.users
CREATE OR REPLACE FUNCTION create_auth_users() RETURNS void AS $$
DECLARE
    user_id UUID;
    user_record RECORD;
BEGIN
    -- Para cada usuario en la tabla 'usuarios'
    FOR user_record IN (SELECT * FROM usuarios) LOOP
        BEGIN
            -- Crear usuario en auth.users si no existe
            INSERT INTO auth.users (
                id,
                email,
                email_confirmed_at,
                encrypted_password,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role
            )
            VALUES (
                uuid_generate_v4(),                            -- id: UUID generado
                user_record.username || '@app.com',            -- email: username@app.com
                NOW(),                                         -- email_confirmed_at: confirmado automáticamente
                crypt(user_record.password, gen_salt('bf')),   -- encrypted_password: hash de la contraseña
                '{"provider":"email","providers":["email"]}',  -- raw_app_meta_data
                jsonb_build_object('nombre', user_record.nombre, 'apellido', user_record.apellido, 'rol', user_record.rol),  -- raw_user_meta_data
                NOW(),                                         -- created_at
                NOW(),                                         -- updated_at
                'authenticated'                                -- role
            )
            ON CONFLICT (email) DO UPDATE 
            SET raw_user_meta_data = jsonb_build_object('nombre', user_record.nombre, 'apellido', user_record.apellido, 'rol', user_record.rol),
                encrypted_password = crypt(user_record.password, gen_salt('bf'))
            RETURNING id INTO user_id;
            
            -- Actualizar el auth.identities para este usuario
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            )
            VALUES (
                uuid_generate_v4(),                            -- id: UUID generado
                user_id,                                       -- user_id: el ID retornado del insert anterior
                jsonb_build_object('sub', user_id, 'email', user_record.username || '@app.com'),  -- identity_data
                'email',                                       -- provider
                user_record.username || '@app.com',            -- provider_id: el correo electrónico
                NOW(),                                         -- last_sign_in_at
                NOW(),                                         -- created_at
                NOW()                                          -- updated_at
            )
            ON CONFLICT (provider, provider_id) DO NOTHING;
            
            RAISE NOTICE 'Usuario creado/actualizado en auth: %', user_record.username;
            
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Error al crear/actualizar usuario %: %', user_record.username, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Proceso de creación de usuarios completado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función
SELECT create_auth_users();
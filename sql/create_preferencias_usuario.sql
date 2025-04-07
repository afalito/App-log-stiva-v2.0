-- Tabla para almacenar preferencias de usuario
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notificaciones_habilitadas BOOLEAN DEFAULT false,
    no_mostrar_notificacion_widget BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Establecer políticas RLS
ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para preferencias_usuario
-- Política para lectura: un usuario solo puede ver sus propias preferencias
CREATE POLICY preferencias_usuario_select_policy
    ON preferencias_usuario
    FOR SELECT
    USING (auth.uid() = usuario_id OR auth.uid() IS NULL);

-- Política para inserción: un usuario solo puede crear sus propias preferencias
CREATE POLICY preferencias_usuario_insert_policy
    ON preferencias_usuario
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id OR auth.uid() IS NULL);

-- Política para actualización: un usuario solo puede actualizar sus propias preferencias
CREATE POLICY preferencias_usuario_update_policy
    ON preferencias_usuario
    FOR UPDATE
    USING (auth.uid() = usuario_id OR auth.uid() IS NULL);

-- Política para eliminación: un usuario solo puede eliminar sus propias preferencias
CREATE POLICY preferencias_usuario_delete_policy
    ON preferencias_usuario
    FOR DELETE
    USING (auth.uid() = usuario_id OR auth.uid() IS NULL);

-- Crear índice para búsquedas por usuario_id
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_usuario_id ON preferencias_usuario(usuario_id);
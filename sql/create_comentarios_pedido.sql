-- Tabla para almacenar comentarios asociados a los pedidos
CREATE TABLE IF NOT EXISTS comentarios_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    texto TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Establecer políticas RLS
ALTER TABLE comentarios_pedido ENABLE ROW LEVEL SECURITY;

-- Política para lectura: cualquier usuario autenticado puede ver los comentarios de pedidos
CREATE POLICY comentarios_pedido_select_policy
    ON comentarios_pedido
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Política para inserción: cualquier usuario autenticado puede añadir comentarios
CREATE POLICY comentarios_pedido_insert_policy
    ON comentarios_pedido
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para actualización: sólo el creador del comentario puede modificarlo
CREATE POLICY comentarios_pedido_update_policy
    ON comentarios_pedido
    FOR UPDATE
    USING (auth.uid() = usuario_id);

-- Política para eliminación: sólo el creador del comentario o usuario maestro puede eliminarlo
CREATE POLICY comentarios_pedido_delete_policy
    ON comentarios_pedido
    FOR DELETE
    USING (
        auth.uid() = usuario_id OR 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.auth_id = auth.uid() AND usuarios.rol = 'maestro'
        )
    );

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_comentarios_pedido_pedido_id ON comentarios_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_pedido_usuario_id ON comentarios_pedido(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_pedido_fecha ON comentarios_pedido(fecha DESC);
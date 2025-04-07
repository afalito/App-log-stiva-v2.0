-- Script para crear las tablas en Supabase
-- Aplicación: Fluxon Logistics - Sistema de Gestión Logística
-- Este script crea todas las tablas necesarias para la aplicación

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(10) NOT NULL UNIQUE,
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100) NOT NULL,
  cliente_direccion TEXT NOT NULL,
  cliente_ciudad VARCHAR(100) NOT NULL,
  cliente_departamento VARCHAR(100) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  tipo_pago VARCHAR(20) NOT NULL, -- 'contraentrega' o 'anticipado'
  estado VARCHAR(30) NOT NULL, -- 'buscando-conductor', 'conductor-asignado', 'en-proceso', 'entregado-pendiente', 'finalizado', 'devuelto', 'anulado'
  creador_id INTEGER REFERENCES usuarios(id),
  conductor_id INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_finalizacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de pedido (productos en cada pedido)
CREATE TABLE IF NOT EXISTS detalles_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  nombre_producto VARCHAR(255) NOT NULL, -- Para mantener histórico aunque cambie el producto
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de estados de pedidos
CREATE TABLE IF NOT EXISTS historial_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  nombre_usuario VARCHAR(200), -- Para mantener histórico aunque cambie el usuario
  comentario TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comentarios en pedidos
CREATE TABLE IF NOT EXISTS comentarios_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id),
  nombre_usuario VARCHAR(200) NOT NULL, -- Nombre completo para mostrar
  texto TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  referencia VARCHAR(255), -- Descripción opcional de la referencia
  referencia_id INTEGER, -- ID de la entidad referenciada (pedido, etc.)
  tipo VARCHAR(50) NOT NULL, -- 'pedido-asignacion', 'pedido-comentario', 'pedido-estado', etc.
  leida BOOLEAN DEFAULT false,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo - Usuarios
INSERT INTO usuarios (nombre, apellido, username, password, rol, activo)
VALUES
  ('Admin', 'Sistema', 'admin', 'admin123', 'maestro', true),
  ('Juan', 'Pérez', 'vendedor', 'vendedor123', 'vendedor', true),
  ('María', 'López', 'bodega', 'bodega123', 'bodega', true),
  ('Carlos', 'Gómez', 'conductor', 'conductor123', 'conductor', true),
  ('Laura', 'Martínez', 'tesoreria', 'tesoreria123', 'tesoreria', true)
ON CONFLICT (username) DO NOTHING;

-- Insertar datos de ejemplo - Productos
INSERT INTO productos (nombre, descripcion, precio)
VALUES
  ('Laptop HP Pavilion', 'Laptop de 15" con procesador Intel i5, 8GB RAM, 512GB SSD', 2500000),
  ('Monitor Dell 24"', 'Monitor FHD de 24 pulgadas con panel IPS', 750000),
  ('Teclado Mecánico Logitech', 'Teclado mecánico RGB con switches Blue', 320000),
  ('Mouse Inalámbrico', 'Mouse ergonómico con conexión bluetooth', 85000),
  ('Auriculares Sony', 'Auriculares inalámbricos con cancelación de ruido', 650000),
  ('Tablet Samsung', 'Tablet Android de 10" con 64GB de almacenamiento', 900000)
ON CONFLICT DO NOTHING;
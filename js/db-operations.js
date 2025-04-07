// Operaciones de base de datos para Supabase
// Este archivo centraliza todas las operaciones CRUD para interactuar con Supabase

// Obtener el cliente de Supabase
function getClient() {
  return getSupabaseClient();
}

// ============ OPERACIONES DE PEDIDOS ============

// Obtener todos los pedidos con filtros opcionales
async function fetchPedidos(filters = {}) {
  try {
    const supabase = getClient();
    let query = supabase.from('pedidos').select(`
      *,
      usuarios_vendedor:usuario_vendedor_id (nombre, apellido),
      usuarios_conductor:usuario_conductor_id (nombre, apellido),
      detalles_pedido (*)
    `);
    
    // Aplicar filtros si existen
    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }
    
    if (filters.fechaDesde && filters.fechaHasta) {
      query = query.gte('fecha', filters.fechaDesde).lte('fecha', filters.fechaHasta);
    }
    
    if (filters.usuarioId) {
      query = query.eq('usuario_vendedor_id', filters.usuarioId);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('fecha', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    throw error;
  }
}

// Crear o actualizar un pedido
async function savePedido(pedido) {
  try {
    const supabase = getClient();
    
    // Si tiene ID, actualizar. Si no, crear nuevo.
    if (pedido.id) {
      // Actualizar pedido existente
      const { data, error } = await supabase
        .from('pedidos')
        .update({
          cliente_nombre: pedido.clienteNombre,
          cliente_direccion: pedido.clienteDireccion,
          cliente_telefono: pedido.clienteTelefono,
          usuario_vendedor_id: pedido.usuarioVendedorId,
          usuario_conductor_id: pedido.usuarioConductorId,
          fecha_entrega: pedido.fechaEntrega,
          tipo_pago: pedido.tipoPago,
          estado: pedido.estado,
          total: pedido.total,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedido.id);
        
      if (error) throw error;
      
      // Actualizar detalles del pedido si están incluidos
      if (pedido.productos && pedido.productos.length > 0) {
        // Primero eliminar detalles existentes
        await supabase
          .from('detalles_pedido')
          .delete()
          .eq('pedido_id', pedido.id);
          
        // Luego insertar los nuevos detalles
        const detalles = pedido.productos.map(producto => ({
          pedido_id: pedido.id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
          subtotal: producto.subtotal
        }));
        
        const { error: detallesError } = await supabase
          .from('detalles_pedido')
          .insert(detalles);
          
        if (detallesError) throw detallesError;
      }
      
      return { id: pedido.id };
      
    } else {
      // Crear nuevo pedido
      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          numero: pedido.numero,
          cliente_nombre: pedido.clienteNombre,
          cliente_direccion: pedido.clienteDireccion,
          cliente_telefono: pedido.clienteTelefono,
          usuario_vendedor_id: pedido.usuarioVendedorId,
          fecha: new Date().toISOString(),
          fecha_entrega: pedido.fechaEntrega,
          tipo_pago: pedido.tipoPago,
          estado: pedido.estado,
          total: pedido.total
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Insertar detalles del pedido
      if (pedido.productos && pedido.productos.length > 0) {
        const detalles = pedido.productos.map(producto => ({
          pedido_id: data.id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
          subtotal: producto.subtotal
        }));
        
        const { error: detallesError } = await supabase
          .from('detalles_pedido')
          .insert(detalles);
          
        if (detallesError) throw detallesError;
      }
      
      // Registrar en historial
      await registrarHistorialPedido(data.id, 'Creación', pedido.estado, app.currentUser.id);
      
      return data;
    }
  } catch (error) {
    console.error('Error al guardar pedido:', error);
    throw error;
  }
}

// Cambiar el estado de un pedido
async function cambiarEstadoPedido(pedidoId, nuevoEstado, usuarioId) {
  try {
    const supabase = getClient();
    
    // Obtener estado actual para el historial
    const { data: pedidoActual, error: errorConsulta } = await supabase
      .from('pedidos')
      .select('estado')
      .eq('id', pedidoId)
      .single();
      
    if (errorConsulta) throw errorConsulta;
    
    // Actualizar el estado
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);
      
    if (error) throw error;
    
    // Registrar en historial
    await registrarHistorialPedido(pedidoId, 'Cambio de estado', nuevoEstado, usuarioId, pedidoActual.estado);
    
    return { success: true };
  } catch (error) {
    console.error('Error al cambiar estado del pedido:', error);
    throw error;
  }
}

// Asignar un conductor a un pedido
async function asignarConductor(pedidoId, conductorId, usuarioId) {
  try {
    const supabase = getClient();
    
    const { error } = await supabase
      .from('pedidos')
      .update({
        usuario_conductor_id: conductorId,
        estado: 'Conductor Asignado',
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);
      
    if (error) throw error;
    
    // Registrar en historial
    await registrarHistorialPedido(pedidoId, 'Asignación de conductor', 'Conductor Asignado', usuarioId);
    
    return { success: true };
  } catch (error) {
    console.error('Error al asignar conductor:', error);
    throw error;
  }
}

// Registrar entrada en historial de pedidos
async function registrarHistorialPedido(pedidoId, accion, estado, usuarioId, estadoAnterior = null) {
  try {
    const supabase = getClient();
    
    const { error } = await supabase
      .from('historial_pedidos')
      .insert({
        pedido_id: pedidoId,
        usuario_id: usuarioId,
        accion: accion,
        estado: estado,
        estado_anterior: estadoAnterior,
        fecha: new Date().toISOString()
      });
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error al registrar historial de pedido:', error);
    throw error;
  }
}

// Agregar comentario a un pedido
async function addComment(pedidoId, texto, usuarioId) {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from('comentarios_pedido')
      .insert({
        pedido_id: pedidoId,
        usuario_id: usuarioId,
        texto: texto,
        fecha: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    throw error;
  }
}

// Obtener comentarios de un pedido
async function fetchComentariosPedido(pedidoId) {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from('comentarios_pedido')
      .select(`
        *,
        usuarios (nombre, apellido)
      `)
      .eq('pedido_id', pedidoId)
      .order('fecha', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener comentarios del pedido:', error);
    throw error;
  }
}

// ============ OPERACIONES DE PRODUCTOS ============

// Obtener todos los productos
async function fetchProductos() {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}

// Guardar o actualizar un producto
async function saveProducto(producto) {
  try {
    const supabase = getClient();
    
    if (producto.id) {
      // Actualizar producto existente
      const { data, error } = await supabase
        .from('productos')
        .update({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stock: producto.stock,
          categoria: producto.categoria,
          activo: producto.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', producto.id);
        
      if (error) throw error;
      
      return { id: producto.id };
    } else {
      // Crear nuevo producto
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stock: producto.stock,
          categoria: producto.categoria,
          activo: producto.activo
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      return data;
    }
  } catch (error) {
    console.error('Error al guardar producto:', error);
    throw error;
  }
}

// ============ OPERACIONES DE USUARIOS ============

// Obtener todos los usuarios
async function fetchUsuarios() {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

// Guardar o actualizar un usuario
async function saveUsuario(usuario) {
  try {
    const supabase = getClient();
    console.log('Guardando usuario en Supabase:', usuario);
    
    if (usuario.id) {
      // Preparar los datos para actualizar
      const updateData = {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        updated_at: new Date().toISOString()
      };
      
      // Solo incluir username si se proporciona
      if (usuario.username) {
        updateData.username = usuario.username;
      }
      
      // Solo incluir password si se proporciona
      if (usuario.password) {
        updateData.password = usuario.password;
      }
      
      // Solo incluir activo si se proporciona
      if (usuario.activo !== undefined) {
        updateData.activo = usuario.activo;
      }
      
      console.log('Datos de actualización:', updateData);
      
      // Actualizar usuario existente
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuario.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error de Supabase al actualizar usuario:', error);
        throw error;
      }
      
      console.log('Usuario actualizado correctamente:', data);
      return data || { id: usuario.id };
    } else {
      // Preparar datos para inserción
      const insertData = {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        username: usuario.username,
        password: usuario.password,
        rol: usuario.rol,
        activo: usuario.activo !== undefined ? usuario.activo : true
      };
      
      console.log('Datos para inserción:', insertData);
      
      // Crear nuevo usuario
      const { data, error } = await supabase
        .from('usuarios')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error de Supabase al crear usuario:', error);
        throw error;
      }
      
      console.log('Usuario creado correctamente:', data);
      return data;
    }
  } catch (error) {
    console.error('Error general al guardar usuario:', error);
    throw error;
  }
}

// Activar/desactivar usuario
async function toggleUsuarioStatus(usuarioId, nuevoEstado) {
  try {
    const supabase = getClient();
    console.log(`Cambiando estado de usuario ${usuarioId} a ${nuevoEstado ? 'activo' : 'inactivo'}`);
    
    // Asegurarnos de que el usuarioId es un número
    const id = parseInt(usuarioId);
    if (isNaN(id)) {
      throw new Error(`ID de usuario inválido: ${usuarioId}`);
    }
    
    // Verificar que el usuario existe antes de actualizar
    const { data: user, error: checkError } = await supabase
      .from('usuarios')
      .select('id, nombre, activo')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('Error al verificar usuario:', checkError);
      throw checkError;
    }
    
    if (!user) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    
    console.log(`Usuario encontrado: ${user.nombre}, estado actual: ${user.activo}`);
    
    // Actualizar el estado
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        activo: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error al actualizar estado de usuario:', error);
      throw error;
    }
    
    console.log('Estado de usuario actualizado correctamente:', data);
    
    return { 
      success: true, 
      data: data && data.length > 0 ? data[0] : null 
    };
  } catch (error) {
    console.error('Error general al cambiar estado del usuario:', error);
    throw error;
  }
}

// ============ OPERACIONES DE INFORMES ============

// Obtener datos para informes de pedidos
async function fetchDatosInformes(filtros = {}) {
  try {
    const supabase = getClient();
    
    let query = supabase.from('pedidos').select(`
      *,
      usuarios_vendedor:usuario_vendedor_id (nombre, apellido),
      usuarios_conductor:usuario_conductor_id (nombre, apellido),
      detalles_pedido (
        *,
        productos (nombre, precio)
      )
    `);
    
    // Aplicar filtros
    if (filtros.fechaDesde) {
      query = query.gte('fecha', filtros.fechaDesde);
    }
    
    if (filtros.fechaHasta) {
      query = query.lte('fecha', filtros.fechaHasta);
    }
    
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }
    
    if (filtros.vendedor) {
      query = query.eq('usuario_vendedor_id', filtros.vendedor);
    }
    
    if (filtros.conductor) {
      query = query.eq('usuario_conductor_id', filtros.conductor);
    }
    
    // Ordenar por fecha (normalmente descendente)
    query = query.order('fecha', { ascending: filtros.ordenAscendente || false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener datos para informes:', error);
    throw error;
  }
}

// ============ OPERACIONES PARA EL DASHBOARD ============

// Obtener estadísticas para el dashboard
async function fetchEstadisticasDashboard() {
  try {
    const supabase = getClient();
    
    // Obtener conteo por estado
    const { data: countByStatus, error: countError } = await supabase
      .from('pedidos')
      .select('estado, count')
      .group('estado');
      
    if (countError) throw countError;
    
    // Obtener pedidos recientes
    const { data: recentOrders, error: recentError } = await supabase
      .from('pedidos')
      .select(`
        *,
        usuarios_vendedor:usuario_vendedor_id (nombre, apellido)
      `)
      .order('fecha', { ascending: false })
      .limit(5);
      
    if (recentError) throw recentError;
    
    // Obtener ventas por día (últimos 7 días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 7);
    
    const { data: salesByDay, error: salesError } = await supabase
      .from('pedidos')
      .select('fecha, total')
      .gte('fecha', fechaInicio.toISOString())
      .filter('estado', 'not.eq', 'Anulado');
      
    if (salesError) throw salesError;
    
    return {
      countByStatus: countByStatus || [],
      recentOrders: recentOrders || [],
      salesByDay: salesByDay || []
    };
  } catch (error) {
    console.error('Error al obtener estadísticas para dashboard:', error);
    throw error;
  }
}

// ============ FUNCIÓN PARA OBTENER SIGUIENTE NÚMERO DE PEDIDO ============

async function obtenerSiguienteNumeroPedido() {
  try {
    const supabase = getClient();
    
    // Consultar el último número de pedido
    const { data, error } = await supabase
      .from('pedidos')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // No error if no records
      throw error;
    }
    
    // Si no hay pedidos, comenzar desde 1000
    if (!data) {
      return "P-1000";
    }
    
    // Extraer el número y aumentarlo
    const ultimoNumero = parseInt(data.numero.replace('P-', ''));
    const siguienteNumero = ultimoNumero + 1;
    
    return `P-${siguienteNumero}`;
  } catch (error) {
    console.error('Error al obtener siguiente número de pedido:', error);
    // En caso de error, generar un número basado en timestamp
    return `P-${Date.now().toString().substring(6)}`;
  }
}

// Hacer disponibles las funciones globalmente
window.dbOperations = {
  // Pedidos
  fetchPedidos,
  savePedido,
  cambiarEstadoPedido,
  asignarConductor,
  registrarHistorialPedido,
  addComment,
  fetchComentariosPedido,
  
  // Productos
  fetchProductos,
  saveProducto,
  
  // Usuarios
  fetchUsuarios,
  saveUsuario,
  toggleUsuarioStatus,
  
  // Informes
  fetchDatosInformes,
  
  // Dashboard
  fetchEstadisticasDashboard,
  
  // Utilidades
  obtenerSiguienteNumeroPedido
};
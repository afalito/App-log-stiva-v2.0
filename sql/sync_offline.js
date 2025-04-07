// Sistema de sincronización offline para Fluxon Logistics
// Este archivo implementa un mecanismo para permitir operaciones 
// cuando el dispositivo está offline y sincronizar cuando vuelve a conectarse

// Cola de operaciones pendientes
let pendingOperations = [];

// Estado actual de conexión
let isOnline = navigator.onLine;

// Inicializar sistema de sincronización
function initSyncSystem() {
  // Cargar operaciones pendientes del almacenamiento local
  loadPendingOperations();
  
  // Configurar listeners para detectar cambios en la conectividad
  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);
  
  // Revisar periódicamente si hay operaciones pendientes para sincronizar
  setInterval(attemptSync, 30000); // Cada 30 segundos
  
  // Intento inicial de sincronización
  if (isOnline) {
    attemptSync();
  }
  
  console.log('Sistema de sincronización offline inicializado');
}

// Manejar cambios en la conectividad
function handleConnectionChange(event) {
  isOnline = navigator.onLine;
  console.log(`Conectividad: ${isOnline ? 'En línea' : 'Fuera de línea'}`);
  
  // Actualizar indicadores UI
  updateConnectionStatusIndicator();
  
  // Si regresamos a estar online, intentar sincronizar
  if (isOnline) {
    attemptSync();
  }
}

// Actualizar indicador visual de conexión
function updateConnectionStatusIndicator() {
  const statusIndicator = document.getElementById('connection-status');
  if (statusIndicator) {
    statusIndicator.className = isOnline ? 'status-online' : 'status-offline';
    statusIndicator.title = isOnline ? 'Conectado' : 'Fuera de línea';
  }
}

// Cargar operaciones pendientes del almacenamiento local
function loadPendingOperations() {
  try {
    const saved = localStorage.getItem('pendingOperations');
    if (saved) {
      pendingOperations = JSON.parse(saved);
      console.log(`${pendingOperations.length} operaciones pendientes cargadas`);
    }
  } catch (error) {
    console.error('Error al cargar operaciones pendientes:', error);
    pendingOperations = [];
  }
}

// Guardar operaciones pendientes en almacenamiento local
function savePendingOperations() {
  try {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  } catch (error) {
    console.error('Error al guardar operaciones pendientes:', error);
  }
}

// Añadir operación a la cola
function addOperation(operation) {
  // Agregar ID único y timestamp
  operation.id = Date.now() + Math.random().toString(36).substring(7);
  operation.timestamp = new Date().toISOString();
  operation.attempts = 0;
  
  // Agregar a la cola
  pendingOperations.push(operation);
  savePendingOperations();
  
  console.log(`Operación "${operation.type}" en "${operation.table}" añadida a la cola`);
  
  // Si estamos online, intentar sincronizar inmediatamente
  if (isOnline) {
    attemptSync();
  }
  
  return {
    success: true,
    message: isOnline ? 'Operación programada para ejecución' : 'Operación guardada para sincronización futura',
    offline: !isOnline,
    operationId: operation.id
  };
}

// Intentar sincronizar operaciones pendientes
async function attemptSync() {
  if (!isOnline || pendingOperations.length === 0) {
    return;
  }
  
  console.log(`Intentando sincronizar ${pendingOperations.length} operaciones pendientes`);
  
  // Procesar operaciones en orden
  for (let i = 0; i < pendingOperations.length; i++) {
    const operation = pendingOperations[i];
    
    try {
      // Incrementar contador de intentos
      operation.attempts++;
      
      // Ejecutar operación
      await executeOperation(operation);
      
      // Si llegamos aquí, la operación fue exitosa
      console.log(`Operación "${operation.type}" en "${operation.table}" completada exitosamente`);
      
      // Eliminar de la cola
      pendingOperations.splice(i, 1);
      i--; // Ajustar índice para el siguiente ciclo
      
      // Guardar estado actualizado
      savePendingOperations();
      
    } catch (error) {
      console.error(`Error al procesar operación "${operation.type}" en "${operation.table}":`, error);
      
      // Si ha habido demasiados intentos, marcar para revisión manual
      if (operation.attempts >= 5) {
        operation.status = 'failed';
        operation.error = error.message;
        savePendingOperations();
        
        // Notificar al usuario
        showToast(`Una operación no pudo ser completada. Contacte a soporte.`, 'error', 5000);
      }
      
      // Continuar con la siguiente operación
    }
  }
}

// Ejecutar una operación específica
async function executeOperation(operation) {
  const supabase = getSupabaseClient();
  
  switch (operation.type) {
    case 'insert':
      const { error: insertError } = await supabase
        .from(operation.table)
        .insert(operation.data);
      
      if (insertError) throw insertError;
      break;
      
    case 'update':
      const { error: updateError } = await supabase
        .from(operation.table)
        .update(operation.data)
        .match(operation.match);
      
      if (updateError) throw updateError;
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(operation.table)
        .delete()
        .match(operation.match);
      
      if (deleteError) throw deleteError;
      break;
      
    case 'upsert':
      const { error: upsertError } = await supabase
        .from(operation.table)
        .upsert(operation.data);
      
      if (upsertError) throw upsertError;
      break;
      
    default:
      throw new Error(`Tipo de operación desconocido: ${operation.type}`);
  }
}

// Función wrapper para insert con soporte offline
async function insertWithOfflineSupport(table, data) {
  if (!isOnline) {
    return addOperation({
      type: 'insert',
      table,
      data
    });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error en inserción a ${table}:`, error);
    
    // En caso de error de red, añadir a la cola
    if (error.message.includes('network') || !navigator.onLine) {
      return addOperation({
        type: 'insert',
        table,
        data
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Función wrapper para update con soporte offline
async function updateWithOfflineSupport(table, data, match) {
  if (!isOnline) {
    return addOperation({
      type: 'update',
      table,
      data,
      match
    });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .match(match);
    
    if (error) throw error;
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error en actualización a ${table}:`, error);
    
    // En caso de error de red, añadir a la cola
    if (error.message.includes('network') || !navigator.onLine) {
      return addOperation({
        type: 'update',
        table,
        data,
        match
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Función wrapper para upsert con soporte offline
async function upsertWithOfflineSupport(table, data) {
  if (!isOnline) {
    return addOperation({
      type: 'upsert',
      table,
      data
    });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data);
    
    if (error) throw error;
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error en upsert a ${table}:`, error);
    
    // En caso de error de red, añadir a la cola
    if (error.message.includes('network') || !navigator.onLine) {
      return addOperation({
        type: 'upsert',
        table,
        data
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Función wrapper para delete con soporte offline
async function deleteWithOfflineSupport(table, match) {
  if (!isOnline) {
    return addOperation({
      type: 'delete',
      table,
      match
    });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from(table)
      .delete()
      .match(match);
    
    if (error) throw error;
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error en eliminación de ${table}:`, error);
    
    // En caso de error de red, añadir a la cola
    if (error.message.includes('network') || !navigator.onLine) {
      return addOperation({
        type: 'delete',
        table,
        match
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Obtener estado de operaciones pendientes
function getPendingOperationsCount() {
  return pendingOperations.length;
}

// Forzar sincronización
function forceSyncNow() {
  if (isOnline) {
    attemptSync();
    return {
      success: true,
      message: `Sincronización iniciada para ${pendingOperations.length} operaciones pendientes`
    };
  } else {
    return {
      success: false,
      message: 'No es posible sincronizar sin conexión a internet'
    };
  }
}

// Exponer funciones globalmente
window.syncSystem = {
  init: initSyncSystem,
  insert: insertWithOfflineSupport,
  update: updateWithOfflineSupport,
  upsert: upsertWithOfflineSupport,
  delete: deleteWithOfflineSupport,
  getPendingCount: getPendingOperationsCount,
  forceSync: forceSyncNow,
  getConnectionStatus: () => isOnline
};
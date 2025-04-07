// Inicialización del módulo de productos
function initProductosModule() {
    // Esta función se llama al iniciar la aplicación
    console.log('Módulo de productos inicializado');
}

// Configuración de eventos para el módulo de productos
function setupProductosEvents() {
    // Evento para el botón de nuevo producto
    const createProductoBtn = document.getElementById('create-producto-btn');
    if (createProductoBtn) {
        createProductoBtn.addEventListener('click', () => {
            openProductoModal();
        });
    }
    
    // Eventos para búsqueda
    const searchProductos = document.getElementById('search-productos');
    if (searchProductos) {
        searchProductos.addEventListener('input', () => {
            updateProductosTable();
        });
    }
    
    // Configurar eventos para el modal de productos
    setupProductoModalEvents();
}

// Cargar productos desde Supabase
async function loadProductos() {
    try {
        // Mostrar cargador
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'flex';
        }
        
        // Intentar cargar productos usando la función centralizada
        try {
            const productos = await dbOperations.fetchProductos();
            // Actualizar productos en la aplicación
            app.productos = productos || [];
            console.log(`${productos.length} productos cargados desde Supabase`);
        } catch (dbError) {
            console.error('Error al cargar productos desde Supabase:', dbError);
            
            // Si estamos offline, usar datos en caché
            if (!navigator.onLine) {
                showToast('Usando datos en caché para productos', 'warning');
            } else {
                // Si hay un error que no es por estar offline, mostrar mensaje
                showToast('Error al cargar productos del servidor', 'error');
            }
        }
        
        // Actualizar tabla
        updateProductosTable();
        
        return app.productos;
    } catch (error) {
        console.error('Error general al cargar productos:', error);
        showToast('Error al cargar los productos: ' + error.message, 'error');
        return [];
    } finally {
        // Ocultar cargador
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'none';
        }
    }
}

// Actualizar tabla de productos
function updateProductosTable() {
    const productosList = document.getElementById('productos-list');
    if (!productosList) return;
    
    // Indicador de estado de conexión
    const connectionStatus = navigator.onLine ? 
        '<span class="connection-status status-online" title="Conectado"><i class="fas fa-wifi"></i></span>' : 
        '<span class="connection-status status-offline" title="Sin conexión"><i class="fas fa-wifi-slash"></i></span>';
    
    // Mostrar indicador de carga mientras se prepara la tabla
    productosList.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 10px;">
                ${connectionStatus}
                <span>Actualizando lista...</span>
            </td>
        </tr>
    `;
    
    // Aplicar filtros
    let filteredProductos = app.productos.filter(p => !p._deleted); // Excluir los marcados como eliminados
    
    // Filtrar por búsqueda
    const searchProductos = document.getElementById('search-productos');
    if (searchProductos && searchProductos.value) {
        const searchTerm = searchProductos.value.toLowerCase();
        filteredProductos = filteredProductos.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm))
        );
    }
    
    // Mostrar mensaje si no hay productos
    if (filteredProductos.length === 0) {
        productosList.innerHTML = `
            <tr class="empty-state">
                <td colspan="4">
                    <div class="empty-message">
                        <i class="fas fa-box"></i>
                        <p>No hay productos que coincidan con la búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Generar HTML para cada producto
    const productosHTML = filteredProductos.map(producto => {
        // Determinar si el producto es temporal (creado offline)
        const isTemporal = producto._tempId === true;
        
        // Aplicar estilos especiales para productos temporales
        const rowClass = isTemporal ? 'class="producto-temporal"' : '';
        const statusIndicator = isTemporal ? 
            '<span class="sync-pending-badge" title="Pendiente de sincronización"><i class="fas fa-clock"></i></span>' : 
            '';
        
        return `
            <tr ${rowClass}>
                <td>
                    ${statusIndicator}
                    ${producto.nombre}
                </td>
                <td>${producto.descripcion || 'Sin descripción'}</td>
                <td>${formatCurrency(producto.precio)}</td>
                <td>
                    <button class="btn btn-small" onclick="editProducto(${producto.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteProducto(${producto.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    productosList.innerHTML = productosHTML;
    
    // Indicador del estado de la conexión en la tabla
    const pendingCount = syncSystem ? syncSystem.getPendingCount() : 0;
    
    if (!navigator.onLine || pendingCount > 0) {
        // Mostrar indicador del estado de sincronización
        const syncFooter = document.createElement('tr');
        syncFooter.className = 'sync-status-footer';
        syncFooter.innerHTML = `
            <td colspan="4">
                <div class="sync-status ${navigator.onLine ? 'status-pending' : 'status-offline'}">
                    <i class="fas fa-${navigator.onLine ? 'sync' : 'wifi-slash'}"></i>
                    ${navigator.onLine 
                        ? `${pendingCount} cambios pendientes de sincronizar` 
                        : 'Sin conexión. Los cambios se sincronizarán automáticamente cuando se restablezca la conexión.'}
                    ${navigator.onLine && pendingCount > 0 
                        ? '<button class="btn btn-small" onclick="syncSystem.forceSync()">Sincronizar ahora</button>' 
                        : ''}
                </div>
            </td>
        `;
        productosList.appendChild(syncFooter);
    }
}

// Abrir modal de producto (nuevo o edición)
function openProductoModal(productoId = null) {
    // Reiniciar formulario
    const productoForm = document.getElementById('producto-form');
    if (productoForm) {
        productoForm.reset();
    }
    
    // Configurar título del modal y guardar ID si estamos editando
    const productoModalTitle = document.getElementById('producto-modal-title');
    if (productoModalTitle) {
        if (productoId) {
            productoModalTitle.textContent = 'Editar Producto';
            productoModalTitle.setAttribute('data-producto-id', productoId);
            
            // Cargar datos del producto
            const producto = app.productos.find(p => p.id === productoId);
            if (producto) {
                document.getElementById('producto-nombre').value = producto.nombre;
                document.getElementById('producto-descripcion').value = producto.descripcion || '';
                document.getElementById('producto-precio').value = producto.precio;
            }
        } else {
            productoModalTitle.textContent = 'Nuevo Producto';
            productoModalTitle.removeAttribute('data-producto-id');
        }
    }
    
    // Abrir modal
    openModal('producto-modal');
}

// Configurar eventos para el modal de productos
function setupProductoModalEvents() {
    // Botón cancelar
    const cancelProductoBtn = document.getElementById('cancel-producto-btn');
    if (cancelProductoBtn) {
        cancelProductoBtn.addEventListener('click', () => {
            closeModal('producto-modal');
        });
    }
    
    // Botón guardar
    const saveProductoBtn = document.getElementById('save-producto-btn');
    if (saveProductoBtn) {
        saveProductoBtn.addEventListener('click', () => {
            saveProducto();
        });
    }
}

// Guardar producto
async function saveProducto() {
    try {
        // Obtener datos del formulario
        const nombre = document.getElementById('producto-nombre').value;
        const descripcion = document.getElementById('producto-descripcion').value;
        const precio = parseFloat(document.getElementById('producto-precio').value) || 0;
        
        // Validar datos
        if (!nombre) {
            showToast('El nombre del producto es obligatorio', 'error');
            return;
        }
        
        if (precio <= 0) {
            showToast('El precio debe ser mayor a 0', 'error');
            return;
        }
        
        // Mostrar cargador
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'flex';
        }
        
        // Verificar si estamos editando o creando
        const productoModalTitle = document.getElementById('producto-modal-title');
        const productoId = productoModalTitle.getAttribute('data-producto-id');
        
        // Preparar objeto del producto
        const productoData = {
            nombre: nombre,
            descripcion: descripcion,
            precio: precio
        };
        
        // Si tiene ID, es una actualización
        if (productoId) {
            productoData.id = parseInt(productoId);
        }
        
        try {
            // Usar db-operations para guardar
            const result = await dbOperations.saveProducto(productoData);
            
            // Si hay resultado, la operación fue exitosa
            if (result) {
                showToast(
                    productoId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                    'success'
                );
                
                // Recargar productos para tener la lista actualizada
                await loadProductos();
                
                // Cerrar modal
                closeModal('producto-modal');
            } else {
                throw new Error('No se recibió confirmación del servidor');
            }
        } catch (dbError) {
            console.error('Error al guardar producto en Supabase:', dbError);
            
            // Si estamos en modo offline, usar sync_offline
            if (!navigator.onLine) {
                const syncResult = await syncSystem.upsert('productos', productoData);
                
                if (syncResult.success) {
                    // Actualizar localmente para reflejar cambios inmediatos
                    if (productoId) {
                        // Actualizar producto existente
                        const index = app.productos.findIndex(p => p.id == productoId);
                        if (index !== -1) {
                            app.productos[index] = {...app.productos[index], ...productoData};
                        }
                    } else {
                        // Crear placeholder local con ID temporal
                        const tempId = Date.now() * -1; // ID negativo para identificar como temporal
                        app.productos.push({
                            id: tempId,
                            ...productoData,
                            _tempId: true // Marcar como temporal
                        });
                    }
                    
                    showToast(
                        'Cambios guardados localmente. Se sincronizarán cuando haya conexión.',
                        'info'
                    );
                    
                    // Actualizar tabla
                    updateProductosTable();
                    
                    // Cerrar modal
                    closeModal('producto-modal');
                } else {
                    throw new Error('Error al guardar para sincronización: ' + syncResult.error);
                }
            } else {
                throw dbError;
            }
        }
    } catch (error) {
        console.error('Error general al guardar producto:', error);
        showToast('Error al guardar el producto: ' + error.message, 'error');
    } finally {
        // Ocultar cargador
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'none';
        }
    }
}

// Editar producto
function editProducto(productoId) {
    openProductoModal(productoId);
}

// Eliminar producto
async function deleteProducto(productoId) {
    try {
        // Buscar producto en caché local
        const producto = app.productos.find(p => p.id === productoId);
        
        if (!producto) {
            showToast('Producto no encontrado', 'error');
            return;
        }
        
        // Configurar mensaje de confirmación
        const confirmationMessage = document.getElementById('confirmation-message');
        const confirmationTitle = document.getElementById('confirmation-title');
        
        confirmationTitle.textContent = 'Eliminar Producto';
        confirmationMessage.textContent = `¿Estás seguro de eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`;
        
        // Configurar botón de confirmación
        const confirmButton = document.getElementById('confirm-action-btn');
        
        // Limpiar eventos anteriores
        confirmButton.replaceWith(confirmButton.cloneNode(true));
        
        // Obtener el nuevo botón
        const newConfirmButton = document.getElementById('confirm-action-btn');
        
        // Añadir evento
        newConfirmButton.addEventListener('click', async () => {
            try {
                // Mostrar cargador
                const appLoader = document.getElementById('app-loader');
                if (appLoader) {
                    appLoader.style.display = 'flex';
                }
                
                // Verificar si el producto está siendo usado en algún pedido
                // Primero intentamos usar datos locales para una verificación rápida
                const pedidosConProducto = app.pedidos.filter(pedido => 
                    pedido.productos.some(p => p.id === productoId)
                );
                
                if (pedidosConProducto.length > 0) {
                    showToast(`No se puede eliminar el producto porque está siendo usado en ${pedidosConProducto.length} pedido(s)`, 'error');
                    closeModal('confirmation-modal');
                    if (appLoader) appLoader.style.display = 'none';
                    return;
                }
                
                // En una implementación futura, se podría hacer una consulta a Supabase para verificar
                // si el producto está siendo usado en algún pedido de forma más precisa
                
                try {
                    // Usar db-operations para eliminar el producto
                    await dbOperations.deleteProducto(productoId);
                    
                    // Eliminar producto de la aplicación local
                    const index = app.productos.findIndex(p => p.id === productoId);
                    if (index !== -1) {
                        app.productos.splice(index, 1);
                    }
                    
                    // Cerrar modal y actualizar UI
                    closeModal('confirmation-modal');
                    updateProductosTable();
                    
                    // Mensaje de éxito
                    showToast('Producto eliminado correctamente', 'success');
                } catch (dbError) {
                    console.error('Error al eliminar producto de Supabase:', dbError);
                    
                    // Si estamos en modo offline, usar sync_offline
                    if (!navigator.onLine) {
                        const syncResult = await syncSystem.delete('productos', { id: productoId });
                        
                        if (syncResult.success) {
                            // Eliminar producto localmente para feedback inmediato
                            const index = app.productos.findIndex(p => p.id === productoId);
                            if (index !== -1) {
                                // Marcar como eliminado pero mantener para referencia
                                app.productos[index]._deleted = true;
                                // Alternativa: eliminar directamente
                                // app.productos.splice(index, 1);
                            }
                            
                            closeModal('confirmation-modal');
                            updateProductosTable();
                            
                            showToast('Producto marcado para eliminación. Se sincronizará cuando haya conexión.', 'info');
                        } else {
                            throw new Error('Error al programar eliminación para sincronización: ' + syncResult.error);
                        }
                    } else {
                        throw dbError;
                    }
                }
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                showToast('Error al eliminar el producto: ' + error.message, 'error');
            } finally {
                // Ocultar cargador
                const appLoader = document.getElementById('app-loader');
                if (appLoader) {
                    appLoader.style.display = 'none';
                }
            }
        });
        
        // Abrir modal de confirmación
        openModal('confirmation-modal');
    } catch (error) {
        console.error('Error general en deleteProducto:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Exportar función para que sea accesible desde otros archivos
window.loadProductos = loadProductos;
window.editProducto = editProducto;
window.deleteProducto = deleteProducto;
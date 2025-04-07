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

// Actualizar tabla de productos
function updateProductosTable() {
    const productosList = document.getElementById('productos-list');
    if (!productosList) return;
    
    // Aplicar filtros
    let filteredProductos = app.productos;
    
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
    const productosHTML = filteredProductos.map(producto => `
        <tr>
            <td>${producto.nombre}</td>
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
    `).join('');
    
    productosList.innerHTML = productosHTML;
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
function saveProducto() {
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
    
    // Verificar si estamos editando o creando
    const productoModalTitle = document.getElementById('producto-modal-title');
    const productoId = productoModalTitle.getAttribute('data-producto-id');
    
    if (productoId) {
        // Editar producto existente
        const producto = app.productos.find(p => p.id == productoId);
        
        if (producto) {
            producto.nombre = nombre;
            producto.descripcion = descripcion;
            producto.precio = precio;
            
            showToast('Producto actualizado correctamente', 'success');
        }
    } else {
        // Crear nuevo producto
        const nuevoProducto = {
            id: app.productos.length > 0 ? Math.max(...app.productos.map(p => p.id)) + 1 : 1,
            nombre: nombre,
            descripcion: descripcion,
            precio: precio
        };
        
        app.productos.push(nuevoProducto);
        showToast('Producto creado correctamente', 'success');
    }
    
    // Cerrar modal
    closeModal('producto-modal');
    
    // Actualizar tabla
    updateProductosTable();
}

// Editar producto
function editProducto(productoId) {
    openProductoModal(productoId);
}

// Eliminar producto
function deleteProducto(productoId) {
    // Buscar producto
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
    newConfirmButton.addEventListener('click', () => {
        // Verificar si el producto está siendo usado en algún pedido
        const pedidosConProducto = app.pedidos.filter(pedido => 
            pedido.productos.some(p => p.id === productoId)
        );
        
        if (pedidosConProducto.length > 0) {
            showToast(`No se puede eliminar el producto porque está siendo usado en ${pedidosConProducto.length} pedido(s)`, 'error');
            closeModal('confirmation-modal');
            return;
        }
        
        // Eliminar producto
        const index = app.productos.findIndex(p => p.id === productoId);
        if (index !== -1) {
            app.productos.splice(index, 1);
            
            // Cerrar modal de confirmación
            closeModal('confirmation-modal');
            
            // Actualizar tabla
            updateProductosTable();
            
            // Mostrar notificación de éxito
            showToast('Producto eliminado correctamente', 'success');
        }
    });
    
    // Abrir modal de confirmación
    openModal('confirmation-modal');
}
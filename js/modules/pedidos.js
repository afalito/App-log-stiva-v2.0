// Inicialización del módulo de pedidos
function initPedidosModule() {
    // Esta función se llama al iniciar la aplicación
    console.log('Módulo de pedidos inicializado');
}

// Configuración de eventos para el módulo de pedidos
function setupPedidosEvents() {
    // Evento para el botón de nuevo pedido
    const createPedidoBtn = document.getElementById('create-pedido-btn');
    if (createPedidoBtn) {
        createPedidoBtn.addEventListener('click', () => {
            openPedidoModal();
        });
    }
    
    // Eventos para filtros y búsqueda
    const searchPedidos = document.getElementById('search-pedidos');
    if (searchPedidos) {
        searchPedidos.addEventListener('input', () => {
            updatePedidosTable();
        });
    }
    
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            updatePedidosTable();
        });
    }
    
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (dateFrom && dateTo) {
        dateFrom.addEventListener('change', () => {
            updatePedidosTable();
        });
        
        dateTo.addEventListener('change', () => {
            updatePedidosTable();
        });
    }
    
    // Configurar eventos para el modal de pedidos
    setupPedidoModalEvents();
}

// Actualizar tabla de pedidos
function updatePedidosTable() {
    const pedidosList = document.getElementById('pedidos-list');
    if (!pedidosList) return;
    
    // Aplicar filtros
    let filteredPedidos = app.pedidos;
    
    // Filtrar por estado si está seleccionado
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus && filterStatus.value) {
        filteredPedidos = filteredPedidos.filter(p => p.estado === filterStatus.value);
    }
    
    // Filtrar por fecha desde
    const dateFrom = document.getElementById('date-from');
    if (dateFrom && dateFrom.value) {
        const fromDate = new Date(dateFrom.value);
        fromDate.setHours(0, 0, 0, 0);
        filteredPedidos = filteredPedidos.filter(p => new Date(p.fechaCreacion) >= fromDate);
    }
    
    // Filtrar por fecha hasta
    const dateTo = document.getElementById('date-to');
    if (dateTo && dateTo.value) {
        const toDate = new Date(dateTo.value);
        toDate.setHours(23, 59, 59, 999);
        filteredPedidos = filteredPedidos.filter(p => new Date(p.fechaCreacion) <= toDate);
    }
    
    // Filtrar por búsqueda
    const searchPedidos = document.getElementById('search-pedidos');
    if (searchPedidos && searchPedidos.value) {
        const searchTerm = searchPedidos.value.toLowerCase();
        filteredPedidos = filteredPedidos.filter(p => 
            p.numeroPedido.toLowerCase().includes(searchTerm) ||
            p.cliente.nombre.toLowerCase().includes(searchTerm) ||
            p.cliente.apellido.toLowerCase().includes(searchTerm) ||
            p.cliente.direccion.toLowerCase().includes(searchTerm) ||
            p.cliente.ciudad.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar según el rol del usuario
    if (app.currentUser.rol === 'vendedor') {
        // Vendedor solo ve sus propios pedidos
        filteredPedidos = filteredPedidos.filter(p => p.creador.id === app.currentUser.id);
    } else if (app.currentUser.rol === 'conductor') {
        // Conductor solo ve pedidos asignados a él
        filteredPedidos = filteredPedidos.filter(p => 
            p.conductor && p.conductor.id === app.currentUser.id
        );
    } else if (app.currentUser.rol === 'bodega') {
        // Bodega ve pedidos en ciertos estados
        filteredPedidos = filteredPedidos.filter(p => 
            ['buscando-conductor', 'en-proceso', 'devuelto'].includes(p.estado)
        );
    } else if (app.currentUser.rol === 'tesoreria') {
        // Tesorería ve pedidos en ciertos estados
        filteredPedidos = filteredPedidos.filter(p => 
            ['entregado-pendiente', 'en-proceso'].includes(p.estado)
        );
    }
    
    // Ordenar pedidos por fecha (más recientes primero)
    filteredPedidos = filteredPedidos.sort((a, b) => 
        new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
    );
    
    // Mostrar mensaje si no hay pedidos
    if (filteredPedidos.length === 0) {
        pedidosList.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-message">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No hay pedidos que coincidan con los filtros</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Generar HTML para cada pedido
    const pedidosHTML = filteredPedidos.map(pedido => {
        // Calcular productos (hasta 2 + contador si hay más)
        let productosText = '';
        if (pedido.productos.length === 0) {
            productosText = '<span class="text-light">Sin productos</span>';
        } else if (pedido.productos.length <= 2) {
            productosText = pedido.productos.map(p => p.nombre).join(', ');
        } else {
            productosText = `${pedido.productos[0].nombre}, ${pedido.productos[1].nombre} y ${pedido.productos.length - 2} más`;
        }
        
        // Aplicar clase especial si está anulado
        const anulado = pedido.estado === 'anulado';
        const rowClass = anulado ? 'anulado' : '';
        
        return `
            <tr class="${rowClass}">
                <td>${pedido.numeroPedido}</td>
                <td>${pedido.cliente.nombre} ${pedido.cliente.apellido}</td>
                <td>${productosText}</td>
                <td>${formatCurrency(pedido.total)}</td>
                <td><span class="status-badge status-${pedido.estado}">${getEstadoLabel(pedido.estado)}</span></td>
                <td>${formatDate(pedido.fechaCreacion)}</td>
                <td>
                    <button class="btn btn-small" data-pedido-id="${pedido.id}" onclick="openPedidoDetail(${pedido.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    pedidosList.innerHTML = pedidosHTML;
}

// Abrir modal de pedido (nuevo o edición)
function openPedidoModal(pedidoId = null) {
    // Reiniciar formulario
    const pedidoForm = document.getElementById('pedido-form');
    if (pedidoForm) {
        pedidoForm.reset();
    }
    
    // Verificar que haya productos disponibles
    if (app.productos.length === 0) {
        showToast('No hay productos disponibles. Por favor, añade productos primero.', 'warning');
        
        // Si el usuario es maestro, sugerir ir a la sección de productos
        if (app.currentUser && app.currentUser.rol === 'maestro') {
            setTimeout(() => {
                changeModule('productos');
            }, 2000);
        }
        return;
    }
    
    // Limpiar lista de productos
    const pedidoProductosList = document.getElementById('pedido-productos-list');
    if (pedidoProductosList) {
        pedidoProductosList.innerHTML = `
            <div class="empty-productos">
                <p>Añade productos al pedido</p>
            </div>
        `;
    }
    
    // Reiniciar total
    const pedidoTotalValue = document.getElementById('pedido-total-value');
    if (pedidoTotalValue) {
        pedidoTotalValue.textContent = formatCurrency(0);
    }
    
    // Configurar título del modal
    const pedidoModalTitle = document.getElementById('pedido-modal-title');
    if (pedidoModalTitle) {
        pedidoModalTitle.textContent = 'Nuevo Pedido';
    }
    
    // Abrir modal
    openModal('pedido-modal');
}

// Configurar eventos para el modal de pedidos
function setupPedidoModalEvents() {
    // Botón cancelar
    const cancelPedidoBtn = document.getElementById('cancel-pedido-btn');
    if (cancelPedidoBtn) {
        cancelPedidoBtn.addEventListener('click', () => {
            closeModal('pedido-modal');
        });
    }
    
    // Botón guardar
    const savePedidoBtn = document.getElementById('save-pedido-btn');
    if (savePedidoBtn) {
        savePedidoBtn.addEventListener('click', () => {
            savePedido();
        });
    }
    
    // Botón añadir producto
    const addProductoBtn = document.getElementById('add-producto-btn');
    if (addProductoBtn) {
        addProductoBtn.addEventListener('click', () => {
            openProductoSelectorModal();
        });
    }
    
    // Configurar eventos para el selector de productos
    setupProductoSelectorModalEvents();
}

// Guardar pedido
function savePedido() {
    // Obtener datos del formulario
    const clienteNombre = document.getElementById('cliente-nombre').value;
    const clienteApellido = document.getElementById('cliente-apellido').value;
    const clienteDireccion = document.getElementById('cliente-direccion').value;
    const clienteCiudad = document.getElementById('cliente-ciudad').value;
    const clienteDepartamento = document.getElementById('cliente-departamento').value;
    
    // Validar datos básicos
    if (!clienteNombre || !clienteApellido || !clienteDireccion || !clienteCiudad || !clienteDepartamento) {
        showToast('Por favor, completa todos los datos del cliente', 'error');
        return;
    }
    
    // Obtener productos del pedido
    const productosSeleccionados = [];
    document.querySelectorAll('.producto-item').forEach(item => {
        const productoId = parseInt(item.getAttribute('data-producto-id'));
        const cantidad = parseInt(item.getAttribute('data-cantidad'));
        const precioUnitario = parseFloat(item.getAttribute('data-precio'));
        const subtotal = cantidad * precioUnitario;
        
        // Buscar producto en la "base de datos"
        const producto = app.productos.find(p => p.id === productoId);
        
        if (producto) {
            productosSeleccionados.push({
                id: productoId,
                nombre: producto.nombre,
                cantidad: cantidad,
                precioUnitario: precioUnitario,
                subtotal: subtotal
            });
        }
    });
    
    // Validar que haya al menos un producto
    if (productosSeleccionados.length === 0) {
        showToast('Por favor, añade al menos un producto al pedido', 'error');
        return;
    }
    
    // Calcular total del pedido
    const total = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    
    // Obtener tipo de pago
    const tipoPago = document.querySelector('input[name="tipoPago"]:checked').value;
    
    // Crear nuevo pedido
    const nuevoPedido = {
        id: app.pedidos.length + 1,
        numeroPedido: generarNumeroPedido(),
        cliente: {
            nombre: clienteNombre,
            apellido: clienteApellido,
            direccion: clienteDireccion,
            ciudad: clienteCiudad,
            departamento: clienteDepartamento
        },
        productos: productosSeleccionados,
        total: total,
        tipoPago: tipoPago,
        estado: 'buscando-conductor',
        fechaCreacion: new Date().toISOString(),
        creador: app.currentUser,
        conductor: null,
        comentarios: [],
        historial: [
            {
                fecha: new Date().toISOString(),
                estado: 'buscando-conductor',
                usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`
            }
        ]
    };
    
    // Añadir a la lista de pedidos
    app.pedidos.push(nuevoPedido);
    
    // Cerrar modal
    closeModal('pedido-modal');
    
    // Actualizar tabla de pedidos si estamos en ese módulo
    if (app.currentModule === 'pedidos') {
        updatePedidosTable();
    }
    
    // Mostrar mensaje de éxito
    showToast(`Pedido ${nuevoPedido.numeroPedido} creado exitosamente`, 'success');
}

// Abrir modal de selector de productos
function openProductoSelectorModal() {
    // Cargar lista de productos
    const productSelectorList = document.getElementById('product-selector-list');
    if (productSelectorList) {
        productSelectorList.innerHTML = app.productos.map(producto => `
            <div class="product-item" data-producto-id="${producto.id}">
                <div class="product-name">${producto.nombre}</div>
                <div class="product-price">${formatCurrency(producto.precio)}</div>
            </div>
        `).join('');
        
        // Añadir eventos a los productos
        document.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', () => {
                // Quitar selección de todos los productos
                document.querySelectorAll('.product-item').forEach(i => {
                    i.classList.remove('selected');
                });
                
                // Marcar este producto como seleccionado
                item.classList.add('selected');
                
                // Mostrar precio referencial
                const productoId = parseInt(item.getAttribute('data-producto-id'));
                const producto = app.productos.find(p => p.id === productoId);
                
                if (producto && document.getElementById('producto-precio-unitario')) {
                    document.getElementById('producto-precio-unitario').value = producto.precio;
                }
            });
        });
    }
    
    // Reiniciar formulario
    const productoCantidad = document.getElementById('producto-cantidad');
    if (productoCantidad) {
        productoCantidad.value = 1;
    }
    
    // Abrir modal
    openModal('producto-selector-modal');
}

// Configurar eventos para el selector de productos
function setupProductoSelectorModalEvents() {
    // Botón cancelar
    const cancelProductoSelectBtn = document.getElementById('cancel-producto-select-btn');
    if (cancelProductoSelectBtn) {
        cancelProductoSelectBtn.addEventListener('click', () => {
            closeModal('producto-selector-modal');
        });
    }
    
    // Botón confirmar
    const confirmProductoSelectBtn = document.getElementById('confirm-producto-select-btn');
    if (confirmProductoSelectBtn) {
        confirmProductoSelectBtn.addEventListener('click', () => {
            addProductToPedido();
        });
    }
    
    // Búsqueda de productos
    const searchProductoSelector = document.getElementById('search-producto-selector');
    if (searchProductoSelector) {
        searchProductoSelector.addEventListener('input', () => {
            filterProductoSelector();
        });
    }
}

// Filtrar productos en el selector
function filterProductoSelector() {
    const searchTerm = document.getElementById('search-producto-selector').value.toLowerCase();
    
    document.querySelectorAll('#product-selector-list .product-item').forEach(item => {
        const productoId = parseInt(item.getAttribute('data-producto-id'));
        const producto = app.productos.find(p => p.id === productoId);
        
        if (producto) {
            const visible = producto.nombre.toLowerCase().includes(searchTerm);
            item.style.display = visible ? '' : 'none';
        }
    });
}

// Añadir producto al pedido
function addProductToPedido() {
    // Obtener producto seleccionado
    const selectedProduct = document.querySelector('.product-item.selected');
    if (!selectedProduct) {
        showToast('Por favor, selecciona un producto', 'error');
        return;
    }
    
    const productoId = parseInt(selectedProduct.getAttribute('data-producto-id'));
    const producto = app.productos.find(p => p.id === productoId);
    
    if (!producto) {
        showToast('Error al seleccionar el producto', 'error');
        return;
    }
    
    // Obtener cantidad y precio
    const cantidad = parseInt(document.getElementById('producto-cantidad').value) || 1;
    const precioUnitario = parseFloat(document.getElementById('producto-precio-unitario').value) || producto.precio;
    
    // Validar datos
    if (cantidad <= 0) {
        showToast('La cantidad debe ser mayor a 0', 'error');
        return;
    }
    
    if (precioUnitario <= 0) {
        showToast('El precio debe ser mayor a 0', 'error');
        return;
    }
    
    // Calcular subtotal
    const subtotal = cantidad * precioUnitario;
    
    // Añadir producto a la lista
    const pedidoProductosList = document.getElementById('pedido-productos-list');
    
    // Eliminar mensaje de vacío si existe
    const emptyMessage = pedidoProductosList.querySelector('.empty-productos');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Verificar si el producto ya está en la lista
    const existingProduct = pedidoProductosList.querySelector(`[data-producto-id="${productoId}"]`);
    
    if (existingProduct) {
        // Actualizar cantidad y precio del producto existente
        const currentCantidad = parseInt(existingProduct.getAttribute('data-cantidad'));
        const newCantidad = currentCantidad + cantidad;
        
        existingProduct.setAttribute('data-cantidad', newCantidad);
        existingProduct.setAttribute('data-precio', precioUnitario);
        
        // Actualizar texto
        const cantidadElement = existingProduct.querySelector('.producto-cantidad');
        const precioElement = existingProduct.querySelector('.producto-precio');
        const subtotalElement = existingProduct.querySelector('.producto-subtotal');
        
        if (cantidadElement) cantidadElement.textContent = newCantidad;
        if (precioElement) precioElement.textContent = formatCurrency(precioUnitario);
        if (subtotalElement) subtotalElement.textContent = formatCurrency(newCantidad * precioUnitario);
    } else {
        // Añadir nuevo producto
        const productoHTML = `
            <div class="producto-item" data-producto-id="${productoId}" data-cantidad="${cantidad}" data-precio="${precioUnitario}">
                <div class="producto-info">
                    <div class="producto-nombre">${producto.nombre}</div>
                    <div class="producto-detalles">
                        <span class="producto-cantidad">${cantidad}</span> x 
                        <span class="producto-precio">${formatCurrency(precioUnitario)}</span> = 
                        <span class="producto-subtotal">${formatCurrency(subtotal)}</span>
                    </div>
                </div>
                <div class="producto-actions">
                    <span class="remove-producto" onclick="removeProductFromPedido(${productoId})">
                        <i class="fas fa-trash"></i>
                    </span>
                </div>
            </div>
        `;
        
        pedidoProductosList.insertAdjacentHTML('beforeend', productoHTML);
    }
    
    // Actualizar total del pedido
    updatePedidoTotal();
    
    // Cerrar modal
    closeModal('producto-selector-modal');
}

// Eliminar producto del pedido
function removeProductFromPedido(productoId) {
    // Buscar elemento en la lista
    const productoElement = document.querySelector(`.producto-item[data-producto-id="${productoId}"]`);
    
    if (productoElement) {
        // Eliminar elemento
        productoElement.remove();
        
        // Si no quedan productos, mostrar mensaje de vacío
        const pedidoProductosList = document.getElementById('pedido-productos-list');
        if (pedidoProductosList && pedidoProductosList.querySelectorAll('.producto-item').length === 0) {
            pedidoProductosList.innerHTML = `
                <div class="empty-productos">
                    <p>Añade productos al pedido</p>
                </div>
            `;
        }
        
        // Actualizar total
        updatePedidoTotal();
    }
}

// Actualizar total del pedido
function updatePedidoTotal() {
    let total = 0;
    
    // Sumar subtotales de todos los productos
    document.querySelectorAll('.producto-item').forEach(item => {
        const cantidad = parseInt(item.getAttribute('data-cantidad'));
        const precio = parseFloat(item.getAttribute('data-precio'));
        total += cantidad * precio;
    });
    
    // Actualizar total en la UI
    const pedidoTotalValue = document.getElementById('pedido-total-value');
    if (pedidoTotalValue) {
        pedidoTotalValue.textContent = formatCurrency(total);
    }
}

// Abrir detalle de pedido
function openPedidoDetail(pedidoId) {
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        showToast('Pedido no encontrado', 'error');
        return;
    }
    
    // Llenar datos del pedido
    document.getElementById('pedido-detail-title').textContent = `Detalles del Pedido`;
    document.getElementById('pedido-detail-number').textContent = pedido.numeroPedido;
    document.getElementById('pedido-detail-status').textContent = getEstadoLabel(pedido.estado);
    document.getElementById('pedido-detail-status').className = `status-badge status-${pedido.estado}`;
    
    document.getElementById('pedido-detail-cliente').textContent = 
        `${pedido.cliente.nombre} ${pedido.cliente.apellido}`;
    
    document.getElementById('pedido-detail-direccion').textContent = 
        `${pedido.cliente.direccion}, ${pedido.cliente.ciudad}, ${pedido.cliente.departamento}`;
    
    document.getElementById('pedido-detail-creador').textContent = 
        `${pedido.creador.nombre} ${pedido.creador.apellido}`;
    
    document.getElementById('pedido-detail-fecha').textContent = 
        formatDate(pedido.fechaCreacion);
    
    document.getElementById('pedido-detail-tipo-pago').textContent = 
        pedido.tipoPago === 'contraentrega' ? 'Pago Contraentrega' : 'Pago Anticipado';
    
    // Mostrar conductor si existe
    const conductorRow = document.getElementById('conductor-row');
    if (pedido.conductor) {
        conductorRow.style.display = '';
        document.getElementById('pedido-detail-conductor').textContent = 
            `${pedido.conductor.nombre} ${pedido.conductor.apellido}`;
    } else {
        conductorRow.style.display = 'none';
    }
    
    // Llenar tabla de productos
    const productosTable = document.getElementById('pedido-detail-productos');
    
    if (pedido.productos.length === 0) {
        productosTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No hay productos en este pedido</td>
            </tr>
        `;
    } else {
        productosTable.innerHTML = pedido.productos.map(producto => `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${formatCurrency(producto.precioUnitario)}</td>
                <td>${formatCurrency(producto.subtotal)}</td>
            </tr>
        `).join('');
    }
    
    // Actualizar total
    document.getElementById('pedido-detail-total').textContent = formatCurrency(pedido.total);
    
    // Llenar historial
    const timelineContainer = document.getElementById('pedido-detail-timeline');
    timelineContainer.innerHTML = pedido.historial.map(historial => `
        <li class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${formatDateTime(historial.fecha)}</div>
            <div class="timeline-status">${getEstadoLabel(historial.estado)}</div>
            <div class="timeline-user">${historial.usuario}</div>
        </li>
    `).join('');
    
    // Llenar comentarios
    const commentsContainer = document.getElementById('pedido-comments-container');
    
    if (pedido.comentarios.length === 0) {
        commentsContainer.innerHTML = `
            <div class="empty-comments">
                <p>No hay comentarios en este pedido</p>
            </div>
        `;
    } else {
        commentsContainer.innerHTML = pedido.comentarios.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${comment.usuario}</span>
                    <span class="comment-time">${formatDateTime(comment.fecha)}</span>
                </div>
                <div class="comment-text">${formatComment(comment.texto)}</div>
            </div>
        `).join('');
    }
    
    // Configurar acciones según el rol y estado
    setupPedidoActions(pedido);
    
    // Configurar eventos de comentarios
    setupCommentEvents(pedido);
    
    // Abrir modal
    openModal('pedido-detail-modal');
}

// Formatear comentario (resaltar menciones)
function formatComment(text) {
    // Convertir saltos de línea a <br>
    let formattedText = text.replace(/\n/g, '<br>');
    
    // Convertir URLs en enlaces
    formattedText = formattedText.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank">$1</a>'
    );
    
    // Resaltar menciones
    formattedText = formattedText.replace(
        /@(\w+)/g, 
        '<span class="mention">@$1</span>'
    );
    
    return formattedText;
}

// Configurar acciones disponibles para el pedido
function setupPedidoActions(pedido) {
    const actionsContainer = document.getElementById('pedido-actions');
    actionsContainer.innerHTML = '';
    
    // Si el pedido está anulado, no mostrar acciones
    if (pedido.estado === 'anulado') {
        return;
    }
    
    // Crear contenedor flex para los botones
    actionsContainer.className = 'pedido-actions';
    
    // Acción de cambiar estado (según el rol y estado actual)
    if (app.currentUser.rol === 'conductor') {
        // El conductor puede cambiar a ciertos estados según el estado actual
        if (pedido.estado === 'conductor-asignado') {
            // Puede marcar como En Proceso de Entrega
            actionsContainer.innerHTML += `
                <button class="btn btn-small" onclick="cambiarEstadoPedido(${pedido.id}, 'en-proceso')">
                    <i class="fas fa-truck"></i> Marcar En Proceso
                </button>
            `;
        } else if (pedido.estado === 'en-proceso') {
            // Puede marcar como entregado o devuelto
            actionsContainer.innerHTML += `
                <button class="btn btn-small btn-success" onclick="cambiarEstadoPedido(${pedido.id}, '${pedido.tipoPago === 'contraentrega' ? 'entregado-pendiente' : 'finalizado'}')">
                    <i class="fas fa-check"></i> Marcar Entregado
                </button>
                <button class="btn btn-small btn-danger" onclick="cambiarEstadoPedido(${pedido.id}, 'devuelto')">
                    <i class="fas fa-undo"></i> Marcar Devuelto
                </button>
            `;
        }
    } else if (app.currentUser.rol === 'bodega') {
        // El usuario de bodega puede asignar conductores
        if (pedido.estado === 'buscando-conductor') {
            actionsContainer.innerHTML += `
                <button class="btn btn-small" onclick="asignarConductor(${pedido.id})">
                    <i class="fas fa-user"></i> Asignar Conductor
                </button>
            `;
        }
    } else if (app.currentUser.rol === 'tesoreria') {
        // Tesorería puede finalizar pedidos pendientes de pago
        if (pedido.estado === 'entregado-pendiente') {
            actionsContainer.innerHTML += `
                <button class="btn btn-small btn-success" onclick="cambiarEstadoPedido(${pedido.id}, 'finalizado')">
                    <i class="fas fa-check-circle"></i> Confirmar Pago
                </button>
            `;
        }
    } else if (app.currentUser.rol === 'maestro') {
        // El usuario maestro puede hacer todas las acciones
        if (pedido.estado === 'buscando-conductor') {
            actionsContainer.innerHTML += `
                <button class="btn btn-small" onclick="asignarConductor(${pedido.id})">
                    <i class="fas fa-user"></i> Asignar Conductor
                </button>
                
                <button class="btn btn-small btn-danger" onclick="anularPedido(${pedido.id})">
                    <i class="fas fa-ban"></i> Anular Pedido
                </button>
            `;
        }
    }
}

// Configurar eventos de comentarios
function setupCommentEvents(pedido) {
    const sendCommentBtn = document.getElementById('send-comment-btn');
    const newCommentText = document.getElementById('new-comment');
    
    if (sendCommentBtn && newCommentText) {
        // Limpiar eventos anteriores
        sendCommentBtn.replaceWith(sendCommentBtn.cloneNode(true));
        
        // Obtener el nuevo botón
        const newSendCommentBtn = document.getElementById('send-comment-btn');
        
        // Añadir evento
        newSendCommentBtn.addEventListener('click', () => {
            if (newCommentText.value.trim() === '') {
                showToast('El comentario no puede estar vacío', 'warning');
                return;
            }
            
            // Añadir comentario
            addComment(pedido.id, newCommentText.value);
            
            // Limpiar campo
            newCommentText.value = '';
        });
    }
}

// Añadir comentario a un pedido
function addComment(pedidoId, texto) {
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        showToast('Pedido no encontrado', 'error');
        return;
    }
    
    // Crear comentario
    const comentario = {
        id: Date.now(),
        texto: texto,
        usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`,
        fecha: new Date().toISOString()
    };
    
    // Añadir comentario al pedido
    pedido.comentarios.push(comentario);
    
    // Actualizar vista de comentarios
    const commentsContainer = document.getElementById('pedido-comments-container');
    
    // Eliminar mensaje de vacío si existe
    const emptyComments = commentsContainer.querySelector('.empty-comments');
    if (emptyComments) {
        emptyComments.remove();
    }
    
    // Añadir nuevo comentario
    const commentHTML = `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-user">${comentario.usuario}</span>
                <span class="comment-time">${formatDateTime(comentario.fecha)}</span>
            </div>
            <div class="comment-text">${formatComment(comentario.texto)}</div>
        </div>
    `;
    
    commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
    
    // Hacer scroll al final de los comentarios
    commentsContainer.scrollTop = commentsContainer.scrollHeight;
    
    // Verificar menciones y crear notificaciones
    const mencionados = crearNotificacionesMenciones(texto, pedidoId, app.currentUser);
    
    // Mostrar confirmación de menciones
    if (mencionados && mencionados.length > 0) {
        showToast(`Se ha notificado a ${mencionados.length} usuario(s) mencionado(s)`, 'success');
    } else {
        showToast('Comentario añadido', 'success');
    }
}

// Asignar conductor a un pedido
function asignarConductor(pedidoId) {
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        showToast('Pedido no encontrado', 'error');
        return;
    }
    
    // Verificar permisos - solo bodega y maestro pueden asignar
    if (!validarPermiso('asignar_conductor', pedido.estado)) {
        showToast('No tienes permisos para asignar conductores', 'error');
        return;
    }
    
    // Verificar estado - solo se puede asignar si está en "buscando conductor"
    if (pedido.estado !== 'buscando-conductor') {
        showToast('Solo se pueden asignar conductores a pedidos en estado "Buscando Conductor"', 'error');
        return;
    }

    // Buscar conductores disponibles
    const conductores = app.usuarios.filter(u => u.rol === 'conductor' && u.activo);
    
    if (conductores.length === 0) {
        showToast('No hay conductores disponibles', 'warning');
        return;
    }
    
    // Crear HTML para el modal de confirmación
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmationTitle = document.getElementById('confirmation-title');
    
    confirmationTitle.textContent = 'Asignar Conductor';
    confirmationMessage.innerHTML = `
        <p>Selecciona un conductor para el pedido ${pedido.numeroPedido}:</p>
        <div class="form-group">
            <select id="conductor-select" class="form-control">
                ${conductores.map(c => `
                    <option value="${c.id}">${c.nombre} ${c.apellido}</option>
                `).join('')}
            </select>
        </div>
    `;
    
    // Configurar botón de confirmación
    const confirmButton = document.getElementById('confirm-action-btn');
    
    // Limpiar eventos anteriores
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    
    // Obtener el nuevo botón
    const newConfirmButton = document.getElementById('confirm-action-btn');
    
    // Añadir evento
    newConfirmButton.addEventListener('click', () => {
        const conductorId = parseInt(document.getElementById('conductor-select').value);
        const conductor = app.usuarios.find(u => u.id === conductorId);
        
        if (conductor) {
            // Asignar conductor
            pedido.conductor = conductor;
            
            // Cambiar estado
            pedido.estado = 'conductor-asignado';
            
            // Añadir al historial
            pedido.historial.push({
                fecha: new Date().toISOString(),
                estado: 'conductor-asignado',
                usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`
            });
            
            // Añadir comentario automático
            const comentario = {
                id: Date.now(),
                texto: `Pedido asignado a ${conductor.nombre} ${conductor.apellido}`,
                usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`,
                fecha: new Date().toISOString()
            };
            
            pedido.comentarios.push(comentario);
            
            // Crear notificación para el conductor
            crearNotificacionAsignacion(pedido, conductor);
            
            // Cerrar modal de confirmación
            closeModal('confirmation-modal');
            
            // Actualizar vista de detalle
            openPedidoDetail(pedidoId);
            
            // Mostrar notificación de éxito
            showToast(`Conductor asignado al pedido ${pedido.numeroPedido}`, 'success');
            
            // Actualizar la vista de pedidos si estamos en esa pantalla
            if (app.currentModule === 'pedidos') {
                updatePedidosTable();
            }
            
            // Actualizar el dashboard si estamos ahí
            if (app.currentModule === 'dashboard') {
                updateDashboard();
            }
        }
    });
    
    // Abrir modal de confirmación
    openModal('confirmation-modal');
}

// Función para crear notificación de asignación de pedido al conductor
function crearNotificacionAsignacion(pedido, conductor) {
    // Crear notificación para el conductor
    const notificacion = {
        id: Date.now() + Math.floor(Math.random() * 1000), // ID único
        usuarioId: conductor.id,
        texto: `Se te ha asignado un nuevo pedido: ${pedido.numeroPedido}`,
        referencia: `Pedido para ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
        referenciaId: pedido.id,
        tipo: 'pedido-asignacion',
        leida: false,
        fecha: new Date().toISOString()
    };
    
    // Añadir la notificación a la lista global
    app.notificaciones.push(notificacion);
    
    // Actualizar contador de notificaciones
    actualizarContadorNotificaciones();
    
    console.log('Notificación creada para el conductor:', notificacion);
}

// Cambiar estado de un pedido
function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        showToast('Pedido no encontrado', 'error');
        return;
    }
    
    // Validar transición de estado
    if (!validarTransicionEstado(pedido.estado, nuevoEstado)) {
        showToast('Transición de estado no permitida', 'error');
        return;
    }
    
    // Configurar mensaje de confirmación
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmationTitle = document.getElementById('confirmation-title');
    
    confirmationTitle.textContent = 'Cambiar Estado';
    confirmationMessage.textContent = `¿Estás seguro de cambiar el pedido ${pedido.numeroPedido} a "${getEstadoLabel(nuevoEstado)}"?`;
    
    // Configurar botón de confirmación
    const confirmButton = document.getElementById('confirm-action-btn');
    
    // Limpiar eventos anteriores
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    
    // Obtener el nuevo botón
    const newConfirmButton = document.getElementById('confirm-action-btn');
    
    // Añadir evento
    newConfirmButton.addEventListener('click', () => {
        // Guardar estado anterior
        const estadoAnterior = pedido.estado;
        
        // Cambiar estado
        pedido.estado = nuevoEstado;
        
        // Si el estado es finalizado, guardar fecha de finalización
        if (nuevoEstado === 'finalizado') {
            pedido.fechaFinalizacion = new Date().toISOString();
        }
        
        // Añadir al historial
        pedido.historial.push({
            fecha: new Date().toISOString(),
            estado: nuevoEstado,
            usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`
        });
        
        // Añadir comentario automático
        const comentario = {
            id: Date.now(),
            texto: `Estado cambiado de "${getEstadoLabel(estadoAnterior)}" a "${getEstadoLabel(nuevoEstado)}"`,
            usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`,
            fecha: new Date().toISOString()
        };
        
        pedido.comentarios.push(comentario);
        
        // Generar notificaciones relevantes según el cambio de estado
        generarNotificacionesCambioEstado(pedido, estadoAnterior, nuevoEstado);
        
        // Cerrar modal de confirmación
        closeModal('confirmation-modal');
        
        // Actualizar vista de detalle
        openPedidoDetail(pedidoId);
        
        // Actualizar tabla si estamos en la vista de pedidos
        if (app.currentModule === 'pedidos') {
            updatePedidosTable();
        }
        
        // Actualizar dashboard si estamos en la pantalla principal
        if (app.currentModule === 'dashboard') {
            updateDashboard();
        }
        
        // Mostrar notificación de éxito
        showToast(`Estado del pedido ${pedido.numeroPedido} actualizado a "${getEstadoLabel(nuevoEstado)}"`, 'success');
    });
    
    // Abrir modal de confirmación
    openModal('confirmation-modal');
}

// Generar notificaciones según el cambio de estado
function generarNotificacionesCambioEstado(pedido, estadoAnterior, nuevoEstado) {
    // Notificar a diferentes roles según el cambio de estado
    
    // Si se entregó, notificar a tesorería
    if (nuevoEstado === 'entregado-pendiente') {
        // Buscar usuarios de tesorería
        const usuariosTesoreria = app.usuarios.filter(u => u.rol === 'tesoreria' && u.activo);
        
        // Notificar a cada usuario de tesorería
        usuariosTesoreria.forEach(usuario => {
            const notificacion = {
                id: Date.now() + Math.floor(Math.random() * 1000), // ID único
                usuarioId: usuario.id,
                texto: `Pedido ${pedido.numeroPedido} entregado, pendiente de pago`,
                referencia: `Cliente: ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                referenciaId: pedido.id,
                tipo: 'pedido-pendiente-pago',
                leida: false,
                fecha: new Date().toISOString()
            };
            
            app.notificaciones.push(notificacion);
        });
    }
    
    // Si se finalizó, notificar al vendedor original
    if (nuevoEstado === 'finalizado' && pedido.creador) {
        const notificacion = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            usuarioId: pedido.creador.id,
            texto: `Pedido ${pedido.numeroPedido} finalizado exitosamente`,
            referencia: `Cliente: ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
            referenciaId: pedido.id,
            tipo: 'pedido-finalizado',
            leida: false,
            fecha: new Date().toISOString()
        };
        
        app.notificaciones.push(notificacion);
    }
    
    // Si se devolvió, notificar al vendedor y a bodega
    if (nuevoEstado === 'devuelto') {
        // Notificar al vendedor
        if (pedido.creador) {
            const notificacionVendedor = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                usuarioId: pedido.creador.id,
                texto: `Pedido ${pedido.numeroPedido} fue devuelto`,
                referencia: `Cliente: ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                referenciaId: pedido.id,
                tipo: 'pedido-devuelto',
                leida: false,
                fecha: new Date().toISOString()
            };
            
            app.notificaciones.push(notificacionVendedor);
        }
        
        // Notificar a bodega
        const usuariosBodega = app.usuarios.filter(u => u.rol === 'bodega' && u.activo);
        
        usuariosBodega.forEach(usuario => {
            const notificacion = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                usuarioId: usuario.id,
                texto: `Pedido ${pedido.numeroPedido} fue devuelto`,
                referencia: `Cliente: ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                referenciaId: pedido.id,
                tipo: 'pedido-devuelto',
                leida: false,
                fecha: new Date().toISOString()
            };
            
            app.notificaciones.push(notificacion);
        });
    }
    
    // Actualizar contador global de notificaciones
    actualizarContadorNotificaciones();
}

// Validar transición de estado
function validarTransicionEstado(estadoActual, nuevoEstado) {
    // Definir transiciones permitidas
    const transicionesPermitidas = {
        'buscando-conductor': ['conductor-asignado', 'anulado'],
        'conductor-asignado': ['en-proceso', 'anulado'],
        'en-proceso': ['entregado-pendiente', 'finalizado', 'devuelto', 'anulado'],
        'entregado-pendiente': ['finalizado', 'anulado'],
        'devuelto': ['buscando-conductor', 'anulado'],
        'finalizado': ['anulado']
    };
    
    // Verificar si la transición está permitida
    return transicionesPermitidas[estadoActual] && 
           transicionesPermitidas[estadoActual].includes(nuevoEstado);
}

// Anular pedido
function anularPedido(pedidoId) {
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        showToast('Pedido no encontrado', 'error');
        return;
    }
    
    // Verificar permisos - solo usuario maestro puede anular
    if (!validarPermiso('anular_pedido')) {
        showToast('No tienes permisos para anular pedidos', 'error');
        return;
    }
    
    // Verificar estado - solo se puede anular si está en "buscando conductor"
    if (pedido.estado !== 'buscando-conductor') {
        showToast('Solo se pueden anular pedidos en estado "Buscando Conductor"', 'error');
        return;
    }
    
    // Configurar mensaje de confirmación
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmationTitle = document.getElementById('confirmation-title');
    
    confirmationTitle.textContent = 'Anular Pedido';
    confirmationMessage.textContent = `¿Estás seguro de anular el pedido ${pedido.numeroPedido}? Esta acción no se puede deshacer.`;
    
    // Configurar botón de confirmación
    const confirmButton = document.getElementById('confirm-action-btn');
    
    // Limpiar eventos anteriores
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    
    // Obtener el nuevo botón
    const newConfirmButton = document.getElementById('confirm-action-btn');
    
    // Añadir evento
    newConfirmButton.addEventListener('click', () => {
        // Guardar estado anterior
        const estadoAnterior = pedido.estado;
        
        // Cambiar estado
        pedido.estado = 'anulado';
        
        // Añadir al historial
        pedido.historial.push({
            fecha: new Date().toISOString(),
            estado: 'anulado',
            usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`
        });
        
        // Añadir comentario automático
        const comentario = {
            id: Date.now(),
            texto: `Pedido anulado. Estado anterior: "${getEstadoLabel(estadoAnterior)}"`,
            usuario: `${app.currentUser.nombre} ${app.currentUser.apellido}`,
            fecha: new Date().toISOString()
        };
        
        pedido.comentarios.push(comentario);
        
        // Notificar al vendedor que creó el pedido
        if (pedido.creador && pedido.creador.id !== app.currentUser.id) {
            const notificacion = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                usuarioId: pedido.creador.id,
                texto: `Pedido ${pedido.numeroPedido} ha sido anulado`,
                referencia: `Cliente: ${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                referenciaId: pedidoId,
                tipo: 'pedido-anulado',
                leida: false,
                fecha: new Date().toISOString()
            };
            
            app.notificaciones.push(notificacion);
            actualizarContadorNotificaciones();
        }
        
        // Cerrar modal de confirmación
        closeModal('confirmation-modal');
        
        // Actualizar vista de detalle
        openPedidoDetail(pedidoId);
        
        // Actualizar tabla si estamos en la vista de pedidos
        if (app.currentModule === 'pedidos') {
            updatePedidosTable();
        }
        
        // Actualizar dashboard si estamos en la pantalla principal
        if (app.currentModule === 'dashboard') {
            updateDashboard();
        }
        
        // Mostrar notificación de éxito
        showToast(`Pedido ${pedido.numeroPedido} anulado correctamente`, 'warning');
    });
    
    // Abrir modal de confirmación
    openModal('confirmation-modal');
}
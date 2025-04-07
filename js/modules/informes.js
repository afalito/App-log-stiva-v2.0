// Inicialización del módulo de informes
function initInformesModule() {
    // Esta función se llama al iniciar la aplicación
    console.log('Módulo de informes inicializado');
}

// Configuración de eventos para el módulo de informes
function setupInformesEvents() {
    // Evento para el botón de generar informe
    const generarInformeBtn = document.getElementById('generar-informe-btn');
    if (generarInformeBtn) {
        generarInformeBtn.addEventListener('click', () => {
            generarInforme();
        });
    }
    
    // Evento para el checkbox "Todos"
    const checkboxTodos = document.querySelector('input[value="todos"]');
    if (checkboxTodos) {
        checkboxTodos.addEventListener('change', () => {
            const estadosCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:not([value="todos"])');
            estadosCheckboxes.forEach(checkbox => {
                checkbox.checked = checkboxTodos.checked;
                checkbox.disabled = checkboxTodos.checked;
            });
        });
    }
    
    // Eventos para los checkboxes de estados
    const estadosCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:not([value="todos"])');
    estadosCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const allChecked = Array.from(estadosCheckboxes).every(cb => cb.checked);
            const noneChecked = Array.from(estadosCheckboxes).every(cb => !cb.checked);
            
            const checkboxTodos = document.querySelector('input[value="todos"]');
            if (checkboxTodos) {
                // Si todos están marcados, marcar "Todos"
                if (allChecked) {
                    checkboxTodos.checked = true;
                    estadosCheckboxes.forEach(cb => cb.disabled = true);
                } else {
                    checkboxTodos.checked = false;
                    estadosCheckboxes.forEach(cb => cb.disabled = false);
                }
                
                // Si ninguno está marcado, marcar "Todos"
                if (noneChecked) {
                    checkboxTodos.checked = true;
                    estadosCheckboxes.forEach(cb => cb.disabled = true);
                }
            }
        });
    });
    
    // Inicializar fechas
    const fechaDesde = document.getElementById('informe-fecha-desde');
    const fechaHasta = document.getElementById('informe-fecha-hasta');
    
    if (fechaDesde && fechaHasta) {
        // Configurar fecha desde a 30 días atrás
        const treintaDiasAtras = new Date();
        treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
        fechaDesde.valueAsDate = treintaDiasAtras;
        
        // Configurar fecha hasta a hoy
        const hoy = new Date();
        fechaHasta.valueAsDate = hoy;
    }
}

// Generar informe
function generarInforme() {
    // Obtener fechas
    const fechaDesde = document.getElementById('informe-fecha-desde').value;
    const fechaHasta = document.getElementById('informe-fecha-hasta').value;
    
    // Validar fechas
    if (!fechaDesde || !fechaHasta) {
        showToast('Las fechas son obligatorias', 'error');
        return;
    }
    
    // Convertir fechas a objetos Date
    const dateDesde = new Date(fechaDesde);
    const dateHasta = new Date(fechaHasta);
    dateHasta.setHours(23, 59, 59, 999); // Incluir todo el día
    
    // Validar rango de fechas
    if (dateDesde > dateHasta) {
        showToast('La fecha desde no puede ser posterior a la fecha hasta', 'error');
        return;
    }
    
    // Obtener estados seleccionados
    let estadosSeleccionados = [];
    
    // Verificar si "Todos" está seleccionado
    const checkboxTodos = document.querySelector('input[value="todos"]');
    if (checkboxTodos && checkboxTodos.checked) {
        estadosSeleccionados = ['buscando-conductor', 'conductor-asignado', 'en-proceso', 'entregado-pendiente', 'finalizado', 'devuelto', 'anulado'];
    } else {
        // Obtener estados seleccionados
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(checkbox => {
            if (checkbox.value !== 'todos') {
                estadosSeleccionados.push(checkbox.value);
            }
        });
    }
    
    // Validar que al menos un estado esté seleccionado
    if (estadosSeleccionados.length === 0) {
        showToast('Debes seleccionar al menos un estado', 'error');
        return;
    }
    
    // Filtrar pedidos según criterios
    let pedidosFiltrados = app.pedidos.filter(pedido => {
        const fechaPedido = new Date(pedido.fechaCreacion);
        const cumpleFecha = fechaPedido >= dateDesde && fechaPedido <= dateHasta;
        const cumpleEstado = estadosSeleccionados.includes(pedido.estado);
        
        // Si es vendedor, solo sus pedidos
        if (app.currentUser.rol === 'vendedor') {
            return cumpleFecha && cumpleEstado && pedido.creador.id === app.currentUser.id;
        }
        
        return cumpleFecha && cumpleEstado;
    });
    
    // Verificar si hay pedidos
    if (pedidosFiltrados.length === 0) {
        showToast('No hay pedidos que coincidan con los criterios seleccionados', 'warning');
        
        // Mostrar mensaje en la vista previa
        const previewContent = document.querySelector('.preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-search"></i>
                    <p>No hay datos para mostrar</p>
                </div>
            `;
        }
        
        return;
    }
    
    // Generar vista previa del informe
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) {
        // Mostrar tabla con datos de muestra (primeros 5 pedidos)
        const muestraPedidos = pedidosFiltrados.slice(0, 5);
        
        previewContent.innerHTML = `
            <div class="informe-resumen">
                <p><strong>Total de pedidos:</strong> ${pedidosFiltrados.length}</p>
                <p><strong>Período:</strong> ${formatDate(fechaDesde)} - ${formatDate(fechaHasta)}</p>
                <button class="btn btn-primary" onclick="descargarInforme()">
                    <i class="fas fa-download"></i> Descargar Informe
                </button>
            </div>
            <div class="informe-preview-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${muestraPedidos.map(pedido => `
                            <tr>
                                <td>${pedido.numeroPedido}</td>
                                <td>${pedido.cliente.nombre} ${pedido.cliente.apellido}</td>
                                <td>${formatDate(pedido.fechaCreacion)}</td>
                                <td><span class="status-badge status-${pedido.estado}">${getEstadoLabel(pedido.estado)}</span></td>
                                <td>${formatCurrency(pedido.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${pedidosFiltrados.length > 5 ? `<p class="preview-note">Mostrando 5 de ${pedidosFiltrados.length} pedidos. Descarga el informe para ver todos.</p>` : ''}
            </div>
        `;
    }
    
    // Guardar datos para descargar
    window.informeData = {
        pedidos: pedidosFiltrados,
        fechaDesde,
        fechaHasta,
        estados: estadosSeleccionados
    };
    
    showToast(`Informe generado con ${pedidosFiltrados.length} pedidos`, 'success');
}

// Descargar informe
function descargarInforme() {
    // Verificar que haya datos para descargar
    if (!window.informeData || !window.informeData.pedidos.length) {
        showToast('No hay datos para descargar', 'error');
        return;
    }
    
    // Obtener datos del informe
    const { pedidos, fechaDesde, fechaHasta } = window.informeData;
    
    try {
        // Convertir datos a formato CSV
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Encabezados
        csvContent += 'Número Pedido,Cliente,Dirección,Ciudad,Departamento,Fecha Creación,Estado,Tipo Pago,Producto,Cantidad,Precio,Subtotal,Total Pedido,Creador,Conductor,Comentarios\n';
        
        // Datos
        pedidos.forEach(pedido => {
            // Si el pedido no tiene productos, crear una fila sin productos
            if (pedido.productos.length === 0) {
                const row = [
                    pedido.numeroPedido,
                    `${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                    pedido.cliente.direccion,
                    pedido.cliente.ciudad,
                    pedido.cliente.departamento,
                    formatDate(pedido.fechaCreacion),
                    getEstadoLabel(pedido.estado),
                    pedido.tipoPago === 'contraentrega' ? 'Pago Contraentrega' : 'Pago Anticipado',
                    '', // Producto
                    '', // Cantidad
                    '', // Precio
                    '', // Subtotal
                    formatCurrency(pedido.total),
                    `${pedido.creador.nombre} ${pedido.creador.apellido}`,
                    pedido.conductor ? `${pedido.conductor.nombre} ${pedido.conductor.apellido}` : 'Sin asignar',
                    pedido.comentarios.length
                ].map(cell => `"${cell}"`).join(',');
                
                csvContent += row + '\n';
            } else {
                // Si el pedido tiene productos, crear una fila por cada producto
                pedido.productos.forEach((producto, index) => {
                    const row = [
                        pedido.numeroPedido,
                        `${pedido.cliente.nombre} ${pedido.cliente.apellido}`,
                        pedido.cliente.direccion,
                        pedido.cliente.ciudad,
                        pedido.cliente.departamento,
                        formatDate(pedido.fechaCreacion),
                        getEstadoLabel(pedido.estado),
                        pedido.tipoPago === 'contraentrega' ? 'Pago Contraentrega' : 'Pago Anticipado',
                        producto.nombre,
                        producto.cantidad,
                        formatCurrency(producto.precioUnitario),
                        formatCurrency(producto.subtotal),
                        index === 0 ? formatCurrency(pedido.total) : '', // Solo mostrar el total en la primera fila
                        `${pedido.creador.nombre} ${pedido.creador.apellido}`,
                        pedido.conductor ? `${pedido.conductor.nombre} ${pedido.conductor.apellido}` : 'Sin asignar',
                        index === 0 ? pedido.comentarios.length : '' // Solo mostrar comentarios en la primera fila
                    ].map(cell => `"${cell}"`).join(',');
                    
                    csvContent += row + '\n';
                });
            }
        });
        
        // Crear un enlace temporal para descargar
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `informe_pedidos_${formatDateFile(fechaDesde)}_${formatDateFile(fechaHasta)}.csv`);
        document.body.appendChild(link);
        
        // Hacer clic en el enlace y luego eliminarlo
        link.click();
        document.body.removeChild(link);
        
        showToast('Informe descargado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar el informe:', error);
        showToast('Error al generar el informe', 'error');
    }
}

// Formatear fecha para nombre de archivo
function formatDateFile(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}${month}${year}`;
}
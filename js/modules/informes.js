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
    
    // Ordenar pedidos por fecha (más recientes primero)
    pedidosFiltrados.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    // Generar vista completa del informe (ya no solo vista previa)
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) {
        previewContent.innerHTML = `
            <div class="informe-resumen">
                <p><strong>Total de pedidos:</strong> ${pedidosFiltrados.length}</p>
                <p><strong>Período:</strong> ${formatDate(fechaDesde)} - ${formatDate(fechaHasta)}</p>
                <div class="informe-actions">
                    <button class="btn btn-primary" onclick="imprimirInforme()">
                        <i class="fas fa-print"></i> Imprimir Informe
                    </button>
                    <button class="btn btn-success" onclick="descargarInformeExcel()">
                        <i class="fas fa-file-excel"></i> Descargar Excel
                    </button>
                </div>
            </div>
            <div class="informe-table-container">
                <table class="informe-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Dirección</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Productos</th>
                            <th>Total</th>
                            <th>Creador</th>
                            <th>Conductor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidosFiltrados.map(pedido => `
                            <tr class="${pedido.estado === 'anulado' ? 'anulado' : ''}">
                                <td>${pedido.numeroPedido}</td>
                                <td>${pedido.cliente.nombre} ${pedido.cliente.apellido}</td>
                                <td>${pedido.cliente.direccion}, ${pedido.cliente.ciudad}</td>
                                <td>${formatDate(pedido.fechaCreacion)}</td>
                                <td><span class="status-badge status-${pedido.estado}">${getEstadoLabel(pedido.estado)}</span></td>
                                <td>${pedido.productos.map(p => `${p.cantidad} x ${p.nombre}`).join('<br>')}</td>
                                <td>${formatCurrency(pedido.total)}</td>
                                <td>${pedido.creador ? pedido.creador.nombre + ' ' + pedido.creador.apellido : '-'}</td>
                                <td>${pedido.conductor ? pedido.conductor.nombre + ' ' + pedido.conductor.apellido : 'Sin asignar'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    showToast(`Informe generado con ${pedidosFiltrados.length} pedidos`, 'success');
}

// Función para imprimir el informe
function imprimirInforme() {
    // Crear una ventana nueva para imprimir
    const printWindow = window.open('', '_blank');
    
    // Obtener datos del informe actual
    const informeTable = document.querySelector('.informe-table');
    const informeResumen = document.querySelector('.informe-resumen');
    
    if (!informeTable || !informeResumen) {
        showToast('No hay informe para imprimir', 'error');
        if (printWindow) printWindow.close();
        return;
    }
    
    // Extraer información de resumen
    const totalPedidos = informeResumen.querySelector('p:first-child').textContent;
    const periodo = informeResumen.querySelector('p:nth-child(2)').textContent;
    
    // Crear HTML para la ventana de impresión
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Informe de Pedidos - Fluxon Logistics</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #013AFB;
                }
                .report-subtitle {
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                }
                .report-info p {
                    margin: 5px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                tr.anulado {
                    text-decoration: line-through;
                    color: #999;
                }
                .status-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .status-buscando-conductor { background-color: #e0f7fa; color: #006064; }
                .status-conductor-asignado { background-color: #e8f5e9; color: #2e7d32; }
                .status-en-proceso { background-color: #fff8e1; color: #ff6f00; }
                .status-entregado-pendiente { background-color: #e8eaf6; color: #303f9f; }
                .status-finalizado { background-color: #e8f5e9; color: #2e7d32; }
                .status-devuelto { background-color: #ffebee; color: #c62828; }
                .status-anulado { background-color: #f5f5f5; color: #757575; }
                .print-footer {
                    text-align: center;
                    font-size: 12px;
                    margin-top: 30px;
                    color: #666;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">Fluxon Logistics</div>
                <div class="report-subtitle">Informe de Pedidos</div>
            </div>
            
            <div class="report-info">
                <div>
                    <p><strong>Usuario:</strong> ${app.currentUser.nombre} ${app.currentUser.apellido}</p>
                    <p><strong>Rol:</strong> ${getRoleName(app.currentUser.rol)}</p>
                </div>
                <div>
                    <p>${totalPedidos}</p>
                    <p>${periodo}</p>
                    <p><strong>Fecha de generación:</strong> ${formatDateTime(new Date())}</p>
                </div>
            </div>
            
            ${informeTable.outerHTML}
            
            <div class="print-footer">
                <p>© ${new Date().getFullYear()} Fluxon Logistics - Informe generado el ${formatDateTime(new Date())}</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print();" style="padding: 10px 20px; background-color: #013AFB; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-print"></i> Imprimir Informe
                </button>
                <button onclick="window.close();" style="padding: 10px 20px; background-color: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; margin-left: 10px; cursor: pointer;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
            <div class="print-footer no-print" style="text-align: center; margin-top: 10px; font-size: 12px; color: #999;">
                * La impresión puede variar según la configuración de su navegador. Para mejores resultados, utilice Chrome o Edge.
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Función para descargar el informe en formato Excel
function descargarInformeExcel() {
    // Verificar que hay un informe generado
    const informeTable = document.querySelector('.informe-table');
    if (!informeTable) {
        showToast('No hay informe para descargar', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        const appLoader = document.getElementById('app-loader');
        if (appLoader) appLoader.style.display = 'flex';
        
        // Obtener datos del informe
        const rows = [];
        
        // Primero los encabezados
        const headers = [];
        informeTable.querySelectorAll('thead th').forEach(th => {
            headers.push(th.textContent);
        });
        rows.push(headers);
        
        // Luego las filas de datos
        informeTable.querySelectorAll('tbody tr').forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('td').forEach((td, index) => {
                // Para la columna de productos, quitar los <br> y usar comas
                if (index === 5) { // índice de la columna Productos
                    rowData.push(td.innerHTML.replace(/<br>/g, ', '));
                } 
                // Para la columna de estado, obtener solo el texto sin el badge
                else if (index === 4) { // índice de la columna Estado
                    rowData.push(td.textContent);
                } 
                else {
                    rowData.push(td.textContent);
                }
            });
            rows.push(rowData);
        });
        
        // Crear una hoja de cálculo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        
        // Obtener período desde el resumen
        const periodoText = document.querySelector('.informe-resumen p:nth-child(2)').textContent;
        const periodo = periodoText.split(':')[1].trim();
        
        // Configurar nombre del archivo
        const filename = `Informe_Pedidos_${periodo.replace(/\//g, '-')}.xlsx`;
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        
        // Descargar el archivo
        XLSX.writeFile(wb, filename);
        
        // Ocultar loading y mostrar mensaje de éxito
        if (appLoader) appLoader.style.display = 'none';
        showToast('Informe descargado correctamente', 'success');
    } catch (error) {
        // Mostrar error
        console.error('Error al generar el archivo Excel:', error);
        showToast('Error al generar el archivo Excel', 'error');
        
        // Ocultar loading
        const appLoader = document.getElementById('app-loader');
        if (appLoader) appLoader.style.display = 'none';
    }
}


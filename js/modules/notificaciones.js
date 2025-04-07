// Inicialización del módulo de notificaciones
function initNotificacionesModule() {
    // Esta función se llama al iniciar la aplicación
    console.log('Módulo de notificaciones inicializado');
    
    // Evento para el ícono de notificaciones en la barra superior
    const notificationsIcon = document.querySelector('.notifications-icon');
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            changeModule('notificaciones');
        });
    }
    
    // Verificar soporte para notificaciones web
    if ('Notification' in window && typeof sendNotification === 'function') {
        console.log('Sistema de notificaciones web disponible');
        
        // Intentar obtener permiso para notificaciones si no se ha decidido
        if (Notification.permission === 'default') {
            requestNotificationPermission();
        }
    }
}

// Configuración de eventos para el módulo de notificaciones
function setupNotificacionesEvents() {
    // Evento para marcar todas como leídas
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            marcarTodasComoLeidas();
        });
    }
}

// Actualizar lista de notificaciones
function updateNotificacionesList() {
    const notificacionesList = document.getElementById('notificaciones-list');
    if (!notificacionesList) return;
    
    // Filtrar notificaciones para el usuario actual
    const notificacionesUsuario = app.notificaciones.filter(n => 
        n.usuarioId === app.currentUser.id
    );
    
    // Ordenar por fecha (más recientes primero)
    notificacionesUsuario.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
    );
    
    // Mostrar mensaje si no hay notificaciones
    if (notificacionesUsuario.length === 0) {
        notificacionesList.innerHTML = `
            <li class="empty-state">
                <div class="empty-message">
                    <i class="fas fa-bell"></i>
                    <p>No tienes notificaciones</p>
                </div>
            </li>
        `;
        return;
    }
    
    // Generar HTML para cada notificación
    const notificacionesHTML = notificacionesUsuario.map(notificacion => `
        <li class="notificacion-item ${notificacion.leida ? '' : 'unread'}" data-notificacion-id="${notificacion.id}" onclick="abrirNotificacion(${notificacion.id})">
            <div class="notificacion-header">
                <span class="notificacion-message">${notificacion.texto}</span>
                <span class="notificacion-time">${formatTimeAgo(notificacion.fecha)}</span>
            </div>
            <div class="notificacion-reference">${notificacion.referencia}</div>
        </li>
    `).join('');
    
    notificacionesList.innerHTML = notificacionesHTML;
}

// Abrir notificación
function abrirNotificacion(notificacionId) {
    // Buscar notificación
    const notificacion = app.notificaciones.find(n => n.id === notificacionId);
    
    if (!notificacion) {
        showToast('Notificación no encontrada', 'error');
        return;
    }
    
    // Marcar como leída
    notificacion.leida = true;
    
    // Actualizar contador de notificaciones
    actualizarContadorNotificaciones();
    
    // Actualizar UI de notificaciones
    updateNotificacionesList();
    
    // Abrir recurso relacionado según el tipo
    if (notificacion.tipo === 'pedido-mencion' && notificacion.referenciaId) {
        // Si estamos en otra página, ir a pedidos primero
        if (app.currentModule !== 'pedidos') {
            changeModule('pedidos');
        }
        
        // Abrir detalle del pedido
        openPedidoDetail(notificacion.referenciaId);
    }
}

// Marcar todas las notificaciones como leídas
function marcarTodasComoLeidas() {
    // Buscar notificaciones no leídas del usuario actual
    const notificacionesPendientes = app.notificaciones.filter(n => 
        n.usuarioId === app.currentUser.id && !n.leida
    );
    
    if (notificacionesPendientes.length === 0) {
        showToast('No tienes notificaciones pendientes', 'info');
        return;
    }
    
    // Marcar todas como leídas
    notificacionesPendientes.forEach(n => {
        n.leida = true;
    });
    
    // Actualizar contador de notificaciones
    actualizarContadorNotificaciones();
    
    // Actualizar UI de notificaciones
    updateNotificacionesList();
    
    showToast(`${notificacionesPendientes.length} notificaciones marcadas como leídas`, 'success');
}

// Formatear tiempo relativo (hace x minutos, hace x horas, etc.)
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'hace unos segundos';
    } else if (diffMin < 60) {
        return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    } else if (diffHour < 24) {
        return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
    } else if (diffDay < 7) {
        return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    } else {
        return formatDate(dateString);
    }
}
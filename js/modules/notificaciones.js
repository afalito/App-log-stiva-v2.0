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
async function updateNotificacionesList() {
    const notificacionesList = document.getElementById('notificaciones-list');
    if (!notificacionesList) return;
    
    // Primero intentamos cargar las notificaciones recientes desde Supabase
    try {
        await cargarNotificacionesDesdeSupabase();
    } catch (error) {
        console.error('Error al cargar notificaciones desde Supabase:', error);
    }
    
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

// Cargar notificaciones desde Supabase
async function cargarNotificacionesDesdeSupabase() {
    if (!app.currentUser) return;
    
    try {
        const supabase = getSupabaseClient();
        
        // Consultar notificaciones del usuario
        const { data, error } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('usuario_id', app.currentUser.id)
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
            // Transformar a formato compatible con la aplicación
            app.notificaciones = data.map(n => ({
                id: n.id,
                usuarioId: n.usuario_id,
                texto: n.texto,
                referencia: n.referencia,
                referenciaId: n.referencia_id,
                tipo: n.tipo,
                leida: n.leida,
                fecha: n.fecha
            }));
            
            // Actualizar contador de notificaciones
            actualizarContadorNotificaciones();
            
            console.log(`${data.length} notificaciones cargadas desde Supabase`);
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        throw error;
    }
}

// Abrir notificación
async function abrirNotificacion(notificacionId) {
    // Buscar notificación
    const notificacion = app.notificaciones.find(n => n.id === notificacionId);
    
    if (!notificacion) {
        showToast('Notificación no encontrada', 'error');
        return;
    }
    
    // Marcar como leída en local y en Supabase
    notificacion.leida = true;
    
    try {
        const supabase = getSupabaseClient();
        // Actualizar en Supabase
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', notificacionId);
        
        if (error) {
            console.error('Error al actualizar notificación en Supabase:', error);
            showToast('Error al actualizar notificación', 'error');
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
    
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
async function marcarTodasComoLeidas() {
    // Buscar notificaciones no leídas del usuario actual
    const notificacionesPendientes = app.notificaciones.filter(n => 
        n.usuarioId === app.currentUser.id && !n.leida
    );
    
    if (notificacionesPendientes.length === 0) {
        showToast('No tienes notificaciones pendientes', 'info');
        return;
    }
    
    // Marcar todas como leídas localmente
    notificacionesPendientes.forEach(n => {
        n.leida = true;
    });
    
    try {
        const supabase = getSupabaseClient();
        
        // Obtener los IDs de las notificaciones pendientes
        const ids = notificacionesPendientes.map(n => n.id);
        
        // Actualizar todas en Supabase
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .in('id', ids);
        
        if (error) {
            console.error('Error al actualizar notificaciones en Supabase:', error);
            showToast('Error al actualizar notificaciones', 'error');
        }
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
    
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
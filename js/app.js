// Variables globales
const app = {
    currentUser: null,
    currentModule: 'dashboard',
    modules: ['dashboard', 'pedidos', 'productos', 'informes', 'usuarios', 'notificaciones'],
    pedidos: [],
    productos: [],
    usuarios: [],
    notificaciones: [],
    nextPedidoId: 1
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando aplicación...");
    
    // Mostrar el cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'flex';
    }
    
    // Cargar datos de ejemplo para desarrollo PRIMERO
    console.log("Cargando datos de usuarios de ejemplo...");
    loadDummyData();
    console.log("Usuarios cargados:", app.usuarios.length);
    
    // Iniciar la auth
    initAuth();
    
    // Inicializar módulos
    initModules();
    
    // Inicializar UI components
    initUI();
    
    // Después cargar usuario desde localStorage 
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            app.currentUser = JSON.parse(savedUser);
            loginSuccess();
        } catch (error) {
            console.error('Error al cargar el usuario:', error);
        }
    }
    
    // Si estamos en el dashboard, asegurarse de que el gráfico se cargue correctamente
    if (app.currentModule === 'dashboard') {
        // Dar tiempo para que el canvas se renderice antes de crear el gráfico
        setTimeout(() => {
            updateDashboard();
        }, 100);
    }
    
    // Ocultar el cargador después de completar todas las inicializaciones
    if (appLoader) {
        appLoader.style.display = 'none';
    }
});

// Inicialización de módulos
function initModules() {
    // Inicializar pedidos
    if (typeof initPedidosModule === 'function') {
        initPedidosModule();
    }
    
    // Inicializar productos
    if (typeof initProductosModule === 'function') {
        initProductosModule();
    }
    
    // Inicializar usuarios
    if (typeof initUsuariosModule === 'function') {
        initUsuariosModule();
    }
    
    // Inicializar informes
    if (typeof initInformesModule === 'function') {
        initInformesModule();
    }
    
    // Inicializar notificaciones
    if (typeof initNotificacionesModule === 'function') {
        initNotificacionesModule();
    }
}

// Inicialización de la UI
function initUI() {
    // Eventos del menú lateral y móvil
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const module = item.getAttribute('data-module');
            if (!module) return;
            
            // Si es el menú "más" en móvil, mostrar menú adicional
            if (module === 'menu') {
                toggleMobileMenu();
                return;
            }
            
            // Para otros módulos, cambiar a ese módulo
            changeModule(module);
        });
    });
    
    // Evento de perfil de usuario
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userProfile && userDropdown) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }
    
    // Evento de cierre de sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Eventos para los modales
    setupModals();
    
    // Detectar cambios de tamaño de pantalla para móvil/escritorio
    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar una vez al inicio
}

// Configuración de modales
function setupModals() {
    // Evento para cerrar modales
    document.querySelectorAll('.close-modal, .modal').forEach(element => {
        element.addEventListener('click', (e) => {
            if (e.target === element) {
                closeAllModals();
            }
        });
    });
    
    // Evitar que el click en el contenido del modal cierre el modal
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

// Función para cambiar de módulo
function changeModule(moduleName) {
    if (!app.modules.includes(moduleName)) return;
    
    // Actualizar módulo activo
    app.currentModule = moduleName;
    
    // Actualizar menú
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('data-module') === moduleName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Actualizar título de la página
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        const moduleTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        pageTitle.textContent = moduleTitle;
    }
    
    // Cargar contenido del módulo
    loadModuleContent(moduleName);
}

// Cargar contenido del módulo
function loadModuleContent(moduleName) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    
    // Si el módulo es dashboard, mostrarlo directamente
    if (moduleName === 'dashboard') {
        const dashboardModule = document.getElementById('dashboard-module');
        if (dashboardModule) {
            dashboardModule.classList.add('active');
            
            // Ejecutar updateDashboard de inmediato y luego de nuevo después de un breve retraso
            // para asegurar que el canvas esté completamente renderizado
            updateDashboard();
            
            // Segunda ejecución después de 50ms para asegurar que el DOM esté completamente actualizado
            setTimeout(() => {
                if (app.currentModule === 'dashboard') {
                    updateDashboard();
                }
            }, 50);
        }
        return;
    }
    
    // Para otros módulos, cargar desde template
    const moduleTemplate = document.getElementById(`${moduleName}-template`);
    const mainContent = document.getElementById('main-content');
    
    if (moduleTemplate && mainContent) {
        // Buscar si ya existe el módulo
        let moduleElement = document.getElementById(`${moduleName}-module`);
        
        if (!moduleElement) {
            // Crear el módulo a partir del template
            moduleElement = document.createElement('div');
            moduleElement.id = `${moduleName}-module`;
            moduleElement.className = 'module';
            moduleElement.innerHTML = moduleTemplate.innerHTML;
            mainContent.appendChild(moduleElement);
            
            // Inicializar eventos específicos del módulo
            if (moduleName === 'pedidos' && typeof setupPedidosEvents === 'function') {
                setupPedidosEvents();
            } else if (moduleName === 'productos' && typeof setupProductosEvents === 'function') {
                setupProductosEvents();
            } else if (moduleName === 'usuarios' && typeof setupUsuariosEvents === 'function') {
                setupUsuariosEvents();
            } else if (moduleName === 'informes' && typeof setupInformesEvents === 'function') {
                setupInformesEvents();
            } else if (moduleName === 'notificaciones' && typeof setupNotificacionesEvents === 'function') {
                setupNotificacionesEvents();
            }
        }
        
        // Mostrar el módulo y actualizar su contenido
        moduleElement.classList.add('active');
        
        // Actualizar datos del módulo
        updateModuleData(moduleName);
    }
}

// Actualizar datos del módulo
function updateModuleData(moduleName) {
    if (moduleName === 'pedidos' && typeof updatePedidosTable === 'function') {
        updatePedidosTable();
    } else if (moduleName === 'productos' && typeof updateProductosTable === 'function') {
        updateProductosTable();
    } else if (moduleName === 'usuarios' && typeof updateUsuariosTable === 'function') {
        updateUsuariosTable();
    } else if (moduleName === 'notificaciones' && typeof updateNotificacionesList === 'function') {
        updateNotificacionesList();
    }
}

// Actualizar dashboard
function updateDashboard() {
    // Filtrar pedidos según el rol del usuario
    let filteredPedidos = app.pedidos;
    
    if (app.currentUser.rol === 'vendedor') {
        // Vendedor solo ve sus propios pedidos
        filteredPedidos = filteredPedidos.filter(p => p.creador.id === app.currentUser.id);
    } else if (app.currentUser.rol === 'conductor') {
        // Conductor solo ve pedidos asignados a él
        filteredPedidos = filteredPedidos.filter(p => p.conductor && p.conductor.id === app.currentUser.id);
    } else if (app.currentUser.rol === 'bodega') {
        // Bodega ve pedidos en ciertos estados
        filteredPedidos = filteredPedidos.filter(p => ['buscando-conductor', 'conductor-asignado', 'en-proceso', 'devuelto'].includes(p.estado));
    } else if (app.currentUser.rol === 'tesoreria') {
        // Tesorería ve pedidos en ciertos estados
        filteredPedidos = filteredPedidos.filter(p => ['entregado-pendiente', 'finalizado'].includes(p.estado));
    }
    
    // Contadores
    const pedidosActivos = filteredPedidos.filter(p => 
        p.estado !== 'finalizado' && p.estado !== 'anulado').length;
    
    const pedidosEntrega = filteredPedidos.filter(p => 
        p.estado === 'en-proceso').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const finalizadosHoy = filteredPedidos.filter(p => {
        if (p.estado !== 'finalizado') return false;
        const pedidoDate = new Date(p.fechaFinalizacion);
        pedidoDate.setHours(0, 0, 0, 0);
        return pedidoDate.getTime() === today.getTime();
    }).length;
    
    const devoluciones = filteredPedidos.filter(p => 
        p.estado === 'devuelto').length;
    
    // Actualizar valores en el dashboard
    document.querySelectorAll('.card-value')[0].textContent = pedidosActivos;
    document.querySelectorAll('.card-value')[1].textContent = pedidosEntrega;
    document.querySelectorAll('.card-value')[2].textContent = finalizadosHoy;
    document.querySelectorAll('.card-value')[3].textContent = devoluciones;
    
    // Generar datos para el gráfico de pedidos por día
    const chartCanvas = document.getElementById('orders-chart');
    if (chartCanvas) {
        try {
            // Mostrar loader mientras se carga el gráfico
            const chartLoader = document.getElementById('chart-loader');
            if (chartLoader) {
                chartLoader.style.display = 'flex';
            }
            
            // Verificar que el canvas esté visible y tenga dimensiones válidas
            if (chartCanvas.offsetWidth === 0 || chartCanvas.offsetHeight === 0) {
                // Si el canvas no tiene dimensiones, puede que no esté visible aún
                // Intentamos de nuevo en el próximo frame de renderizado
                requestAnimationFrame(() => updateDashboard());
                return;
            }
            
            // Usamos los pedidos ya filtrados según el rol del usuario
            
            // Obtener los últimos 7 días
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                last7Days.push(d);
            }
            
            // Calcular pedidos por día de manera más eficiente
            const pedidosPorDia = new Array(7).fill(0);
            
            // Mapear fechas a índices para un conteo más rápido
            const dateMap = {};
            last7Days.forEach((day, index) => {
                dateMap[day.getTime()] = index;
            });
            
            // Contar pedidos para cada día
            filteredPedidos.forEach(pedido => {
                const pedidoDate = new Date(pedido.fechaCreacion);
                pedidoDate.setHours(0, 0, 0, 0);
                const dayIndex = dateMap[pedidoDate.getTime()];
                if (dayIndex !== undefined) {
                    pedidosPorDia[dayIndex]++;
                }
            });
            
            // Formatear etiquetas de fechas
            const labels = last7Days.map(d => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
            
            // Destruir gráfico anterior si existe
            if (window.ordersChart) {
                window.ordersChart.destroy();
            }
            
            // Ocultar loader una vez que el gráfico está listo para ser creado
            if (chartLoader) {
                chartLoader.style.display = 'none';
            }
            
            // Crear el gráfico con opciones optimizadas
            window.ordersChart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Pedidos',
                        data: pedidosPorDia,
                        backgroundColor: 'rgba(1, 58, 251, 0.3)',
                        borderColor: 'rgba(1, 58, 251, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 250 // Reducir duración de animación para carga más rápida
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error al crear el gráfico:', error);
        }
    }
}

// Abrir modal
function openModal(modalId) {
    // Asegurarse de que todos los demás modales estén cerrados
    if (modalId !== 'confirmation-modal') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.id !== modalId && modal.id !== 'confirmation-modal') {
                modal.classList.remove('show');
            }
        });
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Si es el modal de confirmación, darle un z-index más alto
        if (modalId === 'confirmation-modal') {
            modal.style.zIndex = '1100';
        }
    }
}

// Cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Resetear z-index si es el modal de confirmación
        if (modalId === 'confirmation-modal') {
            modal.style.zIndex = '';
        }
        
        // Solo restaurar el overflow si no hay otros modales visibles
        const modalVisible = document.querySelector('.modal.show');
        if (!modalVisible) {
            document.body.style.overflow = '';
        }
    }
}

// Cerrar todos los modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
        
        // Resetear z-index para todos los modales
        if (modal.id === 'confirmation-modal') {
            modal.style.zIndex = '';
        }
    });
    document.body.style.overflow = '';
}

// Mostrar notificación toast
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) return;
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Configurar icono según el tipo
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close">&times;</div>
    `;
    
    // Agregar el toast al contenedor
    toastContainer.appendChild(toast);
    
    // Evento de cierre
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
    }
    
    // Auto-eliminar después del tiempo especificado
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Validar permisos de acceso a un módulo según el rol del usuario
function validarAccesoModulo(moduleName) {
    // Si no hay usuario autenticado, no tiene acceso
    if (!app.currentUser) return false;
    
    // El dashboard es accesible para todos
    if (moduleName === 'dashboard') return true;
    
    // Pedidos: Todos tienen acceso
    if (moduleName === 'pedidos') return true;
    
    // Productos: Solo el usuario maestro
    if (moduleName === 'productos' && app.currentUser.rol === 'maestro') return true;
    
    // Informes: Vendedor, Bodega y Maestro
    if (moduleName === 'informes' && ['vendedor', 'bodega', 'maestro'].includes(app.currentUser.rol)) return true;
    
    // Usuarios: Solo el usuario maestro
    if (moduleName === 'usuarios' && app.currentUser.rol === 'maestro') return true;
    
    // Notificaciones: Todos tienen acceso
    if (moduleName === 'notificaciones') return true;
    
    // Por defecto, no tiene acceso
    return false;
}

// Función para validar permisos de acciones según el rol del usuario
function validarPermiso(accion, estadoPedido = null) {
    // Si no hay usuario autenticado, no tiene permisos
    if (!app.currentUser) return false;
    
    // Usuario Maestro tiene todos los permisos
    if (app.currentUser.rol === 'maestro') return true;
    
    switch (accion) {
        case 'crear_pedido':
            return app.currentUser.rol === 'vendedor';
        
        case 'ver_todos_pedidos':
            return ['bodega', 'tesoreria'].includes(app.currentUser.rol);
        
        case 'asignar_conductor':
            return app.currentUser.rol === 'bodega' && 
                  estadoPedido === 'buscando-conductor';
        
        case 'cambiar_estado':
            // Conductor puede cambiar algunos estados
            if (app.currentUser.rol === 'conductor') {
                return ['conductor-asignado', 'en-proceso'].includes(estadoPedido);
            }
            // Tesorería puede finalizar pedidos pendientes de pago
            if (app.currentUser.rol === 'tesoreria') {
                return estadoPedido === 'entregado-pendiente';
            }
            return false;
        
        case 'anular_pedido':
            return app.currentUser.rol === 'maestro'; // Solo el maestro puede anular
        
        case 'descargar_informes':
            return ['vendedor', 'bodega'].includes(app.currentUser.rol);
        
        case 'gestionar_productos':
        case 'gestionar_usuarios':
            return false; // Solo el maestro puede gestionar productos y usuarios
        
        case 'comentar_pedidos':
            return true; // Todos pueden comentar
            
        default:
            return false;
    }
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formatear fecha y hora
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Obtener etiqueta de estado para mostrar
function getEstadoLabel(estado) {
    const estados = {
        'buscando-conductor': 'Buscando Conductor',
        'conductor-asignado': 'Conductor Asignado',
        'en-proceso': 'En Proceso de Entrega',
        'entregado-pendiente': 'Entregado, Pendiente Pagar',
        'finalizado': 'Finalizado',
        'devuelto': 'Devuelto',
        'anulado': 'Anulado'
    };
    
    return estados[estado] || estado;
}

// Cargar datos de ejemplo para desarrollo
function loadDummyData() {
    // Crear usuarios de ejemplo si no existen
    if (app.usuarios.length === 0) {
        app.usuarios = [
            {
                id: 1,
                nombre: 'Admin',
                apellido: 'Sistema',
                username: 'admin',
                password: 'admin123',
                rol: 'maestro',
                activo: true
            },
            {
                id: 2,
                nombre: 'Juan',
                apellido: 'Pérez',
                username: 'vendedor',
                password: 'vendedor123',
                rol: 'vendedor',
                activo: true
            },
            {
                id: 3,
                nombre: 'María',
                apellido: 'López',
                username: 'bodega',
                password: 'bodega123',
                rol: 'bodega',
                activo: true
            },
            {
                id: 4,
                nombre: 'Carlos',
                apellido: 'Gómez',
                username: 'conductor',
                password: 'conductor123',
                rol: 'conductor',
                activo: true
            },
            {
                id: 5,
                nombre: 'Laura',
                apellido: 'Martínez',
                username: 'tesoreria',
                password: 'tesoreria123',
                rol: 'tesoreria',
                activo: true
            }
        ];
    }
    
    // Crear productos de ejemplo si no existen
    if (app.productos.length === 0) {
        app.productos = [
            {
                id: 1,
                nombre: 'Laptop HP Pavilion',
                descripcion: 'Laptop de 15" con procesador Intel i5, 8GB RAM, 512GB SSD',
                precio: 2500000
            },
            {
                id: 2,
                nombre: 'Monitor Dell 24"',
                descripcion: 'Monitor FHD de 24 pulgadas con panel IPS',
                precio: 750000
            },
            {
                id: 3,
                nombre: 'Teclado Mecánico Logitech',
                descripcion: 'Teclado mecánico RGB con switches Blue',
                precio: 320000
            },
            {
                id: 4,
                nombre: 'Mouse Inalámbrico',
                descripcion: 'Mouse ergonómico con conexión bluetooth',
                precio: 85000
            },
            {
                id: 5,
                nombre: 'Auriculares Sony',
                descripcion: 'Auriculares inalámbricos con cancelación de ruido',
                precio: 650000
            },
            {
                id: 6,
                nombre: 'Tablet Samsung',
                descripcion: 'Tablet Android de 10" con 64GB de almacenamiento',
                precio: 900000
            }
        ];
    }
    
    // Crear pedidos de ejemplo si no existen
    if (app.pedidos.length === 0) {
        const fechaHoy = new Date();
        const fechaAyer = new Date(fechaHoy);
        fechaAyer.setDate(fechaAyer.getDate() - 1);
        const fechaAnteayer = new Date(fechaHoy);
        fechaAnteayer.setDate(fechaAnteayer.getDate() - 2);
        const fechaSemanaPasada = new Date(fechaHoy);
        fechaSemanaPasada.setDate(fechaSemanaPasada.getDate() - 6);
        
        app.pedidos = [
            {
                id: 1,
                numeroPedido: 'FX001',
                cliente: {
                    nombre: 'Pedro',
                    apellido: 'Ramírez',
                    direccion: 'Calle 123',
                    ciudad: 'Bogotá',
                    departamento: 'Cundinamarca'
                },
                productos: [
                    {
                        id: 1,
                        nombre: 'Laptop HP Pavilion',
                        cantidad: 1,
                        precioUnitario: 2500000,
                        subtotal: 2500000
                    },
                    {
                        id: 4,
                        nombre: 'Mouse Inalámbrico',
                        cantidad: 1,
                        precioUnitario: 85000,
                        subtotal: 85000
                    }
                ],
                total: 2585000,
                tipoPago: 'contraentrega',
                estado: 'buscando-conductor',
                fechaCreacion: fechaHoy.toISOString(),
                creador: app.usuarios[1], // Vendedor
                conductor: null,
                comentarios: [],
                historial: [
                    {
                        fecha: fechaHoy.toISOString(),
                        estado: 'buscando-conductor',
                        usuario: app.usuarios[1].nombre + ' ' + app.usuarios[1].apellido
                    }
                ]
            },
            {
                id: 2,
                numeroPedido: 'FX002',
                cliente: {
                    nombre: 'Ana',
                    apellido: 'Sánchez',
                    direccion: 'Carrera 45',
                    ciudad: 'Medellín',
                    departamento: 'Antioquia'
                },
                productos: [
                    {
                        id: 2,
                        nombre: 'Monitor Dell 24"',
                        cantidad: 2,
                        precioUnitario: 750000,
                        subtotal: 1500000
                    },
                    {
                        id: 3,
                        nombre: 'Teclado Mecánico Logitech',
                        cantidad: 1,
                        precioUnitario: 320000,
                        subtotal: 320000
                    }
                ],
                total: 1820000,
                tipoPago: 'anticipado',
                estado: 'en-proceso',
                fechaCreacion: fechaAyer.toISOString(),
                creador: app.usuarios[1], // Vendedor
                conductor: app.usuarios[3], // Conductor
                comentarios: [
                    {
                        id: 1,
                        texto: 'Pedido asignado a Carlos Gómez',
                        usuario: app.usuarios[2].nombre + ' ' + app.usuarios[2].apellido,
                        fecha: fechaAyer.toISOString()
                    },
                    {
                        id: 2,
                        texto: 'Confirmo recepción del pedido, procedo a entrega',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido,
                        fecha: fechaHoy.toISOString()
                    }
                ],
                historial: [
                    {
                        fecha: fechaAyer.toISOString(),
                        estado: 'buscando-conductor',
                        usuario: app.usuarios[1].nombre + ' ' + app.usuarios[1].apellido
                    },
                    {
                        fecha: fechaAyer.toISOString(),
                        estado: 'conductor-asignado',
                        usuario: app.usuarios[2].nombre + ' ' + app.usuarios[2].apellido
                    },
                    {
                        fecha: fechaHoy.toISOString(),
                        estado: 'en-proceso',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    }
                ]
            },
            {
                id: 3,
                numeroPedido: 'FX003',
                cliente: {
                    nombre: 'Carlos',
                    apellido: 'Mendoza',
                    direccion: 'Av. Principal 789',
                    ciudad: 'Cali',
                    departamento: 'Valle del Cauca'
                },
                productos: [
                    {
                        id: 5,
                        nombre: 'Auriculares Sony',
                        cantidad: 1,
                        precioUnitario: 650000,
                        subtotal: 650000
                    }
                ],
                total: 650000,
                tipoPago: 'contraentrega',
                estado: 'entregado-pendiente',
                fechaCreacion: fechaAnteayer.toISOString(),
                creador: app.usuarios[1], // Vendedor
                conductor: app.usuarios[3], // Conductor
                comentarios: [
                    {
                        id: 3,
                        texto: 'Pedido entregado con éxito. Pendiente recibir el pago.',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido,
                        fecha: fechaAyer.toISOString()
                    }
                ],
                historial: [
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'buscando-conductor',
                        usuario: app.usuarios[1].nombre + ' ' + app.usuarios[1].apellido
                    },
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'conductor-asignado',
                        usuario: app.usuarios[2].nombre + ' ' + app.usuarios[2].apellido
                    },
                    {
                        fecha: fechaAyer.toISOString(),
                        estado: 'en-proceso',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    },
                    {
                        fecha: fechaAyer.toISOString(),
                        estado: 'entregado-pendiente',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    }
                ]
            },
            {
                id: 4,
                numeroPedido: 'FX004',
                cliente: {
                    nombre: 'Laura',
                    apellido: 'Gutiérrez',
                    direccion: 'Calle 67 #45-12',
                    ciudad: 'Barranquilla',
                    departamento: 'Atlántico'
                },
                productos: [
                    {
                        id: 6,
                        nombre: 'Tablet Samsung',
                        cantidad: 1,
                        precioUnitario: 900000,
                        subtotal: 900000
                    },
                    {
                        id: 4,
                        nombre: 'Mouse Inalámbrico',
                        cantidad: 1,
                        precioUnitario: 85000,
                        subtotal: 85000
                    }
                ],
                total: 985000,
                tipoPago: 'anticipado',
                estado: 'finalizado',
                fechaCreacion: fechaSemanaPasada.toISOString(),
                fechaFinalizacion: fechaAnteayer.toISOString(),
                creador: app.usuarios[1], // Vendedor
                conductor: app.usuarios[3], // Conductor
                comentarios: [
                    {
                        id: 4,
                        texto: 'Pedido entregado correctamente.',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido,
                        fecha: fechaAnteayer.toISOString()
                    }
                ],
                historial: [
                    {
                        fecha: fechaSemanaPasada.toISOString(),
                        estado: 'buscando-conductor',
                        usuario: app.usuarios[1].nombre + ' ' + app.usuarios[1].apellido
                    },
                    {
                        fecha: fechaSemanaPasada.toISOString(),
                        estado: 'conductor-asignado',
                        usuario: app.usuarios[2].nombre + ' ' + app.usuarios[2].apellido
                    },
                    {
                        fecha: fechaSemanaPasada.toISOString(),
                        estado: 'en-proceso',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    },
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'finalizado',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    }
                ]
            },
            {
                id: 5,
                numeroPedido: 'FX005',
                cliente: {
                    nombre: 'Roberto',
                    apellido: 'Fernández',
                    direccion: 'Av. Libertador 123',
                    ciudad: 'Santa Marta',
                    departamento: 'Magdalena'
                },
                productos: [
                    {
                        id: 1,
                        nombre: 'Laptop HP Pavilion',
                        cantidad: 1,
                        precioUnitario: 2500000,
                        subtotal: 2500000
                    }
                ],
                total: 2500000,
                tipoPago: 'contraentrega',
                estado: 'devuelto',
                fechaCreacion: fechaAnteayer.toISOString(),
                creador: app.usuarios[1], // Vendedor
                conductor: app.usuarios[3], // Conductor
                comentarios: [
                    {
                        id: 5,
                        texto: 'Cliente no se encontraba en la dirección indicada. Se intentó contactar sin éxito.',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido,
                        fecha: fechaAyer.toISOString()
                    }
                ],
                historial: [
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'buscando-conductor',
                        usuario: app.usuarios[1].nombre + ' ' + app.usuarios[1].apellido
                    },
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'conductor-asignado',
                        usuario: app.usuarios[2].nombre + ' ' + app.usuarios[2].apellido
                    },
                    {
                        fecha: fechaAnteayer.toISOString(),
                        estado: 'en-proceso',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    },
                    {
                        fecha: fechaAyer.toISOString(),
                        estado: 'devuelto',
                        usuario: app.usuarios[3].nombre + ' ' + app.usuarios[3].apellido
                    }
                ]
            }
        ];
        
        app.nextPedidoId = 6; // El próximo ID será 6
        
        // Crear notificaciones de ejemplo
        app.notificaciones = [
            {
                id: 1001,
                usuarioId: 4, // Conductor
                texto: 'Se te ha asignado un nuevo pedido: FX002',
                referencia: 'Pedido para Ana Sánchez',
                referenciaId: 2,
                tipo: 'pedido-asignacion',
                leida: true,
                fecha: fechaAyer.toISOString()
            },
            {
                id: 1002,
                usuarioId: 5, // Tesorería
                texto: 'Pedido FX003 entregado, pendiente de pago',
                referencia: 'Cliente: Carlos Mendoza',
                referenciaId: 3,
                tipo: 'pedido-pendiente-pago',
                leida: false,
                fecha: fechaAyer.toISOString()
            },
            {
                id: 1003,
                usuarioId: 2, // Vendedor
                texto: 'Pedido FX004 finalizado exitosamente',
                referencia: 'Cliente: Laura Gutiérrez',
                referenciaId: 4,
                tipo: 'pedido-finalizado',
                leida: true,
                fecha: fechaAnteayer.toISOString()
            },
            {
                id: 1004,
                usuarioId: 2, // Vendedor
                texto: 'Pedido FX005 fue devuelto',
                referencia: 'Cliente: Roberto Fernández',
                referenciaId: 5,
                tipo: 'pedido-devuelto',
                leida: false,
                fecha: fechaAyer.toISOString()
            },
            {
                id: 1005,
                usuarioId: 3, // Bodega
                texto: 'Pedido FX005 fue devuelto',
                referencia: 'Cliente: Roberto Fernández',
                referenciaId: 5,
                tipo: 'pedido-devuelto',
                leida: false,
                fecha: fechaAyer.toISOString()
            }
        ];
    }
}

// Función para generar número de pedido
function generarNumeroPedido() {
    // Formato FX001, FX002, etc. (FX por Fluxon)
    const numPedido = app.nextPedidoId.toString().padStart(3, '0');
    app.nextPedidoId++;
    return `FX${numPedido}`;
}

// Función para buscar menciones en un texto
function buscarMenciones(texto) {
    const regex = /@(\w+)/g;
    const menciones = [];
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
        menciones.push(match[1]); // Captura el nombre de usuario sin el @
    }
    
    return menciones;
}

// Función para crear notificaciones por menciones
function crearNotificacionesMenciones(texto, pedidoId, usuarioEmisor) {
    const menciones = buscarMenciones(texto);
    
    if (menciones.length === 0) return [];
    
    // Buscar pedido
    const pedido = app.pedidos.find(p => p.id === pedidoId);
    if (!pedido) return [];
    
    // Lista de usuarios mencionados con éxito
    const usuariosMencionados = [];
    
    // Por cada mención, crear notificación
    menciones.forEach(username => {
        // Buscar usuario mencionado
        const usuarioMencionado = app.usuarios.find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );
        
        if (usuarioMencionado && usuarioMencionado.id !== usuarioEmisor.id) {
            const notificacion = {
                id: Date.now() + Math.floor(Math.random() * 1000), // ID único
                usuarioId: usuarioMencionado.id,
                texto: `${usuarioEmisor.nombre} ${usuarioEmisor.apellido} te ha mencionado en un comentario`,
                referencia: `Pedido ${pedido.numeroPedido}`,
                referenciaId: pedidoId,
                tipo: 'pedido-mencion',
                leida: false,
                fecha: new Date().toISOString()
            };
            
            app.notificaciones.push(notificacion);
            usuariosMencionados.push(usuarioMencionado);
            
            console.log(`Notificación de mención creada para ${usuarioMencionado.username}`);
        }
    });
    
    // Actualizar contador de notificaciones solo si se crearon notificaciones
    if (usuariosMencionados.length > 0) {
        actualizarContadorNotificaciones();
    }
    
    return usuariosMencionados;
}

// Manejar cambio de tamaño de ventana para adaptar vista móvil/escritorio
function handleResize() {
    const isMobile = window.innerWidth < 768;
    const sidebar = document.getElementById('sidebar');
    const mobileNav = document.getElementById('mobile-nav');
    const mainContent = document.getElementById('main-content');
    
    if (sidebar && mobileNav && mainContent) {
        if (isMobile) {
            // Configuración para móvil
            sidebar.classList.add('mobile');
            sidebar.style.transform = 'translateX(-100%)';
            mobileNav.style.display = 'flex';
            mainContent.style.marginLeft = '0';
            mainContent.style.marginBottom = 'var(--mobile-nav-height)';
        } else {
            // Configuración para escritorio
            sidebar.classList.remove('mobile');
            sidebar.style.transform = 'translateX(0)';
            mobileNav.style.display = 'none';
            mainContent.style.marginLeft = 'var(--sidebar-width)';
            mainContent.style.marginBottom = '0';
        }
    }
    
    // Informar en consola para depuración
    console.log(`Resolución detectada: ${window.innerWidth}px - Modo ${isMobile ? 'móvil' : 'escritorio'}`);
}

// Mostrar menú adicional en móvil (cuando se presiona "Más")
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        // Comprobar si el sidebar está visible o no
        const isVisible = window.getComputedStyle(sidebar).transform !== 'matrix(1, 0, 0, 1, -250, 0)' && 
                          sidebar.style.transform !== 'translateX(-100%)';
        
        if (isVisible) {
            // Ocultar sidebar
            sidebar.style.transform = 'translateX(-100%)';
            console.log('Ocultando menú lateral en móvil');
        } else {
            // Mostrar sidebar
            sidebar.style.transform = 'translateX(0)';
            console.log('Mostrando menú lateral en móvil');
            
            // Añadir evento para ocultar al hacer clic fuera
            setTimeout(() => {
                document.addEventListener('click', function hideSidebar(e) {
                    if (!sidebar.contains(e.target) && e.target.getAttribute('data-module') !== 'menu') {
                        sidebar.style.transform = 'translateX(-100%)';
                        document.removeEventListener('click', hideSidebar);
                        console.log('Menú lateral cerrado por clic fuera');
                    }
                });
            }, 100);
        }
    } else {
        console.error('No se encontró el menú lateral');
    }
}
// Inicialización del módulo de autenticación
function initAuth() {
    // Formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginUser();
        });
    }
    
    // Enlace de olvidó contraseña
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Por favor contacte a su administrador para restablecer su contraseña', 'info', 5000);
        });
    }
    
    // Comprobación de sesión existente
    checkExistingSession();
}

// Verificar si hay una sesión existente
async function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            // Verificar que el usuario sigue siendo válido en la base de datos
            await verifyUserInDatabase(userData);
        } catch (error) {
            console.error('Error al cargar la sesión del usuario:', error);
            // Si hay error, limpiar la sesión
            localStorage.removeItem('currentUser');
        }
    }
}

// Verificar que el usuario existe en la base de datos
async function verifyUserInDatabase(userData) {
    try {
        const supabase = getSupabaseClient();
        
        // Consultar usuario por username
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', userData.username)
            .eq('activo', true)
            .single();
        
        if (error) throw error;
        
        if (data) {
            // Usuario encontrado, actualizar datos locales y continuar
            app.currentUser = {
                id: data.id,
                nombre: data.nombre,
                apellido: data.apellido,
                username: data.username,
                rol: data.rol
            };
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
            
            // Continuar con inicio de sesión
            loginSuccess();
        } else {
            // Usuario no encontrado o inactivo
            throw new Error('Usuario no encontrado o inactivo');
        }
    } catch (error) {
        console.error('Error al verificar usuario en BD:', error);
        throw error;
    }
}

// Función para iniciar sesión
async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Limpiar mensajes de error
    document.getElementById('username-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    
    // Validar que los campos no estén vacíos
    let hasErrors = false;
    
    if (!username) {
        document.getElementById('username-error').textContent = 'El nombre de usuario es obligatorio';
        hasErrors = true;
    }
    
    if (!password) {
        document.getElementById('password-error').textContent = 'La contraseña es obligatoria';
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Mostrar cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'flex';
    }
    
    try {
        const supabase = getSupabaseClient();
        
        // Consultar usuario en la base de datos
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            // Error de supabase distinto a "no se encontraron resultados"
            throw error;
        }
        
        if (data && data.password === password && data.activo) {
            console.log("Usuario autenticado con éxito:", data.nombre, data.rol);
            
            // Guardar usuario en la aplicación
            app.currentUser = {
                id: data.id,
                nombre: data.nombre,
                apellido: data.apellido,
                username: data.username,
                rol: data.rol
            };
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
            
            // Continuar con el inicio de sesión
            loginSuccess();
        } else {
            // Error de autenticación
            if (appLoader) {
                appLoader.style.display = 'none';
            }
            
            if (data) {
                // Usuario existe pero contraseña incorrecta o inactivo
                if (data.password !== password) {
                    document.getElementById('password-error').textContent = 'Contraseña incorrecta';
                } else if (!data.activo) {
                    document.getElementById('username-error').textContent = 'Usuario inactivo';
                    document.getElementById('password-error').textContent = 'Contacte a su administrador';
                }
            } else {
                // Usuario no existe
                document.getElementById('username-error').textContent = 'Usuario no encontrado';
                document.getElementById('password-error').textContent = 'Verifica tus credenciales';
            }
        }
    } catch (error) {
        console.error("Error durante el login:", error);
        
        if (appLoader) {
            appLoader.style.display = 'none';
        }
        
        // En caso de fallar la conexión con Supabase, intentar el modo de desarrollo
        fallbackToDevMode(username, password);
    }
}

// Función para usar modo desarrollo en caso de fallo de conexión
function fallbackToDevMode(username, password) {
    console.warn("Utilizando modo de desarrollo debido a problemas de conexión con Supabase");
    
    // Cargar datos de ejemplo
    if (app.usuarios.length === 0) {
        loadDummyData();
    }
    
    // Buscar usuario en los datos de ejemplo
    const user = app.usuarios.find(u => 
        u.username === username && u.password === password && u.activo
    );
    
    if (user) {
        console.log("Usuario encontrado en modo desarrollo:", user.nombre, user.rol);
        // Guardar usuario en la aplicación
        app.currentUser = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            username: user.username,
            rol: user.rol
        };
        
        // Guardar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
        
        // Continuar con el inicio de sesión
        loginSuccess();
    } else {
        // Mostrar error de fallback
        document.getElementById('username-error').textContent = 'Error al conectar con el servidor';
        document.getElementById('password-error').textContent = 'Intente de nuevo más tarde';
    }
}

// Función ejecutada tras un inicio de sesión exitoso
function loginSuccess() {
    // Ocultar pantalla de login
    document.getElementById('login-container').style.display = 'none';
    
    // Mostrar la aplicación
    document.getElementById('app-container').style.display = 'flex';
    
    // Actualizar información del usuario en la UI
    document.getElementById('current-user-name').textContent = `${app.currentUser.nombre} ${app.currentUser.apellido}`;
    document.getElementById('current-user-role').textContent = getRoleName(app.currentUser.rol);
    
    // Configurar inicial del usuario
    const userInitial = document.querySelector('.user-initial');
    if (userInitial) {
        userInitial.textContent = app.currentUser.nombre.charAt(0);
    }
    
    // Configurar permisos según el rol
    setupRolePermissions();
    
    // Cargar módulo inicial
    changeModule('dashboard');
    
    // Mostrar toast de bienvenida
    showToast(`Bienvenido, ${app.currentUser.nombre}!`, 'success');
    
    // Cargar datos desde Supabase
    loadInitialData();
    
    // Ocultar el cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'none';
    }
}

// Cargar datos iniciales desde Supabase
async function loadInitialData() {
    try {
        const supabase = getSupabaseClient();
        
        // Cargar productos
        const { data: productos, error: productosError } = await supabase
            .from('productos')
            .select('*')
            .order('id', { ascending: true });
        
        if (productosError) throw productosError;
        app.productos = productos || [];
        
        // Cargar notificaciones del usuario actual
        if (app.currentUser) {
            const { data: notificaciones, error: notificacionesError } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', app.currentUser.id)
                .order('fecha', { ascending: false });
            
            if (notificacionesError) throw notificacionesError;
            
            // Transformar a formato compatible con la aplicación
            app.notificaciones = (notificaciones || []).map(n => ({
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
        }
        
        console.log("Datos iniciales cargados con éxito");
    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        showToast('Algunos datos no pudieron ser cargados', 'warning');
    }
}

// Configurar permisos según el rol
function setupRolePermissions() {
    // Ocultar elementos que no corresponden al rol
    document.querySelectorAll('[data-role]').forEach(element => {
        const roles = element.getAttribute('data-role').split(',');
        if (!roles.includes(app.currentUser.rol) && !roles.includes('*')) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
    });
}

// Función para cerrar sesión
async function logout() {
    // Mostrar cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'flex';
    }
    
    try {
        // En el futuro podríamos llamar a Supabase para invalidar tokens o sesiones
        
        // Eliminar usuario del localStorage
        localStorage.removeItem('currentUser');
        
        // Limpiar usuario actual
        app.currentUser = null;
        
        // Limpiar datos de la aplicación
        app.productos = [];
        app.pedidos = [];
        app.notificaciones = [];
        
        // Ocultar la aplicación
        document.getElementById('app-container').style.display = 'none';
        
        // Mostrar pantalla de login
        document.getElementById('login-container').style.display = 'flex';
        
        // Limpiar campos de login
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('username-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        
        console.log('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        // Ocultar cargador
        if (appLoader) {
            appLoader.style.display = 'none';
        }
    }
}

// Obtener nombre legible del rol
function getRoleName(rol) {
    const roles = {
        'maestro': 'Usuario Maestro',
        'vendedor': 'Usuario Vendedor',
        'bodega': 'Usuario Bodega',
        'conductor': 'Usuario Conductor',
        'tesoreria': 'Usuario Tesorería'
    };
    
    return roles[rol] || rol;
}

// Actualizar contador de notificaciones
function actualizarContadorNotificaciones() {
    if (!app.currentUser) return;
    
    // Contar notificaciones no leídas para el usuario actual
    const notificacionesPendientes = app.notificaciones.filter(n => 
        n.usuarioId === app.currentUser.id && !n.leida
    ).length;
    
    // Actualizar contador en la UI
    const notificationCount = document.getElementById('notification-count');
    if (notificationCount) {
        notificationCount.textContent = notificacionesPendientes;
        
        // Mostrar u ocultar según si hay notificaciones
        if (notificacionesPendientes > 0) {
            notificationCount.style.display = 'flex';
        } else {
            notificationCount.style.display = 'none';
        }
    }
}
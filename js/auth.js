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
}

// Función para iniciar sesión
function loginUser() {
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
    
    // Simulamos una breve demora para dar sensación de procesamiento
    setTimeout(() => {
        // Aseguramos que los datos de ejemplo estén cargados
        if (app.usuarios.length === 0) {
            console.log("Cargando datos de ejemplo antes de login...");
            loadDummyData();
        }
        
        console.log("Intentando login con:", username, "Usuarios disponibles:", app.usuarios.length);
        
        // Buscar usuario en la "base de datos"
        const user = app.usuarios.find(u => 
            u.username === username && u.password === password && u.activo
        );
        
        if (user) {
            console.log("Usuario encontrado:", user.nombre, user.rol);
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
            console.log("Login fallido para usuario:", username);
            // Ocultar cargador
            if (appLoader) {
                appLoader.style.display = 'none';
            }
            // Verificar si el usuario existe pero la contraseña es incorrecta
            const userExists = app.usuarios.some(u => u.username === username);
            if (userExists) {
                console.log("El usuario existe pero la contraseña es incorrecta");
                document.getElementById('password-error').textContent = 'Contraseña incorrecta';
            } else {
                console.log("Usuario no encontrado entre los", app.usuarios.length, "usuarios disponibles");
                document.getElementById('username-error').textContent = 'Usuario no encontrado';
                document.getElementById('password-error').textContent = 'Verifica tus credenciales';
            }
        }
    }, 500); // Medio segundo de demora para mejorar la experiencia de usuario
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
    
    // Actualizar contador de notificaciones
    actualizarContadorNotificaciones();
    
    // Ocultar el cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'none';
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
function logout() {
    // Mostrar cargador
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        appLoader.style.display = 'flex';
    }
    
    setTimeout(() => {
        // Eliminar usuario del localStorage
        localStorage.removeItem('currentUser');
        
        // Limpiar usuario actual
        app.currentUser = null;
        
        // Ocultar la aplicación
        document.getElementById('app-container').style.display = 'none';
        
        // Mostrar pantalla de login
        document.getElementById('login-container').style.display = 'flex';
        
        // Limpiar campos de login
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('username-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        
        // Ocultar cargador
        if (appLoader) {
            appLoader.style.display = 'none';
        }
        
        console.log('Sesión cerrada correctamente');
    }, 500); // Pequeña demora para mostrar el cargador
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
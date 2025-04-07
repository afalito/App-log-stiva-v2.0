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
    try {
        const supabase = getSupabaseClient();
        
        // Primero verificar si hay sesión de Supabase Auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionData && sessionData.session) {
            console.log("Sesión de Supabase Auth detectada");
            
            // Obtener el usuario vinculado a esta sesión
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (user) {
                // Usar la función de sincronización para obtener el usuario de la app
                const appUser = await sincronizarUsuarioSupabase(user);
                
                if (appUser) {
                    // Usuario válido, cargar en la app
                    app.currentUser = appUser;
                    
                    // Guardar en localStorage
                    localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
                    
                    // Continuar con inicio de sesión
                    loginSuccess();
                    return;
                } else {
                    console.warn("Sesión de Supabase válida, pero no se encontró el usuario en la base de datos");
                    // Cerrar la sesión de Supabase ya que el usuario no existe o está inactivo
                    await supabase.auth.signOut();
                }
            }
        } else {
            console.log("No hay sesión de Supabase Auth activa");
        }
        
        // Si no hay sesión de Auth o no se pudo validar, verificar localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            console.log("Verificando usuario guardado en localStorage");
            const userData = JSON.parse(savedUser);
            // Verificar que el usuario sigue siendo válido en la base de datos
            await verifyUserInDatabase(userData);
        }
    } catch (error) {
        console.error('Error al verificar la sesión existente:', error);
        // Si hay error, limpiar la sesión
        localStorage.removeItem('currentUser');
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
        
        console.log(`Intentando autenticar a usuario: ${username} con Supabase Auth...`);
        
        // Método 1: Autenticación con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: `${username}@app.com`, // Supabase requiere un formato de email
            password: password
        });
        
        // Si hay error de autenticación con Supabase Auth
        if (authError) {
            console.warn("Error de autenticación con Supabase Auth:", authError.message);
            
            // Método 2: Autenticación directa con tabla usuarios
            console.log("Intentando autenticación alternativa con tabla usuarios...");
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('username', username)
                .single();
            
            if (userError) {
                if (userError.code === 'PGRST116') {
                    // No se encontraron resultados (usuario no existe)
                    console.warn("Usuario no encontrado en la base de datos");
                    if (appLoader) {
                        appLoader.style.display = 'none';
                    }
                    document.getElementById('username-error').textContent = 'Usuario no encontrado';
                    document.getElementById('password-error').textContent = 'Verifica tus credenciales';
                    return;
                } else {
                    // Otro error de consulta
                    throw userError;
                }
            }
            
            if (userData) {
                if (!userData.activo) {
                    // Usuario existe pero está inactivo
                    console.warn("Usuario inactivo:", username);
                    if (appLoader) {
                        appLoader.style.display = 'none';
                    }
                    document.getElementById('username-error').textContent = 'Usuario inactivo';
                    document.getElementById('password-error').textContent = 'Contacte a su administrador';
                    return;
                }
                
                if (userData.password !== password) {
                    // Contraseña incorrecta
                    console.warn("Contraseña incorrecta para usuario:", username);
                    if (appLoader) {
                        appLoader.style.display = 'none';
                    }
                    document.getElementById('password-error').textContent = 'Contraseña incorrecta';
                    return;
                }
                
                // Usuario y contraseña válidos (método alternativo)
                console.log("Usuario autenticado con éxito (método alternativo):", userData.nombre, userData.rol);
                
                // Intentar registrar o actualizar el usuario en Supabase Auth para futuros logins
                try {
                    await createOrUpdateSupabaseAuthUser(username, password);
                } catch (authRegisterError) {
                    console.warn("No se pudo registrar usuario en Auth:", authRegisterError);
                    // Continuamos con el login aunque no se haya podido registrar en Auth
                }
                
                // Guardar usuario en la aplicación
                app.currentUser = {
                    id: userData.id,
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                    username: userData.username,
                    rol: userData.rol
                };
                
                // Guardar en localStorage
                localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
                
                // Continuar con el inicio de sesión
                loginSuccess();
            }
        } else if (authData && authData.user) {
            // Éxito en la autenticación con Supabase Auth
            console.log("Usuario autenticado con éxito mediante Supabase Auth");
            
            // Usar nuestra función de sincronización
            const appUser = await sincronizarUsuarioSupabase(authData.user);
            
            if (appUser) {
                // Guardar usuario en la aplicación
                app.currentUser = appUser;
                
                // Guardar en localStorage
                localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
                
                // Continuar con el inicio de sesión
                loginSuccess();
            } else {
                // Usuario inactivo o no encontrado en nuestra tabla
                if (appLoader) {
                    appLoader.style.display = 'none';
                }
                
                // Cerrar la sesión de Supabase ya que el usuario no existe o está inactivo
                await supabase.auth.signOut();
                
                document.getElementById('username-error').textContent = 'Usuario no encontrado o inactivo';
                document.getElementById('password-error').textContent = 'Contacte a su administrador';
            }
        } else {
            // No debería llegar aquí, pero por si acaso
            if (appLoader) {
                appLoader.style.display = 'none';
            }
            
            document.getElementById('username-error').textContent = 'Error de autenticación';
            document.getElementById('password-error').textContent = 'Por favor, intente de nuevo';
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

// Función para crear o actualizar un usuario en Supabase Auth (útil cuando el usuario existe en DB pero no en Auth)
async function createOrUpdateSupabaseAuthUser(username, password) {
    try {
        const supabase = getSupabaseClient();
        
        // Verificar si el usuario ya existe en Auth
        try {
            const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
                email: `${username}@app.com`,
                password: password
            });
            
            if (existingUser && existingUser.user) {
                console.log("Usuario ya existe en Supabase Auth, actualizando contraseña:", username);
                // Actualizar contraseña si ya existe
                const { error: updateError } = await supabase.auth.updateUser({
                    password: password
                });
                
                if (updateError) {
                    console.warn("Error al actualizar contraseña en Auth:", updateError.message);
                }
                
                return true;
            }
        } catch (checkUserError) {
            // El usuario probablemente no existe, continuamos con la creación
            console.log("Usuario no encontrado en Auth, procediendo a crear:", username);
        }
        
        // Intentar registrar el usuario en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: `${username}@app.com`,
            password: password
        });
        
        if (error) {
            console.warn("No se pudo crear usuario en Supabase Auth:", error.message);
            return false;
        }
        
        console.log("Usuario registrado en Supabase Auth:", username);
        return true;
    } catch (error) {
        console.error("Error al crear/actualizar usuario en Auth:", error);
        return false;
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
    
    // Si hay un prompt de notificaciones, ocultarlo
    const notificationPrompt = document.getElementById('notification-permission-prompt');
    if (notificationPrompt) {
        hideNotificationPrompt();
    }
    
    // Ocultar el widget de notificaciones persistente si existe
    setTimeout(() => {
        if (typeof hideNotificationWidget === 'function') {
            hideNotificationWidget();
        } else {
            const permissionNotification = document.querySelector('.permission-notification');
            if (permissionNotification) {
                permissionNotification.remove();
            }
        }
    }, 500);
    
    // Almacenar en sessionStorage para mantener la sesión en caso de refresco
    sessionStorage.setItem('lastModule', 'dashboard');
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
        // Cerrar sesión en Supabase Auth
        const supabase = getSupabaseClient();
        
        console.log("Cerrando sesión...");
        
        // Primero intentar cerrar sesión en Supabase Auth
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error al cerrar sesión en Supabase Auth:', error);
        } else {
            console.log('Sesión de Supabase Auth cerrada correctamente');
        }
        
        // Eliminar todas las claves de localStorage relacionadas con Supabase
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('fluxon_supabase') || key === 'currentUser') {
                localStorage.removeItem(key);
                console.log(`Eliminada clave de localStorage: ${key}`);
            }
        });
        
        // Para asegurarnos, eliminar usuario del localStorage explícitamente
        localStorage.removeItem('currentUser');
        localStorage.removeItem('fluxon_supabase_auth');
        
        // Limpiar usuario actual
        app.currentUser = null;
        
        // Limpiar datos de la aplicación
        app.productos = [];
        app.pedidos = [];
        app.notificaciones = [];
        
        // Volver a cargar datos de ejemplo para modo desarrollo
        loadDummyData();
        
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
        
        // Opcional: Mostrar mensaje de éxito
        setTimeout(() => {
            showToast('Sesión cerrada correctamente', 'info', 2000);
        }, 500);
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        
        // Forzar cierre de sesión a nivel local en caso de error
        localStorage.removeItem('currentUser');
        app.currentUser = null;
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
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
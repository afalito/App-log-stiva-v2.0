// Inicialización del módulo de usuarios
function initUsuariosModule() {
    // Esta función se llama al iniciar la aplicación
    console.log('Módulo de usuarios inicializado');
}

// Configuración de eventos para el módulo de usuarios
function setupUsuariosEvents() {
    // Evento para el botón de nuevo usuario
    const createUsuarioBtn = document.getElementById('create-usuario-btn');
    if (createUsuarioBtn) {
        createUsuarioBtn.addEventListener('click', () => {
            openUsuarioModal();
        });
    }
    
    // Eventos para filtros y búsqueda
    const searchUsuarios = document.getElementById('search-usuarios');
    if (searchUsuarios) {
        searchUsuarios.addEventListener('input', () => {
            updateUsuariosTable();
        });
    }
    
    const filterRoles = document.getElementById('filter-roles');
    if (filterRoles) {
        filterRoles.addEventListener('change', () => {
            updateUsuariosTable();
        });
    }
    
    // Configurar eventos para el modal de usuarios
    setupUsuarioModalEvents();
}

// Actualizar tabla de usuarios
async function updateUsuariosTable() {
    const usuariosList = document.getElementById('usuarios-list');
    if (!usuariosList) return;
    
    // Mostrar un indicador de carga
    usuariosList.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 20px;">
                <div class="spinner-small"></div>
                <p>Cargando usuarios...</p>
            </td>
        </tr>
    `;
    
    try {
        // Primero, cargar los usuarios desde Supabase
        let usuarios = [];
        
        try {
            usuarios = await dbOperations.fetchUsuarios();
            
            // Actualizar la caché local
            app.usuarios = usuarios;
        } catch (error) {
            console.error('Error al cargar usuarios desde Supabase:', error);
            
            // Si hay error, usar datos en caché
            usuarios = app.usuarios;
            
            // Mostrar notificación si estamos usando caché
            showToast('Usando datos en caché para usuarios', 'warning');
        }
        
        // Aplicar filtros
        let filteredUsuarios = usuarios;
        
        // Filtrar por rol si está seleccionado
        const filterRoles = document.getElementById('filter-roles');
        if (filterRoles && filterRoles.value) {
            filteredUsuarios = filteredUsuarios.filter(u => u.rol === filterRoles.value);
        }
        
        // Filtrar por búsqueda
        const searchUsuarios = document.getElementById('search-usuarios');
        if (searchUsuarios && searchUsuarios.value) {
            const searchTerm = searchUsuarios.value.toLowerCase();
            filteredUsuarios = filteredUsuarios.filter(u => 
                u.nombre.toLowerCase().includes(searchTerm) ||
                u.apellido.toLowerCase().includes(searchTerm) ||
                u.username.toLowerCase().includes(searchTerm)
            );
        }
        
        // Mostrar mensaje si no hay usuarios
        if (filteredUsuarios.length === 0) {
            usuariosList.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5">
                        <div class="empty-message">
                            <i class="fas fa-users"></i>
                            <p>No hay usuarios que coincidan con los filtros</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generar HTML para cada usuario
        const usuariosHTML = filteredUsuarios.map(usuario => `
            <tr>
                <td>${usuario.nombre} ${usuario.apellido}</td>
                <td>${usuario.username}</td>
                <td>${getRoleName(usuario.rol)}</td>
                <td>
                    <span class="status-badge ${usuario.activo ? 'status-finalizado' : 'status-anulado'}">
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-small" onclick="editUsuario(${usuario.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-small ${usuario.activo ? 'btn-danger' : 'btn-success'}" onclick="toggleUsuarioStatus(${usuario.id})">
                        <i class="fas fa-${usuario.activo ? 'ban' : 'check'}"></i> ${usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `).join('');
        
        usuariosList.innerHTML = usuariosHTML;
    } catch (error) {
        console.error('Error al actualizar tabla de usuarios:', error);
        usuariosList.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar usuarios. Intente nuevamente.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Abrir modal de usuario (nuevo o edición)
function openUsuarioModal(usuarioId = null) {
    // Reiniciar formulario
    const usuarioForm = document.getElementById('usuario-form');
    if (usuarioForm) {
        usuarioForm.reset();
    }
    
    // Configurar título del modal y guardar ID si estamos editando
    const usuarioModalTitle = document.getElementById('usuario-modal-title');
    if (usuarioModalTitle) {
        if (usuarioId) {
            usuarioModalTitle.textContent = 'Editar Usuario';
            usuarioModalTitle.setAttribute('data-usuario-id', usuarioId);
            
            // Cargar datos del usuario
            const usuario = app.usuarios.find(u => u.id === usuarioId);
            if (usuario) {
                document.getElementById('usuario-nombre').value = usuario.nombre;
                document.getElementById('usuario-apellido').value = usuario.apellido;
                document.getElementById('usuario-username').value = usuario.username;
                document.getElementById('usuario-rol').value = usuario.rol;
                
                // En edición, no requerimos contraseña a menos que se vaya a cambiar
                document.getElementById('usuario-password').required = false;
                document.getElementById('usuario-password-confirm').required = false;
                
                // Deshabilitar el campo de usuario si es el usuario actual
                if (usuario.id === app.currentUser.id) {
                    document.getElementById('usuario-rol').disabled = true;
                } else {
                    document.getElementById('usuario-rol').disabled = false;
                }
            }
        } else {
            usuarioModalTitle.textContent = 'Nuevo Usuario';
            usuarioModalTitle.removeAttribute('data-usuario-id');
            
            // En creación, requerimos contraseña
            document.getElementById('usuario-password').required = true;
            document.getElementById('usuario-password-confirm').required = true;
            
            // Habilitar campo de rol
            document.getElementById('usuario-rol').disabled = false;
        }
    }
    
    // Abrir modal
    openModal('usuario-modal');
}

// Configurar eventos para el modal de usuarios
function setupUsuarioModalEvents() {
    // Botón cancelar
    const cancelUsuarioBtn = document.getElementById('cancel-usuario-btn');
    if (cancelUsuarioBtn) {
        cancelUsuarioBtn.addEventListener('click', () => {
            closeModal('usuario-modal');
        });
    }
    
    // Botón guardar
    const saveUsuarioBtn = document.getElementById('save-usuario-btn');
    if (saveUsuarioBtn) {
        saveUsuarioBtn.addEventListener('click', () => {
            saveUsuario();
        });
    }
}

// Guardar usuario
async function saveUsuario() {
    try {
        // Mostrar loader
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'flex';
        }

        // Obtener datos del formulario
        const nombre = document.getElementById('usuario-nombre').value;
        const apellido = document.getElementById('usuario-apellido').value;
        const username = document.getElementById('usuario-username').value;
        const password = document.getElementById('usuario-password').value;
        const passwordConfirm = document.getElementById('usuario-password-confirm').value;
        const rol = document.getElementById('usuario-rol').value;
        
        // Validar datos
        if (!nombre || !apellido || !username || !rol) {
            showToast('Todos los campos son obligatorios', 'error');
            if (appLoader) appLoader.style.display = 'none';
            return;
        }
        
        // Verificar si estamos editando o creando
        const usuarioModalTitle = document.getElementById('usuario-modal-title');
        const usuarioId = usuarioModalTitle.getAttribute('data-usuario-id');
        
        // Validar contraseñas
        const isCreating = !usuarioId;
        
        if (isCreating || password) {
            if (password !== passwordConfirm) {
                showToast('Las contraseñas no coinciden', 'error');
                if (appLoader) appLoader.style.display = 'none';
                return;
            }
            
            if (password.length < 6) {
                showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                if (appLoader) appLoader.style.display = 'none';
                return;
            }
        }
        
        // Verificar que el nombre de usuario no exista (excepto si es el mismo usuario en edición)
        const existingUser = app.usuarios.find(u => 
            u.username === username && (!usuarioId || u.id != usuarioId)
        );
        
        if (existingUser) {
            showToast('El nombre de usuario ya existe', 'error');
            if (appLoader) appLoader.style.display = 'none';
            return;
        }
        
        // Preparar objeto de usuario
        const usuarioData = {
            nombre: nombre,
            apellido: apellido,
            username: username,
            rol: rol,
            activo: true
        };
        
        // Si hay contraseña, incluirla
        if (password) {
            usuarioData.password = password;
        }
        
        // Si hay ID, incluirlo para actualización
        if (usuarioId) {
            usuarioData.id = parseInt(usuarioId);
        }
        
        // Enviar a Supabase
        try {
            // Usar función de dbOperations para guardar
            const result = await dbOperations.saveUsuario(usuarioData);
            
            // Si hay ID en el resultado, la operación fue exitosa
            if (result && (result.id || usuarioId)) {
                // Si era una actualización del usuario actual, actualizar UI y localStorage
                if (usuarioId && parseInt(usuarioId) === app.currentUser.id) {
                    app.currentUser.nombre = nombre;
                    app.currentUser.apellido = apellido;
                    
                    // Actualizar UI
                    document.getElementById('current-user-name').textContent = `${nombre} ${apellido}`;
                    
                    // Actualizar inicial del usuario
                    const userInitial = document.querySelector('.user-initial');
                    if (userInitial) {
                        userInitial.textContent = nombre.charAt(0);
                    }
                    
                    // Actualizar localStorage de forma segura
                    localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
                }
                
                showToast(usuarioId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');
                
                // Cerrar modal
                closeModal('usuario-modal');
                
                // Actualizar tabla
                await updateUsuariosTable();
            } else {
                throw new Error('No se recibió confirmación del servidor');
            }
        } catch (error) {
            console.error('Error al guardar usuario en Supabase:', error);
            
            // Si estamos en modo offline, usar sync_offline
            if (!navigator.onLine) {
                const syncResult = await syncSystem.upsert('usuarios', usuarioData);
                
                if (syncResult.success) {
                    showToast(
                        usuarioId 
                            ? 'Usuario guardado para sincronización en línea' 
                            : 'Usuario creado para sincronización en línea', 
                        'info'
                    );
                    
                    // Cerrar modal
                    closeModal('usuario-modal');
                    
                    // Actualizar tabla
                    await updateUsuariosTable();
                } else {
                    throw new Error('Error al guardar para sincronización: ' + syncResult.error);
                }
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showToast('Error al guardar usuario: ' + error.message, 'error');
    } finally {
        // Ocultar loader
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'none';
        }
    }
}

// Editar usuario
function editUsuario(usuarioId) {
    openUsuarioModal(usuarioId);
}

// Activar/Desactivar usuario
async function toggleUsuarioStatus(usuarioId) {
    try {
        // Mostrar loader
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.display = 'flex';
        }
        
        // Buscar usuario en la caché local
        const usuario = app.usuarios.find(u => u.id === usuarioId);
        
        if (!usuario) {
            showToast('Usuario no encontrado', 'error');
            if (appLoader) appLoader.style.display = 'none';
            return;
        }
        
        // No permitir desactivar al usuario actual
        if (usuario.id === app.currentUser.id) {
            showToast('No puedes desactivar tu propio usuario', 'error');
            if (appLoader) appLoader.style.display = 'none';
            return;
        }
        
        // No permitir desactivar al último usuario maestro
        if (usuario.rol === 'maestro' && usuario.activo) {
            const maestrosActivos = app.usuarios.filter(u => u.rol === 'maestro' && u.activo);
            if (maestrosActivos.length <= 1) {
                showToast('No puedes desactivar al último usuario maestro', 'error');
                if (appLoader) appLoader.style.display = 'none';
                return;
            }
        }
        
        // Ocultar loader mientras se muestra el modal de confirmación
        if (appLoader) appLoader.style.display = 'none';
        
        // Configurar mensaje de confirmación
        const confirmationMessage = document.getElementById('confirmation-message');
        const confirmationTitle = document.getElementById('confirmation-title');
        const action = usuario.activo ? 'Desactivar' : 'Activar';
        
        confirmationTitle.textContent = `${action} Usuario`;
        confirmationMessage.textContent = `¿Estás seguro de ${action.toLowerCase()} el usuario "${usuario.nombre} ${usuario.apellido}"?`;
        
        // Configurar botón de confirmación
        const confirmButton = document.getElementById('confirm-action-btn');
        
        // Limpiar eventos anteriores
        confirmButton.replaceWith(confirmButton.cloneNode(true));
        
        // Obtener el nuevo botón
        const newConfirmButton = document.getElementById('confirm-action-btn');
        
        // Añadir evento
        newConfirmButton.addEventListener('click', async () => {
            try {
                // Mostrar loader nuevamente
                if (appLoader) appLoader.style.display = 'flex';
                
                // Cambiar estado del usuario en Supabase
                const newStatus = !usuario.activo;
                
                // Usar dbOperations para actualizar en Supabase
                const result = await dbOperations.toggleUsuarioStatus(usuarioId, newStatus);
                
                if (result && result.success) {
                    // Actualizar el usuario localmente
                    usuario.activo = newStatus;
                    
                    // Cerrar modal de confirmación
                    closeModal('confirmation-modal');
                    
                    // Actualizar tabla
                    await updateUsuariosTable();
                    
                    // Mostrar notificación de éxito
                    showToast(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`, 'success');
                } else {
                    throw new Error('No se pudo cambiar el estado del usuario');
                }
            } catch (error) {
                console.error('Error al cambiar estado del usuario:', error);
                
                // Si estamos en modo offline, usar sync_offline
                if (!navigator.onLine) {
                    const syncResult = await syncSystem.update('usuarios', { activo: !usuario.activo }, { id: usuarioId });
                    
                    if (syncResult.success) {
                        // Actualizar el usuario localmente
                        usuario.activo = !usuario.activo;
                        
                        // Cerrar modal de confirmación
                        closeModal('confirmation-modal');
                        
                        // Actualizar tabla
                        await updateUsuariosTable();
                        
                        showToast(`Cambio de estado guardado para sincronización en línea`, 'info');
                    } else {
                        throw new Error('Error al guardar para sincronización: ' + syncResult.error);
                    }
                } else {
                    showToast('Error al cambiar estado del usuario: ' + error.message, 'error');
                }
            } finally {
                // Ocultar loader
                if (appLoader) appLoader.style.display = 'none';
            }
        });
        
        // Abrir modal de confirmación
        openModal('confirmation-modal');
    } catch (error) {
        console.error('Error general en toggleUsuarioStatus:', error);
        showToast('Error: ' + error.message, 'error');
        
        // Asegurar que el loader esté oculto
        if (appLoader) appLoader.style.display = 'none';
    }
}
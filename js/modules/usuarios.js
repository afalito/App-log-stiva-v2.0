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
function updateUsuariosTable() {
    const usuariosList = document.getElementById('usuarios-list');
    if (!usuariosList) return;
    
    // Aplicar filtros
    let filteredUsuarios = app.usuarios;
    
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
function saveUsuario() {
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
            return;
        }
        
        if (password.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
    }
    
    // Verificar que el nombre de usuario no exista (excepto si es el mismo usuario en edición)
    const existingUser = app.usuarios.find(u => 
        u.username === username && (!usuarioId || u.id != usuarioId)
    );
    
    if (existingUser) {
        showToast('El nombre de usuario ya existe', 'error');
        return;
    }
    
    if (usuarioId) {
        // Editar usuario existente
        const usuario = app.usuarios.find(u => u.id == usuarioId);
        
        if (usuario) {
            usuario.nombre = nombre;
            usuario.apellido = apellido;
            
            // Solo actualizar el username si no es el usuario actual
            if (usuario.id !== app.currentUser.id) {
                usuario.username = username;
            }
            
            // Solo actualizar el rol si no es el usuario actual
            if (usuario.id !== app.currentUser.id) {
                usuario.rol = rol;
            }
            
            // Actualizar contraseña solo si se proporciona
            if (password) {
                usuario.password = password;
            }
            
            // Si es el usuario actual, actualizar datos en app.currentUser
            if (usuario.id === app.currentUser.id) {
                app.currentUser.nombre = nombre;
                app.currentUser.apellido = apellido;
                
                // Actualizar UI
                document.getElementById('current-user-name').textContent = `${nombre} ${apellido}`;
                
                // Actualizar inicial del usuario
                const userInitial = document.querySelector('.user-initial');
                if (userInitial) {
                    userInitial.textContent = nombre.charAt(0);
                }
                
                // Actualizar localStorage
                localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
            }
            
            showToast('Usuario actualizado correctamente', 'success');
        }
    } else {
        // Crear nuevo usuario
        const nuevoUsuario = {
            id: app.usuarios.length > 0 ? Math.max(...app.usuarios.map(u => u.id)) + 1 : 1,
            nombre: nombre,
            apellido: apellido,
            username: username,
            password: password,
            rol: rol,
            activo: true
        };
        
        app.usuarios.push(nuevoUsuario);
        showToast('Usuario creado correctamente', 'success');
    }
    
    // Cerrar modal
    closeModal('usuario-modal');
    
    // Actualizar tabla
    updateUsuariosTable();
}

// Editar usuario
function editUsuario(usuarioId) {
    openUsuarioModal(usuarioId);
}

// Activar/Desactivar usuario
function toggleUsuarioStatus(usuarioId) {
    // Buscar usuario
    const usuario = app.usuarios.find(u => u.id === usuarioId);
    
    if (!usuario) {
        showToast('Usuario no encontrado', 'error');
        return;
    }
    
    // No permitir desactivar al usuario actual
    if (usuario.id === app.currentUser.id) {
        showToast('No puedes desactivar tu propio usuario', 'error');
        return;
    }
    
    // No permitir desactivar al último usuario maestro
    if (usuario.rol === 'maestro' && usuario.activo) {
        const maestrosActivos = app.usuarios.filter(u => u.rol === 'maestro' && u.activo);
        if (maestrosActivos.length <= 1) {
            showToast('No puedes desactivar al último usuario maestro', 'error');
            return;
        }
    }
    
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
    newConfirmButton.addEventListener('click', () => {
        // Cambiar estado del usuario
        usuario.activo = !usuario.activo;
        
        // Cerrar modal de confirmación
        closeModal('confirmation-modal');
        
        // Actualizar tabla
        updateUsuariosTable();
        
        // Mostrar notificación de éxito
        showToast(`Usuario ${usuario.activo ? 'activado' : 'desactivado'} correctamente`, 'success');
    });
    
    // Abrir modal de confirmación
    openModal('confirmation-modal');
}
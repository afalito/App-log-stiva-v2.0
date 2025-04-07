let deferredPrompt;
let installPromptShown = false;

window.addEventListener('beforeinstallprompt', (e) => {
  // Evitar que Chrome muestre automáticamente el prompt
  e.preventDefault();
  
  // Guardar el evento para usarlo más tarde
  deferredPrompt = e;
  
  // Verificar si ya se mostró el prompt o si ya está instalado
  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
  
  if (!installPromptShown && !isPWAInstalled) {
    showInstallPrompt();
  }
});

// Detectar cuando se completa la instalación
window.addEventListener('appinstalled', (evt) => {
  // Limpiar el evento guardado
  deferredPrompt = null;
  
  // Ocultar prompt de instalación si está visible
  hideInstallPrompt();
  
  // Mostrar mensaje de éxito
  showToast('¡Aplicación instalada correctamente!', 'success');
  
  console.log('Fluxon Logistics ha sido instalada');
});

// Mostrar prompt de instalación
function showInstallPrompt() {
  // Marcar que ya se mostró el prompt
  installPromptShown = true;
  
  // Verificar si el elemento ya existe
  if (document.getElementById('pwa-install-prompt')) return;
  
  // Crear el prompt
  const promptElement = document.createElement('div');
  promptElement.className = 'pwa-install-prompt';
  promptElement.id = 'pwa-install-prompt';
  
  promptElement.innerHTML = `
    <div class="pwa-install-prompt-content">
      <h3>Instala Fluxon Logistics</h3>
      <p>Instala esta aplicación en tu dispositivo para usarla sin conexión y acceder más rápido.</p>
    </div>
    <div class="pwa-install-actions">
      <button id="pwa-install-later" class="btn btn-text">Más tarde</button>
      <button id="pwa-install-now" class="btn btn-primary">
        <i class="fas fa-download"></i> Instalar
      </button>
    </div>
  `;
  
  // Añadir al DOM
  document.body.appendChild(promptElement);
  
  // Eventos para los botones
  document.getElementById('pwa-install-now').addEventListener('click', () => {
    if (deferredPrompt) {
      // Mostrar el prompt de instalación
      deferredPrompt.prompt();
      
      // Esperar respuesta del usuario
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
        } else {
          console.log('Usuario rechazó la instalación');
        }
        
        // Limpiar
        deferredPrompt = null;
      });
      
      // Ocultar nuestro prompt personalizado
      hideInstallPrompt();
    }
  });
  
  document.getElementById('pwa-install-later').addEventListener('click', () => {
    hideInstallPrompt();
  });
}

// Ocultar prompt de instalación
function hideInstallPrompt() {
  const promptElement = document.getElementById('pwa-install-prompt');
  if (promptElement) {
    promptElement.style.animation = 'slideDown 0.3s ease forwards';
    
    // Eliminar después de la animación
    setTimeout(() => {
      promptElement.remove();
    }, 300);
  }
}

// Añadir estilo para la animación de cierre
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
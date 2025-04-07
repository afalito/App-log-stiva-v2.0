// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Verificar si estamos en protocolo http o https (no file://)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      console.log('Protocolo compatible detectado, intentando registrar Service Worker...');
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration.scope);
          
          // Solicitar permiso para notificaciones
          requestNotificationPermission();
        })
        .catch(error => {
          console.error('Error al registrar el Service Worker:', error);
        });
    } else {
      console.warn('No se puede registrar el Service Worker: protocolo no compatible (' + window.location.protocol + ').');
      console.warn('Para funcionalidad PWA completa, use un servidor web (http o https).');
      
      // Aún podemos ofrecer algunas funcionalidades básicas
      if ('Notification' in window) {
        console.log('Ofreciendo notificaciones básicas sin Service Worker');
        requestNotificationPermission();
      }
    }
  });
}

// Solicitar permiso para notificaciones
async function requestNotificationPermission() {
  if ('Notification' in window) {
    // Si el usuario tiene permisos concedidos, omitir widget
    if (Notification.permission === 'granted') {
      console.log('Permiso de notificaciones ya concedido');
      // Si ya tiene permiso, intentar suscribir a push notifications
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        subscribeToPushNotifications();
      }
      return;
    }
    
    // Si los permisos están denegados, omitirlo
    if (Notification.permission === 'denied') {
      return;
    }
    
    // Verificar si el usuario está autenticado antes de mostrar el banner
    if (!app || !app.currentUser) {
      console.log('Usuario no autenticado, esperando hasta después del login para mostrar notificaciones');
      return;
    }
    
    // Verificar preferencia guardada en Supabase
    let preferenciaNoDeMostrarWidget = false;
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('preferencias_usuario')
        .select('no_mostrar_notificacion_widget')
        .eq('usuario_id', app.currentUser.id)
        .single();
        
      if (data && data.no_mostrar_notificacion_widget) {
        preferenciaNoDeMostrarWidget = true;
        console.log('Usuario eligió no mostrar el widget de notificaciones');
        return;
      }
    } catch (error) {
      console.warn('Error al verificar preferencias de usuario:', error);
    }
    
    // Verificar si ya hay un banner de notificaciones visible
    if (document.querySelector('.permission-notification')) {
      console.log('Widget de notificaciones ya visible, no mostrar otro');
      return;
    }
    
    // Verificar si estamos en la pantalla de login
    if (document.getElementById('login-container').style.display !== 'none') {
      console.log('Usuario en pantalla de login, esperando hasta después del login');
      return;
    }
    
    // Mostrar el widget de solicitud de permisos
    if (Notification.permission === 'default') {
      // Mostrar un mensaje explicativo antes de solicitar permisos
      const notification = document.createElement('div');
      notification.className = 'permission-notification';
      notification.id = 'permission-notification-widget';
      notification.innerHTML = `
        <div class="permission-content">
          <p>¿Quieres recibir notificaciones para tus pedidos?</p>
          <div class="notification-actions">
            <button id="accept-notifications" class="btn btn-primary btn-small">Permitir</button>
            <button id="reject-notifications" class="btn btn-text btn-small">Ahora no</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Evento para permitir notificaciones
      document.getElementById('accept-notifications').addEventListener('click', async () => {
        // Primero quitamos el widget para evitar confusión
        notification.remove();
        
        // Luego solicitamos el permiso con un pequeño retraso
        setTimeout(() => {
          Notification.requestPermission()
            .then(async permission => {
              console.log('Resultado de solicitud de notificaciones:', permission);
              if (permission === 'granted') {
                console.log('Permiso de notificaciones concedido');
                
                // Guardar la preferencia en Supabase
                saveNotificationPreference(true);
                
                // Si se concede permiso, intentamos suscribir a notificaciones push
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                  subscribeToPushNotifications();
                }
              } else {
                // Registrar decisión en Supabase
                saveNotificationPreference(false);
              }
            })
            .catch(error => {
              console.error('Error al solicitar permisos de notificación:', error);
            });
        }, 100);
      });
      
      // Evento para rechazar notificaciones
      document.getElementById('reject-notifications').addEventListener('click', async () => {
        notification.remove();
        
        // Guardar preferencia del usuario para no mostrar el widget en el futuro
        if (app && app.currentUser) {
          try {
            const supabase = getSupabaseClient();
            await supabase
              .from('preferencias_usuario')
              .upsert({
                usuario_id: app.currentUser.id,
                no_mostrar_notificacion_widget: true,
                updated_at: new Date().toISOString()
              });
              
            console.log('Preferencia de no mostrar widget guardada');
          } catch (error) {
            console.warn('Error al guardar preferencia de usuario:', error);
          }
        }
      });
    }
  }
}

// Función para ocultar manualmente el banner de notificaciones
function hideNotificationWidget() {
  const notificationWidget = document.querySelector('.permission-notification, #permission-notification-widget');
  if (notificationWidget) {
    notificationWidget.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      notificationWidget.remove();
    }, 300);
    
    // Guardar preferencia del usuario para no mostrar el widget en el futuro
    if (app && app.currentUser) {
      try {
        const supabase = getSupabaseClient();
        supabase
          .from('preferencias_usuario')
          .upsert({
            usuario_id: app.currentUser.id,
            no_mostrar_notificacion_widget: true,
            updated_at: new Date().toISOString()
          });
        console.log('Preferencia de no mostrar widget guardada al ocultar manualmente');
      } catch (error) {
        console.warn('Error al guardar preferencia de usuario:', error);
      }
    }
  }
}

// Agregar estilo para la animación de salida del widget de notificaciones
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
  @keyframes slideOut {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyle);

// Guardar la preferencia de notificaciones en Supabase
async function saveNotificationPreference(habilitado) {
  if (app && app.currentUser) {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('preferencias_usuario')
        .upsert({
          usuario_id: app.currentUser.id,
          notificaciones_habilitadas: habilitado,
          updated_at: new Date().toISOString()
        });
        
      console.log(`Preferencia de notificaciones (${habilitado ? 'habilitadas' : 'deshabilitadas'}) guardada`);
    } catch (error) {
      console.warn('Error al guardar preferencia de notificaciones:', error);
    }
  }
}

// Suscribir al usuario a notificaciones push
function subscribeToPushNotifications() {
  navigator.serviceWorker.ready
    .then(registration => {
      // Verificar si ya está suscrito
      return registration.pushManager.getSubscription()
        .then(subscription => {
          if (subscription) {
            return subscription;
          }
          
          // Si no está suscrito, crear nueva suscripción
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            )
          });
        });
    })
    .then(subscription => {
      // Enviar la suscripción al servidor
      console.log('Usuario suscrito a notificaciones push:', subscription);
      
      // En un entorno real, enviaríamos esta suscripción al servidor
      // return fetch('/api/subscribe', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
    })
    .catch(error => {
      console.error('Error al suscribir a notificaciones push:', error);
    });
}

// Función auxiliar para convertir clave de aplicación
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Función para enviar notificación y guardarla en Supabase
async function sendNotification(title, body, options = {}) {
  const { url = '/', tipo = 'general', referencia = '', referenciaId = null, usuarioId = null } = options;
  
  // Primero enviar la notificación al navegador si está permitido
  if ('Notification' in window && Notification.permission === 'granted') {
    // Si la app está abierta, mostrar notificación nativa
    new Notification(title, {
      body: body,
      icon: 'img/icon-192x192.png'
    });
  } else if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Si la app está cerrada, intentar enviar a través de Push API
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: body,
        icon: 'img/icon-192x192.png',
        badge: 'img/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: url }
      });
    });
  }
  
  // Guardar la notificación en Supabase si hay un usuario autenticado
  try {
    // Solo si hay un usuario al que enviar la notificación
    if (app && (app.currentUser || usuarioId)) {
      const supabase = getSupabaseClient();
      const destinatarioId = usuarioId || app.currentUser.id;
      
      // Crear notificación en Supabase
      const { data, error } = await supabase
        .from('notificaciones')
        .insert({
          usuario_id: destinatarioId,
          texto: body,
          referencia: referencia,
          referencia_id: referenciaId,
          tipo: tipo,
          leida: false,
          fecha: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error al guardar notificación en Supabase:', error);
      } else {
        console.log('Notificación guardada en Supabase');
        
        // Si la notificación es para el usuario actual, actualizar la UI
        if (destinatarioId === app.currentUser?.id) {
          // Intentar obtener la notificación recién creada
          const { data: notificacionData, error: fetchError } = await supabase
            .from('notificaciones')
            .select('*')
            .order('created_at', { ascending: false })
            .eq('usuario_id', destinatarioId)
            .limit(1)
            .single();
          
          if (!fetchError && notificacionData) {
            // Transformar a formato compatible con la aplicación
            const nuevaNotificacion = {
              id: notificacionData.id,
              usuarioId: notificacionData.usuario_id,
              texto: notificacionData.texto,
              referencia: notificacionData.referencia,
              referenciaId: notificacionData.referencia_id,
              tipo: notificacionData.tipo,
              leida: notificacionData.leida,
              fecha: notificacionData.fecha
            };
            
            // Añadir a la lista local
            app.notificaciones.unshift(nuevaNotificacion);
            
            // Actualizar contador de notificaciones
            actualizarContadorNotificaciones();
            
            // Actualizar UI de notificaciones si está visible
            if (app.currentModule === 'notificaciones') {
              updateNotificacionesList();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al procesar notificación:', error);
  }
}
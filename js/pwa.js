// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Solicitar permiso para notificaciones
        requestNotificationPermission();
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}

// Solicitar permiso para notificaciones
function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      // Mostrar un mensaje explicativo antes de solicitar permisos
      const notification = document.createElement('div');
      notification.className = 'permission-notification';
      notification.innerHTML = `
        <div class="permission-content">
          <p>¿Quieres recibir notificaciones para estar al día con tus pedidos?</p>
          <button id="accept-notifications" class="btn btn-primary">Permitir</button>
          <button id="reject-notifications" class="btn btn-text">Ahora no</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Evento para permitir notificaciones
      document.getElementById('accept-notifications').addEventListener('click', () => {
        Notification.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              console.log('Permiso de notificaciones concedido');
              notification.remove();
            }
          });
      });
      
      // Evento para rechazar notificaciones
      document.getElementById('reject-notifications').addEventListener('click', () => {
        notification.remove();
      });
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

// Función para enviar notificación
function sendNotification(title, body, url = '/') {
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
}
# Fluxon Logistics - Aplicación de Gestión Logística

## Descripción
Fluxon Logistics es una aplicación de gestión logística diseñada para facilitar el seguimiento de pedidos, desde su creación hasta su entrega. Con un enfoque moderno y responsivo, esta aplicación proporciona herramientas para administrar pedidos, productos, usuarios y generar informes detallados.

## Características

### Gestion de Usuarios con Roles Específicos
- **Usuario Maestro**: Administración completa del sistema
- **Usuario Vendedor**: Creación y seguimiento de pedidos
- **Usuario Bodega**: Asignación de conductores a pedidos
- **Usuario Conductor**: Gestión y actualización de entregas
- **Usuario Tesorería**: Gestión de pagos de pedidos

### Seguimiento de Pedidos
- Creación de pedidos con detalles del cliente y productos
- Sistema de estados para seguimiento en tiempo real
- Comentarios y notificaciones con menciones (@usuario)
- Historial completo de cambios de estado

### Gestión de Productos
- Catálogo de productos configurable
- Selección rápida de productos al crear pedidos

### Informes Detallados
- Generación de informes en formato Excel
- Filtros por fechas y estados de pedidos
- Vista previa de resultados antes de descargar

### Notificaciones Internas y Push
- Sistema de menciones en comentarios
- Centro de notificaciones con marcado de leídas/no leídas
- Soporte para notificaciones push en dispositivos móviles

### Aplicación Web Progresiva (PWA)
- Instalable en dispositivos móviles y escritorio
- Funcionalidad offline básica
- Experiencia de aplicación nativa

## Flujo de Trabajo
1. El vendedor crea un pedido con estado "Buscando Conductor"
2. El usuario de bodega asigna un conductor
3. El conductor confirma la recepción y cambia el estado a "En Proceso de Entrega"
4. Al entregar, el conductor actualiza el estado según el tipo de pago:
   - **Contraentrega**: "Entregado, Pendiente Pagar"
   - **Pago Anticipado**: "Finalizado"
5. Si es contraentrega, el usuario de tesorería confirma el pago para finalizar el pedido

## Tecnologías Utilizadas
- HTML5, CSS3 y JavaScript puro (vanilla)
- Diseño responsivo para dispositivos móviles y web
- Almacenamiento local para demo y pruebas
- Service Workers para funcionalidad offline y PWA
- Web Push API para notificaciones

## Comenzando

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Instalación
1. Clona este repositorio
2. Abre el archivo `index.html` en tu navegador
3. Para una experiencia completa, usa un servidor local:
   ```
   # Con Python
   python -m http.server 8000
   
   # Con Node.js y http-server
   npx http-server
   ```

### Instalación como PWA
1. Abre la aplicación en Chrome o Edge
2. Verás un banner de instalación en la parte inferior
3. Haz clic en "Instalar" para añadir la app a tu dispositivo
4. Alternativamente, usa el menú del navegador y selecciona "Instalar aplicación"

### Usuarios Demo
- **Usuario Maestro**: admin / admin123
- **Usuario Vendedor**: vendedor / vendedor123
- **Usuario Bodega**: bodega / bodega123
- **Usuario Conductor**: conductor / conductor123
- **Usuario Tesorería**: tesoreria / tesoreria123

## Estructura del Proyecto
```
/
├── index.html            # Archivo principal HTML
├── manifest.json         # Manifest para PWA
├── sw.js                 # Service Worker
├── css/
│   └── styles.css        # Estilos CSS de la aplicación
├── js/
│   ├── app.js            # Lógica principal de la aplicación
│   ├── auth.js           # Gestión de autenticación
│   ├── pwa.js            # Funcionalidad de PWA
│   ├── pwa-install.js    # Lógica de instalación de PWA
│   └── modules/          # Módulos específicos
│       ├── pedidos.js    # Funcionalidad de pedidos
│       ├── productos.js  # Gestión de productos
│       ├── usuarios.js   # Administración de usuarios
│       ├── informes.js   # Generación de informes
│       └── notificaciones.js # Sistema de notificaciones
└── img/                  # Iconos y recursos visuales
```

## Funcionalidades en Dispositivos Móviles
- Navegación optimizada para pantallas pequeñas
- Menú inferior para acceso rápido a funciones principales
- Vista ampliada al presionar "Más" para acceder a todas las opciones
- Tablas adaptadas para mejor visualización en pantallas pequeñas
- Instalable como aplicación nativa

## Notificaciones Push
- La aplicación solicitará permisos para enviar notificaciones
- Las notificaciones de sistema se mostrarán incluso con la app cerrada
- Incluye badging (contador) en el icono de la aplicación

## Notas Importantes
- Esta versión utiliza almacenamiento en memoria y localStorage para demostración
- Los datos se reinician al cerrar completamente el navegador
- Para una implementación real, se recomienda integrar con un backend y base de datos

---

© 2025 Fluxon Logistics
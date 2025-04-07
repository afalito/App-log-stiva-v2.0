# LogiStiva - Aplicaci�n de Gesti�n Log�stica

## Descripci�n
LogiStiva es una aplicaci�n de gesti�n log�stica dise�ada para facilitar el seguimiento de pedidos, desde su creaci�n hasta su entrega. Con un enfoque moderno y minimalista, esta aplicaci�n proporciona herramientas para administrar pedidos, productos, usuarios y generar informes detallados.

## Caracter�sticas

### Gesti�n de Usuarios con Roles Espec�ficos
- **Usuario Maestro**: Administraci�n completa del sistema
- **Usuario Vendedor**: Creaci�n y seguimiento de pedidos
- **Usuario Bodega**: Asignaci�n de conductores a pedidos
- **Usuario Conductor**: Gesti�n y actualizaci�n de entregas
- **Usuario Tesorer�a**: Gesti�n de pagos de pedidos

### Seguimiento de Pedidos
- Creaci�n de pedidos con detalles del cliente y productos
- Sistema de estados para seguimiento en tiempo real
- Comentarios y notificaciones con menciones (@usuario)
- Historial completo de cambios de estado

### Gesti�n de Productos
- Cat�logo de productos configurable
- Selecci�n r�pida de productos al crear pedidos

### Informes Detallados
- Generaci�n de informes en formato CSV
- Filtros por fechas y estados de pedidos
- Vista previa de resultados antes de descargar

### Notificaciones Internas
- Sistema de menciones en comentarios
- Centro de notificaciones con marcado de le�das/no le�das

## Flujo de Trabajo
1. El vendedor crea un pedido con estado "Buscando Conductor"
2. El usuario de bodega asigna un conductor
3. El conductor confirma la recepci�n y cambia el estado a "En Proceso de Entrega"
4. Al entregar, el conductor actualiza el estado seg�n el tipo de pago:
   - **Contraentrega**: "Entregado, Pendiente Pagar"
   - **Pago Anticipado**: "Finalizado"
5. Si es contraentrega, el usuario de tesorer�a confirma el pago para finalizar el pedido

## Tecnolog�as Utilizadas
- HTML5, CSS3 y JavaScript puro (vanilla)
- Dise�o responsive para dispositivos m�viles y web
- Almacenamiento local para demo y pruebas

## Comenzando

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Instalaci�n
1. Clona este repositorio
2. Abre el archivo `Main.html` en tu navegador

### Usuarios Demo
- **Usuario Maestro**: admin / admin123
- **Usuario Vendedor**: vendedor / vendedor123
- **Usuario Bodega**: bodega / bodega123
- **Usuario Conductor**: conductor / conductor123
- **Usuario Tesorer�a**: tesoreria / tesoreria123

## Estructura del Proyecto
```
/
   Main.html              # Archivo principal HTML
   css/
      styles.css         # Estilos CSS de la aplicaci�n
   js/
      app.js             # L�gica principal de la aplicaci�n
      auth.js            # Gesti�n de autenticaci�n
      modules/           # M�dulos espec�ficos
          pedidos.js     # Funcionalidad de pedidos
          productos.js   # Gesti�n de productos
          usuarios.js    # Administraci�n de usuarios
          informes.js    # Generaci�n de informes
          notificaciones.js # Sistema de notificaciones
   img/                  # Carpeta para im�genes
```

## Notas Importantes
- Esta versi�n utiliza almacenamiento en memoria y localStorage para demostraci�n
- Los datos se reinician al cerrar completamente el navegador
- Para una implementaci�n real, se recomienda integrar con un backend y base de datos

---

� 2025 LogiStiva
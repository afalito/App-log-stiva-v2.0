// Configuración de Supabase
// Valores para la conexión a Supabase
const SUPABASE_URL = 'https://xftsrnddfkksvtcypqsz.supabase.co';

// La clave anon/public de Supabase (esta es tu clave pública, está bien que esté en el cliente)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdHNybmRkZmtrc3Z0Y3lwcXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTI0NzIsImV4cCI6MjA1OTYyODQ3Mn0.OlJHBFu3RMinHUddnJptXHZqaRGQswUP0_uQcDIbq28';

// Inicializar el cliente de Supabase con opciones de seguridad mejoradas
function initSupabase() {
  // Configuración adicional para mejorar la seguridad
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: 'fluxon_supabase_auth',
      storage: window.localStorage
    },
    global: {
      headers: {
        'Content-Type': 'application/json'
      }
    },
    realtime: {
      enabled: true
    }
  };
  
  return supabase.createClient(SUPABASE_URL, SUPABASE_KEY, options);
}

// Crear una instancia del cliente
let supabaseClient = null;

// Función para obtener el cliente de Supabase
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  return supabaseClient;
}

// Función para sincronizar usuario de Supabase con nuestro modelo de usuario
async function sincronizarUsuarioSupabase(supabaseUser) {
  try {
    if (!supabaseUser) return null;
    
    const supabase = getSupabaseClient();
    
    // Extraer el username del email (si se usó el formato username@app.com)
    const username = supabaseUser.email.split('@')[0];
    
    // Buscar el usuario en nuestra tabla
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error) {
      console.error('Error al sincronizar usuario:', error);
      return null;
    }
    
    if (userData && userData.activo) {
      return {
        id: userData.id,
        nombre: userData.nombre,
        apellido: userData.apellido,
        username: userData.username,
        rol: userData.rol
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error en sincronizarUsuarioSupabase:', error);
    return null;
  }
}

// Hacer que las funciones estén disponibles globalmente
window.getSupabaseClient = getSupabaseClient;
window.sincronizarUsuarioSupabase = sincronizarUsuarioSupabase;
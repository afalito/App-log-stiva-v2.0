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

// Esta función ya no se usa ya que no estamos utilizando Supabase Auth
// La mantenemos por compatibilidad con código existente
async function sincronizarUsuarioSupabase(supabaseUser) {
  console.log("sincronizarUsuarioSupabase: No se usa Supabase Auth");
  return null;
}

// Hacer que las funciones estén disponibles globalmente
window.getSupabaseClient = getSupabaseClient;
window.sincronizarUsuarioSupabase = sincronizarUsuarioSupabase;
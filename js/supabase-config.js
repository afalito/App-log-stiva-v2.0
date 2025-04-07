// Configuración de Supabase
// Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'https://xftsrnddfkksvtcypqsz.supabase.co'; // Ejemplo: https://abcdefghijklmnopqrst.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdHNybmRkZmtrc3Z0Y3lwcXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTI0NzIsImV4cCI6MjA1OTYyODQ3Mn0.OlJHBFu3RMinHUddnJptXHZqaRGQswUP0_uQcDIbq28'; // La clave anon/public de Supabase

// Inicializar el cliente de Supabase
function initSupabase() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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

// Hacer que la función esté disponible globalmente
window.getSupabaseClient = getSupabaseClient;
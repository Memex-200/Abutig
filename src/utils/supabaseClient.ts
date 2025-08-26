import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://feyujlenikivrjiibsfd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleXVqbGVuaWtpdnJqaWlic2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDIwMjksImV4cCI6MjA3MTgxODAyOX0._pnJsfUAlPTWtOwRsuVfmtekZ-zbkC_Q7US_OoD2GY8";

export const supabase = createClient(supabaseUrl, supabaseKey);

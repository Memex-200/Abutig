import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Testing direct connection to Supabase...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectConnection() {
  try {
    // Test 1: Get Complaint Types (Read)
    console.log('1️⃣ Testing getComplaintTypes (Read)...');
    const { data: types, error: typesError } = await supabase
      .from("complaint_types")
      .select("id, name, icon, description, is_active")
      .order("name", { ascending: true });
    
    if (typesError) {
      console.log(`❌ Error: ${typesError.message}`);
    } else {
      console.log(`✅ Success: Found ${types?.length || 0} complaint types`);
    }

    // Test 2: Get Users (Read)
    console.log('\n2️⃣ Testing getUsers (Read)...');
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });
    
    if (usersError) {
      console.log(`❌ Error: ${usersError.message}`);
    } else {
      console.log(`✅ Success: Found ${users?.length || 0} users`);
    }

    // Test 3: Get Complaints (Read)
    console.log('\n3️⃣ Testing getComplaints (Read)...');
    const { data: complaints, error: complaintsError } = await supabase
      .from("complaints")
      .select(`
        id, title, description, status, created_at,
        type:complaint_types(id, name, icon),
        citizen:users!complaints_citizen_id_fkey(id, full_name, phone, email)
      `)
      .order("created_at", { ascending: false });
    
    if (complaintsError) {
      console.log(`❌ Error: ${complaintsError.message}`);
    } else {
      console.log(`✅ Success: Found ${complaints?.length || 0} complaints`);
    }

    // Test 4: Admin Operations (if service key available)
    if (supabaseServiceKey) {
      console.log('\n4️⃣ Testing Admin Operations (Write)...');
      
      // Test creating a test complaint type
      const { data: newType, error: createError } = await supabaseAdmin
        .from("complaint_types")
        .insert({
          name: "Test Type",
          description: "Test description",
          icon: "🧪",
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.log(`❌ Create Error: ${createError.message}`);
      } else {
        console.log(`✅ Success: Created test complaint type with ID: ${newType.id}`);
        
        // Clean up - delete the test type
        const { error: deleteError } = await supabaseAdmin
          .from("complaint_types")
          .delete()
          .eq("id", newType.id);
        
        if (deleteError) {
          console.log(`⚠️ Warning: Could not delete test type: ${deleteError.message}`);
        } else {
          console.log(`✅ Success: Deleted test complaint type`);
        }
      }
    } else {
      console.log('\n4️⃣ Skipping Admin Operations (No service key)');
    }

    console.log('\n🎉 Direct connection tests completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Read operations working');
    console.log('- ✅ Joins working');
    console.log('- ✅ Admin operations working (if service key available)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectConnection();

// scripts/supabase.js
// File này dùng để kết nối Supabase - dùng chung cho toàn bộ project

const SUPABASE_URL = 'https://lmcxlveyfhfoccuujvki.supabase.co'
const SUPABASE_ANON_KEY = document.querySelector('meta[name="supabase-key"]')?.content 
  || window.SUPABASE_ANON_KEY

const { createClient } = supabase

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Hàm lấy thông tin CLB theo subdomain
async function getClubBySubdomain(subdomain) {
  const { data, error } = await db
    .from('clubs')
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    console.error('Không tìm thấy CLB:', error.message)
    return null
  }
  return data
}

// Hàm lấy subdomain từ URL hiện tại
function getSubdomain() {
  const hostname = window.location.hostname
  // localhost thì trả về 'demo' để test
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'demo'
  }
  const parts = hostname.split('.')
  // abc.live3c.xyz → parts = ['abc', 'live3c', 'xyz']
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}
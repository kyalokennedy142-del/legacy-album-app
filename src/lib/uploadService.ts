// src/lib/uploadService.ts
import { createClient } from '@/lib/supabase/client'

/**
 * Securely uploads a file to Supabase Storage
 * - Uses authenticated user's ID
 * - Generates random UUID filename (Security)
 * - Returns Public URL
 */
export async function uploadFileToSupabase(file: File, userId: string) {
  const supabase = createClient()

  // 1. Generate Secure Filename
  // Format: userId/timestamp-uuid.jpg
  const fileExt = file.name.split('.').pop()
  // Use crypto.randomUUID() (Native) or uuid package
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // 2. Upload to Supabase
  const { data, error } = await supabase.storage
    .from('album-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Prevent overwriting
      contentType: file.type
    })

  // 3. Handle Errors & Null Safety
  if (error) {
    console.error('Supabase Upload Error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  // ✅ Fix: Check if data is null before accessing .path
  if (!data) {
    throw new Error('Upload failed: No data returned')
  }

  const path = data.path

  // 4. Get Public URL
  const { data: urlData } = supabase.storage
    .from('album-photos')
    .getPublicUrl(path)

  return { 
    path, 
    url: urlData?.publicUrl || '' 
  }
}
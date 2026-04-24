/* eslint-disable react-hooks/exhaustive-deps */
// src/components/PhotoUpload.tsx
'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaCloudUploadAlt, FaCheckCircle, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa'
import { uploadFileToSupabase } from '@/lib/uploadService'
import { createClient } from '@/lib/supabase/client'

type FileWithPreview = {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  errorMessage?: string
  url?: string
  path?: string
}

interface PhotoUploadProps {
  userId: string
  draftOrderId: string
  onUploadComplete: () => void
  planId?: string
  uploadToGallery?: boolean
}

const PLAN_LIMITS: Record<string, number> = { 
  free: 10,
  legacy: 50, 
  heirloom: Infinity 
}

export default function PhotoUpload({ 
  userId, 
  draftOrderId, 
  onUploadComplete,
  planId = 'free',
  uploadToGallery = false
}: PhotoUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const supabase = createClient()

  const uploadFile = useCallback(async (fileItem: FileWithPreview) => {
    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f =>
          f.id === fileItem.id
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ))
      }, 200)

      const result = await uploadFileToSupabase(fileItem.file, userId)
      if (progressInterval) clearInterval(progressInterval)

      setFiles(prev => {
        const successCount = prev.filter(f => f.status === 'success').length
        
        if (uploadToGallery) {
          // ✅ Check for duplicate BEFORE inserting
          supabase
            .from('user_gallery')
            .select('id')
            .eq('user_id', userId)
            .eq('storage_path', result.path)
            .maybeSingle()
            .then(({  data, error: checkError }) => {  // ✅ FIX: Use 'data' not 'existing'
              if (checkError) {
                console.error('Error checking existing photo:', checkError)
                return
              }
              
              if (data) {  // ✅ FIX: Check 'data' not 'existing'
                // ✅ Photo already exists — show user-friendly warning
                console.log('⚠️ Photo already in gallery:', fileItem.file.name)
                setFiles(prevFiles => prevFiles.map(f =>
                  f.id === fileItem.id
                    ? { 
                        ...f, 
                        progress: 100, 
                        status: 'success', 
                        url: result.url, 
                        path: result.path,
                        errorMessage: '⚠️ Already in gallery'
                      }
                    : f
                ))
                // ✅ Show alert to user
                alert(`"${fileItem.file.name}" is already in your gallery. Skipping duplicate.`)
                return
              }
              
              // ✅ Insert new photo
              supabase
                .from('user_gallery')
                .insert({
                  user_id: userId,
                  storage_path: result.path,
                  public_url: result.url,
                  file_name: fileItem.file.name,
                  file_size: fileItem.file.size,
                })
                .then(({ error }) => {
                  if (error) {
                    console.error('DB insert failed:', error)
                    setFiles(prevFiles => prevFiles.map(f =>
                      f.id === fileItem.id
                        ? { ...f, status: 'error', errorMessage: 'Failed to save' }
                        : f
                    ))
                  }
                })
            })
        } else {
          // Legacy flow: insert into order_photos
          supabase
            .from('order_photos')
            .insert({
              draft_order_id: draftOrderId,
              storage_path: result.path,
              public_url: result.url,
              file_name: fileItem.file.name,
              file_size: fileItem.file.size,
              sequence_number: successCount,
            })
            .then(({ error }) => {
              if (error) {
                console.error('DB insert failed:', error)
                setFiles(prev => prev.map(f =>
                  f.id === fileItem.id
                    ? { ...f, status: 'error', errorMessage: 'Failed to save' }
                    : f
                ))
              }
            })
        }

        return prev.map(f =>
          f.id === fileItem.id
            ? { ...f, progress: 100, status: 'success', url: result.url, path: result.path }
            : f
        )
      })
    } catch (error: unknown) {
      if (progressInterval) clearInterval(progressInterval)

      const err = error as { message?: string }
      const supabaseError = err?.message ?? 'Unknown error'

      console.error('Upload failed:', {
        file: fileItem.file.name,
        error: supabaseError,
      })

      setFiles(prev => prev.map(f =>
        f.id === fileItem.id
          ? {
              ...f,
              progress: 0,
              status: 'error',
              errorMessage: `Failed: ${supabaseError}`,
            }
          : f
      ))
    }
  }, [userId, draftOrderId, uploadToGallery])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const MAX_SIZE = 10 * 1024 * 1024
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    
    const maxPhotos = PLAN_LIMITS[planId] ?? 5
    const currentCount = files.length
    const remaining = maxPhotos - currentCount
    
    if (remaining <= 0) {
      alert(`You've reached the ${maxPhotos === Infinity ? 'unlimited' : maxPhotos}-photo limit for your ${planId} plan.`)
      return
    }

    const newFiles = acceptedFiles
      .slice(0, remaining)
      .filter(file => {
        if (file.size > MAX_SIZE) {
          alert(`${file.name} is too large (max 10MB)`)
          return false
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          alert(`${file.name} is not a supported image type`)
          return false
        }
        return true
      })
      .map(file => ({
        file,
        id: crypto.randomUUID(),
        progress: 0,
        status: 'uploading' as const,
      }))

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      newFiles.forEach(fileItem => uploadFile(fileItem))
    }
  }, [files.length, planId, uploadFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  useEffect(() => {
    if (files.length > 0 && files.every(f => f.status !== 'uploading')) {
      const allSuccess = files.every(f => f.status === 'success')
      if (allSuccess) {
        onUploadComplete()
      }
    }
  }, [files, onUploadComplete])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-10 text-center
          ${isDragActive
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-cyan-400 text-slate-900' : 'bg-white/10 text-white'}`}>
            <FaCloudUploadAlt className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">
              {isDragActive ? 'Drop your photos here' : 'Drag & drop photos here'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              or click to select (Max 10MB per image)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
          {files.map(fileItem => (
            <div key={fileItem.id} className="glass p-3 rounded-xl flex items-center gap-3 animate-slide-up">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden relative">
                {fileItem.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileItem.url} alt={fileItem.file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">📷</div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{fileItem.file.name}</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      fileItem.status === 'success' ? 'bg-green-500' :
                      fileItem.status === 'error' ? 'bg-red-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${fileItem.progress}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${fileItem.errorMessage ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {fileItem.status === 'uploading' ? 'Uploading...' :
                   fileItem.status === 'success' ? (fileItem.errorMessage ? <span className="flex items-center gap-1"><FaExclamationTriangle className="w-3 h-3" /> {fileItem.errorMessage}</span> : '✅ Ready') :
                   `❌ ${fileItem.errorMessage ?? 'Failed'}`}
                </p>
              </div>
              
              {/* Action */}
              <button
                onClick={() => removeFile(fileItem.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                type="button"
              >
                {fileItem.status === 'success'
                  ? <FaCheckCircle className="w-5 h-5 text-green-500" />
                  : <FaTrashAlt className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

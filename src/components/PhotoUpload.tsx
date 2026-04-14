// src/components/PhotoUpload.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaCloudUploadAlt, FaCheckCircle, FaTrashAlt } from 'react-icons/fa'
import { uploadFileToSupabase } from '@/lib/uploadService'
import { createClient } from '@/lib/supabase/client'

type FileWithPreview = {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  errorMessage?: string   // ✅ FIX: was missing from the type
  url?: string
  path?: string
}

interface PhotoUploadProps {
  userId: string
  draftOrderId: string
  onUploadComplete: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PhotoUpload({ userId, draftOrderId, onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const supabase = createClient()

  // ✅ FIX: uploadFile defined before onDrop so the reference is stable
  const uploadFile = useCallback(async (fileItem: FileWithPreview) => {
    // ✅ FIX: declared OUTSIDE try so catch can reach it
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
      clearInterval(progressInterval)

      // ✅ FIX: sequence_number read from functional updater to avoid stale closure
      setFiles(prev => {
        const currentCount = prev.filter(f => f.status === 'success').length

        supabase
          .from('order_photos')
          .insert({
            draft_order_id: draftOrderId,
            storage_path: result.path,
            public_url: result.url,
            file_name: fileItem.file.name,
            file_size: fileItem.file.size,
            sequence_number: currentCount,
          })
          .then(({ error }) => {
            if (error) console.error('DB insert failed:', error)
          })

        return prev.map(f =>
          f.id === fileItem.id
            ? { ...f, progress: 100, status: 'success', url: result.url, path: result.path }
            : f
        )
      })
    } catch (error: unknown) {
      if (progressInterval) clearInterval(progressInterval)

      const err = error as { message?: string; hint?: string; details?: string }
      const supabaseError = err?.message ?? 'Unknown error'
      const errorHint = err?.hint ?? ''
      const errorDetails = err?.details ?? ''

      console.error('Upload failed:', {
        file: fileItem.file.name,
        supabaseError,
        hint: errorHint,
        details: errorDetails,
      })

      setFiles(prev => prev.map(f =>
        f.id === fileItem.id
          ? {
              ...f,
              progress: 0,
              status: 'error',
              errorMessage: supabaseError.includes('violates')
                ? 'Database constraint error. Check column names or RLS policies.'
                : supabaseError.includes('foreign key')
                ? 'Invalid order ID. Please restart the upload process.'
                : `Failed: ${supabaseError}`,
            }
          : f
      ))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, draftOrderId])

  // ✅ FIX: uploadFile is now a stable dep so this callback is correct
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const MAX_SIZE = 10 * 1024 * 1024
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

    const newFiles = acceptedFiles
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
  }, [uploadFile])

  // ✅ FIX: useDropzone, removeFile, and return are now at component level (not inside uploadFile)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone Area */}
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
              <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden relative">
                {fileItem.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileItem.url} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">📷</div>
                )}
              </div>
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
                <p className="text-xs text-gray-400 mt-1">
                  {fileItem.status === 'uploading' ? 'Uploading...' :
                   fileItem.status === 'success' ? 'Ready' :
                   fileItem.errorMessage ?? 'Failed'}
                </p>
              </div>
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
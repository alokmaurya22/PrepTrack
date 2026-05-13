import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  onUploadComplete: () => void
}

export function FileUpload({ onUploadComplete }: Props) {
  const { session } = useAuthStore()

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'audio/mpeg',
          'audio/mp4',
        ]
        if (!allowed.includes(file.type)) {
          toast.error(`${file.name}: unsupported file type`)
          continue
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name}: exceeds 50 MB limit`)
          continue
        }

        const fileId = uuidv4()
        const filePath = `${session!.user.id}/${fileId}/${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file)

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`)
          continue
        }

        const { error: dbError } = await supabase.from('attachments').insert({
          user_id: session!.user.id,
          file_path: filePath,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })

        if (dbError) {
          toast.error('Failed to save file record')
        }
      }
      onUploadComplete()
    },
    [session, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-muted-foreground text-sm">
        {isDragActive
          ? 'Drop files here…'
          : 'Drag & drop files, or click to browse'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PDF, DOCX, JPG, PNG, MP3 — max 50 MB each
      </p>
    </div>
  )
}
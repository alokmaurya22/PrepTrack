import { useState } from 'react'
import { Trash2, Download, FileText, Image, File, HardDrive, RotateCcw } from 'lucide-react'
import {
  useAttachments,
  useTrashAttachments,
  useStorageUsage,
  useDeleteAttachment,
  usePermanentDeleteAttachment,
  useRestoreAttachment,
  useGetFileUrl,
  type Attachment,
} from '../lib/queries/resources'
import { FileUpload } from '../components/resources/FileUpload'
import { cn } from '../lib/utils'
import { format } from 'date-fns'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
  return <File className="h-5 w-5 text-muted-foreground" />
}

export function ResourcesPage() {
  const [view, setView] = useState<'files' | 'trash'>('files')
  const { data: attachments, isLoading, refetch } = useAttachments()
  const { data: trashAttachments } = useTrashAttachments()
  const { data: storageBytes } = useStorageUsage()
  const deleteAttachment = useDeleteAttachment()
  const permanentDelete = usePermanentDeleteAttachment()
  const restoreAttachment = useRestoreAttachment()
  const getFileUrl = useGetFileUrl()

  const handleDownload = async (file: Attachment) => {
    const url = await getFileUrl.mutateAsync(file.file_path)
    if (url) {
      window.open(url, '_blank')
    }
  }

  const storageGB = storageBytes ? storageBytes / (1024 * 1024 * 1024) : 0

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading resources…</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setView('files')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  view === 'files'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Files ({attachments?.length || 0})
              </button>
              <button
                onClick={() => setView('trash')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  view === 'trash'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Trash ({trashAttachments?.length || 0})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            <span>{storageGB.toFixed(2)} GB used</span>
          </div>
        </div>

        {/* Storage bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min((storageGB / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'files' ? (
          <>
            <FileUpload onUploadComplete={() => refetch()} />

            <div className="mt-4">
              {attachments && attachments.length === 0 ? (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag & drop files above to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {attachments?.map((file) => (
                    <div
                      key={file.id}
                      className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {getFileIcon(file.mime_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.file_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatSize(file.size_bytes)} · {format(new Date(file.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-primary hover:bg-primary/10 rounded px-2 py-1 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Open
                        </button>
                        <button
                          onClick={() => deleteAttachment.mutate(file.id)}
                          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded px-2 py-1 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            {trashAttachments && trashAttachments.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Trash is empty</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deleted files appear here for 30 days
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {trashAttachments?.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
                  >
                    {getFileIcon(file.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.file_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatSize(file.size_bytes)} · Deleted {file.deleted_at ? format(new Date(file.deleted_at), 'MMM d') : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => restoreAttachment.mutate(file.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 rounded px-2 py-1 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => permanentDelete.mutate(file.id)}
                      className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded px-2 py-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'media'

export async function uploadMedia(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string; type: 'video' | 'photo' }> {
  const isVideo = file.type.startsWith('video/')
  const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, type: isVideo ? 'video' : 'photo' }
}

export async function uploadThumbnail(
  supabase: SupabaseClient,
  userId: string,
  blob: Blob
): Promise<string> {
  const path = `${userId}/thumb_${Date.now()}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const objectUrl = URL.createObjectURL(file)

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = objectUrl

    video.onloadedmetadata = () => {
      // アスペクト比を保ちながら最大720px
      const maxW = 720
      const ratio = Math.min(maxW / video.videoWidth, 1)
      canvas.width = Math.round(video.videoWidth * ratio)
      canvas.height = Math.round(video.videoHeight * ratio)
      video.currentTime = Math.min(1, video.duration * 0.1)
    }

    video.onseeked = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas context failed')); return }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(objectUrl)
        blob ? resolve(blob) : reject(new Error('thumbnail generation failed'))
      }, 'image/jpeg', 0.85)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('video load failed'))
    }
  })
}

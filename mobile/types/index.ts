export type MediaType = 'video' | 'photo'
export type Visibility = 'public' | 'private' | 'unlisted'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface Page {
  id: string
  user_id: string
  slug: string
  title: string
  theme: string
  description: string | null
  sort_order: number
  is_public: boolean
}

export interface Post {
  id: string
  user_id: string
  page_id: string | null
  media_url: string | null
  media_type: MediaType | null
  thumbnail_url: string | null
  caption: string | null
  visibility: Visibility
  created_at: string
}

export type MediaType = 'video' | 'photo'
export type Visibility = 'public' | 'private' | 'unlisted'

export type Theme =
  | 'daily'
  | 'cafe'
  | 'travel'
  | 'night'
  | 'minimal'
  | 'wedding'
  | 'birthday'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  custom_domain: string | null
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  user_id: string
  slug: string
  title: string
  theme: Theme
  description: string | null
  sort_order: number
  is_public: boolean
  created_at: string
  updated_at: string
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
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ShareToken {
  id: string
  token: string
  user_id: string
  post_id: string | null
  page_id: string | null
  label: string | null
  expires_at: string | null
  created_at: string
}

export interface PostAccess {
  id: string
  post_id: string
  viewer_id: string
  granted_at: string
}

export interface PageAccess {
  id: string
  page_id: string
  viewer_id: string
  granted_at: string
}

// DB row types (with joins)
export interface PostWithPage extends Post {
  page: Page | null
}

export interface PageWithPosts extends Page {
  posts: Post[]
}

export interface ProfileWithPages extends Profile {
  pages: Page[]
}

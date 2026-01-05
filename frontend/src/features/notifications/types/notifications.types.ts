export interface Notification {
  id: string
  userId: string
  title: string
  message?: string
  type?: string
  link?: string
  readAt?: string | null
  createdAt: string
}

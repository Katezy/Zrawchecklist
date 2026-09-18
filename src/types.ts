export interface Note {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export interface Project {
  id: string
  name: string
  notes: Note[]
  createdAt: number
}
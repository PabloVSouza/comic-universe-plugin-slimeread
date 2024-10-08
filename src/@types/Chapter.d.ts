interface IChapter {
  id: number
  comicId: number
  siteId: string
  siteLink?: string | null
  releaseId?: string | null
  name: string
  number: string
  pages: string
  date: string
  repo: string
  language?: string
  offline: boolean
  Comic: IComic
  ReadProgress: IReadProgress[]
}

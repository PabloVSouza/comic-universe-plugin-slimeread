interface BookTag {
  tag: {
    tag_name: string
    tag_id: number
    tag_name_ptBR: string
    tag_nsfw: boolean
  }
}

interface BookCategory {
  cat_name: string
  cat_id: number
  cat_name_ptBR: string
  cat_nsfw: boolean
}

interface BookTemp {
  bt_id: number
  bt_season: string | null
}

interface BookInfoContent {
  type: string
  mangadexId: string
  avaiablesProviders: {
    al: string
    ap: string
    bw: string
    kt: string
    mu: string
    amz: string
    cdj: string
    ebj: string
    mal: string
    others: string
    others1: string
  }
}

interface BookInfo {
  book_info_id: number
  book_info_book_id: number
  book_info_content: BookInfoContent
  book_info_date_created: string
  book_info_date_updated: string
}

interface Scan {
  scan_id: number
  scan_name: string
}

interface Genre {
  genre_name: string
}

interface Author {
  author_name: string
  author_id: number
}

interface Book {
  book_name_original: string
  book_name: string
  book_image: string
  book_id: number
  book_redirect_link: string | null
  book_name_alternatives: string
  book_status: number
  book_date_updated: string
  book_views: number
  book_synopsis: string
  book_publication_year: number
  book_language_id: number | null
  book_scan_id: number
  book_flagged: number
  book_uuid: string
  book_content_warning: number
  book_nsfw: number
  book_genre_id: number
  scan: Scan
  genre: Genre
  author: Author
  book_tag: BookTag[]
  book_categories: BookCategory[]
  book_temp: BookTemp[]
  book_infos: BookInfo[]
}

interface PageProps {
  book_info: Book
}

interface BookInfoResponse {
  data: { pageProps: PageProps }
}

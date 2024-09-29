interface IBookTag {
  tag: {
    tag_name: string
    tag_id: number
    tag_name_ptBR: string
    tag_nsfw: boolean
  }
}

interface IBookCategory {
  cat_name: string
  cat_id: number
  cat_name_ptBR: string
  cat_nsfw: boolean
}

interface IBookTempCap {
  btc_cap: number
  btc_date_created: string
  btc_date_updated: string
  btc_name: string | null
  scan: IScan
}

interface IBookTemp {
  bt_id: number
  bt_season: string | null
  book_temp_caps: IBookTempCap[]
}

interface IBookInfoContent {
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

interface IBookInfo {
  book_info_id: number
  book_info_book_id: number
  book_info_content: IBookInfoContent
  book_info_date_created: string
  book_info_date_updated: string
}

interface IScan {
  scan_id: number
  scan_name: string
}

interface IGenre {
  genre_name: string
}

interface IAuthor {
  author_name: string
  author_id: number
}

interface IBook {
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
  book_publication_year: number | null
  book_language_id: number | null
  book_scan_id: number
  book_flagged: number | null
  book_uuid: string
  book_content_warning: number
  book_nsfw: number
  book_genre_id: number
  scan: IScan
  genre: IGenre
  author: IAuthor
  book_tag: IBookTag[]
  book_categories: IBookCategory[]
  book_temp: IBookTemp[]
  book_infos: IBookInfo[]
  book_date_created: string
}

interface IPageProps {
  book_info: IBook
}

interface IBookInfoSingleResponse {
  data: { pageProps: IPageProps }
}

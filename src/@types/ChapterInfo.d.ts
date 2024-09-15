interface IScan {
  scan_name: string
  scan_id: string
}

interface IChaptersInfo {
  btc_id: number
  btc_cap: number
  btc_date_updated: string
  btc_external_link: string
  btc_name: string
  scan: IScan
}

interface IChapterInfo {
  data: IChaptersInfo[]
}

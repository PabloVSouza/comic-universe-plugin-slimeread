interface PageInfo {
  btcu_content: null
  btcu_image: string
  btcu_provider_host: number
  btcu_downloaded_status: number
}

interface PagesInfo {
  btc_id: number
  btc_cap: number
  btc_scan_id: number
  btc_name: string
  scan: Scan
  book_temp_caps_colab: []
  book_temp_cap_unit: PageInfo[]
}

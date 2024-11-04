/// <reference types="node" />
import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import * as zlib from 'node:zlib'
import * as cheerio from 'cheerio'
import { getQuickJS } from 'quickjs-emscripten'

class SlimeReadRepoPlugin implements IRepoPluginRepository {
  public RepoName = 'Slime Read'
  public RepoTag = 'slimeread'
  public RepoUrl = 'https://slimeread.com/'
  private _ApiUrl = ''
  private cdnSources = {
    '2': 'https://cdn.slimeread.com/',
    '3': 'https://objects.slimeread.com/',
    '5': 'https://black.slimeread.com/'
  } as { [key: string]: string }

  private buildId = ''

  private axios: AxiosInstance

  constructor(_data: IRepoPluginRepositoryInit) {
    this.axios = axios.create({
      baseURL: this.RepoUrl,
      timeout: 15000,
      headers: {
        'content-type': 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        'User-Agent': 'insomnia/9.3.3'
      }
    })
  }

  private ApiUrl = async () => {
    if (!this._ApiUrl.length) await this.getApiUrlFromPage()
    return this._ApiUrl
  }

  private getApiUrlFromPage = async () => {
    const FUNCTION_REGEX =
      /function\s*\(\)\s*\{(?:(?!function)[\s\S])*?slimeread\.com:8443[^\}]*\}/s
    const BASEURL_VAL_REGEX = /baseURL\s*:\s*(\w+)/

    const initResponse = await this.axios.get('/')
    if (initResponse.status !== 200) {
      throw new Error(`HTTP error ${initResponse.status}`)
    }

    const $ = cheerio.load(initResponse.data)
    const scriptUrl = $('script[src*="pages/_app"]').attr('src')
    if (!scriptUrl) {
      throw new Error('Could not find script URL')
    }

    const scriptResponse = await this.axios.get(scriptUrl)
    if (scriptResponse.status !== 200) {
      throw new Error(`HTTP error ${scriptResponse.status}`)
    }

    const script = scriptResponse.data

    const functionMatch = FUNCTION_REGEX.exec(script)
    if (!functionMatch) {
      throw new Error('Could not find the function containing the API URL')
    }

    const baseUrlMatch = BASEURL_VAL_REGEX.exec(functionMatch[0])
    if (!baseUrlMatch) {
      throw new Error('Could not find the base URL variable')
    }

    const baseUrlVar = baseUrlMatch[1]
    const regex = new RegExp(`let.*?${baseUrlVar}\\s*=.*?(?=,\\s*\\w\\s*=)`, 's')
    const varBlockMatch = regex.exec(functionMatch[0])

    if (!varBlockMatch) {
      throw new Error('Could not find the variable block for the base URL')
    }

    try {
      const quickJs = await getQuickJS()
      const apiUrl = quickJs.evalCode(`${varBlockMatch[0]}; ${baseUrlVar}`) as string
      const finalApiUrl = apiUrl.replace(/\/$/, '') // Remove the trailing slash

      this._ApiUrl = finalApiUrl
    } catch (error) {
      throw new Error('Could not find API URL')
    }
  }

  private ApiToAppFormatter = (data: IBook[]): IComic[] => {
    const list = data.map((val) => {
      const name = val.book_name_original
      const cover = val.book_image
      const siteId = String(val.book_id)
      const siteLink = val.book_name
      const type = 'manga'

      return {
        name,
        siteId,
        siteLink,
        cover,
        type
      }
    })

    return list as IComic[]
  }

  private getBuildId = async () => {
    const result = await this.axios.get(this.RepoUrl)
    const data = result.data as string

    const buildIdIndex = data.indexOf('buildId') + 10

    const buildIdParcial = data.substring(buildIdIndex)

    const buildId = buildIdParcial.substring(0, buildIdParcial.indexOf('"'))
    this.buildId = buildId
  }

  public methods: IRepoPluginMethods = {
    getList: async (): Promise<IComic[]> => {
      let res: IComic[]

      try {
        if (!this.buildId) await this.getBuildId()
        const url = `${this.RepoUrl}_next/data/${this.buildId}/recentes.json`
        const { data } = await this.axios.get(url)

        const comicData = data.pageProps.data.data
        const list = this.ApiToAppFormatter(comicData)
        res = list as IComic[]
      } catch (e) {
        console.log(e)
        res = []
      }

      return new Promise((resolve) => {
        resolve(res)
      })
    },

    search: async ({ search }): Promise<IComic[]> => {
      const searchString = qs.stringify({
        query: search
      })

      let res: IComic[]

      try {
        const apiUrl = await this.ApiUrl()

        const { data } = await this.axios.get(`${apiUrl}/book_search/?${searchString}`)

        const list = this.ApiToAppFormatter(data)

        res = list as IComic[]
      } catch (e) {
        console.log(e)
        res = []
      }

      return new Promise((resolve) => {
        resolve(res)
      })
    },

    getDetails: async (search): Promise<Partial<IComic>> => {
      const {
        data: {
          pageProps: { book_info }
        }
      } = (await this.axios.get(
        `${this.RepoUrl}_next/data/${this.buildId}/manga/${search.siteId}/${search.siteLink}.json`
      )) as IBookInfoSingleResponse

      return new Promise((resolve) => {
        resolve({
          synopsis: book_info.book_synopsis,
          genres: JSON.stringify(book_info.book_tag.map((val) => val.tag.tag_name)),
          type: 'manga'
        })
      })
    },

    getChapters: async ({ siteId }): Promise<IChapter[]> => {
      const apiUrl = await this.ApiUrl()
      const { data } = (await axios.get(
        `${apiUrl}/book_cap_units_all?manga_id=${siteId}`
      )) as IChapterInfo
      const chapters = data.map(
        (val) =>
          ({
            siteId: String(val.btc_id),
            siteLink: siteId,
            number: String(val.btc_cap),
            date: val.btc_date_updated,
            name: val.btc_name,
            repo: this.RepoTag
          } as IChapter)
      ) as IChapter[]

      const nonDupe = chapters.filter(
        (val, index) => chapters.findIndex((item) => item.number === val.number) === index
      )

      const removeInvalid = nonDupe.filter((val) => !val.number.startsWith('-'))
      return new Promise((resolve) => {
        resolve(removeInvalid)
      })
    },

    getPages: async ({ chapter }) => {
      const apiUrl = await this.ApiUrl()
      const url = `${apiUrl}/v2/book_cap_units?manga_id=${chapter.siteLink}&cap=${chapter.number}`
      const { data } = await axios.get(url)

      const byteString = data.caps.substring(data.caps.indexOf(',') + 1) as string
      const splitString = byteString.split(',').map((a) => parseInt(a))
      const uiArray = new Uint8Array(splitString)
      const inflate = zlib.inflateSync(uiArray)
      const decoded = JSON.parse(new TextDecoder().decode(inflate)) as PagesInfo[]
      const scan = decoded[0]

      this.cdnSources[2]

      const pages = scan.book_temp_cap_unit.map(
        (val) =>
          ({
            path: `${this.cdnSources[val.btcu_provider_host ?? 3]}${val.btcu_image}`,
            filename: val.btcu_image.substring(val.btcu_image.lastIndexOf('/') + 1)
          } as IPage)
      ) as IPage[]

      return new Promise((resolve) => {
        resolve(pages)
      })
    }
  }
}

export default SlimeReadRepoPlugin

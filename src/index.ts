import axios, { Axios } from 'axios'
import qs from 'qs'
import * as cheerio from 'cheerio'
class HQNowRepoPlugin implements IRepoPluginRepository {
  public RepoName = 'Slime Read'
  public RepoTag = 'slimeread'
  public RepoUrl = 'https://slimeread.com/'

  private axios: Axios

  constructor(data: IRepoPluginRepositoryInit) {
    this.axios = new Axios({
      baseURL: this.RepoUrl,
      timeout: 15000,
      headers: {
        'content-type': 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest'
      }
    })
  }

  //@ts-ignore
  private ApiToAppFormatter = (data): ComicInterface[] => {
    const list = data
      //@ts-ignore
      .map((val) => {
        const name = val.book_name_original
        const cover = val.book_image
        const siteId = val.book_id
        const siteLink = siteId
        const type = 'manga'

        return {
          name,
          siteId,
          siteLink,
          cover,
          type
        }
      })

    return list as ComicInterface[]
  }

  public methods: IRepoPluginMethods = {
    getList: async (): Promise<ComicInterface[]> => {
      let res: ComicInterface[]

      try {
        const { data } = await this.axios.get(
          `${this.RepoUrl}/_next/data/1721567990076/recentes.json`
        )

        const comicData = JSON.parse(data).pageProps.data.data

        console.log(comicData)

        const list = this.ApiToAppFormatter(comicData)

        res = list as ComicInterface[]
      } catch (e) {
        console.log(e)
        res = []
      }

      return new Promise((resolve) => {
        resolve(res)
      })
    },

    search: async ({ search }): Promise<ComicInterface[]> => {
      const searchString = qs.stringify({
        query: search
      })

      let res: ComicInterface[]

      try {
        const { data } = await this.axios.get(
          `https://ola-scrapper-to-precisando-de-gente-bora.slimeread.com:8443/book_search/?${searchString}`
        )

        const list = this.ApiToAppFormatter(JSON.parse(data))

        res = list as ComicInterface[]
      } catch (e) {
        console.log(e)
        res = []
      }

      return new Promise((resolve) => {
        resolve(res)
      })
    },

    getDetails: async (search): Promise<Partial<ComicInterface>> => {
      const { siteLink } = search

      const { data } = await this.axios.get(siteLink)

      const parsedData = cheerio.load(data)

      const synopsisRaw = parsedData('.boxAnimeSobreLast p').html()
      const synopsis = synopsisRaw?.substring(synopsisRaw.indexOf(':') + 1)

      const genres = JSON.stringify(
        parsedData('.genre-list li')
          .map((_i, item) => parsedData(item).find('a').html()?.trim())
          .toArray()
      )

      const res = {
        synopsis,
        genres,
        type: 'manga'
      } as Partial<ComicInterface>

      return new Promise((resolve) => {
        resolve(res)
      })
    },

    getChapters: async ({ siteId }): Promise<ChapterInterface[]> => {
      const { data } = await axios.get(siteId)

      const parsedData = cheerio.load(data)

      const chaptersList = parsedData('.single-chapter')
        .map(
          (_id, val) =>
            ({
              siteId: parsedData(val).prop('data-id-cap'),
              number: parsedData(val).prop('data-id-cap'),
              siteLink: parsedData(val).find('a').prop('href'),
              date: parsedData(val).find('small').children('small').text()
            } as ChapterInterface)
        )
        .toArray()

      return new Promise((resolve) => {
        resolve(chaptersList.reverse())
      })
    },

    getPages: async ({ siteLink }) => {
      function base64Decrypt(data: string): string {
        const base64String = data.substring(data.indexOf(',') + 1)
        return Buffer.from(base64String, 'base64').toString()
      }

      let response: { filename: string; path: string }[]

      try {
        const fetchPage = await this.axios.get(siteLink)
        const parsedPage = cheerio.load(fetchPage.data)
        const pagesRawBase64 = parsedPage('.heading-header').next().prop('src')
        const pagesRaw =
          (pagesRawBase64
            ? base64Decrypt(pagesRawBase64)
            : parsedPage('.heading-header').next().html()) ?? ''

        const pages = JSON.parse(
          pagesRaw.substring(pagesRaw.indexOf('['), pagesRaw.indexOf(']') + 1)
        ) as string[]

        response = pages.map((page) => {
          const filename = page.substring(page.lastIndexOf('/') + 1)
          const path = page

          return { filename, path }
        })
      } catch (e) {
        console.log(e)
        response = []
      }

      return new Promise((resolve) => {
        resolve(response)
      })
    }
  }
}

export default HQNowRepoPlugin

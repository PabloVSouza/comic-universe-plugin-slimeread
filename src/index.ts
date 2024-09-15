import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import * as cheerio from 'cheerio'
class SlimeReadRepoPlugin implements IRepoPluginRepository {
  public RepoName = 'Slime Read'
  public RepoTag = 'slimeread'
  public RepoUrl = 'https://slimeread.com/'
  private ApiUrl = 'https://ola-scrapper-to-precisando-de-gente-bora.slimeread.com:8443'
  private buildId = ''

  private axios: AxiosInstance

  constructor(data: IRepoPluginRepositoryInit) {
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

  //@ts-ignore
  private ApiToAppFormatter = (data): ComicInterface[] => {
    const list = data
      //@ts-ignore
      .map((val) => {
        const name = val.book_name_original
        const cover = val.book_image
        const siteId = val.book_id
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

    return list as ComicInterface[]
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
    getList: async (): Promise<ComicInterface[]> => {
      let res: ComicInterface[]

      try {
        if (!this.buildId) await this.getBuildId()
        const url = `${this.RepoUrl}_next/data/${this.buildId}/recentes.json`
        const { data } = await this.axios.get(url)

        const comicData = data.pageProps.data.data
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
        const { data } = await this.axios.get(`${this.ApiUrl}/book_search/?${searchString}`)

        const list = this.ApiToAppFormatter(data)

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
      const data = await this.axios.get(
        `${this.RepoUrl}_next/data/${this.buildId}/manga/${search.siteId}/${search.siteLink}.json`
      )
      // console.log(data)
      return new Promise((resolve) => {
        resolve({
          //@ts-ignore
          synopsis: data.book_synopsis
        })
      })
    },

    getChapters: async ({ siteId }): Promise<ChapterInterface[]> => {
      return new Promise((resolve) => {
        resolve([])
      })
    },

    getPages: async ({ siteLink }) => {
      return new Promise((resolve) => {
        resolve([])
      })
    }
  }
}

export default SlimeReadRepoPlugin

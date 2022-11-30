import { NextApiRequest, NextApiResponse } from 'next'
import { SitemapStream } from 'sitemap'
import { loadData } from '../../data/load-data'

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')

  const smStream = new SitemapStream({ hostname: 'https://cryptoflows.info/' })
  smStream.pipe(res)

  smStream.write({ url: '/' })
  smStream.write({ url: '/bridges' })

  const data = await loadData();

  for (const bridge of data.bridges) {
    smStream.write({ url: `/bridges/${bridge.id}`, priority: 0.5 })
  }

  for (const chain of data.chains) {
    smStream.write({ url: `/chains/${chain.id}`, priority: 0.5 })
  }

  smStream.end()
}

export default handler

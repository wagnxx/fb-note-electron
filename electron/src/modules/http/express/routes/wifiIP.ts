import { getNetworkInfo } from '@/utils/netUtils'
import { Request, Response, Router } from 'express'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const alias = await getNetworkInfo()
  res.status(200)
  res.send(alias)
})

export default router

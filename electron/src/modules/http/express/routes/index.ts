import { Router, Request, Response } from 'express'
import video from './video'
import image from './image'
import wifiIP from './wifiIP'
import hub from './hub'

const router = Router()

router.use('/video', video)
router.use('/image', image)
router.use('/wifiIP', wifiIP)
router.use('/hub', hub)
router.use('/api/hub', hub)

router.use('/test', (req: Request, res: Response) => {
  res.send('raa -')
})

export default router

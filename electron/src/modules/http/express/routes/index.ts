import { Router, Request, Response } from 'express'
import video from './video'
import image from './image'
import wifiIP from './wifiIP'

const router = Router()

router.use('/video', video)
router.use('/image', image)
router.use('/wifiIP', wifiIP)

router.use('/test', (req: Request, res: Response) => {
  res.send('raa -')
})

export default router

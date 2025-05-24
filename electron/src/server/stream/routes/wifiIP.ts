import { getLocalWiFiIP } from '@/utils/netUtils'
import { Request, Response, Router } from 'express'
import express, { NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const alias = getLocalWiFiIP()
  res.status(200)
  res.send(alias)
})

export default router

import { Request, Response } from 'express'
export function forbidLogsAccess(req: Request, res: Response) {
  res.status(403).send('Access to logs folder is forbidden')
}

import React, { FC, useState } from 'react'
import AvatarCropModal from './AvatarCropModal'
import { Upload } from 'antd'
import AvatarText from './Avatar'
import { readFileAsBase64 } from '@/utils/utilsFile'

const AvatarUploader: FC<{
  avatar?: string
  username?: string
  onUpdateAvatar?: (ava: string) => void
}> = ({ username, avatar, onUpdateAvatar }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  // const [avatar, setAvatar] = useState<string | null>(null)

  const handleFile = (file: any) => {
    readFileAsBase64(file.file).then(result => {
      setImageUrl(result)
      setOpen(true)
    })
  }

  return (
    <div>
      <Upload showUploadList={false} customRequest={handleFile}>
        <AvatarText userName={username} src={avatar || ''} size={'large'} />
      </Upload>

      {imageUrl && (
        <AvatarCropModal
          imageUrl={imageUrl}
          open={open}
          onClose={() => setOpen(false)}
          onFinish={base64 => onUpdateAvatar?.(base64)}
        />
      )}
    </div>
  )
}

export default AvatarUploader

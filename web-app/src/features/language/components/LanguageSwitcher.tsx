import { AppDispatch, RootState } from '@/store/store'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setLanguage } from '../languageSlice'
import { MenuProps, Button, Dropdown } from 'antd'

const LanguageSwitcher = () => {
  const dispatch = useDispatch<AppDispatch>()
  const currentLanguage = useSelector((state: RootState) => state.language.lang)

  const switchLanguage = (lng: string) => {
    dispatch(setLanguage(lng))
  }

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Button size="small" type="text" onClick={() => switchLanguage('en')}>
          English
        </Button>
      ),
    },
    {
      key: '2',
      label: (
        <Button size="small" type="text" onClick={() => switchLanguage('zh')}>
          chinese
        </Button>
      ),
    },
  ]

  return (
    <Dropdown menu={{ items }}>
      <Button size="small" type="text">
        lang: {currentLanguage}
      </Button>
    </Dropdown>
  )
}

export default LanguageSwitcher

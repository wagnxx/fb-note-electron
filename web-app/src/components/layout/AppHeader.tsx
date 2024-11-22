// sidbarCollapsed
import React from 'react'
import { HomeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { getSidbarCollapsed } from '@/features/settings/selectors'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar } from '@/features/settings/settingsSlice'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '@/features/language/components/LanguageSwitcher'

const AppHeader = () => {
  const sidbarCfdsfollapsed = useSelector(getSidbarCollapsed)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <div className="app-header">
      <div className="app-header__item" onClick={() => dispatch(toggleSidebar())}>
        {sidbarCfdsfollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>
      <div className="app-header__item" onClick={() => navigate('/')}>
        <HomeOutlined />
      </div>
      <div className="app-header__item">
        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default AppHeader

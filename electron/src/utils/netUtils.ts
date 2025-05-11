import os from 'os'

export function getLocalWiFiIP(): os.NetworkInterfaceInfoIPv4 | null {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name]
    if (!iface) continue

    for (const alias of iface) {
      // 跳过 IPv6、内网回环地址、非“已连接”状态
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias
      }
    }
  }

  return null
}

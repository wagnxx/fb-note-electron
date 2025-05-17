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

export async function getNetworkInfo() {
  const interfaces = os.networkInterfaces()
  let localAddress: string | null = null

  // 遍历网卡，找到非内网、非虚拟机、IPv4 的地址
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue
    for (const config of iface) {
      if (
        (config.family === 'IPv4' && !config.internal && config.address.startsWith('192.')) ||
        config.address.startsWith('10.') ||
        config.address.startsWith('172.')
      ) {
        localAddress = config.address
        break
      }
    }
    if (localAddress) break
  }

  // 获取默认网关（路由器地址）

  const gatewayModule = await import('default-gateway')
  const result = await gatewayModule.gateway4async()

  return {
    ip: localAddress,
    gateway: result.gateway,
  }
}

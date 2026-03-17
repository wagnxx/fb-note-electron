import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
/* ---------------------------
   Custom red div icon for search results
   (so it visually differs from default blue marker)
   --------------------------- */
export const defaultMapIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
})
// 红色 marker 替代蓝色默认
export const searchMarkerIcon = L.divIcon({
  className: 'search-marker-icon',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #e55353;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) translate(-50%, -50%);
      position: relative;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24], // 尖端对准地理坐标
})

export const locatedIcon = L.divIcon({
  className: 'search-result-icon',
  html: `<div style="
    width: 16px;
    height: 16px;
    border: 2px solid #fff;
    background-color: #0f89f5;
    border-radius: 50%;
    box-shadow: 2px 2px 2px rgba(0, 0, 0, .15);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

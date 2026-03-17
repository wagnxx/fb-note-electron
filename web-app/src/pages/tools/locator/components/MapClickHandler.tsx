import { MeasurePoint, Task, TaskType } from '@/features/locator/types'
import { useNotification } from '@/hooks/useNotification'
import { useMapEvents } from 'react-leaflet'

/* ---------------------------
   Map Click Handler
   - handle clicks according to task type
   --------------------------- */
export function MapClickHandler({
  currentTaskId,
  tasks,
  addPointToTask,
  startMeasurePoint,
  setStartMeasurePoint,
  addLineSegment,
  allowAddWhenNoTask,
  openAddToTaskModal,
}: {
  currentTaskId: string | null
  tasks: Task[]
  addPointToTask: (taskId: string, lat: number, lng: number) => void
  startMeasurePoint: MeasurePoint | null
  setStartMeasurePoint: (p: MeasurePoint | null) => void
  addLineSegment: (start: MeasurePoint, end: MeasurePoint) => void
  allowAddWhenNoTask: boolean
  openAddToTaskModal: (lat: number, lng: number) => void
}) {
  const { notification } = useNotification()

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      if (!currentTaskId) {
        if (allowAddWhenNoTask && tasks.length > 0) {
          openAddToTaskModal(lat, lng)
          return
        }
        // notification.warning({
        //   message: '未选择任务',
        //   description: '请先选择任务或新增任务后再添加点',
        // })
        return
      }

      const task = tasks.find(t => t.id === currentTaskId)
      if (!task) return
      if (task.completed) {
        // notification.warning({ message: '任务已完成', description: '该任务已完成，不能添加点' })
        return
      }

      // 根据任务类型执行不同逻辑
      switch (task.type) {
        case TaskType.Measure:
          // 测距任务
          if (!startMeasurePoint) {
            setStartMeasurePoint({ id: 'tmp', lat, lng, distanceKm: 0 })
            notification.info({ message: '测量', description: '已选择起点，请选择终点' })
          } else {
            addLineSegment(startMeasurePoint, { id: 'tmp2', lat, lng, distanceKm: 0 })
            setStartMeasurePoint(null)
          }
          break

        case TaskType.Circle:
          // 画圈任务，直接添加带圈的点
          addPointToTask(task.id, lat, lng)
          notification.success({ message: '已添加点', description: `已加入任务 ${task.name}` })
          break

        case TaskType.Marker:
          // 仅标记任务
          addPointToTask(task.id, lat, lng)
          notification.success({ message: '已添加标记', description: `已加入任务 ${task.name}` })
          break

        default:
          // 如果不属于已知类型，可以选择忽略或弹窗
          notification.info({ message: '未定义操作', description: '该任务类型点击无效' })
          break
      }
    },
  })

  return null
}

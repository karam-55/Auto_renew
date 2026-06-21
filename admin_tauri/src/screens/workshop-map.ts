import { AuthService } from '../services/auth'
import { ApiClient } from '../api/client'
import { Router } from '../router'
import { AppLayout } from '../components/layout'

export class WorkshopMapScreen {
  constructor(private auth: AuthService, private api: ApiClient, private router: Router) {}

  render(): HTMLElement {
    const layout = new AppLayout(this.auth, this.router, 'خريطة الورشة', 'map', this.api)
    const c = document.createElement('div')
    c.className = 'page-enter min-h-screen bg-background p-gutter'
    c.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 class="font-beVietnamPro text-headline-md text-on-surface">خريطة الورشة</h1>
          <p class="text-body-md text-text-secondary mt-1">توزيع الموارد والمحطات داخل الورشة</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-md border border-surface-subtle p-card-padding min-h-[400px] flex items-center justify-center" id="map-container">
            <div class="text-center">
              <span class="material-symbols-outlined text-[64px] text-text-tertiary mb-4">map</span>
              <p class="text-text-secondary font-body-md">خريطة تفاعلية للورشة</p>
              <p class="text-text-tertiary text-sm mt-2">جاري تحميل الخريطة...</p>
            </div>
          </div>
          <div class="lg:col-span-1 space-y-stack-md">
            <div class="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-subtle">
              <h3 class="font-headline-md text-lg text-on-surface font-semibold mb-4">المحطات</h3>
              <div class="space-y-3" id="stations-list">
                <div class="p-3 bg-surface-subtle rounded-lg text-center text-text-secondary text-sm">جاري التحميل...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    this.loadData(c)
    return layout.render(c)
  }

  private async loadData(c: HTMLElement) {
    try {
      const res: any = await this.api.get('/api/workshop/stations')
      const data = res.data || res
      const stations = Array.isArray(data) ? data : data.stations || data.items || []
      const list = c.querySelector('#stations-list')!

      if (stations.length === 0) {
        list.innerHTML = '<div class="p-3 bg-surface-subtle rounded-lg text-center text-text-secondary text-sm">لا توجد محطات مسجلة</div>'
        return
      }

      const statusBadge = (status: string) => {
        const map: Record<string, [string, string]> = {
          AVAILABLE: ['bg-success/10 text-success', 'متاح'],
          BUSY: ['bg-error/10 text-error', 'مشغول'],
          MAINTENANCE: ['bg-warning/10 text-warning', 'صيانة'],
          OFFLINE: ['bg-surface-container text-on-surface-variant', 'معطل'],
        }
        const [cls, label] = map[status] || map['AVAILABLE']
        return `<span class="${cls} px-2 py-0.5 rounded-full text-xs font-label-sm">${label}</span>`
      }

      const iconMap: Record<string, string> = { wash: 'local_car_wash', paint: 'format_paint', repair: 'car_repair', default: 'build' }

      list.innerHTML = stations.map((s: any) => `
        <div class="flex items-center justify-between p-3 bg-surface-subtle rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-station="${s.id}">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined ${s.iconColor || 'text-primary'}">${iconMap[s.type || 'default'] || iconMap.default}</span>
            <div>
              <span class="font-body-md text-on-surface block">${s.name || s.label || '-'}</span>
              <span class="text-xs text-text-tertiary">${s.currentVehicle || s.vehiclePlate || 'فارغ'}</span>
            </div>
          </div>
          ${statusBadge(s.status || 'AVAILABLE')}
        </div>
      `).join('')

      list.querySelectorAll('[data-station]').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-station')
          const station = stations.find((s: any) => s.id === id)
          if (station) {
            const vehicleInfo = station.currentVehicle || station.vehiclePlate ? `المركبة: ${station.currentVehicle || station.vehiclePlate}` : 'لا توجد مركبة حالياً'
            ;(window as any).toast?.show?.({ message: `${station.name || station.label} — ${station.status || 'AVAILABLE'} — ${vehicleInfo}`, type: 'info' })
          }
        })
      })
    } catch {
      c.querySelector('#stations-list')!.innerHTML = '<div class="p-3 bg-surface-subtle rounded-lg text-center text-error text-sm">فشل تحميل المحطات</div>'
      c.querySelector('#map-container')!.innerHTML = '<div class="text-center"><span class="material-symbols-outlined text-[64px] text-error mb-4">error</span><p class="text-error font-body-md">فشل تحميل الخريطة</p></div>'
    }
  }
}

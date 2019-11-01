import { Facility } from '@/components/facility'
import Optional from '@/utils/tool'

const IllegalyNamePrefixes = ['新規城', '新規村', '新規支城', '新領地', '新規陣', '開拓地', '出城', '支城', '商人町'] as const

export default class Village {
    public id: number | null = null
    public x: number | null = null
    public y: number | null = null
    public c: number | null = null
    public title: string | null = null
    public facilities: Facility[] | null = null

    constructor(opt: Optional<HTMLElement|null>) {
        opt.then(el => {
            this.id = el.dataset.village_id ? Number(el.dataset.village_id) : null
            this.x = el.dataset.village_x ? Number(el.dataset.village_x) : null
            this.y = el.dataset.village_y ? Number(el.dataset.village_y) : null
            this.c = el.dataset.village_c ? Number(el.dataset.village_c) : null
            this.title = el.lastChild ? el.lastChild.textContent : ''
        })
    }
}

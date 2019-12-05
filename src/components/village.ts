import { Facility } from '@/components/facility'
import { query, } from '@/utils/dom'
import { getHtml } from '@/utils/io'
import Optional from '@/utils/tool'
import { filter, isEmpty, isNil } from 'ramda'

const IllegalyNamePrefixes = ['新規城', '新規村', '新規支城', '新領地', '新規陣', '開拓地', '出城', '支城', '商人町'] as const
const arsenal = ['足軽兵舎', '弓兵舎', '厩舎', '兵器鍛冶']

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

    // Check if current village has arsenal so that we will selectively display quick unit training UI
    public async hasArsenal(): Promise<boolean| string> {
        const endpoint = new URL('village_change.php', document.location.href.slice(0, location.href.lastIndexOf('/')))
        if (!isNil(this.id)) {
            endpoint.searchParams.append('village_id', this.id.toString())
        }

        return await getHtml(endpoint.href).then(page => {
            const findExistence = (arsenalName: string) => {
                const result = query('area[title^="' + arsenalName + '"]', page).o
                return result !== null
            }
            const availableArsenal = filter(findExistence, arsenal)
            // why this prints false?
            console.log(isEmpty([]))
            return availableArsenal.length > 0 ? Promise.resolve(true) : Promise.resolve(false)
        })
    }
}

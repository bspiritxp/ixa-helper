import { Facility } from '@/components/facility'
import { query, queryAll } from '@/utils/dom'
import { getHtml } from '@/utils/io'
import Optional from '@/utils/tool'
import { compose, filter, forEach, groupBy, isEmpty, isNil, map, reduce, sort } from 'ramda'
import { finished } from 'stream'

const IllegalyNamePrefixes = ['新規城', '新規村', '新規支城', '新領地', '新規陣', '開拓地', '出城', '支城', '商人町'] as const
const arsenal = ['足軽兵舎', '弓兵舎', '厩舎', '兵器鍛冶']
const resourceProducers = ['木工所', '伐採所', '機織り場', '機織り工房', 'たたら場', '高殿', '水田', '棚田', '釣り堀']
const lumberProducer = ['木工所', '伐採所']
const cottonProducer = ['機織り場', '機織り工房']
const steelProducer = ['たたら場', '高殿']
const grainProducer = ['水田', '棚田']
const stockCapacity = ['蔵']

export default class Village {
    public id: number | null = null
    public x: number | null = null
    public y: number | null = null
    public c: number | null = null
    public title: string | null = null
    public facilities: Facility[] | [] = []
    private buildCapacity: number = 2
    // record finish time for last facility being built/to be built
    // the main purpose of this property is to allow auto-build manager to trigger auto build on specific village
    // not to be used as a parameter to setTimeout()
    private buildFinishTime: Date | null = null

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
        return await getHtml(this.getEndpoint().href).then(page => {
            const findExistence = (arsenalName: string) => {
                const result = query('area[title^="' + arsenalName + '"]', page).o
                return result !== null
            }
            const availableArsenal = filter(findExistence, arsenal)
            // why this prints false?
            // console.log(isEmpty([]))
            return availableArsenal.length > 0 ? Promise.resolve(true) : Promise.resolve(false)
        })
    }

    // if no capacity is available, do need to initialize facilities

    // populate all facilities associated with village
    public async initialize(priority?: string): Promise<boolean> {
        return await getHtml(this.getEndpoint().href).then(page => {
            this.setBuildCapacity(page)
            // get everything that has a 'LV', indicating an actionable facility
            const targets = queryAll('area[title*="LV"]', page)

            const populateFacility = (facility: HTMLElement) => {
                const fac = new Facility(facility, this.id)
                this.facilities.push(fac as never)
            }

            compose(forEach(populateFacility), map(el => el as HTMLElement))([...targets])

            if (this.buildCapacity > 0) {
                return this.autoBuild(priority)
            } else {
                // console.log('build capacity reached')
                return Promise.resolve(true)
            }
        })
    }

    // pick two lowest level resource producing facility among facilities, have them start to build
    // priority is what category of resource to build first
    public async autoBuild(priority?: string ): Promise<boolean> {
        let lowestLevelFacilities: Facility[]
        if (priority) {
            lowestLevelFacilities = this.getLowestLevelFacility(priority)
        } else {
            lowestLevelFacilities = this.getLowestLevelFacility()

        }

        const tasks = map((f: Facility) => {
            return f.build()
        }, lowestLevelFacilities)

        return reduce((chain: Promise<boolean>, task: Promise<boolean>): Promise<boolean> => {
            return chain.then(() => task)
        }, Promise.resolve(true), tasks).then(() => {
            return Promise.resolve(true)
        })
    }

    public setBuildFinishTime(finishTime: Date) {
        this.buildFinishTime = finishTime
    }

    private getEndpoint(): URL {
        const endpoint = new URL('village_change.php', document.location.href.slice(0, location.href.lastIndexOf('/')))
        if (!isNil(this.id)) {
            endpoint.searchParams.append('village_id', this.id.toString())
        }
        return endpoint
    }

    private groupFacilities() {
        const byType = groupBy((facility: Facility) => {
            const title = facility.title
            const facilityName = title != null ? title.split(' ')[0] : null

            if (facilityName != null) {
                return lumberProducer.includes(facilityName) ? 'lumber' :
                    cottonProducer.includes(facilityName) ? 'cotton' :
                    steelProducer.includes(facilityName) ? 'steel' :
                    grainProducer.includes(facilityName) ? 'grain' :
                    stockCapacity.includes(facilityName) ? 'storage' :
                    arsenal.includes(facilityName) ? 'arsenal' : 'other'
            }
            return 'error'
        })
        return byType(this.facilities)
    }

    private getLowestLevelFacility(category?: string): Facility[] {
        const lowToHigh = (a: Facility, b: Facility) => {
            const aLevel = this.extractFacilityLevel(a)
            const bLevel = this.extractFacilityLevel(b)
            return aLevel - bLevel
        }
        let selectedCategoryFacilities: Facility[]
        let sortedFacilities: Facility[]
        switch (category) {
            case 'storage':
                selectedCategoryFacilities = this.groupFacilities().storage
                sortedFacilities = sort(lowToHigh)(selectedCategoryFacilities)
                break
            case 'resource':
            case 'none':
            default:
                sortedFacilities = sort(lowToHigh)(filter((f: Facility) => {
                if (f.title) {
                    const facilityName = f.title != null ? f.title.split(' ')[0] : ''
                    return resourceProducers.includes(facilityName)
                } else {
                    return false
                }
            }, this.facilities))

        }
        return sortedFacilities.slice(0, 2)
    }

    private extractFacilityLevel(fac: Facility): number {
        // ex: "たたら場 LV.5"
        const title = fac.title
        if (title != null) {
            return parseInt(title.substring(title.indexOf('.') + 1, title.length), 10)
        }
        return 0
    }

    // by default will be up to one in progress and one in preparation if not spending gold
    private setBuildCapacity = (page: Document) => {
        let capacity = 2
        const beingBuiltTarget = query('.running_list > li > span .build_now', page)
        const toBeBuiltTarget = query('.running_list > li > span .build_ready', page)
        if (beingBuiltTarget.o) {
            capacity--
        }
        if (toBeBuiltTarget.o) {
            capacity--
        }
        this.buildCapacity = capacity
    }
}

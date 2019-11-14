import { getHtml, post } from '@/utils/io'
import { isNil } from 'ramda'
/**
 * Modeling facility, mainly focus on unit training ones as others don't have much to do with them but upgrading
 */

const YARI:{[key:string]: string} = {
    '321': '足軽',
    '322': '長槍足軽',
    '323': '武士',
    '321_322': '足軽->長槍足軽',
    '321_323': '足軽->武士',
    '322_323': '長槍足軽->武士',
}

const YUMI:{[key:string]: string} = {
    '325': '弓足軽',
    '326': '長弓兵',
    '327': '弓騎馬',
    '325_326': '弓足軽->長弓兵',
    '325_327': '弓足軽->弓騎馬',
    '326_327': '長弓兵->弓騎馬',
}

const KIBA:{[key:string]: string} = {
    '329': '騎馬兵',
    '330': '精鋭騎馬',
    '331': '赤備え',
    '329_330': '騎馬兵->精鋭騎馬',
    '329_331': '騎馬兵->赤備え',
    '330_331': '精鋭騎馬->赤備え',
}

const KAJI:{[key:string]: string} = {
    '333': '破城鎚',
    '334': '攻城櫓',
    '335': '大筒兵',
    '336': '鉄砲足軽',
    '337': '騎馬鉄砲',
    '345': '焙烙火矢',
    '346': '穴太衆',
    '333_334': '破城鎚->攻城櫓',
    '333_346': '破城鎚->穴太衆',
    '333_335': '破城鎚->大筒兵',
    '334_346': '攻城櫓->穴太衆',
    '334_335': '攻城櫓->大筒兵',
    '346_335': '穴太衆->大筒兵'
} as const

// Define unit and their corresponding code
const ALL_UNITS: {[key: string]: string} = {
    ...YARI, ...YUMI, ...KIBA, ...KAJI,
}

export enum UNIT_CATEGORY {
    NO_SELECT, YARI, YUMI, KIBA, KAJI,
}

export enum TRAINING_MODE {
    NORMAL, HIGH, UPGRADE,
}

// Request Payload definition
interface UnitTraining {
    x: string,
    y: string,
    unit_id: string,
    count: string

    // high speed training
    high_speed: string,

    // upgrade training
    upgrade: string,
    from?: string,
    to: string
}

class Facility {
    public dom: HTMLAreaElement | null = null
    public x: string | null = null
    public y: string | null = null
    public title: string | null = null
    private postEndpoint: URL

    // constructor should explicitly have fields defined, cannot be nested in a subroutine,
    // which applies to postEndpoint here
    constructor(el: HTMLElement) {
        this.dom = el as HTMLAreaElement
        this.title = this.dom.title
        this.postEndpoint = new URL(this.dom.href, document.location.href.slice(0, location.href.lastIndexOf('/')))
        this.x = this.postEndpoint.searchParams.get('x')
        this.y = this.postEndpoint.searchParams.get('y')
    }

    // simple say if coordinate information is available, we should be able to get the facility
    public isAvailable() {
        if (isNil(this.x) || isNil(this.y) ) {
            return false
        }
        return true
    }

    public trainUnit(quantity: string, trainingMode: TRAINING_MODE, toUnitId: string, fromUnitId?: string ) {
        switch (trainingMode) {
            case TRAINING_MODE.NORMAL:
                this.normalTraining(quantity, toUnitId)
                break
            case TRAINING_MODE.HIGH:
                this.speedTraining(quantity, toUnitId)
                break
            case TRAINING_MODE.UPGRADE:
                this.upgradeTraining(quantity, toUnitId, fromUnitId)
                break
            default:
                break
        }
    }

    public async getUnitInfo(): Promise<Document> {
        return  await getHtml(this.postEndpoint.href)
    }

    /* Need to append the hash here to distinguish training mode
     * #tab1 -> normal
     * #tab2 -> high speed
     * #tab3 -> upgrade
     */
    private normalTraining(quantity: string, toUnitId: string) {
        if (this.postEndpoint) {
            const requestPayload = this.constructRequestPayload(quantity, TRAINING_MODE.NORMAL, toUnitId)
            const url = this.postEndpoint.href.concat('#tab1')
            return post(url, requestPayload)
        }
        return Promise.reject('no endpoint specified')
    }

    private speedTraining(quantity: string, toUnitId: string) {
        if (this.postEndpoint) {
            const requestPayload = this.constructRequestPayload(quantity, TRAINING_MODE.HIGH, toUnitId)
            const url = this.postEndpoint.href.concat('#tab2')
            return post(url, requestPayload)
        }
        return Promise.reject('no endpoint specified')
    }

    private upgradeTraining(quantity: string, toUnitId: string, fromUnitId: string | undefined) {
        if (this.postEndpoint) {
            const requestPayload = this.constructRequestPayload(quantity, TRAINING_MODE.UPGRADE, toUnitId, fromUnitId)
            const url = this.postEndpoint.href.concat('#tab3')
            return post(url, requestPayload)
        }
        return Promise.reject('no endpoint specified')
    }

    private constructRequestPayload(quantity: string, trainingMode: TRAINING_MODE,
                                    toUnitId: string, fromUnitId?: string) {
        const payload = new FormData()
        if (this.x) {
            payload.append('x', this.x)
        }

        if (this.y) {
            payload.append('y', this.y)
        }

        payload.append('unit_id', toUnitId)
        payload.append('count', quantity)

        switch (trainingMode) {
            case TRAINING_MODE.HIGH:
                payload.append('high_speed', '1')
                break
            case TRAINING_MODE.UPGRADE:
                payload.append('upgrade', '1')
                if (fromUnitId) {
                    payload.append('from', fromUnitId)
                }
                payload.append('to', toUnitId)
                break
            default:
        }
        return payload
    }
}

export {
    Facility,
    YARI,
    YUMI,
    KIBA,
    KAJI,
    ALL_UNITS,
}

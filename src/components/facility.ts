import { getHtml, post } from '@/utils/io'
import { isNil } from 'ramda'
/**
 * Modeling facility, mainly focus on unit training ones as others don't have much to do with them but upgrading
 */

const YARI: {[key: string]: string} = {
    '321': '足軽',
    '322': '長槍足軽',
    '323': '武士',
    '321_322': '足軽->長槍足軽',
    '321_323': '足軽->武士',
    '322_323': '長槍足軽->武士',
}

const YUMI: {[key: string]: string} = {
    '325': '弓足軽',
    '326': '長弓兵',
    '327': '弓騎馬',
    '325_326': '弓足軽->長弓兵',
    '325_327': '弓足軽->弓騎馬',
    '326_327': '長弓兵->弓騎馬',
}

const KIBA: {[key: string]: string} = {
    '329': '騎馬兵',
    '330': '精鋭騎馬',
    '331': '赤備え',
    '329_330': '騎馬兵->精鋭騎馬',
    '329_331': '騎馬兵->赤備え',
    '330_331': '精鋭騎馬->赤備え',
}

const KAJI: {[key: string]: string} = {
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
    '346_335': '穴太衆->大筒兵',
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

/**
 * Facility can either be resource producer or resource consumer
 * producer will be things like: 木工所/伐採所, 機織り場/機織り工房, たたら場/高殿, 水田/棚田
 * consumer will be things like: 足軽兵舎, 弓兵舎, 厩舎, 兵器鍛冶
 */
class Facility {
    public dom: HTMLAreaElement | null = null
    public x: string | null = null
    public y: string | null = null
    public title: string | null = null
    private villageId: number | null = null
    private postEndpoint: URL
    private buildEndpoint: URL

    // constructor should explicitly have fields defined, cannot be nested in a subroutine,
    // which applies to postEndpoint here
    constructor(el: HTMLElement, vid: number | null) {
        this.dom = el as HTMLAreaElement
        this.villageId = vid
        this.title = this.dom.title
        this.postEndpoint = new URL(this.dom.href, document.location.href.slice(0, location.href.lastIndexOf('/')))
        this.buildEndpoint = new URL(this.extractPath(this.dom.href),
                                     document.location.href.slice(0, location.href.lastIndexOf('/')))
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

    public trainUnit(quantity: string, trainingMode: TRAINING_MODE, toUnitId: string, fromUnitId?: string )
    : Promise<Response> {
        switch (trainingMode) {
            case TRAINING_MODE.NORMAL:
                return this.normalTraining(quantity, toUnitId)
            case TRAINING_MODE.HIGH:
                return this.speedTraining(quantity, toUnitId)
            case TRAINING_MODE.UPGRADE:
                return this.upgradeTraining(quantity, toUnitId, fromUnitId)
            default:
                return Promise.reject('no matched training mode')
        }
    }

    public async getUnitInfo(): Promise<Document> {
        return  await getHtml(this.postEndpoint.href)
    }

    public async build(): Promise<boolean>  {
        return await post(this.buildEndpoint.href, '').then(() => {
            return Promise.resolve(true)
        }, () => {
            return Promise.reject(false)
        })
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

    private extractPath(path: string): string {
        let newPath = path.replace(/(.*\/)(facility)(.*)/, '$1build$3')
        newPath += '&vid=' + this.villageId
        return newPath
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

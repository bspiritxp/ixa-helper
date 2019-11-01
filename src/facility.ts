import post from '@/utils/io'

/**
 * Modeling facility, mainly focus on unit training ones as others don't have much to do with them but upgrading
 */

// Define unit and their corresponding code

const YALI: {[key: string]: string} = {
    lv1: '321', // 足軽
    lv2: '322', // 長槍足軽
    lv3: '323', // 武士
} as const

const YUMI: {[key: string]: string} = {
    lv1: '325', // 弓足軽
    lv2: '326', // 長弓兵
    lv3: '327', // 弓騎馬
} as const

const KIBA: {[key: string]: string} = {
    lv1: '329', // 騎馬兵
    lv2: '330', // 精鋭騎馬
    lv3: '331', // 赤備え
} as const

const KAJI: {[key: string]: string} = {
    lv1: '333', // 破城鎚
    lv2: '334', // 攻城櫓
    lv3: '326', // 鉄砲足軽
} as const

// enum UNIT_TYPE {
//     YALI, YUMI, KIBA, KAJI
// }

enum TRAINING_MODE {
    NORMAL, HIGH_SPEED, UPGRADE,
}

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
//    public villageId: string | null = null
    private postEndpoint: URL | null = null

    constructor(el: HTMLElement) {
        this.dom = el as HTMLAreaElement
        this.title = this.dom.title
        this.parseLink(this.dom.href)
    }

    public trainUnit(quantity: string, trainingMode: TRAINING_MODE, toUnitId: string, fromUnitId?: string ) {
        switch (trainingMode) {
            case TRAINING_MODE.NORMAL:
                this.normalTraining(quantity, toUnitId)
                break
            case TRAINING_MODE.HIGH_SPEED:
                this.speedTraining(quantity, toUnitId)
                break
            case TRAINING_MODE.UPGRADE:
                this.upgradeTraining(quantity, toUnitId, fromUnitId)
                break
            default:
                break
        }
    }

    /*
     * Use URL object to access the search parameters in order to extract coordinate info
     */
    private parseLink(path: string) {
        this.postEndpoint = new URL(path, document.location.href.slice(0, location.href.lastIndexOf('/')))
        this.x = this.postEndpoint.searchParams.get('x')
        this.y = this.postEndpoint.searchParams.get('y')
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
            const requestPayload = this.constructRequestPayload(quantity, TRAINING_MODE.HIGH_SPEED, toUnitId)
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
        // const payload =  {
        //     x: this.x,
        //     y: this.y,
        //     unit_id: toUnitId,
        //     count: quantity,
        // } as UnitTraining

        switch (trainingMode) {
            case TRAINING_MODE.HIGH_SPEED:
                // payload.high_speed = '1'
                payload.append('high_speed', '1')
                break
            case TRAINING_MODE.UPGRADE:
                // payload.upgrade = '1'
                // payload.from = fromUnitId
                // payload.to = toUnitId
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
    YALI,
    YUMI,
    KIBA,
    KAJI,
}

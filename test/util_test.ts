// tslint:disable: no-console
import { defaultTo } from 'ramda'
import { get } from '../src/utils/io'
import Optional from '../src/utils/tool'

enum REPORT_TYPE {
    DISCOVERY = '秘境探索',
    SPACE_ATTACK = '空き地攻撃',
}

function testOpional() {
    let testValue: string | null
    testValue = 'ok'
    const r1 = defaultTo('hello')(testValue)
    console.log(r1)
}

function testSplitText() {
    const testStr1 = '戦利品「  木材210  綿210  鉄210  糧210 」を獲得しました'
    const testStr2 = '戦利品「  鉄2160 」を獲得しました'
}

async function testGet() {
    const r = await get('https://www.baidu.com')
    console.log(r)
}

testGet()

import Optional from '../src/utils/tool'

function testOpional() {
    let testValue: string | null;
    testValue = '1'
    const r1 = Optional.of(testValue).map(c => Number(c)).getOrDefault(0);
    console.log(r1);
    
}

testOpional()
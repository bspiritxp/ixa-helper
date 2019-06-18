import { query } from 'Utils/dom'

const continueDraw = `
    <input id="drawLimit" type="number" value="1" min="1" max="10" size="3" />
    <button id='drawBtn' style="padding: 0.5rem">Draw</button>
`

const kujiForm = document.forms.sengokukuji || null
const draw = async (e) => {
    const limit = query('input#drawLimit').value
    if (kujiForm) {
        const fmData = new FormData(kujiForm)
        // await rep = await fetch()
    }
}

export default (jq$) => {
    jq$('img[alt="戦国くじの結果"]').after(jq$(continueDraw))
    jq$('button#drawBtn').on('click', draw)
}
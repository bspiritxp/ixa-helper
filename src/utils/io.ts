import {compose} from 'ramda'

// **NOTE**  don't write .catch of fetch block in this file. please use try...catch block in async function
// Request with GET/HEAD cannot have body
export const get = (url: string): Promise<Response> => fetch(url, {
        method: 'GET',
    })

export const post = (url: string, data: BodyInit): Promise<Response> => fetch(url, {
        method: 'POST',
        body: data,
    })

export const updateDom = (method: VoidFunction): Promise<void> => new Promise((resolve: CallableFunction) => {
    try {
        method()
    } catch (err) {
        // console.error(err);
    } finally {
        resolve()
    }
})

const htmlParser = (txt: string) => (new DOMParser()).parseFromString(txt, 'text/html')

export const getText = compose((pr: Promise<Response>) => pr.then(resp => resp.text()), get)
export const getHtml = compose((pt: Promise<string>) => pt.then(htmlParser), getText)

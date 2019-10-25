
const get = (url: string, data: BodyInit): Promise<Response> => new Promise((resolve: CallableFunction) => {
    return fetch(url, {
        method: 'GET',
        body: data,
    })
})

const post = (url: string, data: BodyInit): Promise<Response> => new Promise<Response>((resolve: CallableFunction) => {
    return fetch(url, {
        method: 'POST',
        body: data,
    })
})

const updateDom = (method: VoidFunction): Promise<void> => new Promise((resolve: CallableFunction) => {
    try {
        method()
    } catch (err) {
        // console.error(err);
    } finally {
        resolve()
    }
})

const changeName = (vid: number, newName: string): Promise<boolean> => new Promise((resolve: CallableFunction) => {
    return
})

export default {
    post,
    get,
    updateDom,
}

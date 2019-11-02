export const get = (url: string, data?: BodyInit): Promise<Document> => new Promise((resolve: CallableFunction, reject: CallableFunction) => {
    return fetch(url, {
        method: 'GET',
        body: data,
    }).then(response => response.text())
        .then(html => {
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')
            return resolve(doc)
        }).catch(error => {
            return reject('Failed to fetch page', error)
        })
})

export const post = (url: string, data: BodyInit): Promise<Response> => new Promise<Response>((resolve: CallableFunction) => {
    return fetch(url, {
        method: 'POST',
        body: data,
    })
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

const changeName = (vid: number, newName: string): Promise<boolean> => new Promise((resolve: CallableFunction) => {
    return
})

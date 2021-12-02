// a helper for getting nested values 
const get = (obj, keyList) => {
    for (const each of keyList) {
        try { obj = obj[each] }
        catch (e) { return null }
    }
    return obj == null ? null : obj
}

class BasicPanelAppConnection {
    // testSite1: ipfs://bafybeig5cbxsequo5ezixotoedqtjbgpa25hhpmjgnrss3nnddhpvesflq/#!/home
    // testSite2: ipfs://bafybeics44wp6kmqk3t7hgv5px7lggfgkhfeslytu3uw6uiayvyla3dgqa/#QmSS3dUE5oKdyDNvpGsYCXgm2mBW4fSDzC5B3NDf7DR8VR
    // dummyPanel1: ipfs://bafybeigv5wnjxn57cncopudxjh6mbbffcnij3v4gu7oxoadji4cls5gj5m/
    // dummyPanel2: ipfs://bafybeib7i6egbwwcqnwitinwrlwdm46xa54v7n4s6f76dsge5yxlsjviqy/
    constructor(ipfsAddress="ipfs://bafybeib7i6egbwwcqnwitinwrlwdm46xa54v7n4s6f76dsge5yxlsjviqy/") {
        Object.freeze(this.ipfsAddress = ipfsAddress)
        Object.freeze(this.origin = new URL(ipfsAddress).origin)
        this.listeners = []
        this._pendingCalls = {}
        // 
        // setup listener before calling the panelApp
        // 
        window.addEventListener("message", ({ origin, timeStamp, data }) => {
            // only pay attention to this specific ipfsAddress
            if (origin === this.origin) {
                let doCallback = false
                let response
                try {
                    response = JSON.parse(data)
                    if (response.returnKey && this._pendingCalls[response.returnKey] instanceof Array) {
                        doCallback = true
                    }
                } catch (error) {
                    console.debug(`error is:`,error)
                }
                if (doCallback) {
                    const [resolve, reject] = this._pendingCalls[response.returnKey]
                    // resolve or reject a pending promise
                    if (response.error) {
                        reject(response.error)
                    } else {
                        resolve(response.output)
                    }
                    return
                }
            }
        }, false)
        // 
        // Create UI for the ipfsPanelApp
        // 
        this._iFrame = document.createElement("iframe")
        this._iFrame.style.position = "fixed"
        this._iFrame.style.minHeight = "20rem"
        this._iFrame.style.minWidth = "20rem"
        this._iFrame.style.right = "0"
        this._iFrame.style.top = "0"
        this._iFrame.style.zIndex = "999999"
        this._iFrame.style.background = "lightcoral"
        this._iFrame.style.border = "1px solid lightcoral"
        this._iFrame.name = `${Math.random()}`
        this._iFrame.src = ipfsAddress
        document.body.append(this._iFrame)
    }

    call(keyList,args=[]) {
        const returnKey = `${Math.random()}`
        let respond = []
        // extract the resolve out of a promise
        const output = new Promise((resolve, reject)=>respond=[resolve,reject])
        // put the resolve inside the pending calls
        this._pendingCalls[returnKey] = [
            (arg)=>{
                // first the clean up step
                delete this._pendingCalls[returnKey]
                // then resolve
                return respond[0](arg)
            },
            (arg)=>{
                // first the clean up step
                delete this._pendingCalls[returnKey]
                // then reject
                return respond[1](arg)
            },
        ]
        this._iFrame.contentWindow.postMessage(
            JSON.stringify({
                returnKey: returnKey,
                keyList,
                args,
            }),
            this.ipfsAddress,
        )
        return output
    }
}

class PanelApp {
    constructor({ methods }) {
        window.addEventListener("message", async (event) => {
            // 
            // extract args
            // 
            try {
                var { returnKey, keyList, args } = JSON.parse(event.data)
            } catch (error) {
                // just tell the app it was 
                event.source.postMessage(
                    JSON.stringify({returnKey, error: "Incorrect argument format, needs to be { returnKey, keyList, args }" }),
                    event.origin
                )
                return
            }
            // 
            // get the method
            // 
            try {
                var method = get(methods, keyList)
            } catch (error) {
                
            }
            if (!(method instanceof Function)) {
                event.source.postMessage(
                    JSON.stringify({returnKey, error: `Method ${JSON.stringify(keyList)} does not exist on this PanelApp` }),
                    event.origin
                )
                return
            }
            // 
            // call 
            // 
            try {
                var output = await methods(event.origin, ...args)
            } catch (error) {
                event.source.postMessage(
                    JSON.stringify({returnKey, error}),
                    event.origin
                )
                return
            }
            // 
            // return
            // 
            event.source.postMessage(
                JSON.stringify({returnKey, output }),
                event.origin
            )
        }, false)
    }
}

module.exports = {
    PanelAppConnection,
    PanelApp,
}
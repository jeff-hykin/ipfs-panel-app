class PanelAppConnection {
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
                let output, returnKey
                try {
                    console.debug(`data is:`,data)
                    const response = JSON.parse(data)
                    console.debug(`response is:`,response)
                    console.debug(`response.returnKey is:`,response.returnKey)
                    if (typeof response.returnKey == 'string') {
                        if (this._pendingCalls[response.returnKey] instanceof Array) {
                            doCallback = true
                            output = response.output
                            returnKey = response.returnKey
                        }
                    }
                } catch (error) {
                    console.debug(`error is:`,error)
                }
                if (doCallback) {
                    const [resolve, reject] = this._pendingCalls[returnKey]
                    // resolve a pending promise
                    resolve(output)
                    return
                }
                // FIXME: call other listeners here
                console.log(timeStamp, data)
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

    send(data) {
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
                input: data,
            }),
            this.ipfsAddress,
        )
        return output
    }
}

class PanelApp {
    constructor() {
        window.addEventListener("message", (event) => {
            // FIXME: require the code calling the Panel app to send proof of who they are
            // then look up / confirm who they are based on local storage preferences and default fallbacks
            //     import HKP from '@openpgp/hkp-client';
            //     import { readKey } from 'openpgp';
            //     (async () => {
            //         const hkp = new HKP(); // Defaults to https://keyserver.ubuntu.com, or pass another keyserver URL as a string
            //         const publicKeyArmored = await hkp.lookup({
            //             query: 'alice@example.com'
            //         });
            //         const publicKey = await readKey({
            //             armoredKey: publicKeyArmored
            //         });
            //     })();

            // Do we trust the sender of this message?
            console.log(event)

            // event.source is window.opener
            // event.data is "hello there!"

            event.source.postMessage("hi there yourself!  the secret response is: rheeeeet!", event.origin);
        }, false)
    }
} 


module.exports = {
    PanelAppConnection,
    PanelApp,
}
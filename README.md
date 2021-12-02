Under construction


```js
// if you're creating a panel app
new PanelApp({
    methods: {
        ping: ()=>{
            console.log("returning pong")
            return "pong"
        }
    }
})
// (upload this to IPFS)
```

```js
// if you're wanting to call a panel app
const ipfsAddressOfPanel = "ipfs://bafybeib7i6egbwwcqnwitinwrlwdm46xa54v7n4s6f76dsge5yxlsjviqy/"
const panelApp = BasicPanelAppConnection(ipfsAddressOfPanel)

// async wrapper so await can be used
;((async ()=>{
    
    const result = await panelApp.call(["ping"])
    console.debug(`result is:`,result)
    
})())
```

# Setup

Everything is detailed in the `documentation/setup.md`!
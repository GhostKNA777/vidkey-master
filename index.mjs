import { webcrack } from "webcrack"
import { Deobfuscator } from "deobfuscator"
import { writeFile } from "node:fs/promises"
import { assert } from "node:console"

async function deobfuscationLoop(obfuscatedInput, loopFunction) {
    let deobfuscated = obfuscatedInput
    for (let run = 0; run < 5; run++) {
        try {
            const result = await loopFunction(deobfuscated)
            if (result == "" || result == undefined) break
            deobfuscated = result
        } catch (e) {
            console.error(e)
            break
        }
    }
    return deobfuscated
}

async function deobfuscationChain(obfuscatedScript, deobfsSteps) {
    let deobfs = obfuscatedScript
    for(const func of deobfsSteps) {
        deobfs = await deobfuscationLoop(deobfs, func)
    }
    return deobfs
}

const synchrony = new Deobfuscator()
const webcrackStep = async (x) => await webcrack(x).code
const synchronyStep = async (x) => await synchrony.deobfuscateSource(x)
const checkDeobfs = (x) => x.indexOf("<video />") !== -1

// See https://github.com/Claudemirovsky/worstsource-keys/issues/2
function getCodeVersion() {
    // [hour]:00:10
    const versionDate = new Date()
    versionDate.setMinutes(0)
    versionDate.setSeconds(10)
    // Get only the first 10 digits
    const timestamp = versionDate.getTime().toString().substring(0, 10)
    return parseInt(timestamp).toString(16) // Convert to HEX
}

async function getDeobfuscatedScript() {
    //https://vidplay.lol and https://vidplay.site DOWN
    const vidplayHost = "https://vidplay.online"
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/120.0",
        "Referer": vidplayHost + "/e/",
        "Origin": vidplayHost
    }

    const scriptUrl = `${vidplayHost}/assets/mcloud/min/embed.js?v=${getCodeVersion()}`
    //const scriptUrl = `https://vidplay.online/assets/mcloud/min/embed.js?v=65a6b61a`;
    //const scriptUrl = `https://vidplay.online/assets/mcloud/min/embed.js?v=65a7269a`;
    console.error(scriptUrl)
    const obfuscatedScript = await fetch(scriptUrl, {headers: headers}).then(async (x) => await x.text())

    const firstTry = await deobfuscationChain(obfuscatedScript, [webcrackStep, synchronyStep])
    if (checkDeobfs(firstTry)) return firstTry

    const secondTry = await deobfuscationChain(obfuscatedScript, [synchronyStep])
    return secondTry
}

const deobfuscated = await getDeobfuscatedScript() 

// Phase 4: Let's find the keys!
if (checkDeobfs(deobfuscated)) {
    const start = deobfuscated.substring(deobfuscated.indexOf("<video />"))
    const end = start.substring(0, start.indexOf(".replace"))
    const keys = Array.from(end.matchAll(/'(\w+)'/g), x => x[1])
    assert(keys.length == 2, "Invalid array length!")

    // Be happy!
    console.info("Success!")
    await writeFile("keys.json", JSON.stringify(keys), "utf8")
} else {
    // ... Or not xD
    console.error("FAIL!")
    await writeFile("failed.js", deobfuscated, "utf8")
}
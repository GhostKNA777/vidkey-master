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

async function getDeobfuscatedScript() {
    const vidplayHost = "https://vidplay.lol"
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/120.0",
        "Referer": vidplayHost + "/e/",
        "Origin": vidplayHost
    }

    const vidplayHtml = await fetch(`${vidplayHost}/e/`, {headers: headers}).then(async (x) => await x.text())
    const codeVersion = vidplayHtml.match(/embed.js\?v=(\w+)/)[1]
    const scriptUrl = `${vidplayHost}/assets/mcloud/min/embed.js?v=${codeVersion}`

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

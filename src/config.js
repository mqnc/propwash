
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs'

// fix config
export const dt = 0.01 // physics timestep


// allows to load layered config files:
// config files can reference other config files with the "extends" key
// multiple config files can be specified with the "config" query parameter as a comma separated list
// any previous config will be overridden by a new config

const defaultConfig = "configs/default.json5"

async function fetchConfigFile(path) {
    return JSON5.parse(await (await fetch(path)).text())
}

function deepMerge(target, source) {
    for (const key in source) {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
        ) {
            if (!target[key]) target[key] = {}
            deepMerge(target[key], source[key])
        } else {
            target[key] = source[key]
        }
    }
    return target
}

async function resolveConfig(entryPath) {
    const entry = await fetchConfigFile(entryPath)

    let result = {}

    if (entry.extends) {
        for (const path of entry.extends) {
            const parent = await resolveConfig(path)
            result = deepMerge(result, parent)
        }
    }

    return deepMerge(result, entry)
}

export async function loadConfig() {

    const params = new URLSearchParams(window.location.search)

    let config = {}
    let userConfig = params.get('config') ?? ''

    for (const path of [defaultConfig, ...userConfig.split(",")]) {
        if (path === '') { continue }
        const resolved = await resolveConfig(path)
        config = deepMerge(config, resolved)
    }

    return config
}
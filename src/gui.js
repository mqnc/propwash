
import GUI from 'three/addons/libs/lil-gui.module.min.js';

let ignore = [
    "version",
    "aircraft.type",
]

let requiresReload = [
]

function getController(gui, path) {
    const parts = path.split('.');
    const prop = parts.pop();
    let folder = gui;

    for (const p of parts) {
        folder = folder.folders.find(f => f._title === p);
        if (!folder) return null;
    }

    let field = folder.controllers.find(c => c._name === prop);
    if (field) { return field; }
    let subfolder = folder.folders.find(f => f._title === prop);
    if (subfolder) { return subfolder; }

    return null
}

export function createGui(config) {
    const gui = new GUI({ closeFolders: true });

    function walkFolder(parent, obj) {

        for (const [name, value] of Object.entries(obj)) {
            switch (typeof value) {
                case 'number':
                    parent.add(obj, name);
                    break;
                case 'string':
                    parent.add(obj, name);
                    break;
                case 'boolean':
                    parent.add(obj, name);
                    break;
                case 'object':
                    let folder = parent.addFolder(name);
                    walkFolder(folder, value)
                    folder.close()
                    break;
            }
        }
    }

    walkFolder(gui, config)

    for (const path of ignore) {
        // was a bit easier than tracking the current path in walkFolder
        getController(gui, path).destroy()
    }

    return gui
}

const _guiChangeCallbacks = new WeakMap();

export function onGuiChange(gui, paths, callback, immediate = false) {
    // callback arguments are different for fields and folders
    // fields: https://lil-gui.georgealways.com/#Controller#onFinishChange
    // folders: https://lil-gui.georgealways.com/#GUI#onFinishChange
    for (const path of paths) {
        const controller = path ? getController(gui, path) : gui;
        if (!controller) return;

        let list = _guiChangeCallbacks.get(controller);

        if (!list) {
            list = [];
            _guiChangeCallbacks.set(controller, list);

            controller.onFinishChange(v => {
                for (const cb of list) cb(v);
            });
        }

        list.push(callback);

        if (immediate) callback(controller.getValue ? controller.getValue() : null);
    }
}
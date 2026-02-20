
import GUI from 'three/addons/libs/lil-gui.module.min.js';

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
}
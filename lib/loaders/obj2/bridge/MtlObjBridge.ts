/**
 * Development repository: https://github.com/kaisalmen/WWOBJLoader
 */

// import { MaterialCreator } from "../../../mtlloader";
import { MTLLoader } from "../../MTLLoader";


const MtlObjBridge = {

    /**
     *
     * @param processResult
     * @param assetLoader
     */
    link: function (processResult: any, assetLoader: any) {

        if (typeof assetLoader.addMaterials === 'function') {

            assetLoader.addMaterials(this.addMaterialsFromMtlLoader(processResult), true);

        }

    },

    /**
     * Returns the array instance of {@link MTLLoader.MaterialCreator}.
     *
     * @param Instance of {@link MTLLoader.MaterialCreator}
     */
    addMaterialsFromMtlLoader: function (materialCreator: any) {

        let newMaterials = {};

        if (materialCreator instanceof (MTLLoader as any).MaterialCreator) {

            materialCreator.preload();
            newMaterials = materialCreator.materials;

        }

        return newMaterials;

    }
};

export { MtlObjBridge };

import Request from './Request';
import Store from './Store';
import Model from './Model';
import { modelConfig } from './Config';
import { connectToStore } from "./StoreConnect"

const createModel = (opts) => {
    return new Model(opts);
}

const WTools = {
    Request,
    Store,
    Model,
    connectToStore,
    modelConfig,
    createModel
}
export default WTools;




export {
    Request,
    Store,
    Model,
    connectToStore,
    modelConfig,
    createModel
};
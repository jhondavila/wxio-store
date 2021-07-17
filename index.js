import Request from './Request';
import Store from './Store';
import Model from './Model';
import { modelConfig } from './Config';
import { connectToStore } from "./StoreConnect"

const WTools = {
    Request,
    Store,
    Model,
    connectToStore,
    modelConfig
}

export default WTools;

export {
    Request,
    Store,
    Model,
    connectToStore,
    modelConfig
};
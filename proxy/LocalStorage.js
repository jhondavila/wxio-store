import ProxyWebStorage from "./WebStorage"
class ProxyLocalStorage extends ProxyWebStorage {


    constructor(opts){
        super(opts);
        this.initialize();
    }
    getStorageObject() {
        return window.localStorage;
    }


}

export default ProxyLocalStorage;
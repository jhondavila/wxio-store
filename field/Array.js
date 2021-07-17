import Field from './Field';


class FArray extends Field {

    type = "array";

    constructor(config) {
        super(config)
        this.isArrayField = true;

        // if (!config.hasOwnProperty("defaultValue")) {
        //     this.defaultValue = [];
        // }
    }

}

export default FArray;
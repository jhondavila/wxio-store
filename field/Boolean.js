import Field from './Field';
import * as _ from "lodash"
class FBoolean extends Field {

    type = "bool";

    constructor(config) {
        super(config);
        this.isBooleanField = true;
        this.trueRe = /^\s*(?:true|yes|on|1)\s*$/i;
    }

    convert(v) {
        if (typeof v === 'boolean') {
            return v;
        }
        if (this.allowNull && (v === undefined || v === null || v === '')) {
            return null;
        }
        return this.trueRe.test(String(v));
    }

    serialize(val) {
        return this.trueRe.test(String(val)) ? "1" : "0";
    }


    isEqual(value1, value2) {
        return _.isEqual(this.convert(value1), this.convert(value2));
    }
    // getType() {
    //     return 'bool';
    // }
}

export default FBoolean;
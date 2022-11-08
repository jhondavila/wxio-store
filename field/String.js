import Field from './Field';
import Utils from '../Utils';
import * as _ from 'lodash';

class FString extends Field {

    type = "string";

    // constructor(config) {
    //     super(config)
    // }

    convert(v) {
        var defaultValue = this.allowNull ? null : '';
        return (v === undefined || v === null) ? defaultValue : String(v);
    }

    // getType() {
    //     return 'string';
    // }
    isEqual(value1, value2) {
        // console.log((Utils.isEmpty(value1) ,Utils.isEmpty(value2)), _.isEqual(value1, value2));
        // return () || _.isEqual(value1, value2);
        if(Utils.isEmpty(value1) && Utils.isEmpty(value2)){
            return true;
        }else {
            return _.isEqual(value1, value2);
        }
    }
}

export default FString;
import Field from './Field';


class FObject extends Field {

    type = "object";

    // constructor(config) {
    //     super(config)
    //     // this.isStringField = true;
    // }

    // convert(v) {
    //     var defaultValue = this.allowNull ? null : '';
    //     return (v === undefined || v === null) ? defaultValue : String(v);
    // }

    // getType() {
    //     return 'string';
    // }
}

export default FObject;
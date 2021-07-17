import Field from './Field';


class FFile extends Field {

    type = "file";

    defaultValue = null;

    constructor(config) {
        super(config)
        this.isStringField = true;
    }

    convert(v) {
        return v;
        // var defaultValue = this.allowNull ? null : '';
        // return (v === undefined || v === null) ? defaultValue : String(v);
    }

    // getType() {
    //     return 'file';
    // }
}

export default FFile;
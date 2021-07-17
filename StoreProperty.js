import * as _ from 'lodash';
import Store from "./Store";
import Model from "./Model";
// import EventEmitter from "events"
// import ProxyAjax from "./proxy/Ajax";
// import ProxyLocalStorage from "./proxy/LocalStorage";
// import Model from "./Model";

import Core from "./Core";
class StoreProperty extends Store {

    constructor(opts) {
        // debugger
        opts.model = new Model({
            idProperty: "name",
            fields: {
                name: "string",
                value: "default"
            }
        });
        super(opts);
    }

    getProperty(row) {
        let rec = Core.isNumber(row) ? this.getAt(row) : this.getById(row),
            ret = undefined;
        if (rec) {
            ret = rec.get('value');
        }
        return ret;
    }

    getRec(prop) {
        return this.getById(prop);
    }

    
    getValue(row) {
        let rec = Core.isNumber(row) ? this.getAt(row) : this.getById(row),
            ret = undefined;
        if (rec) {
            ret = rec.get('value');
        }
        return ret;
    }

    setValue(prop, value, create) {
        // var me = this,
        let rec = this.getRec(prop);
        let cfgBase = {},
            nameGroup = null;
        if (rec) {
            rec.set('value', value);
            //     me.source[prop] = value;
        } else if (create) {
            //     var config = this.grid.templateActive.getProperty(prop);
            //     if (config && config.nameGroup) {
            //         nameGroup = config.nameGroup;
            //     } else {
            //         nameGroup = me.defaultGroupOthers;
            //     }
            //     me.source[prop] = value;
            //     rec = new Wtools.propertygrid.Property({ name: prop, value: value, nameGroup: nameGroup }, prop);
            let records = this.add({
                name: prop,
                value: value
            });
            records[0].phantom = true;
            //     config = null;
        }
        cfgBase = null;
    }

    remove(prop) {
        var rec = this.getRec(prop);
        if (rec) {
            super.remove(rec);
        }
    }

}

export default StoreProperty;
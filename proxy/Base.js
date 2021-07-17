import * as _ from 'lodash';
import { EventEmitter } from "events"
class ProxyBase extends EventEmitter {


    // constructor() {
    //     super();
    // }

    getCreateData(records, store) {
        // debugger
        let nested = false;
        let CRUDObject = false;

        if (this.mode == "batch") {
            nested = false;
            CRUDObject = false;
        } else if (this.mode == "include") {
            nested = false;
            CRUDObject = true;
        } else {
            nested = true;
            CRUDObject = false;
        }

        let options = {
            mode: "create",
            serialize: true,
            persist: true,

            nested: nested,
            CRUDObject: CRUDObject,

            foreignKey: store ? store.foreignKey : null,
            modelParent: store ? store.modelParent : null
        };
        return _.map(records, _.method('getData', options));
    }

    getUpdateData(records, store) {
        let nested = false;
        let CRUDObject = false;

        if (this.mode == "batch") {
            nested = false;
            CRUDObject = false;
        } else if (this.mode == "include") {
            nested = false;
            CRUDObject = true;
        } else {
            nested = true;
            CRUDObject = false;
        }

        return _.map(records, _.method('getData', {
            mode: "update",
            serialize: true,
            changes: true,
            persist: true,
            nested: nested,
            CRUDObject: CRUDObject,

            foreignKey: store ? store.foreignKey : null,
            modelParent: store ? store.modelParent : null
        }));
    }

    getDestroyData(records, store) {
        return _.map(records, (i) => {
            let obj = {};

            obj[i.idProperty] = i.getId();
            return obj;
        });
    }

    processCreate(records, response, store) {
        let rs = response.data;
        let data = rs.data;
        // if (data && data.success !== false) {
        if (!rs) {
            throw `Create : Result no found`;
            // return false;
        }
        if (rs.success === false) {
            throw `Create : Request fail`;
            // return ;
        }
        if (data) {
            let model = records[0];
            if (model) {
                this.applyRemoteData(model, records, data, store);
            }
        }
        for (let x = 0; x < records.length; x++) {
            records[x].commit(undefined, undefined, this.mode === "batch" ? true : false);
        }

    }

    processUpdate(records, response, store) {
        let rs = response.data;
        let data = rs.data;
        if (!rs) {
            throw `Update : Result no found`;

            // return;
        }
        if (rs.success === false) {
            throw `Update : Request fail`;
            // return;
        }
        if (data) {
            let model = records[0];
            if (model) {
                this.applyRemoteDataUpdated(model, records, data, store);
            }
        }


        for (let x = 0; x < records.length; x++) {
            records[x].commit(undefined, undefined, this.mode === "batch" ? true : false);
        }
    }

    processDestroy(records, response, store) {
        let rs = response.data;
        let data = rs.data;
        if (!rs) {
            throw `Delete : Result no found`;

            return;
        }
        if (rs.success === false) {
            throw `Delete : Request fail`;
            // return;
        }
        if (data) {

        }

        for (let x = 0; x < records.length; x++) {
            records[x].commit();
            _.remove(store.removed, records[x]);
        }

    }

    applyRemoteData(model, records, data, store) {
        console.log("applyRemoteData")
        let clientId = model.clientIdProperty;
        let idProperty = model.idProperty;

        let i, p;
        for (let x = 0; x < data.length; x++) {
            i = data[x];
            let rec = store.getById(i[clientId]);
            if (rec) {
                rec.set(idProperty, i[idProperty]);
                for (p in i) {
                    rec.set(p, i[p]);
                }
            } else {
                console.log("record no encontrado clientId: " + i[clientId]);
            }
        }

    }

    applyRemoteDataUpdated(model, records, data, store) {

        let clientId = model.clientIdProperty;
        let idProperty = model.idProperty;

        let i, p;
        for (let x = 0; x < data.length; x++) {
            i = data[x];
            let rec = store.getById(i[idProperty]);
            if (rec) {
                for (p in i) {
                    rec.set(p, i[p]);
                }
            } else {
                console.log("record no encontrado clientId: " + i[clientId]);
            }
        }
    }

}

export default ProxyBase;
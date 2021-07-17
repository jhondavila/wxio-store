import ProxyBase from "./Base"
import Sequential from "../identifier/Sequential"
import Core from "../Core";
class ProxyWebStorage extends ProxyBase {

    constructor(opts) {
        super(opts);
        this.store = opts.store;
        this.id = opts.id;
        this.cache = {};
    }

    async load() {
        let ids = this.getIds(),
            length = ids.length,
            data,
            record,
            // records = [],
            Model = this.store.model,
            allRecords = [], i;

        for (i = 0; i < length; i++) {
            data = this.getRecord(ids[i]);
            record = new Model(data);
            allRecords.push(record);
        }

        let start = this.store.start || 0;
        let limit = this.store.pageSize;
        let records = allRecords.slice(start, limit + start);
        return {
            data: {//response
                data: records,
                total: allRecords.length
            }
        };
    }



    getStorageObject() {
        console.error("The getStorageObject function has not been defined in your subclass");
    }

    initialize() {
        console.log("initialize");
        let storageObject = this.getStorageObject();
        let lastId = +storageObject.getItem(this.getRecordCounterKey());
        // let id = this.id;
        this.idGenerator = new Sequential({
            seed: lastId ? lastId + 1 : 1
        });
    }

    getRecordCounterKey() {
        return `${this.id}-counter`;
    }
    getRecordKey(id) {
        if (id.isModel) {
            id = id.getId();
        }
        return `${this.id}-${id}`;
    }

    getIdField() {
        let model = this.store.model;
        return model.fields[model.idProperty];
    }

    getIds() {
        // var me = this,
        let ids = (this.getStorageObject().getItem(this.id) || "").split(","),
            length = ids.length,
            isString = this.getIdField().isStringField,
            i;

        if (length === 1 && ids[0] === "") {
            ids = [];
        } else {
            for (i = 0; i < length; i++) {
                ids[i] = isString ? ids[i] : +ids[i];
            }
        }
        return ids;
    }

    setIds(ids) {
        let obj = this.getStorageObject(),
            str = ids.join(","),
            id = this.id;
        obj.removeItem(id);
        if (!Core.isEmpty(str)) {
            obj.setItem(id, str);
        }
    }

    getNextId() {
        // var me = this,
        let obj = this.getStorageObject(),
            key = this.getRecordCounterKey(),
            isString = this.getIdField().isStringField,
            id;
        id = this.idGenerator.generate();
        obj.setItem(key, id);
        if (isString) {
            id = id + '';
        }
        return id;
    }

    getRecord(id) {
        let me = this,
            cache = me.cache,
            data = !cache[id] ? JSON.parse(me.getStorageObject().getItem(me.getRecordKey(id))) : cache[id];

        if (!data) {
            return null;
        }

        cache[id] = data;
        data[this.store.model.idProperty] = id;

        // In order to preserve the cache, we MUST copy it here because
        // Models use the incoming raw data as their data object and convert/default values into that object
        return Object.assign({}, data);
    }

    async execute(operations) {
        // let filters = this.parseFilters();
        // let extraParams = this.parseExtraParams();
        // let params = {};

        // Object.assign(params, extraParams);

        // if (filters) {
        //     Object.assign(params, {
        //         filter: JSON.stringify(filters)
        //     });
        // }

        if (this.chunkSync) {
            // await this.batchChunkMode(operations, store, params);
        } else {
            await this.batchSimple(operations);
        }
        return true;
    }

    async batchSimple(operations) {
        // let store = this.store;

        if (operations.create) {
            let ids = this.getIds();
            for (let x = 0; x < operations.create.length; x++) {
                let record = operations.create[x];
                let id;
                let isString = this.getIdField().isStringField
                if (record.phantom && !isString) {
                    record.phantom = false;
                    id = this.getNextId();
                } else {
                    id = record.getId();
                }
                record.set(this.store.model.idProperty, id);
                this.setRecord(record, id);
                record.commit();
                ids.push(id);
            }
            // debugger
            this.setIds(ids);
        }


        if (operations.update) {

            let records = operations.update,
                length = records.length,
                ids = this.getIds(),
                record, id, i;

            for (i = 0; i < length; i++) {
                record = records[i];
                this.setRecord(record);
                record.commit();

                //we need to update the set of ids here because it's possible that a non-phantom record was added
                //to this proxy - in which case the record's id would never have been added via the normal 'create' call
                id = record.getId();
                if (id !== undefined && ids.indexOf(id) === -1) {
                    ids.push(id);
                }
            }
        }


        if (operations.destroy) {
            let
                records = operations.destroy,
                ids = this.getIds(),
                idLength = ids.length,
                newIds = [],
                removedHash = {},
                i = records.length,
                id;

            for (; i--;) {
                Object.assign(removedHash, this.removeRecord(records[i]))
            }

            for (i = 0; i < idLength; i++) {
                id = ids[i];
                if (!removedHash[id]) {
                    newIds.push(id);
                }
            }

            this.setIds(newIds);

            //     let data = this.getDestroyData(operations.destroy, store);
            //     params.data = JSON.stringify(data);

            //     let response = await Request({
            //         method: this.methods["destroy"],
            //         url: this.api["destroy"],
            //         params: params
            //     });
            //     this.processDestroy(operations.destroy, response, store);
        }
    }

    removeRecord(record) {
        var me = this,
            id = record.getId(),
            records = {};

        records[id] = record;
        me.getStorageObject().removeItem(me.getRecordKey(id));
        delete me.cache[id];

        return records;
    }

    setRecord(record, id) {
        if (!id) {
            id = record.getId();
        }
        let obj, key;
        // var me = this,
        //     rawData = record.getData(),
        //     data = {},
        //     model = me.getModel(),
        //     fields = model.getFields(),
        //     length = fields.length,
        //     i = 0,
        //     field, name, obj, key;

        // for (; i < length; i++) {
        //     field = fields[i];
        //     name = field.name;

        //     if (field.persist) {
        //         data[name] = rawData[name];
        //     }
        // }

        // no need to store the id in the data, since it is already stored in the record key
        // delete data[model.prototype.idProperty];

        // if the record is a tree node and it's a direct child of the root node, do not store the parentId
        // if (record.isNode && record.get('depth') === 1) {
        //     delete data.parentId;
        // }

        let data = record.getData({
            serialize: true,
            persist: true,
        })
        obj = this.getStorageObject();
        key = this.getRecordKey(id);

        //keep the cache up to date
        this.cache[id] = data;

        //iPad bug requires that we remove the item before setting it
        obj.removeItem(key);
        obj.setItem(key, JSON.stringify(data));
    }


}

export default ProxyWebStorage;
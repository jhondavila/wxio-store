import * as _ from 'lodash';
import EventEmitter from "events"
import ProxyAjax from "./proxy/Ajax";
import ProxyForm from "./proxy/Form";
import ProxyLocalStorage from "./proxy/LocalStorage";
import Model from "./Model";

import Core from "./Core";
class Store extends EventEmitter {

    model = null;
    modelParent = null;

    data = []
    mapping = {};
    removed = [];
    loading = false;
    isSyncing = false;

    /**
     * @private
     */
     errorRequest = false
     statusRequest = 200

    /**
     * @private
     */
    filters = []

    /**
     * @private
     */
    staticFilters = []
    /**
     * @private
     */
    extraParams = {};
    /**
     * @private
     */
    sorters = [];

    pageSize = 100;

    /**
     * @private
     */
    currentPage = 1;
    /**
     * @private
     */
    total = null;
    /**
     * @private
     */
    limit = null;
    /**
     * 
     * @private 
     */
    start = null;

    /**
     * @private
     */
    proxy = null;
    remoteFilters = true;
    remoteSorters = false;
    clearOnPageLoad = true;

    autoLoad = false;

    _isStore = true;

    constructor(opts) {
        super(opts);
        // if (opts.proxy) {
        Object.assign(this, opts);
        this.initProxy(opts.proxy || { type: "ajax" });
        // }
        // debugger
        this.initModel(opts);
        if (opts.filters) {
            this.setFilters(opts.filters);
        }
        if (opts.staticFilters) {
            this.setStaticFilters(opts.staticFilters);
        }
        this.pageSize = opts.pageSize || this.pageSize;
    }


    /**
     * @private
     * @param {*} cfg 
     */
    initProxy(cfg) {
        let proxy;
        if (cfg.type === "ajax") {
            proxy = new ProxyAjax({
                store: this,
                ...cfg
            });
        } if (cfg.type === "form") {
            proxy = new ProxyForm({
                store: this,
                ...cfg
            });
        } else if (cfg.type === "localstorage") {
            proxy = new ProxyLocalStorage({
                store: this,
                ...cfg
            });
        }
        this.proxy = proxy;
    }

    /**
     * @private
     * @param {*} fields 
     */
    initModel(opts) {
        // let model;
        let model = new Model({
            fields: opts.fields || {},
            idProperty: opts.idProperty
        });
        this.model = model;
    }


    async previousPage() {
        return await this.loadPage(this.currentPage - 1);
    }

    async nextPage() {
        let lastPage = Math.ceil(this.total / this.pageSize);
        if (this.currentPage + 1 <= lastPage) {
            return await this.loadPage(this.currentPage + 1);
        }
    }

    async firstPage() {
        return await this.loadPage(1);
    }

    async lastPage() {
        let lastPage = Math.ceil(this.total / this.pageSize);
        if (this.currentPage < lastPage) {
            return await this.loadPage(lastPage);
        }
        return false;
    }

    async reloadPage(page) {
        return await this.loadPage(page || this.currentPage);
    }

    async refreshPage() {
        return await this.loadPage(this.currentPage);
    }

    async loadPage(page) {
        if (page < 1) {
            page = 1;
        }
        this.start = (page - 1) * this.pageSize;
        this.limit = this.pageSize;
        let silent = true;
        this.currentPage = page;
        let response = await this.load({ silent });
        //this.emit("load", this, this.data);
        return response;
    }

    getPage() {
        return this.currentPage;
    }
    getTotalPages() {
        if (this.total) {
            return Math.ceil(this.total / this.pageSize);
        } else {
            return;
        }
    }


    async load() {
        try {
            this.loading = true;
            this.emit("loading", this, true);

            let rs = await this.proxy.load();
            let propData = rs.data.data;
            if (this.clearOnPageLoad) {
                this.clearLoad();
            }
            this.add(propData, true);
            this.loading = false;

            console.log({...this});

            this.emit("loading", this, false);
            //if(!opts.silent){
            this.emit("load", this, this.data);
            //}
            return true;
        } catch (error) {
            
            this.errorRequest = {...error}.isAxiosError;
            this.statusRequest = {...error}.response ? {...error}.response.status :  0;
            this.loading = false;
            this.emit("loading", false);
            return false;
        }
    }

    async loadData(data) {
        this.loading = true;
        this.emit("loading", this, true);

        this.add(data, true);
        this.loading = false;

        this.emit("loading", this, false);
        //if(!opts.silent){
        this.emit("load", this, this.data);
        return true;
    }


    /**
     * @private
     */
    clearLoad() {
        this.data.splice(0);
        this.mapping = {};
    }


    add(models, cancelFireEvent) {
        if (!models) {
            return [];
        }
        if (!Core.isArray(models)) {
            models = [models];
        }
        let items = [], model,
            modelBase = this.model;
        models.forEach((item) => {
            if (item.isModel) {
                model = item;
            } else {
                model = this.createModel(item, modelBase);
            }
            if (!this.mapping[model.getId()]) {
                this.data.push(model);
                this.onAdd(model);
            } else {
                model = this.getById(model.getId());
                if (item && item != model) {
                    let dataUpdate = item.isModel ? item.getData() : item;
                    model.set(dataUpdate);
                }
            }
            items.push(model);
        });
        this.applySorters();
        this.nestedUpdate();
        if (!cancelFireEvent) {
            this.emit("add", this, items);
        }
        return items;
    }

    /**
     * @private
     * @param {*} attributes 
     * @param {*} modelBase 
     */
    createModel(attributes, modelBase) {
        return new modelBase(attributes, {
            modelParent: this.modelParent
        });
    }



    count() {
        return this.data.length;
    }

    /**
     * @private
     * @param {*} model 
     */
    onAdd(model) {
        model.registerCollection(this);
        this.addModelToRegistry(model);
    }

    /**
     * @private
     * @param {*} model 
     */
    addModelToRegistry(model) {
        this.mapping[model.getId()] = model;
    }


    /**
     * @private
     */
    applySorters() {
        if (this.remoteSorters) {


            //sort: [{"property":"cmp_fecha","direction":"DESC"}]
        } else {
            let propertys = [];
            let directions = [];
            let sorters = this.sorters || [];
            for (let x = 0; x < this.sorters.length; x++) {
                let item = sorters[x];
                propertys.push(item.fn || item.property);
                directions.push(item.direction ? item.direction.toLowerCase() : "asc");
            }
            let data = _.orderBy(this.data, propertys, directions);
            this.data = data;
        }
    }

    nestedUpdate() {
        if (this.modelParent) {
            let modelParent = this.modelParent;
            modelParent.onDirtyChildStore(this);
        }
    }



    setExtraParams(params) {
        this.extraParams = {
            ...params
        };
    }

    addFilters(filter) {
        if (Core.isObject(filter)) {
            filter = [filter]
        }
        this.filters.push(...filter);
    }

    clearFilters() {
        this.filters.splice(0);
    }



    setFilters(name, value) {
        let filters = [];
        if (Core.isObject(name)) {
            filters.push(name);
        } else if (Core.isArray(name)) {
            name.forEach((item) => {
                filters.push(item);
            });
        } else {
            filters.push({
                property: name,
                value: value
            });
        }
        this.filters = filters;
    }
    filter(name, value) {

        if (Core.isObject(name)) {
            this.filters.push(name);
        } else if (Core.isArray(name)) {

            name.forEach((item) => {
                this.filters.push(item);
            });

        } else {


            this.filters.push({
                property: name,
                value: value
            });
        }
    }


    addStaticFilters(filter) {
        if (Core.isObject(filter)) {
            filter = [filter]
        }
        this.staticFilters.push(...filter);
    }

    clearStaticFilters() {
        this.staticFilters.splice(0);
    }



    setStaticFilters(name, value) {
        let filters = [];
        // debugger
        if (Core.isObject(name)) {
            filters.push(name);
        } else if (Core.isArray(name)) {
            name.forEach((item) => {
                filters.push(item);
            });
        } else if (name) {
            filters.push({
                property: name,
                value: value
            });
        }
        this.staticFilters = filters;
    }
    staticFilter(name, value) {

        if (Core.isObject(name)) {
            this.staticFilters.push(name);
        } else if (Core.isArray(name)) {

            name.forEach((item) => {
                this.staticFilters.push(item);
            });

        } else {


            this.staticFilters.push({
                property: name,
                value: value
            });
        }
    }

    addSorters(sorter) {
        if (Core.isObject(sorter)) {
            sorter = [sorter]
        }
        this.sorters.push(...sorter);
        this.applySorters();

    }
    clearSorters() {
        this.sorters.splice(0);
        this.applySorters();
    }

    setSorters(name, direction) {
        let sorters = [];
        if (Core.isObject(name)) {
            sorters.push(name);
        } else if (Core.isArray(name)) {
            name.forEach((item) => {
                sorters.push(item);
            });
        } else {
            sorters.push({
                property: name,
                direction: direction ? direction.toLowerCase() : null
            });
        }
        this.sorters = sorters;
        this.applySorters();
    }

    sorter(name, direction) {

        if (Core.isObject(name)) {
            this.sorters.push(name);
        } else if (Core.isArray(name)) {

            name.forEach((item) => {
                this.sorters.push(item);
            });

        } else {

            this.sorters.push({
                property: name,
                direction: direction ? direction.toLowerCase() : null
            });
        }
        this.applySorters();

    }

    indexOf(model) {
        return this.data.indexOf(model);
    }

    indexOfId(id) {
        let model = this.getById(id);
        return this.data.indexOf(model);
    }

    removeById(id) {
        let model = this.getById(id);
        this.remove(model);
    }

    remove(models) {
        if (!Core.isArray(models)) {
            models = [models];
        }
        let list = [];
        models.forEach((item) => {
            if (item) {
                if (!item.phantom) {
                    this.removed.push(item);
                }
                list.push(item);
                item.drop();
                Core.Array.remove(this.data, item);
                this.onRemove(item);
            }
        });
        this.applySorters();

        this.nestedUpdate();

        this.emit("remove", this, list);

    }
    onRemove(model) {
        this.removeModelToRegistry(model);
    }
    /**
     * @private
     */
    removeModelToRegistry(model) {
        delete this.mapping[model.getId()];
    }

    /**
     * @private
     */
    filterNewModels() {
        return _.filter(this.data, {
            phantom: true
        });
    }

    /**
     * @private
     */
    filterUpdatedModels() {
        return _.filter(this.data, (i) => {
            return i.dirty && !i.phantom ? true : false
        });
    }

    /**
     * @private
     */
    filterRemoveModels() {
        return _.clone(this.removed);
    }



    needsSync() {
        return this.changed();
    }

    changed() {

        if (this.isSyncing) {
            return false;
        }

        let toCreate = this.getNewModels();
        let toUpdate = this.getUpdatedModels();
        let toDestroy = this.getRemoveModels();

        let needsSync = false;
        if (toCreate.length > 0) {
            needsSync = true;
        }

        if (toUpdate.length > 0) {
            needsSync = true;
        }

        if (toDestroy.length > 0) {
            needsSync = true;
        }

        return needsSync;
    }



    async sync(options) {
        if (this.isSyncing) {
            return;
        }
        let toCreate = this.getNewModels();
        let toUpdate = this.getUpdatedModels();
        let toDestroy = this.getRemoveModels();

        let operations = {};
        let needsSync = false;
        if (toCreate.length > 0) {
            operations.create = toCreate;
            needsSync = true;
        }

        if (toUpdate.length > 0) {
            operations.update = toUpdate;
            needsSync = true;
        }

        if (toDestroy.length > 0) {
            operations.destroy = toDestroy;
            needsSync = true;
        }

        if (needsSync) {
            try {
                this.isSyncing = true;
                let proxy = this.proxy;
                await proxy.execute(operations, this);
                this.isSyncing = false;
                return true;
            } catch (error) {
                console.log(error)
                this.isSyncing = false;
                if (options && options.catchError) {
                    return {
                        error: error,
                        request: error.request,
                        response: Core.JSON.decode(error.request.responseText, true)
                    };
                } else {
                    return false;
                }

            }
        } else {
            return true;
        }
    }

    getNewModels() {
        return this.filterNewModels();
    }

    getUpdatedModels() {
        return this.filterUpdatedModels();
    }

    getRemoveModels() {
        return this.filterRemoveModels();
    }


    getNewAndUpdateModels() {
        return [...this.filterNewModels(), ...this.filterUpdatedModels()]
    }

    getRecordsErrors() {
        let recordsWithChanges = [...this.filterNewModels(), ...this.filterUpdatedModels()];
        let errors = [];
        for (let x = 0; x < recordsWithChanges.length; x++) {
            if (recordsWithChanges[x]._isValid === false) {
                errors.push(recordsWithChanges[x]);
            }
        }
        if (errors.length > 0) {
            return errors;
        } else {
            return false;
        }
    }

    getById(key) {
        if (this.mapping[key]) {
            return this.mapping[key];
        }
        return;
    }

    getAt(index) {
        return this.data[index];
    }

    /**
     * @private
     */
    onIdChanged(model, oldId, newId) {
        //borramos el anterior id primero y luego añadimos el nuevo
        //esto para evitar problemas cuando el nuevo y antiguo id son lo mismo;
        delete this.mapping[oldId];
        this.mapping[newId] = model;
    }

    map(fn) {
        return this.data.map(fn);
    }
    each(fn) {
        //copiando orden de elementos actual
        let data = this.data.slice(0);
        for (let x = 0; x < data.length; x++) {
            if (fn(data[x], x) === false) {
                break;
            }
        }
        data.splice(0);//limpiando array
    }

    find(condition) {
        return _.find(this.data, condition);
    }

    async loadByFilters(filters, opts) {
        if (!Array.isArray(filters)) {
            filters = [filters];
        }
        let rs = await this.proxy.loadRequired(filters, opts);

        let propData = rs.data.data;

        let records = this.add(propData, true);
        this.emit("load", this, this.data);

        return records;
    }

    async loadByProperty(property, value, opts) {
        let filters = [{
            property: property,
            value: value
        }];
        let rs = await this.proxy.loadRequired(filters, opts);

        let propData = rs.data.data;

        this.add(propData, true);
        this.emit("load", this, this.data);
        let record = this.find({ [property]: value });

        if (record) {
            return record;
        } else {
            return null;
        }

    }

    async loadById(id) {
        let filters = [{
            property: this.model.idProperty,
            value: id
        }];
        let rs = await this.proxy.loadRequired(filters);

        let propData = rs.data.data;

        this.add(propData, true);
        this.emit("load", this, this.data);
        let record = this.getById(id);

        if (record) {
            return record;
        } else {
            return null;
        }

    }
    /**
     * @private
     */
    onDataChanged(record) {

        this.applySorters();
        this.nestedUpdate();
        this.emit("update", this, record);
    }


    updateParent() {
        this.nestedUpdate();
    }


    cancelChanges() {
        // this.data.forEach((model) => {
        //     model.cancelChanges();
        // });

        this.each((record) => {
            record.cancelChanges();
        });
        //copiamos los records removidos para restaurarlos
        let removeRecords = this.removed.slice(0);

        //obtenemos los nuevos modelos para eliminarlos
        let newModels = this.getNewModels();

        //eliminamos los records
        this.remove(newModels);

        //limpiamos los records eliminados
        for (let x = 0; x < newModels.length; x++) {
            newModels[x].commit();
            Core.Array.remove(this.removed, newModels[x]);
        }

        //volvemos añadir los records que se habian eliminado
        this.add(removeRecords);

    }


    moveUp(model, property = "order") {
        let oldIndex = this.data.indexOf(model);
        let newIndex = oldIndex == 0 ? 0 : oldIndex - 1;
        this.moveTo(model, newIndex, (rec, index) => {
            rec.set(property, index);
        });
    }
    moveDown(model, property = "order") {
        let cloneArray = this.data.slice(0);
        let oldIndex = cloneArray.indexOf(model);
        let newIndex = oldIndex + 1;
        this.moveTo(model, newIndex, (rec, index) => {
            rec.set(property, index);
        });
    }


    moveTo(model, index, fn) {
        let oldIndex = this.data.indexOf(model);
        if (oldIndex > -1) {
            const targetRow = this.data.splice(oldIndex, 1)[0];
            this.data.splice(index, 0, targetRow);
            this.each(fn);
        }
    }

    /**
     * @private
     * @param {*} models 
     */
    commitRemove(models) {
        if (!models) {
            models = this.filterRemoveModels();
        }
        if (!Core.isArray(models)) {
            models = [models];
        }
        for (let x = 0; x < models.length; x++) {
            models[x].commit();
            Core.Array.remove(this.removed, models[x]);
        }
    }

    getData() {
        return this.data.slice(0);
    }

    sumBy(property) {
        return _.sumBy(this.data, (record) => {
            if (record.get(property)) {
                if (typeof record.get(property) === "string") {
                    return parseFloat(record.get(property));
                } else {
                    return record.get(property);
                }
            } else {
                return 0;
            }
        })
    }

    avgBy(property) {
        return _.meanBy(this.data, (record) => {
            // if (record[property]) {
            return record.get(property);
            // } else {
            //     return null;
            // }
        })
    }

    minBy(property) {
        let record = _.minBy(this.data, (record) => {
            return record.get(property);
        })
        if (record) {
            return record.get(property);
        } else {
            return;
        }
    }
    maxBy(property) {
        let record = _.maxBy(this.data, (record) => {
            return record.get(property);
        })
        if (record) {
            return record.get(property);
        } else {
            return;
        }
    }
}

export default Store;
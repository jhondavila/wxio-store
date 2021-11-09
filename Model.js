import { EventEmitter } from "events";

import ProxyAjax from "./proxy/Ajax";
import utils from "./Utils";
import Core from "./Core";
import * as  _ from "lodash"

import SeqNegative from './identifier/Negative';
import schema from 'async-validator';
import { modelConfig } from "./Config"

class BaseModel {

    constructor(options) {
        options = options || {};
        let idProperty = options.idProperty || "id";

        // new schema({
        //     username: {
        //         type: "string",
        //         required: true,
        //     },
        //     password: {
        //         type: "string",
        //         required: true
        //     },
        // }),

        // let schemaValidation 
        // let fieldsValidator = {

        // };
        let compileFields = this.compileFields(idProperty, options);
        let schemaValidator = this.compileValidators(compileFields);


        let {
            fileSupport,
            criticalFields,
            referenceFields
            // subStoreFields
        } = this.classifyFields(compileFields)
        let { proxy } = this.initProxy(options);


        let identifier = new SeqNegative({
            prefix: options.prefixId || "ID_"
        });

        class Model extends EventEmitter {
            clientIdProperty = "clientId";
            _isModel = true;
            fileSupport = fileSupport;
            _fields = compileFields;
            _schemaValidator = schemaValidator;
            _validation = {};
            _attributes = {};
            _commitValues = {};
            _previousValues = {};
            _stores = [];
            phantom = false;
            dirty = false;
            erased = false;

            // validation = null;
            _isValid = null;
            _validationErrors = null;
            get idProperty() {
                return idProperty;
            }


            initAttributes(attributes) {
                let field;
                // debugger
                for (let p in this._fields) {
                    field = this._fields[p];
                    if (field.isNested) {
                        this.registerNestedField(field);
                    } else {
                        this.registerAttribute(field);

                        if (field.defaultValue !== undefined) {
                            let value = Core.isFunction(field.defaultValue) ? field.defaultValue : field.defaultValue;
                            this.set(field.name, value);
                        }

                        if (field.mapping) {
                            // let value = attributes[field.mapping] || PathVal.getValue(field.mapping, attributes);
                            // this.set(field.name, value);
                        }
                    }
                }

            }


            constructor(attributes, options) {
                super();
                Object.assign(this, options);
                this.internalId = Core.classId(this);
                this.initAttributes(attributes);
                this.set(attributes, null, {
                    initialized: true
                });
                if (!this.get(this.idProperty)) {
                    this.phantom = true;
                    this.set(this.idProperty, this.generateId());
                } else {
                    this.commit();
                }

                let data = this.getData({
                    serialize: true,
                    persist: true,
                    nested: false
                });
                this._previousValues = _.cloneDeep(data);
            }



            _addTocompileFields(attribute) {
                if (modelConfig.propertyNoExistAlert) {
                    console.warn(`La propiedad "${attribute}" no se encuentra registrada en el modelo añadiendo`);
                }
                compileFields[attribute] = utils.createField(attribute);
            }

            getCommitValue(key) {
                if (this.phantom) {
                    return this._attributes[key];
                } else {
                    return this._commitValues[key];
                }
            }

            set(property, v, options = {}) {
                // console.log(property,v)
                let single = Core.isString(property);
                let attributes;

                let { initialized, silent } = options;
                if (single) {
                    attributes = {};
                    attributes[property] = v;
                } else {
                    attributes = property;
                }


                let changeId = false;
                let oldId;
                let newId;
                for (let attribute in attributes) {
                    let value = attributes[attribute];
                    let field = this._fields[attribute];
                    let defined = this.has(attribute);
                    if (!defined) {
                        this.registerAttribute(attribute);
                        this._addTocompileFields(attribute);
                        field = this._fields[attribute];
                    }
                    value = this.convert(attribute, value);

                    let previous = this.get(attribute);

                    let changed;

                    if (field && field.isNested) {
                        if (previous) {
                            field.applySet(previous, value);
                            changed = field.changed(previous);
                        } else if (!previous && !field.allowNull) {
                            // debugger
                            Object.assign(this._attributes, {
                                [attribute]: value
                            })
                            // Vue.set(this._attributes, attribute, value);
                            changed = defined && field.persist && !field.isEqual(previous, value);
                            if (Core.isArray(previous) && Core.isArray(value)) {
                                if (previous !== value) {
                                    changed = true;
                                }
                            }

                        } else if (!previous && field.allowNull) {
                            let initialized = field.applyInit(this, field);
                            Object.assign(this._attributes, {
                                [attribute]: initialized
                            });
                            // Vue.set(this._attributes, attribute, initialized);
                            previous = initialized;
                            field.applySet(previous, value);
                            changed = field.changed(previous);
                        }
                    } else {
                        Object.assign(this._attributes, {
                            [attribute]: value
                        });
                        changed = defined && field.persist && !field.isEqual(previous, value);
                        if (Core.isArray(previous) && Core.isArray(value)) {
                            if (previous !== value) {
                                changed = true;
                            }
                        }
                    }


                    if (changed) {
                        this.setDirty(true);
                        if (this.idProperty === attribute) {
                            changeId = true;
                            oldId = previous;
                            newId = value;
                        }
                    }
                }

                if (!silent) {
                    if (changeId) {
                        this.callJoinCollection("onIdChanged", this, oldId, newId);
                    }

                    this.callJoinCollection("onDataChanged", this);
                }


            }

            convert(attribute, value) {

                let field = _.get(this._fields, attribute);
                if (field && field.convert) {
                    try {
                        return field.convert(value, this._attributes, field.name);
                    } catch (error) {
                        console.log(error);
                    }
                }

                return value;
            }

            registerNestedField(field) {
                field.register(this, field);
            }

            registerAttribute(field, isStore) {
                // Protect against unwillingly using an attribute name that already
                // exists as an internal property or method name.
                let attribute;
                if (Core.isString(field)) {
                    attribute = field;
                } else {
                    attribute = field.name;
                }

                // let RESERVED = this.RESERVED;
                // if (_.has(RESERVED, attribute)) {
                //     throw new Error(`Can't use reserved attribute name '${attribute}'`);
                // }

                // Create dynamic accessors and mutations so that we can update the
                // model directly while also keeping the model attributes in sync.

                // console.log(attribute, field.getter)
                Object.defineProperty(this, attribute, {
                    get: field.getter ? field.getter.bind(this) : () => this.get(attribute),
                    set: field.setter ? field.setter.bind(this) : (value) => this.set(attribute, value)
                });
            }

            get attributes() {
                return this._attributes;
            }

            get $() {
                return this._attributes;
            }

            get isModel() {
                return true;
            }


            getId() {
                return this.get(this.idProperty);
            }

            get(attribute, fallback) {
                if (this._fields[attribute]) {
                    if (this._fields[attribute].reference) {
                        return this[attribute];
                    } else if (this._fields[attribute].isMapping) {
                        return this[attribute];
                    } else {
                        return _.get(this._attributes, attribute, fallback);
                    }
                } else {
                    return _.get(this._attributes, attribute, fallback);
                }
            }

            has(attribute) {

                if (this._fields[attribute]) {
                    // console.log(attribute,true);
                    return true;
                } else if (this._attributes[attribute] !== undefined) {
                    // console.log(attribute,true);
                    console.warn(`La propiedad "${attribute}" no se encuentra registrada en el modelo`);
                    return true;
                } else {
                    return false;
                }


            }



            setDirty(value) {
                this.dirty = value;
                if (this.modelParent) {
                    let modelParent = this.modelParent;
                    modelParent.onDirtyChildModel(this);
                }
            }



            onDirtyChildModel(childModel) {
                if (childModel.changed()) {
                    this.setDirty(true);
                }
            }

            onDirtyChildStore(childStore) {
                if (childStore.needsSync()) {
                    this.setDirty(true);
                }
            }

            confirm() {
                // 
                if (!this.phantom) {
                    this.setDirty(this.changed() ? true : false)
                }
                this._eachNestedTypes((field, value) => {
                    field.applyConfirm(value);
                });
                this.copyToPreviousValue(this._attributes, this._previousValues);
            }


            reset(attribute) {
                if (attribute) {
                    this.copyToAttributes(this._previousValues, this._attributes, _.castArray(attribute));
                } else {
                    this.copyToAttributes(this._previousValues, this._attributes);
                    this._eachNestedTypes((field, value) => {
                        field.applyReset(value);
                    });
                }
                this.setDirty(false);
            }


            //Attributes
            cancelChanges() {
                //cancela los cambios realizados
                if (this.phantom) {

                    this.copyToAttributes(this._previousValues, this._attributes);

                } else {

                    this.copyToAttributes(this._commitValues, this._attributes);

                }
                this._eachNestedTypes((field, value) => {
                    field.applyCancelChanges(value);
                });
                this.setDirty(false)
            }

            getPreviousValues() {
                if (this.phantom) {
                    return this._previousValues;
                } else {
                    return this._commitValues;
                }
            }

            copyToPreviousValue(source, target, keys) {
                if (keys) {
                    source = _.pick(source, keys);
                }

                _.each(source, (value, key) => {
                    let field = this._getField(key);
                    if (field && field.isNested) {

                    } else {
                        target[key] = _.cloneDeep(value);
                    }
                });
            }
            copyToAttributes(source, target, keys) {

                if (keys) {
                    source = _.pick(source, keys);
                }

                _.each(source, (value, key) => {
                    let field = this._getField(key);
                    if (field && field.isNested) {

                    } else {
                        this.set(key, _.cloneDeep(value));
                    }
                });
            }


            _eachNestedTypes(fn) {

                let fieldsMap = this._fields;

                for (let fieldKey in fieldsMap) {
                    let field = fieldsMap[fieldKey];
                    if (field.isNested) {
                        let attribute = this.get(fieldKey);
                        if (attribute) {
                            fn(field, attribute);
                        }
                    }
                }

            }

            async _eachNestedTypesSync(fn) {
                let fieldsMap = this._fields;

                for (let fieldKey in fieldsMap) {
                    let field = fieldsMap[fieldKey];
                    if (field.isNested) {
                        let attribute = this.get(fieldKey);
                        if (attribute) {
                            await fn(field, attribute);
                        }
                    }
                }
            }
            commit(silent, modifiedFieldNames, nested) {
                if (!nested) {
                    this._eachNestedTypes((field, value) => {
                        field.applyCommit(value);
                    });
                }
                this.phantom = false;
                this.setDirty(false);
                if (this.dropped) {
                    this.erased = true;
                }
                let data = this.getData({
                    serialize: true,
                    persist: true,
                    nested: false
                });
                this._commitValues = _.cloneDeep(data);
                this._previousValues = _.cloneDeep(data);
                // debugger
            }
            setPhantom(value) {
                this.phantom = value;
            }

            _getField(attribute) {
                return this._fields[attribute];
            }


            // getFiles(options) {
            //     let changes = options.changes,
            //         data = this._attributes,
            //         fieldsMap = this._fields;
            //     let content = changes ? _.pick(this._attributes, this.changed()) : this._attributes;
            //     let ret = [];
            //     if (content) {
            //         for (name in content) {
            //             let value = data[name];
            //             let field = fieldsMap[name];
            //             if (!field) {
            //                 continue;
            //             }
            //             if (field.type === "file") {
            //                 ret.push({
            //                     field: name,
            //                     file: value
            //                 });
            //             }
            //         }
            //     }
            //     // console.log(ret);
            //     return {
            //         id: this.getId(),
            //         idProperty: this.idProperty,
            //         files: ret
            //     };
            // }

            getData(options) {
                options = options || {
                    serialize: true,
                    persist: true,
                    nested: true,
                    CRUDObject: false
                };
                let serialize = options.serialize,
                    persist = options.persist,
                    changes = options.changes,
                    nested = options.nested,
                    CRUDObject = options.CRUDObject,
                    foreignKey = options.foreignKey,
                    modelParent = options.modelParent,
                    fieldsMap = this._fields,
                    // form = options.form,
                    data = this._attributes;

                let content = changes ? _.pick(this._attributes, this.changed()) : this._attributes;
                // console.log(content)
                let ret = {};
                // 
                let name;
                if (content) {
                    for (name in content) {
                        let value = data[name];
                        let field = fieldsMap[name];
                        // 
                        if (field) {
                            // console.log(persist && !field.persist)
                            if (persist && !field.persist) {
                                continue;
                            }
                            if (field.isNested && nested) {
                                value = field.getData(value, this, options);
                            } if (field.isNested && CRUDObject) {
                                value = field.getData(value, this, options);
                            } else if (field.isNested && !nested) {
                                continue;
                            }

                            if (serialize && field.serialize) {
                                value = field.serialize(value, this, options);
                            }
                        }
                        ret[name] = value;
                    }
                }
                // 

                // let critical = _.pick(this._attributes, criticalFields)
                let critical = _.pick(this, criticalFields)

                if (critical) {
                    // debugger
                    for (let name in critical) {
                        let value = critical[name];
                        let field = fieldsMap[name];
                        if (field) {
                            if (serialize && field.serialize) {
                                value = field.serialize(value, this);
                            }
                        }
                        ret[name] = value;
                    }
                }
                if (modelParent && foreignKey) {
                    ret[foreignKey] = modelParent.getId();
                }

                ret[this.idProperty] = this.getId();
                return ret;
            }

            changed() {
                let changed = [];
                let fieldsMap = this._fields;

                for (let attribute in this._attributes) {
                    let value = this._attributes[attribute];
                    let field = fieldsMap[attribute];
                    if (field && !field.persist) {
                        continue;
                    }
                    if (field && field.isNested) {
                        if (!value.changed()) {
                            continue;
                        }
                    } else if (field) {
                        if (field.isEqual(value, this.saved(attribute))) {
                            continue;
                        }
                    } else {
                        if (_.isEqual(value, this.saved(attribute))) {
                            continue;
                        }
                    }

                    changed.push(attribute);
                }

                return !_.isEmpty(changed) ? changed : false;
            }


            saved(attribute, fallback) {
                return _.get(this._commitValues, attribute, fallback);
            }

            registerCollection(store) {
                Core.Array.include(this._stores, store);
            }

            callJoinCollection(method) {
                let store, fn;
                for (let x = 0; x < this._stores.length; x++) {
                    store = this._stores[x];
                    fn = store[method];
                    fn.apply(store, Array.prototype.slice.call(arguments, 1));
                }
            }

            drop() {
                this.dropped = true;
            }

            // getById(id) {
            //     if (this.id == this.getId()) {
            //         return this;
            //     }
            // }

            //class functional
            //class functional
            //class functional
            //class functional
            //class functional
            //class functional
            //class functional

            generateId() {
                // let prototype = Object.getPrototypeOf(this);
                // let constructor = prototype.constructor;
                // debugger
                return identifier.generate();
            }

            needsSync() {
                let needsSync = false;

                if (this.phantom) {
                    needsSync = true;
                }

                if (!this.phantom && this.dirty && !this.dropped) {
                    needsSync = true;
                }

                if (this.dropped) {
                    needsSync = true;
                }

                return needsSync;
            }


            async sync(options) {
                let operations = {};
                let needsSync = false;

                if (this.phantom) {
                    operations.create = [this];
                    needsSync = true;
                }

                if (!this.phantom && this.dirty && !this.dropped) {
                    operations.update = [this];
                    needsSync = true;
                }

                if (this.dropped) {
                    operations.destroy = [this];
                    needsSync = true;
                }

                if (needsSync) {
                    try {
                        this.isSyncing = true;
                        await proxy.batch(operations, this);
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

            async clearInvalidFields() {
                try {
                    // debugger
                    let validation = await this._schemaValidator.validate(this.attributes, {
                        record: this
                    });
                    this._isValid = true;
                    this._validationErrors = null;

                    return true;
                } catch (error) {
                    let { errors, fields } = error;
                    for (let field in fields) {
                        if (this.phantom) {
                            this.set(field, this._previousValues[field]);
                        } else {
                            this.set(field, this._commitValues[field]);
                        }
                    }
                    this._isValid = true;//clear
                    this._validationErrors = null;//clear
                    return fields;
                }
            }


            async getValidation() {
                try {
                    // debugger
                    let validation = await this._schemaValidator.validate(this.attributes, {
                        record: this,
                        // ...opts
                    });
                    let valid = true;
                    let validationErrors = null;
                    await this._eachNestedTypesSync(async (field, attribute) => {
                        let validation = await attribute.getValidation();
                        if (validation !== true) {
                            valid = false;
                            validationErrors = validationErrors || {};
                            validationErrors[field.name] = validation;
                        }
                    })
                    // debugger
                    this._isValid = valid;
                    this._validationErrors = validationErrors;
                    if (valid) {
                        return true;
                    } else {
                        return this._validationErrors;
                    }
                } catch (error) {
                    let { errors, fields } = error;
                    await this._eachNestedTypesSync(async (field, attribute) => {
                        let validation = await attribute.getValidation();
                        if (validation !== true) {
                            fields[field.name] = validation;
                        }
                    })
                    this._isValid = false;
                    this._validationErrors = fields;
                    return fields;
                }
            }

            async isValid() {
                try {
                    let validation = await this._schemaValidator.validate(this.attributes, {
                        record: this
                    });
                    return true;
                } catch (error) {
                    let { errors, fields } = error;
                    return false;
                }
            }


        }

        Model.entityName = options.name;
        Model.idProperty = options.idProperty || "id";
        Model.fields = compileFields;
        Model.schemaValidator = schemaValidator;

        Model.schemaValidator.disabledRule = (field) => {
            let rule = schemaValidator.rules[field];
            if (rule) {
                schemaValidator.disabledRules = schemaValidator.disabledRules || {};
                schemaValidator.disabledRules[field] = rule;
                delete schemaValidator.rules[field];
                return true;
            } else {
                return false;
            }

        }

        Model.schemaValidator.enabledRule = (field) => {
            schemaValidator.disabledRules = schemaValidator.disabledRules || {};
            if (schemaValidator.disabledRules[field]) {
                let rule = schemaValidator.disabledRules[field];
                schemaValidator.rules[field] = rule;
                return true;
            } else {
                return false;
            }
        }
        return Model;
    }

    classifyFields(compileFields) {
        let fileSupport = false;
        let criticalFields = [];
        let referenceFields = [];
        let subStoreFields = [];

        for (let p in compileFields) {
            if (compileFields[p].type === "file") {
                fileSupport = true;
            }
            if (compileFields[p].critical) {
                criticalFields.push(compileFields[p].name);
            }

            if (compileFields[p].reference) {
                referenceFields.push(compileFields[p].name);
            }
        }

        return {
            fileSupport,
            criticalFields,
            subStoreFields,
            referenceFields
        };
    }
    compileFields(idProperty, options) {
        let fields = options.fields || {};
        if (!fields[idProperty]) {
            fields[idProperty] = {
                persist: true
            };
        }
        return utils.compileFields(fields);
    }
    compileValidators(compileFields) {
        let validators = {
        };
        for (let p in compileFields) {
            let field = compileFields[p];
            if (field.validation) {
                validators[p] = field.validation;
            }
        }
        return new schema(validators)
    }

    initProxy(options) {
        let proxy = options.proxy;
        if (proxy) {
            if (proxy.type === "ajax") {
                proxy = new ProxyAjax(proxy);
            }
            //  else if (proxy.type === "form") {
            //     proxy = new ProxyForm(proxy);
            // } else if (proxy.type === "memory") {
            //     proxy = new ProxyMemory(proxy);
            // }
        }

        return { proxy };
    }
}

export default BaseModel;
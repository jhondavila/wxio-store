import Field from './Field';

import Model from "../Model";
import Core from '../Core';
import * as _ from 'lodash';

import Store from "../Store";

const excludeProps = ["mapping", "persist", "name", "mappingPath", "ctModel", "defaultValue", "isNested"];

class FStore extends Field {

    type = "store";
    isNested = true;
    constructor(config) {
        super(config);
    }

    getData(store, parentModel, options) {
        let data;
        // debugger
        if (options.CRUDObject) {
            let toCreate = store.getNewModels();
            let toUpdate = store.getUpdatedModels();
            let toDestroy = store.getRemoveModels();

            let createData = store.proxy.getCreateData(toCreate, store);
            let updateData = store.proxy.getUpdateData(toUpdate, store);
            let destroyData = store.proxy.getDestroyData(toDestroy, store);

            data = {
                C: createData,
                U: updateData,
                D: destroyData
            };
        } else {
            data = [];
            store.each((i) => {
                data.push(i.getData(options));
            })
        }
        return data;
        // let data;
        // if (options.mode === "create") {
        //     let records = store.getNewModels();
        //     data = store.proxy.getCreateData(records);
        //     return data ? data : [];
        // } else if (options.mode === "update") {
        //     let records = store.getNewModels();
        //     data = store.proxy.getUpdateData(records);
        //     return data ? data : [];
        // }
    }


    register(parentModel, field) {
        let model;
        if (!this.ctModel) {
            this.ctModel = new Model(field);
        }
        model = this.ctModel;

        let attribute;
        if (Core.isString(field)) {
            attribute = field;
        } else {
            attribute = field.name;
        }
        // debugger
        // let RESERVED = parentModel.classCt.RESERVED;
        // if (_.has(RESERVED, attribute)) {
        //     throw new Error(`Can't use reserved attribute name '${attribute}'`);
        // }
        Object.defineProperty(parentModel, attribute, {
            get: () => {
                let attr = parentModel.get(attribute);
                return attr;
            },
            set: (value) => {
                parentModel.set(attribute, value);
            }
        });
        let configStore = {
            model: model,
            modelParent: parentModel,
        };

        for (let p in field) {
            if (excludeProps.indexOf(p) > -1) {
                continue;
            }
            configStore[p] = field[p];
        }

        let store = new Store(configStore);
        // debugger



        // Core.apply(store, field);




        parentModel.set(attribute, store);
    }


    applyCommit(store) {
        store.each((record) => {
            record.commit();
        });
    }

    applyReset(store) {
        store.each((record) => {
            record.reset();
        });

        //copiamos los records removidos para restaurarlos
        let removeRecords = store.removed.slice(0);

        //obtenemos los nuevos modelos para eliminarlos
        let newModels = store.getNewModels();

        //eliminamos los records
        store.remove(newModels);

        //limpiamos los records eliminados
        for (let x = 0; x < newModels.length; x++) {
            newModels[x].commit();
            Core.Array.remove(store.removed, newModels[x]);
        }

        //volvemos añadir los records que se habian eliminado
        store.add(removeRecords);

    }

    applyConfirm(store) {
        store.each((record) => {
            record.confirm();
        });
    }

    applyCancelChanges(store) {
        store.each((record) => {
            record.cancelChanges();
        });
        //copiamos los records removidos para restaurarlos
        let removeRecords = store.removed.slice(0);

        //obtenemos los nuevos modelos para eliminarlos
        let newModels = store.getNewModels();

        //eliminamos los records
        store.remove(newModels);

        //limpiamos los records eliminados
        for (let x = 0; x < newModels.length; x++) {
            newModels[x].commit();
            Core.Array.remove(store.removed, newModels[x]);
        }

        //volvemos añadir los records que se habian eliminado
        store.add(removeRecords);
    }

    applySet(store, value) {
        if (typeof value === 'object' && (value.C || value.U || value.D)) {
            // debugger
            let modelStore = store.model;
            let emptyRecord = new modelStore({
            });

            if(value.C){
                store.proxy.applyRemoteData(emptyRecord,[],value.C,store);
            }

            if(value.U){
                store.proxy.applyRemoteDataUpdated(emptyRecord,[],value.C,store);
            }

            // if(value.D){
            //     store.proxy.applyRemoteData(emptyRecord,[],value.C,store);
            // }
            // console.log(store);
        } else {
            let item;
            let modelStore = store.model;
            let emptyRecord = new modelStore({
            });
            // modelStore.clien
            let clientId = emptyRecord.clientIdProperty;
            // let clientId = store.getOption("clientId") || emptyRecord.clientIdProperty;
            let propertyId = emptyRecord.idProperty;


            for (let x = 0; x < value.length; x++) {
                item = value[x];
                if (item._isModel) {
                    store.add(item);
                } else {
                    if (item.hasOwnProperty(clientId)) {
                        let record = store.getById(item[clientId]);
                        if (record) {
                            record.set(propertyId, item[propertyId]);
                            for (let p in item) {
                                record.set(p, item[p]);
                            }
                        }
                    } else if (item.hasOwnProperty(propertyId)) {
                        let record = store.getById(item[propertyId]);
                        if (record) {
                            record.set(item);
                        } else {
                            store.add(item);
                        }
                    } else {
                        store.add(item);
                    }
                }
            }
        }


    }

    changed(store) {
        return store.needsSync();
    }
}

export default FStore;
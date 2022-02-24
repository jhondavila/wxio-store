# [wxio-store](https://github.com/jhondavila/wxio-store)

Examples for use store class, model and events.

## Others Components for react  
[**wx-table**](https://github.com/jhondavila/wxio-table)


## Others Class utility
[**wxio-common**](https://github.com/jhondavila/wxio-common)


<details>
  <summary><b>Expand to show Table of Contents</b></summary>

<!-- toc -->

- [wxio-store](#wxio-store)
  - [Others Components for react](#others-components-for-react)
  - [Others Class utility](#others-class-utility)
  - [Installation](#installation)
  - [Use basic for class Model](#use-basic-for-class-model)
  - [Types fields](#types-fields)
    - [Use Store](#use-store)
    - [Each / Map records from Store](#each--map-records-from-store)
    - [Agreggator functions Store](#agreggator-functions-store)
    - [up/down move record position in Store](#updown-move-record-position-in-store)
    - [Get records from Store](#get-records-from-store)
    - [Synchronize changes of Store](#synchronize-changes-of-store)
    - [Cancel changes in Store](#cancel-changes-in-store)
    - [Check needs sync Store](#check-needs-sync-store)
    - [Remove all records from Store](#remove-all-records-from-store)
    - [Remove record by id from Store](#remove-record-by-id-from-store)
    - [get index record from store](#get-index-record-from-store)

</details>

## Installation

With [npm](https://www.npmjs.org/package/):

```bash
$ git submodule add https://github.com/jhondavila/wxio-table.git ./src/components/table
```


## Use basic for class Model

Simple set values to model
```js
  import { createModel } from "wxio-store"

  let Model = createModel(); //create model
  let record = new Model();//instace model

  record.set("name","Benito");
  record.set("lastname","The Ball");
  record.set("age",12);
  record.set("sex","m");
```

Set multiple values to model
```js
  import { createModel } from "wxio-store"

  let Model = createModel(); //create model
  let record = new Model();//instace model

  record.set({
    name : "Benito",
    lastname : "The Ball",
    age : 12,
    sex:"m"
  });
```


Set nested values to model
```js
  import { createModel } from "wxio-store"

  let Model = createModel(); //create model
  let record = new Model();//instace model

  record.set({
    name : "Benito",
    lastname : "The Ball",
    age : 12,
    sex:"m",
    vehicle : {
      amount: 801,
      color: "turquoise",
      fuel: "Hybrid",
      model: "Challenger",
      type: "Passenger Van",
      vehicle: "Jaguar Challenger",
    }
  });
```


Set Array property value to model
```js
  import { createModel } from "wxio-store"

  let Model = createModel(); //create model
  let record = new Model();//instace model

  record.set({
    name : "Benito",
    lastname : "The Ball",
    age : 12,
    sex:"m",
    vehicles : [
      {
        amount: 801,
        color: "turquoise",
        fuel: "Hybrid",
        model: "Challenger",
        type: "Passenger Van",
        vehicle: "Jaguar Challenger",
      },
      {
        amount: "595.75"
        color: "tan"
        fuel: "Electric"
        model: "1"
        type: "Crew Cab Pickup"
        vehicle: "Porsche Alpine"
      }
    ]
  });
```

## Types fields

```js
  import { createModel } from "wxio-store"

  let Model = createModel({
      fields: {
          amount: "number",
          color: "string",
          fuel: "string",
          model: "integer",
          type: "string",
          vehicle: "string",
      },
      idProperty: "id" //default
  }); //create model
  let record = new Model();//instace model
```




| `type`      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| `"string"`  | Support for string value                                    |
| `"integer"` | Support for single integer value                            |
| `"number"`  | Support for number values with decimals                     |
| `"boolean"` | Support for boolean values true/false                       |
| `"date"`    | Support for date, return moment instance                    |
| `"time"`    | Support for time value in format HH:mm:ss, whitout timezone |
| `"array"`   | Support for simple array                                    |
| `"object"`  | Support for simple object                                   |
| `"model"`   | Support for Nested sub model type field                     |
| `"store"`   | Support for Nested sub store type field                     |
| `"file"`    | Support for send file, use with proxy type "form"           |





### Use Store

Simple use store
```js
  import { Store } from "wxio-store"

  let store = new Store();

  store.add({
    amount: "801.91"
    color: "turquoise"
    fuel: "Hybrid"
    model: "Challenger"
    type: "Passenger Van"
    vehicle: "Jaguar Challenger"
  });
  store.add({
    amount: "595.75"
    color: "tan"
    fuel: "Electric"
    model: "1"
    type: "Crew Cab Pickup"
    vehicle: "Porsche Alpine"
  });

```


Proxy type

| `type`      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| `"ajax"`  | sent data to server as the request URL parameters |
| `"form"` | sent data to server as the request body Only applicable for request methods 'PUT', 'POST', 'DELETE                            |
| `"localstorage"` | use localstorage from browser to save data                            |


Proxy mode

| `type`      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| `"batch"`  |send nested data to server with settings for each nested store |
| `"include"` | send data nested to server with store root |



Config store proxy (remote data)
```js
import { Store } from "wxio-store"

  
const storeQuestions = new Store({
    fields: {
        question: {
            type: "string"
        },
        order: {
            type: "number"
        },
        is_root: {
            type: "number"
        },
        swt_status: {
            type: "boolean"
        }
    },
    proxy: {
        type: "ajax",
        api: {
            read: "/read",
            create: "/create",
            update: "/update",
            destroy: "/destroy"
        }
    }
});

...
storeQuestions.add({...})
...

storeQuestions.sync();//return promise

```




Config store proxy nested
```js
import { Store } from "wxio-store"

  
const storeQuestions = new Store({
    fields: {
        question: {
            type: "string"
        },
        options: {
            type: "store",
            fields: {
                id: { //important define id field
                    type: "integer",
                    critical: true,
                    reference: {
                        parent: true
                    }
                },
                name: {
                    type: "text",
                },
                order: {
                    type: "number",
                    critical: true
                },
                swt_comment: {
                    type: "boolean"
                }
            },
            sorters: [
                {
                    property: "order",
                    direction: "ASC"
                }
            ],
            proxy: {
                type: "ajax",
                api: {
                    read: "/quest/option/read",
                    create: "/quest/option/create",
                    update: "/quest/option/update",
                    destroy: "/quest/option/destroy"
                }
            }
        },
        order: {
            type: "number"
        },
        swt_status: {
            type: "boolean"
        }
    },
    proxy: {
        mode: "batch",// (batch|include) <= Important config "mode" with nested store
        type: "ajax",
        api: {
            read: "/quest/read",
            create: "/quest/create",
            update: "/quest/update",
            destroy: "/quest/destroy"
        }
    }
});

...
storeQuestions.add([
  {
    question : "Question A.",
    options : [
      {name : "Answer A",order : 1},{name : "Answer B", order : 2},
    ],
    order  : 1
  },
  {
    question : "Question B.",
    options : [
      {name : "Answer A",order : 1},{name : "Answer B", order : 2},
    ],
    order  : 2
  }
])
...

storeQuestions.sync();//return promise

```



Add array to store
```js
  import { Store } from "wxio-store"

  let store = new Store();

  let records = [
    {
      amount: "801.91"
      color: "turquoise"
      fuel: "Hybrid"
      model: "Challenger"
      type: "Passenger Van"
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75"
      color: "tan"
      fuel: "Electric"
      model: "1"
      type: "Crew Cab Pickup"
      vehicle: "Porsche Alpine"
    }
  ];
  store.add(records);
```


Count items
```js
  import { Store } from "wxio-store"

  let store = new Store();

  let records = [
    {
      amount: "801.91"
      color: "turquoise"
      fuel: "Hybrid"
      model: "Challenger"
      type: "Passenger Van"
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75"
      color: "tan"
      fuel: "Electric"
      model: "1"
      type: "Crew Cab Pickup"
      vehicle: "Porsche Alpine"
    }
  ];
  store.count()// return 2;
```


### Each / Map records from Store

Each method
```js
  import { Store } from "wxio-store"

  let store = new Store({
      fields: {
          amount: "number",
          color: "string",
          fuel: "string",
          model: "integer",
          type: "string",
          vehicle: "string",
      },
  });

  store.each(record=>{
    console.log(record);
  })
  
```

Map method
```js
  import { Store } from "wxio-store"

  let store = new Store({
      fields: {
          amount: "number",
          color: "string",
          fuel: "string",
          model: "integer",
          type: "string",
          vehicle: "string",
      },
  });

  store.map(record=>{
    return record.getData();
  })
  
```

### Agreggator functions Store

```js
  import { Store } from "wxio-store"

  let store = new Store({});

  let property = "price";
  
  //Sum
  store.sumBy(property);
  
  //Avg
  store.avgBy(property);
  
  //Min
  store.minBy(property);
  
  //Max
  store.maxBy(property)
```

### up/down move record position in Store

```js
  import { Store } from "wxio-store"

  let store = new Store({});

  let records = [
    {
      amount: "801.91",
      order: 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      order: 2,
      vehicle: "Porsche Alpine"
    },
    {
      amount: "336.05",
      order: 3,
      vehicle: "Bentley Camry"
    }
  ];
  
  store.add(records);
  let firstRecord = store.getAt(0);

  console.log(store.getData());
  
  store.moveDown(firstRecord,"order");
  console.log(store.getData());

  store.moveUp(firstRecord,"order");
  console.log(store.getData());
  
```


### Get records from Store 

Method getAt - return a record based on store position
```js
  import { Store } from "wxio-store"

  let store = new Store({});
  store.add([
    {
      amount: "801.91",
      order: 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      order: 2,
      vehicle: "Porsche Alpine"
    },
  ]);
 
  let firstRecord = store.getAt(0);//first record
  let secondRecord = store.getAt(1);//second record
  
```

Method getById - return a record based "id"
```js
  import { Store } from "wxio-store"

  let store = new Store({});
  store.add([
    {
      amount: "801.91",
      id : 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      id: 2,
      vehicle: "Porsche Alpine"
    },
  ]);
 
  let record = store.getById(1);
```


### Synchronize changes of Store
```js
  import { Store } from "wxio-store"

  
  let store = new Store({});
  store.add([
    {
      amount: "801.91",
      order: 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      order: 2,
      vehicle: "Porsche Alpine"
    },
  ]);
 
  let firstRecord = store.getAt(0);//first record
  let secondRecord = store.getAt(1);//second record
  
  firstRecord.set("amount",1200);
  secondRecord.set("amount",2400);

  await store.sync();
```


### Cancel changes in Store

Cancel changes not sent to server / not commit
```js
  import { Store } from "wxio-store"

  let store = new Store({});
  store.add([
    {
      amount: "801.91",
      order: 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      order: 2,
      vehicle: "Porsche Alpine"
    },
  ]);
  
 
  let firstRecord = store.getAt(0);//first record
  let secondRecord = store.getAt(1);//second record
  
  firstRecord.set("amount",1200);
  secondRecord.set("amount",2400);

  store.cancelChanges();
  
```


### Check needs sync Store
```js
  import { Store } from "wxio-store"

  let store = new Store();
  store.needsSync();

```
```js
  import { Store } from "wxio-store"

  let store = new Store();
  store.changed();//return true/false

```


### Remove all records from Store
```js
  import { Store } from "wxio-store"

  let store = new Store();
  ...
  store.removeAll();
  store.count()//return 0;

```
### Remove record by id from Store
```js
  import { Store } from "wxio-store"

  let store = new Store();
  store.add([
    {
      amount: "801.91",
      id : 1,
      vehicle: "Jaguar Challenger"
    },
    {
      amount: "595.75",
      id: 2,
      vehicle: "Porsche Alpine"
    },
  ]);

  store.removeById(1);
  store.count()// return 1

```


### get index record from store

Method indexOf (record)
```js
  import { Store , createModel} from "wxio-store"

  let store = new Store();
  let recordJaguar =  new store.model({
      id : 1,
      amount: "801.91",
      vehicle: "Jaguar Challenger"
  });

  let recordPorsche =  new store.model({
      id: 2,
      amount: "595.75",
      vehicle: "Porsche Alpine"
  });
  
  store.add(recordJaguar);
  store.add(recordPorsche);

  store.indexOf(recordJaguar);//return 0
  store.indexOf(recordPorsche);//return 1

```


Method indexOfId (record)
```js
  import { Store , createModel} from "wxio-store"

  let store = new Store();
  let recordJaguar =  new store.model({
      id : 1,
      amount: "801.91",
      vehicle: "Jaguar Challenger"
  });

  let recordPorsche =  new store.model({
      id: 2,
      amount: "595.75",
      vehicle: "Porsche Alpine"
  });
  
  store.add(recordJaguar);
  store.add(recordPorsche);

  store.indexOfId(1); //return 0
  store.indexOfId(2); //return 1

```

import {Realm, createRealmContext} from '@realm/react';
import {Task} from './Task';
export class TaskAlias extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  task!: Task;

  static generate(task: Task) {
    return {
      _id: new Realm.BSON.ObjectId(),
      task,
    };
  }

  // To use a class as a Realm object type, define the object schema on the static property "schema".
  static schema = {
    name: 'TaskAlias',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      task: 'Task',
    },
  };
}

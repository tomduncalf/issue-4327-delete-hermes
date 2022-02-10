import React, {useCallback, useEffect, useMemo} from 'react';
import {SafeAreaView, View, StyleSheet} from 'react-native';

import TaskContext, {Task} from './app/models/Task';
import IntroText from './app/components/IntroText';
import AddTaskForm from './app/components/AddTaskForm';
import TaskList from './app/components/TaskList';
import colors from './app/styles/colors';
import {BSON} from 'realm';
import {TaskAlias} from './app/models/TaskAlias';

const {useRealm, useQuery, RealmProvider} = TaskContext;

function App() {
  const realm = useRealm();
  const result = useQuery(Task);

  const tasks = useMemo(() => result.sorted('createdAt'), [result]);

  useEffect(() => {
    realm.write(() => {
      realm.create<Task>(Task.schema.name, Task.generate('asd1'));
      realm.create<Task>(Task.schema.name, Task.generate('asd2'));
      realm.create<Task>(Task.schema.name, Task.generate('asd3'));
      realm.create<Task>(Task.schema.name, Task.generate('asd4'));

      console.log(realm.objects(Task.schema.name));
    });

    const thingsToBeRemoved = realm
      .objects<Task>(Task.schema.name)
      .filter(task => task.description === 'asd2');

    realm.write(() => {
      realm.delete(thingsToBeRemoved);
    });

    console.log(realm.objects(Task.schema.name));
  }, []);

  const handleAddTask = useCallback(
    (description: string): void => {
      if (!description) {
        return;
      }

      // Everything in the function passed to "realm.write" is a transaction and will
      // hence succeed or fail together. A transcation is the smallest unit of transfer
      // in Realm so we want to be mindful of how much we put into one single transaction
      // and split them up if appropriate (more commonly seen server side). Since clients
      // may occasionally be online during short time spans we want to increase the probability
      // of sync participants to successfully sync everything in the transaction, otherwise
      // no changes propagate and the transaction needs to start over when connectivity allows.
      realm.write(() => {
        realm.create('Task', Task.generate(description));
      });
    },
    [realm],
  );

  const handleToggleTaskStatus = useCallback(
    (task: Task): void => {
      realm.write(() => {
        // Normally when updating a record in a NoSQL or SQL database, we have to type
        // a statement that will later be interpreted and used as instructions for how
        // to update the record. But in RealmDB, the objects are "live" because they are
        // actually referencing the object's location in memory on the device (memory mapping).
        // So rather than typing a statement, we modify the object directly by changing
        // the property values. If the changes adhere to the schema, Realm will accept
        // this new version of the object and wherever this object is being referenced
        // locally will also see the changes "live".
        task.isComplete = !task.isComplete;
      });

      // Alternatively if passing the ID as the argument to handleToggleTaskStatus:
      // realm?.write(() => {
      //   const task = realm?.objectForPrimaryKey('Task', id); // If the ID is passed as an ObjectId
      //   const task = realm?.objectForPrimaryKey('Task', Realm.BSON.ObjectId(id));  // If the ID is passed as a string
      //   task.isComplete = !task.isComplete;
      // });
    },
    [realm],
  );

  const handleDeleteTask = useCallback(
    (task: Task): void => {
      realm.write(() => {
        realm.delete(task);

        // Alternatively if passing the ID as the argument to handleDeleteTask:
        // realm?.delete(realm?.objectForPrimaryKey('Task', id));
      });
    },
    [realm],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AddTaskForm onSubmit={handleAddTask} />
        {tasks.length === 0 ? (
          <IntroText />
        ) : (
          <TaskList
            tasks={tasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});

function AppWrapper() {
  if (!RealmProvider) {
    return null;
  }
  return (
    <RealmProvider>
      <App />
    </RealmProvider>
  );
}

export default AppWrapper;

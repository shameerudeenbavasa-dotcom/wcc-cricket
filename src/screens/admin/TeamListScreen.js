import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { T } from '../../theme';

export default function TeamListScreen({ navigation }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const deleteTeam = (id, name) => {
    Alert.alert('Delete Team', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'teams', id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🏏 TEAMS</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('TeamForm', {})}>
          <Text style={s.addBtnTxt}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No teams yet</Text>
            <Text style={s.emptyHint}>Tap "+ NEW" to create your first team</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('TeamDetail', { team: item })}>
            <View style={s.cardLeft}>
              <Text style={s.teamName}>{item.name}</Text>
              <Text style={s.playerCount}>{item.players?.length || 0} players</Text>
            </View>
            <View style={s.cardRight}>
              <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('TeamForm', { team: item })}>
                <Text style={s.editBtnTxt}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => deleteTeam(item.id, item.name)}>
                <Text style={s.delBtnTxt}>Del</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: T.gold, fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: T.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  card: { backgroundColor: T.card, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: T.border },
  cardLeft: {},
  teamName: { color: T.text, fontSize: 16, fontWeight: 'bold' },
  playerCount: { color: T.muted, fontSize: 13, marginTop: 2 },
  cardRight: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: T.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  delBtn: { backgroundColor: T.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  delBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyTxt: { color: T.text, fontSize: 18, fontWeight: 'bold' },
  emptyHint: { color: T.muted, fontSize: 14, marginTop: 8 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { T } from '../../theme';

export default function UserTeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  if (selected) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={{ color: T.gold }}>← Teams</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{selected.name.toUpperCase()}</Text>
          <View style={{ width: 60 }} />
        </View>
        <FlatList
          data={selected.players || []}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={s.emptyTxt}>No players listed</Text>}
          renderItem={({ item }) => (
            <View style={s.playerRow}>
              <View style={s.jersey}>
                <Text style={s.jerseyTxt}>#{item.jersey}</Text>
              </View>
              <Text style={s.playerName}>{item.name}</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🏏 TEAMS</Text>
      </View>
      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🏏</Text>
            <Text style={s.emptyTxt}>No teams registered yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
            <View>
              <Text style={s.teamName}>{item.name}</Text>
              <Text style={s.playerCount}>{item.players?.length || 0} players</Text>
            </View>
            <Text style={{ color: T.gold, fontSize: 20 }}>›</Text>
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
  card: { backgroundColor: T.card, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: T.border },
  teamName: { color: T.text, fontSize: 16, fontWeight: 'bold' },
  playerCount: { color: T.muted, fontSize: 13, marginTop: 2 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: T.border },
  jersey: { backgroundColor: T.green, width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  jerseyTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  playerName: { color: T.text, fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { color: T.muted, fontSize: 16 },
});

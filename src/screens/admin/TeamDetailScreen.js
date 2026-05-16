import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { T } from '../../theme';

export default function TeamDetailScreen({ route, navigation }) {
  const { team } = route.params;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: T.gold }}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{team.name.toUpperCase()}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={s.statRow}>
        <View style={s.stat}>
          <Text style={s.statNum}>{team.players?.length || 0}</Text>
          <Text style={s.statLabel}>PLAYERS</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>SQUAD</Text>
      <FlatList
        data={team.players || []}
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: T.gold, fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 16 },
  stat: { alignItems: 'center', padding: 16 },
  statNum: { color: T.gold, fontSize: 36, fontWeight: 'bold' },
  statLabel: { color: T.muted, fontSize: 11, letterSpacing: 1 },
  sectionLabel: { color: T.muted, fontSize: 11, letterSpacing: 1, paddingHorizontal: 20, marginBottom: 4 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: T.border },
  jersey: { backgroundColor: T.green, width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  jerseyTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  playerName: { color: T.text, fontSize: 16 },
  emptyTxt: { color: T.muted, textAlign: 'center', padding: 32 },
});

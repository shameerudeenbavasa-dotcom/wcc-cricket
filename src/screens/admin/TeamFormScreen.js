import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../../App';
import { T } from '../../theme';

export default function TeamFormScreen({ route, navigation }) {
  const { user } = useUser();
  const existing = route.params?.team;

  const [teamName, setTeamName] = useState(existing?.name || '');
  const [players, setPlayers] = useState(existing?.players || []);
  const [pName, setPName] = useState('');
  const [jersey, setJersey] = useState('');
  const [busy, setBusy] = useState(false);

  const addPlayer = () => {
    if (!pName.trim()) return;
    const num = jersey ? parseInt(jersey) : players.length + 1;
    setPlayers([...players, { name: pName.trim(), jersey: num }]);
    setPName('');
    setJersey('');
  };

  const removePlayer = (idx) => setPlayers(players.filter((_, i) => i !== idx));

  const saveTeam = async () => {
    if (!teamName.trim()) return Alert.alert('Error', 'Enter a team name');
    if (players.length === 0) return Alert.alert('Error', 'Add at least one player');
    setBusy(true);
    try {
      if (existing) {
        await setDoc(doc(db, 'teams', existing.id), {
          name: teamName.trim(), players, updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'teams'), {
          name: teamName.trim(), players,
          createdBy: user.uid, createdAt: serverTimestamp(),
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: T.gold }}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{existing ? 'EDIT TEAM' : 'NEW TEAM'}</Text>
          <TouchableOpacity onPress={saveTeam} disabled={busy}>
            <Text style={[{ color: T.gold, fontWeight: 'bold' }, busy && { opacity: 0.5 }]}>
              {busy ? 'Saving...' : 'SAVE'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={s.label}>TEAM NAME</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. WCC Warriors"
            placeholderTextColor={T.muted}
            value={teamName}
            onChangeText={setTeamName}
          />

          <Text style={s.label}>ADD PLAYER</Text>
          <View style={s.playerInputRow}>
            <TextInput
              style={[s.input, { flex: 2, marginBottom: 0 }]}
              placeholder="Player Name"
              placeholderTextColor={T.muted}
              value={pName}
              onChangeText={setPName}
            />
            <TextInput
              style={[s.input, { flex: 1, marginLeft: 8, marginBottom: 0 }]}
              placeholder="# Jersey"
              placeholderTextColor={T.muted}
              value={jersey}
              onChangeText={setJersey}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={s.addBtn} onPress={addPlayer}>
              <Text style={s.addBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.label, { marginTop: 20 }]}>SQUAD ({players.length})</Text>
          {players.map((p, i) => (
            <View key={i} style={s.playerCard}>
              <View style={s.jerseyBadge}>
                <Text style={s.jerseyNum}>#{p.jersey}</Text>
              </View>
              <Text style={s.playerName}>{p.name}</Text>
              <TouchableOpacity onPress={() => removePlayer(i)}>
                <Text style={{ color: T.red, fontSize: 22, lineHeight: 26 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {players.length === 0 && (
            <Text style={s.emptyTxt}>No players added yet</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: T.gold, fontSize: 16, fontWeight: 'bold' },
  label: { color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: T.card, color: T.text, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: T.border, fontSize: 15 },
  playerInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: T.gold, width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  addBtnTxt: { color: '#000', fontSize: 24, fontWeight: 'bold' },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  jerseyBadge: { backgroundColor: T.green, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  jerseyNum: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  playerName: { flex: 1, color: T.text, fontSize: 15 },
  emptyTxt: { color: T.muted, textAlign: 'center', marginTop: 24 },
});

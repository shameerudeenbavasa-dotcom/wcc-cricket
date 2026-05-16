import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, TextInput, Modal,
} from 'react-native';
import {
  doc, setDoc, onSnapshot, serverTimestamp, collection, addDoc, getDocs, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { T } from '../../theme';

const MATCH_DOC = 'current';

const defaultInnings = () => ({ runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, name: '' });

const defaultMatch = () => ({
  innings1: defaultInnings(),
  innings2: defaultInnings(),
  currentInnings: 1,
  status: 'setup',
  ballLog: [],
  updatedAt: null,
});

export default function AdminScoringScreen() {
  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'matches', MATCH_DOC), (snap) => {
      setMatch(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getDocs(collection(db, 'teams')).then((snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const inning = match ? (match.currentInnings === 1 ? match.innings1 : match.innings2) : null;

  const updateScore = async (event) => {
    if (!match || match.status !== 'live') return;
    const curr = match.currentInnings === 1 ? match.innings1 : match.innings2;
    let { runs, wickets, overs, balls, extras } = curr;
    let label = '';

    if (event === 'W') { wickets += 1; label = 'W'; }
    else if (event === 'wd') { runs += 1; extras += 1; label = 'Wd'; }
    else if (event === 'nb') { runs += 1; extras += 1; label = 'NB'; }
    else if (event === 'bye') { extras += 1; label = 'B'; }
    else { runs += event; label = event === 0 ? '·' : String(event); }

    // Advance ball count (wides/no-balls don't count as a ball)
    let newBalls = balls;
    let newOvers = overs;
    if (!['wd', 'nb'].includes(event)) {
      newBalls = balls + 1;
      if (newBalls >= 6) { newOvers = overs + 1; newBalls = 0; }
    }

    const updatedInning = { ...curr, runs, wickets, overs: newOvers, balls: newBalls, extras };
    const inningsKey = match.currentInnings === 1 ? 'innings1' : 'innings2';
    const ballLog = [...(match.ballLog || []), { label, over: overs, ball: balls + 1 }].slice(-36);

    const autoEnd = wickets >= 10 || (newOvers >= 20 && newBalls === 0);
    const newStatus = autoEnd ? 'innings_end' : 'live';

    await setDoc(doc(db, 'matches', MATCH_DOC), {
      ...match,
      [inningsKey]: updatedInning,
      ballLog,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    if (autoEnd && match.currentInnings === 1) {
      Alert.alert('Innings Over', '1st innings complete. Start 2nd innings?', [
        { text: 'Yes', onPress: startSecondInnings },
        { text: 'Later', style: 'cancel' },
      ]);
    }
  };

  const startSecondInnings = async () => {
    await setDoc(doc(db, 'matches', MATCH_DOC), {
      ...match,
      currentInnings: 2,
      innings2: { ...defaultInnings(), name: match.innings2.name },
      status: 'live',
      ballLog: [],
      updatedAt: serverTimestamp(),
    });
  };

  const startMatch = async () => {
    if (!team1Name.trim() || !team2Name.trim()) return Alert.alert('Error', 'Enter both team names');
    await setDoc(doc(db, 'matches', MATCH_DOC), {
      innings1: { ...defaultInnings(), name: team1Name.trim() },
      innings2: { ...defaultInnings(), name: team2Name.trim() },
      currentInnings: 1,
      status: 'live',
      ballLog: [],
      updatedAt: serverTimestamp(),
    });
    setShowSetup(false);
  };

  const endMatch = () => {
    Alert.alert('End Match', 'Mark this match as complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          await setDoc(doc(db, 'matches', MATCH_DOC), {
            ...match,
            status: 'complete',
            endedAt: serverTimestamp(),
          });
        },
      },
    ]);
  };

  const ballColor = (label) => {
    if (label === 'W') return T.red;
    if (label === 'Wd' || label === 'NB') return T.blue;
    if (label === '4' || label === '6') return T.gold;
    return T.border;
  };

  const oversStr = (o, b) => `${o}.${b}`;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        <View style={s.header}>
          <Text style={s.headerTitle}>🏏 SCORING</Text>
          {match?.status === 'live' && (
            <TouchableOpacity onPress={endMatch}>
              <Text style={{ color: T.red, fontSize: 13 }}>End Match</Text>
            </TouchableOpacity>
          )}
        </View>

        {!match || match.status === 'complete' ? (
          <View style={s.setupBox}>
            {match?.status === 'complete' && (
              <View style={s.resultCard}>
                <Text style={s.resultTitle}>MATCH RESULT</Text>
                <Text style={s.resultScore}>{match.innings1.name}: {match.innings1.runs}/{match.innings1.wickets} ({oversStr(match.innings1.overs, match.innings1.balls)} ov)</Text>
                <Text style={s.resultScore}>{match.innings2.name}: {match.innings2.runs}/{match.innings2.wickets} ({oversStr(match.innings2.overs, match.innings2.balls)} ov)</Text>
              </View>
            )}
            <TouchableOpacity style={s.startBtn} onPress={() => setShowSetup(true)}>
              <Text style={s.startBtnTxt}>+ NEW MATCH</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Score Display */}
            <View style={s.scoreCard}>
              <Text style={s.inningsLabel}>
                {match.currentInnings === 1 ? '1ST INNINGS' : '2ND INNINGS'} — {inning.name?.toUpperCase()}
              </Text>
              <Text style={s.bigScore}>{inning.runs}/{inning.wickets}</Text>
              <Text style={s.overs}>Overs: {oversStr(inning.overs, inning.balls)}  •  Extras: {inning.extras}</Text>

              {match.currentInnings === 2 && (
                <View style={s.targetRow}>
                  <Text style={s.targetTxt}>
                    Target: {match.innings1.runs + 1}  |  Need: {match.innings1.runs + 1 - inning.runs} in {(20 - inning.overs) * 6 - inning.balls} balls
                  </Text>
                </View>
              )}
            </View>

            {/* Ball Log */}
            {match.ballLog?.length > 0 && (
              <View style={s.ballLogRow}>
                {match.ballLog.slice(-12).map((b, i) => (
                  <View key={i} style={[s.ballChip, { backgroundColor: ballColor(b.label) }]}>
                    <Text style={s.ballLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Scoring Buttons */}
            <View style={s.scorePanel}>
              <Text style={s.panelLabel}>RUNS</Text>
              <View style={s.btnRow}>
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <TouchableOpacity key={r} style={s.scoreBtn} onPress={() => updateScore(r)}>
                    <Text style={s.scoreBtnTxt}>{r === 0 ? '·' : `+${r}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.panelLabel, { marginTop: 16 }]}>EVENTS</Text>
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.scoreBtn, s.wicketBtn]} onPress={() => updateScore('W')}>
                  <Text style={[s.scoreBtnTxt, { color: '#fff' }]}>WICKET</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.scoreBtn, s.extraBtn]} onPress={() => updateScore('wd')}>
                  <Text style={s.scoreBtnTxt}>WIDE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.scoreBtn, s.extraBtn]} onPress={() => updateScore('nb')}>
                  <Text style={s.scoreBtnTxt}>NO BALL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.scoreBtn, s.extraBtn]} onPress={() => updateScore('bye')}>
                  <Text style={s.scoreBtnTxt}>BYE</Text>
                </TouchableOpacity>
              </View>

              {match.currentInnings === 1 && match.status === 'innings_end' && (
                <TouchableOpacity style={s.startBtn} onPress={startSecondInnings}>
                  <Text style={s.startBtnTxt}>START 2ND INNINGS</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Setup Modal */}
      <Modal visible={showSetup} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>NEW MATCH SETUP</Text>
            <Text style={s.inputLabel}>Batting Team (1st Innings)</Text>
            <TextInput style={s.input} placeholder="Team 1 Name" placeholderTextColor={T.muted} value={team1Name} onChangeText={setTeam1Name} />
            <Text style={s.inputLabel}>Fielding Team (2nd Innings)</Text>
            <TextInput style={s.input} placeholder="Team 2 Name" placeholderTextColor={T.muted} value={team2Name} onChangeText={setTeam2Name} />
            <TouchableOpacity style={s.startBtn} onPress={startMatch}>
              <Text style={s.startBtnTxt}>START MATCH</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSetup(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: T.muted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: T.gold, fontSize: 18, fontWeight: 'bold' },
  setupBox: { padding: 20, alignItems: 'center' },
  startBtn: { backgroundColor: T.gold, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16, width: '100%' },
  startBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  scoreCard: { backgroundColor: T.card, margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  inningsLabel: { color: T.muted, fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  bigScore: { color: T.gold, fontSize: 60, fontWeight: 'bold' },
  overs: { color: T.muted, fontSize: 14, marginTop: 4 },
  targetRow: { marginTop: 10, backgroundColor: T.dark, padding: 8, borderRadius: 8, width: '100%' },
  targetTxt: { color: T.text, fontSize: 13, textAlign: 'center' },
  ballLogRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  ballChip: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },
  ballLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scorePanel: { backgroundColor: T.card, margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border },
  panelLabel: { color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scoreBtn: { backgroundColor: T.surface, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border, minWidth: 64 },
  wicketBtn: { backgroundColor: T.red },
  extraBtn: { backgroundColor: T.dark },
  scoreBtnTxt: { color: T.text, fontWeight: 'bold', fontSize: 14 },
  resultCard: { backgroundColor: T.card, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: T.border },
  resultTitle: { color: T.gold, fontWeight: 'bold', fontSize: 13, letterSpacing: 1, marginBottom: 8 },
  resultScore: { color: T.text, fontSize: 14, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: T.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: T.border },
  modalTitle: { color: T.gold, fontWeight: 'bold', fontSize: 16, letterSpacing: 1, marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: T.muted, fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: T.dark, color: T.text, padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: T.border, fontSize: 15 },
});

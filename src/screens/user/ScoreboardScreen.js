import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { T } from '../../theme';

export default function ScoreboardScreen() {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'matches', 'current'), (snap) => {
      setMatch(snap.exists() ? snap.data() : null);
    });
  }, []);

  if (!match) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.headerTitle}>🏆 SCOREBOARD</Text></View>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🏏</Text>
          <Text style={s.emptyTxt}>No match in progress</Text>
          <Text style={s.emptyHint}>Live scores will appear here during a match</Text>
        </View>
      </SafeAreaView>
    );
  }

  const i1 = match.innings1;
  const i2 = match.innings2;
  const isLive = match.status === 'live';

  const rr = (inn) => {
    const balls = inn.overs * 6 + inn.balls;
    return balls > 0 ? (inn.runs / balls * 6).toFixed(2) : '0.00';
  };

  const ballColor = (label) => {
    if (label === 'W') return T.red;
    if (label === 'Wd' || label === 'NB') return T.blue;
    if (label === '4' || label === '6') return T.gold;
    return T.border;
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        <View style={s.header}>
          <Text style={s.headerTitle}>🏆 SCOREBOARD</Text>
          {isLive && (
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={[s.inningsCard, match.currentInnings === 1 && isLive && s.activeCard]}>
          <View style={s.inningsHeader}>
            <Text style={s.inningsTeam}>{i1.name || '—'}</Text>
            <Text style={s.inningsLabel}>1ST INNINGS</Text>
          </View>
          <Text style={s.score}>{i1.runs}/{i1.wickets}</Text>
          <View style={s.statsRow}>
            <Text style={s.statTxt}>Overs: {i1.overs}.{i1.balls}</Text>
            <Text style={s.statTxt}>RR: {rr(i1)}</Text>
            <Text style={s.statTxt}>Extras: {i1.extras || 0}</Text>
          </View>
        </View>

        {(match.currentInnings === 2 || match.status === 'complete') && (
          <View style={[s.inningsCard, match.currentInnings === 2 && isLive && s.activeCard]}>
            <View style={s.inningsHeader}>
              <Text style={s.inningsTeam}>{i2.name || '—'}</Text>
              <Text style={s.inningsLabel}>2ND INNINGS</Text>
            </View>
            <Text style={s.score}>{i2.runs}/{i2.wickets}</Text>
            <View style={s.statsRow}>
              <Text style={s.statTxt}>Overs: {i2.overs}.{i2.balls}</Text>
              <Text style={s.statTxt}>RR: {rr(i2)}</Text>
              {isLive && match.currentInnings === 2 && (
                <Text style={[s.statTxt, { color: T.gold }]}>
                  Need: {Math.max(0, i1.runs + 1 - i2.runs)}
                </Text>
              )}
            </View>
          </View>
        )}

        {match.ballLog?.length > 0 && (
          <View style={s.ballSection}>
            <Text style={s.sectionLabel}>RECENT BALLS</Text>
            <View style={s.ballRow}>
              {match.ballLog.slice(-12).map((b, i) => (
                <View key={i} style={[s.ball, { backgroundColor: ballColor(b.label) }]}>
                  <Text style={s.ballTxt}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {match.status === 'complete' && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>MATCH COMPLETE</Text>
            {i1.runs > i2.runs ? (
              <Text style={s.resultTxt}>{i1.name} wins by {i1.runs - i2.runs} runs</Text>
            ) : i2.runs > i1.runs ? (
              <Text style={s.resultTxt}>{i2.name} wins by {10 - i2.wickets} wickets</Text>
            ) : (
              <Text style={s.resultTxt}>Match Tied!</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: T.gold, fontSize: 18, fontWeight: 'bold' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 5 },
  liveTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  inningsCard: { backgroundColor: T.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: T.border },
  activeCard: { borderColor: T.gold },
  inningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inningsTeam: { color: T.text, fontSize: 18, fontWeight: 'bold' },
  inningsLabel: { color: T.muted, fontSize: 11, letterSpacing: 1 },
  score: { color: T.gold, fontSize: 48, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  statTxt: { color: T.muted, fontSize: 13 },
  ballSection: { marginHorizontal: 16, marginBottom: 12 },
  sectionLabel: { color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  ballRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ball: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },
  ballTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  resultCard: { backgroundColor: T.green, margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  resultTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1, marginBottom: 8 },
  resultTxt: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyTxt: { color: T.text, fontSize: 18, fontWeight: 'bold' },
  emptyHint: { color: T.muted, fontSize: 14, marginTop: 8, textAlign: 'center' },
});

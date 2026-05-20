import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { createAgoraRtcEngine, ClientRoleType, RtcSurfaceView } from 'react-native-agora';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { T } from '../../theme';

const AGORA_APP_ID = '0a8aa809dae045879483cf52c67b5268';

export default function WatchScreen() {
  const [streamInfo, setStreamInfo] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [joined, setJoined] = useState(false);
  const [score, setScore] = useState(null);
  const engine = useRef(null);

  useEffect(() => {
    const unsubStream = onSnapshot(doc(db, 'stream', 'current'), (snap) => {
      const data = snap.exists() ? snap.data() : null;
      setStreamInfo(data);
      if (!data?.isLive) leaveChannel();
    });
    const unsubMatch = onSnapshot(doc(db, 'matches', 'current'), (snap) => {
      setScore(snap.exists() ? snap.data() : null);
    });
    return () => {
      unsubStream();
      unsubMatch();
      leaveChannel();
    };
  }, []);

  useEffect(() => {
    if (streamInfo?.isLive && !joined) joinChannel(streamInfo.channel);
  }, [streamInfo, joined]);

  const joinChannel = async (channel) => {
    try {
      const eng = createAgoraRtcEngine();
      eng.initialize({ appId: AGORA_APP_ID });
      eng.enableVideo();
      eng.addListener('onUserPublished', (uid) => setRemoteUid(uid));
      eng.addListener('onUserOffline', () => setRemoteUid(null));
      await eng.joinChannel(null, channel, 0, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
      });
      engine.current = eng;
      setJoined(true);
    } catch (e) {
      console.log('Watch join error:', e.message);
    }
  };

  const leaveChannel = async () => {
    if (engine.current) {
      await engine.current.leaveChannel();
      engine.current.release();
      engine.current = null;
    }
    setJoined(false);
    setRemoteUid(null);
  };

  const isLive = streamInfo?.isLive;
  const innings = score ? (score.currentInnings === 1 ? score.innings1 : score.innings2) : null;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📺 WATCH LIVE</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{ color: T.muted, fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={s.videoBox}>
        {isLive && remoteUid ? (
          <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: remoteUid }} />
        ) : (
          <View style={s.offlineBox}>
            <Text style={s.waitIcon}>{isLive ? '⏳' : '📡'}</Text>
            <Text style={s.offlineTxt}>
              {isLive ? 'Connecting to stream...' : 'No live stream'}
            </Text>
            {!isLive && (
              <Text style={s.offlineHint}>The admin will go live during the match</Text>
            )}
          </View>
        )}
        {isLive && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {innings && score?.status === 'live' && (
        <View style={s.scoreBar}>
          <Text style={s.scoreTeam}>{innings.name}</Text>
          <Text style={s.scoreBig}>{innings.runs}/{innings.wickets}</Text>
          <Text style={s.scoreOvers}>{innings.overs}.{innings.balls} ov</Text>
          {score.currentInnings === 2 && (
            <Text style={s.target}>Need {Math.max(0, score.innings1.runs + 1 - innings.runs)}</Text>
          )}
        </View>
      )}

      {!isLive && (
        <View style={s.noticeCard}>
          <Text style={s.noticeTxt}>
            Stream will appear here when the match admin goes live.
          </Text>
          <Text style={s.noticeHint}>Live scores are available on the Scoreboard tab.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { color: T.gold, fontSize: 18, fontWeight: 'bold' },
  videoBox: { height: 260, backgroundColor: '#000', margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  offlineBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitIcon: { fontSize: 40, marginBottom: 12 },
  offlineTxt: { color: T.text, fontSize: 16, fontWeight: '600' },
  offlineHint: { color: T.muted, fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
  liveBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.red, marginRight: 6 },
  liveTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  scoreBar: { backgroundColor: T.card, marginHorizontal: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreTeam: { color: T.muted, fontSize: 13, flex: 1 },
  scoreBig: { color: T.gold, fontSize: 28, fontWeight: 'bold' },
  scoreOvers: { color: T.muted, fontSize: 13 },
  target: { color: T.text, fontSize: 13, fontWeight: '600', backgroundColor: T.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  noticeCard: { backgroundColor: T.card, margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  noticeTxt: { color: T.text, fontSize: 14, marginBottom: 6 },
  noticeHint: { color: T.muted, fontSize: 13 },
});

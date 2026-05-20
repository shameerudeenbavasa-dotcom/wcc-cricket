import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView,
} from 'react-native';
import {
  createAgoraRtcEngine, ClientRoleType, RtcSurfaceView,
} from 'react-native-agora';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../../App';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { T } from '../../theme';

const AGORA_APP_ID = '0a8aa809dae045879483cf52c67b5268';
const CHANNEL = 'wcc-match-live';
const STREAM_DOC = 'current';

export default function AdminLiveScreen() {
  const { user } = useUser();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const engine = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'stream', STREAM_DOC), (snap) => {
      if (snap.exists()) setViewerCount(snap.data().viewers || 0);
    });
    return unsub;
  }, []);

  const startStream = async () => {
    try {
      const eng = createAgoraRtcEngine();
      eng.initialize({ appId: AGORA_APP_ID });
      eng.enableVideo();
      eng.startPreview();
      await eng.joinChannel(null, CHANNEL, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      engine.current = eng;

      await setDoc(doc(db, 'stream', STREAM_DOC), {
        isLive: true,
        channel: CHANNEL,
        adminUid: user.uid,
        startedAt: serverTimestamp(),
        viewers: 0,
      });
      setIsLive(true);
    } catch (e) {
      Alert.alert('Stream Error', e.message);
    }
  };

  const stopStream = async () => {
    await engine.current?.leaveChannel();
    engine.current = null;
    await setDoc(doc(db, 'stream', STREAM_DOC), {
      isLive: false,
      channel: CHANNEL,
      endedAt: serverTimestamp(),
      viewers: 0,
    });
    setIsLive(false);
  };

  const toggleStream = () => {
    if (isLive) {
      Alert.alert('Stop Stream', 'Are you sure you want to end the live stream?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: stopStream },
      ]);
    } else {
      startStream();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔴 LIVE STREAM</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{ color: T.muted, fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={s.camera}>
        {isLive ? (
          <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: 0 }} />
        ) : (
          <View style={s.offlineBox}>
            <Text style={s.offlineIcon}>📷</Text>
            <Text style={s.offlineTxt}>Camera offline</Text>
            <Text style={s.offlineHint}>Tap GO LIVE to start broadcasting</Text>
          </View>
        )}

        {isLive && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveTxt}>LIVE</Text>
            {viewerCount > 0 && <Text style={s.viewerTxt}>{viewerCount} watching</Text>}
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.streamBtn, isLive ? s.stopBtn : s.goBtn]} onPress={toggleStream}>
        <Text style={s.streamBtnTxt}>{isLive ? '⏹  STOP STREAM' : '▶  GO LIVE'}</Text>
      </TouchableOpacity>

      <View style={s.infoCard}>
        <Text style={s.infoLabel}>CHANNEL</Text>
        <Text style={s.infoValue}>{CHANNEL}</Text>
        <Text style={[s.infoLabel, { marginTop: 10 }]}>STATUS</Text>
        <Text style={[s.infoValue, { color: isLive ? '#4CAF50' : T.muted }]}>
          {isLive ? 'Broadcasting to viewers' : 'Not streaming'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { color: T.gold, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  camera: { height: 280, backgroundColor: '#000', margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  offlineBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineIcon: { fontSize: 40, marginBottom: 10 },
  offlineTxt: { color: T.text, fontSize: 16, fontWeight: '600' },
  offlineHint: { color: T.muted, fontSize: 13, marginTop: 6 },
  liveBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.red, marginRight: 6 },
  liveTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  viewerTxt: { color: T.muted, fontSize: 12, marginLeft: 8 },
  streamBtn: { marginHorizontal: 16, padding: 18, borderRadius: 14, alignItems: 'center' },
  goBtn: { backgroundColor: T.green },
  stopBtn: { backgroundColor: T.red },
  streamBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  infoCard: { backgroundColor: T.card, margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  infoLabel: { color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: T.text, fontSize: 15, fontWeight: '600' },
});

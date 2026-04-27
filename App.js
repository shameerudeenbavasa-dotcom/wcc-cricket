import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  gold: '#D4A017', goldLight: '#F5C842', goldDark: '#A07810',
  green: '#1B5E20', greenLight: '#2E7D32',
  dark: '#080C08', card: '#0E140E', card2: '#141C14',
  border: '#1E2E1E', text: '#F0EAD6', muted: '#7A8C6A',
  red: '#C62828',
};

// ─── AGORA CONFIG ─────────────────────────────────────────────────────────────
const AGORA_APP_ID  = '0a8aa809dae045879483cf52c67b5268';
const AGORA_CHANNEL = 'wcc-match-live';
const AGORA_TOKEN   = null;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TEAMS = {
  home: { name: 'Weekend Cricket Club', short: 'WCC', color: T.gold },
  away: { name: 'City Smashers',        short: 'CSM', color: '#4FC3F7' },
};

const BALL_EVENTS = [
  { type: 'run1',   label: '1',  color: '#60A5FA' },
  { type: 'run2',   label: '2',  color: '#60A5FA' },
  { type: 'four',   label: '4',  color: '#22C55E' },
  { type: 'six',    label: '6',  color: '#F5C842' },
  { type: 'dot',    label: '•',  color: '#7A8C6A' },
  { type: 'wicket', label: 'W',  color: '#C62828' },
  { type: 'wide',   label: 'Wd', color: '#A78BFA' },
];

const COMMENTARY = [
  'FOUR! Cracking cut shot through point!',
  'Dot. Tight line, great discipline.',
  'SIX! Over long-on! Clears the boundary!',
  'OUT! Caught at mid-wicket.',
  'Wide! Down the leg side.',
  'Single taken. Pushed to mid-off.',
  'No ball! Free hit next ball!',
  'FOUR! Edge flies past gully!',
  'Two runs! Good running!',
  'Yorker! Full and straight.',
];

// ─── SHARED AGORA ENGINE ──────────────────────────────────────────────────────
let agoraEngine = null;
function getEngine() {
  if (!agoraEngine) {
    agoraEngine = createAgoraRtcEngine();
    agoraEngine.initialize({
      appId: AGORA_APP_ID,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
  }
  return agoraEngine;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role,  setRole]  = useState(null);
  const [pin,   setPin]   = useState('');
  const [name,  setName]  = useState('');
  const [error, setError] = useState('');

  function handleAdmin() {
    if (pin === '1234') onLogin('admin');
    else setError('Wrong PIN. Try 1234');
  }

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: T.dark }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.loginScroll}>
        <View style={s.logoWrap}>
          <View style={s.logoBadge}>
            <Text style={s.logoEmoji}>🏏</Text>
          </View>
          <Text style={s.logoTitle}>WCC</Text>
          <Text style={s.logoSub}>WEEKEND CRICKET CLUB</Text>
        </View>

        <View style={s.authWrap}>
          {!role && (
            <>
              <Text style={s.sectionLbl}>SELECT YOUR ROLE</Text>
              {[
                { r: 'admin',  icon: '🎬', label: 'Admin / Streamer', sub: 'Broadcast the live match' },
                { r: 'viewer', icon: '👁',  label: 'Viewer',           sub: 'Watch the live match'     },
              ].map(({ r, icon, label, sub }) => (
                <TouchableOpacity key={r} style={s.roleBtn} onPress={() => setRole(r)}>
                  <Text style={s.roleIcon}>{icon}</Text>
                  <View>
                    <Text style={s.roleLbl}>{label}</Text>
                    <Text style={s.roleSub}>{sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {role === 'admin' && (
            <>
              <Text style={s.sectionLbl}>ADMIN PIN</Text>
              <TextInput
                style={[s.input, error && { borderColor: T.red }]}
                placeholder="Enter PIN" placeholderTextColor={T.muted}
                secureTextEntry value={pin}
                onChangeText={t => { setPin(t); setError(''); }}
                keyboardType="number-pad"
              />
              {!!error && <Text style={s.errorTxt}>{error}</Text>}
              <TouchableOpacity style={s.goldBtn} onPress={handleAdmin}>
                <Text style={s.goldBtnTxt}>ENTER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={() => { setRole(null); setPin(''); setError(''); }}>
                <Text style={s.ghostBtnTxt}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

          {role === 'viewer' && (
            <>
              <Text style={s.sectionLbl}>YOUR NAME</Text>
              <TextInput
                style={s.input} placeholder="Enter your name"
                placeholderTextColor={T.muted} value={name}
                onChangeText={setName}
              />
              <TouchableOpacity style={s.greenBtn} onPress={() => onLogin('viewer')}>
                <Text style={s.greenBtnTxt}>WATCH LIVE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={() => setRole(null)}>
                <Text style={s.ghostBtnTxt}>← Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({ onLogout, score, setScore, thisOver, setThisOver, addCommentary }) {
  const [isLive, setIsLive] = useState(false);
  const [tab,    setTab]    = useState('score');
  const engineRef           = useRef(null);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        agoraEngine = null;
      }
    };
  }, []);

  async function goLive() {
    try {
      const engine = getEngine();
      engineRef.current = engine;
      engine.registerEventHandler({
        onError: (err) => { Alert.alert('Stream Error', `${err}`); setIsLive(false); },
      });
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableVideo();
      engine.startPreview();
      await engine.joinChannel(AGORA_TOKEN, AGORA_CHANNEL, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      setIsLive(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not start stream');
    }
  }

  async function stopLive() {
    try {
      if (engineRef.current) {
        engineRef.current.stopPreview();
        await engineRef.current.leaveChannel();
      }
    } catch (e) {}
    setIsLive(false);
  }

  function addBall(ev) {
    const { type, label, color } = ev;
    setThisOver(prev => [...prev.slice(-5), { label, color }]);
    addCommentary(COMMENTARY[Math.floor(Math.random() * COMMENTARY.length)]);
    setScore(s => {
      const runs =
        type === 'four'   ? s.runs + 4 :
        type === 'six'    ? s.runs + 6 :
        type === 'run1'   ? s.runs + 1 :
        type === 'run2'   ? s.runs + 2 :
        type === 'wide'   ? s.runs + 1 : s.runs;
      const wickets = type === 'wicket' ? Math.min(s.wickets + 1, 10) : s.wickets;
      const b = type === 'wide' ? s.ballsThisOver : (s.ballsThisOver + 1) % 6;
      const overs = type === 'wide' ? s.overs
        : s.ballsThisOver === 5
          ? parseFloat((Math.floor(s.overs) + 1).toFixed(1))
          : parseFloat((Math.floor(s.overs) + (s.ballsThisOver + 1) / 10).toFixed(1));
      return { ...s, runs, wickets, overs, ballsThisOver: b };
    });
  }

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: T.dark }]}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerL}>
          <Text style={s.headerEmoji}>🏏</Text>
          <View>
            <Text style={s.headerTitle}>WCC ADMIN</Text>
            <Text style={s.headerSub}>Match Control</Text>
          </View>
        </View>
        <View style={s.headerR}>
          {isLive && <View style={s.liveBadge}><Text style={s.liveTxt}>● LIVE</Text></View>}
          <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
            <Text style={s.logoutTxt}>🔑</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>

        {/* Camera / Stream box */}
        <View style={[s.cameraBox, isLive && { borderColor: T.gold }]}>
          {isLive ? (
            <>
              <RtcSurfaceView
                style={s.flex}
                canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              />
              <View style={s.camScoreOverlay}>
                <Text style={s.camScoreTeam}>WCC</Text>
                <Text style={s.camScoreRuns}>{score.runs}/{score.wickets}</Text>
                <Text style={s.camScoreOvers}>{score.overs} Ov</Text>
              </View>
              <View style={s.camControls}>
                <TouchableOpacity style={s.stopBtn} onPress={stopLive}>
                  <Text style={s.stopTxt}>⏹  STOP STREAM</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={s.cameraOffline}>
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={s.cameraOfflineMsg}>Tap GO LIVE to start broadcasting</Text>
              <Text style={s.cameraOfflineSub}>Your camera streams to all viewers via Agora</Text>
              <TouchableOpacity style={s.goLiveBtn} onPress={goLive}>
                <Text style={s.goLiveTxt}>▶  GO LIVE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={s.tabBar}>
          {[{ id: 'score', label: '⚡ Score' }, { id: 'players', label: '👥 Players' }].map(t => (
            <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnActive]} onPress={() => setTab(t.id)}>
              <Text style={[s.tabTxt, tab === t.id && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'score' && (
          <>
            <View style={s.card}>
              <Text style={s.cardLbl}>CURRENT SCORE</Text>
              <View style={s.scoreRow}>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: T.gold }]}>{score.runs}</Text><Text style={s.scoreLbl}>RUNS</Text></View>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: T.red }]}>{score.wickets}</Text><Text style={s.scoreLbl}>WKTS</Text></View>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: '#60A5FA' }]}>{score.overs}</Text><Text style={s.scoreLbl}>OVERS</Text></View>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: '#22C55E' }]}>{score.target}</Text><Text style={s.scoreLbl}>TARGET</Text></View>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardLbl}>THIS OVER</Text>
              <View style={s.ballRow}>
                {thisOver.length === 0
                  ? <Text style={{ color: T.muted, fontSize: 13 }}>No balls yet</Text>
                  : thisOver.map((b, i) => (
                    <View key={i} style={[s.ballChip, { borderColor: b.color, marginRight: 8 }]}>
                      <Text style={[s.ballChipTxt, { color: b.color }]}>{b.label}</Text>
                    </View>
                  ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardLbl}>ADD BALL</Text>
              <View style={s.ballGrid}>
                {BALL_EVENTS.map(ev => (
                  <TouchableOpacity key={ev.type} onPress={() => addBall(ev)}
                    style={[s.ballBtn, { borderColor: ev.color, backgroundColor: ev.color + '22', marginRight: 10, marginBottom: 10 }]}>
                    <Text style={[s.ballBtnTxt, { color: ev.color }]}>{ev.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={[s.cardLbl, { flex: 1, marginBottom: 0 }]}>SET TARGET</Text>
              <TextInput
                style={s.targetInput}
                value={score.target.toString()}
                onChangeText={v => setScore(sc => ({ ...sc, target: parseInt(v) || 0 }))}
                keyboardType="number-pad"
              />
            </View>
          </>
        )}

        {tab === 'players' && (
          <View style={s.card}>
            <Text style={s.cardLbl}>PLAYERS</Text>
            <Text style={{ color: T.muted, fontSize: 13 }}>Player management coming soon.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── VIEWER ───────────────────────────────────────────────────────────────────
function ViewerScreen({ onLogout, score, thisOver, commentary }) {
  const [tab,         setTab]         = useState('live');
  const [remoteUid,   setRemoteUid]   = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const engineRef = useRef(null);

  useEffect(() => {
    joinAsViewer();
    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        agoraEngine = null;
      }
    };
  }, []);

  async function joinAsViewer() {
    try {
      const engine = getEngine();
      engineRef.current = engine;
      engine.registerEventHandler({
        onUserJoined:      (_, uid) => { setRemoteUid(uid); setIsConnected(true); },
        onUserOffline:     ()       => { setRemoteUid(null); setIsConnected(false); },
        onJoinChannelSuccess: ()    => { setIsConnected(true); },
      });
      engine.setClientRole(ClientRoleType.ClientRoleAudience);
      engine.enableVideo();
      await engine.joinChannel(AGORA_TOKEN, AGORA_CHANNEL, 0, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
      });
    } catch (e) {
      console.log('Viewer join error:', e.message);
    }
  }

  const rrr = score.target > score.runs
    ? ((score.target - score.runs) / Math.max(0.1, 20 - score.overs)).toFixed(2) : '—';

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: T.dark }]}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerL}>
          <View style={s.headerLogo}><Text style={{ fontSize: 18 }}>🏏</Text></View>
          <View>
            <Text style={s.headerTitle}>WCC</Text>
            <Text style={s.headerSub}>WEEKEND CRICKET CLUB</Text>
          </View>
        </View>
        <View style={s.headerR}>
          {remoteUid
            ? <View style={s.liveBadge}><Text style={s.liveTxt}>● LIVE</Text></View>
            : <View style={s.offlineBadge}><Text style={s.offlineTxt}>📡 Waiting</Text></View>}
          <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
            <Text style={s.logoutTxt}>🔑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live video from admin */}
      <View style={[s.cameraBox, remoteUid && { borderColor: T.gold }]}>
        {remoteUid ? (
          <>
            <RtcSurfaceView
              style={s.flex}
              canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
            />
            <View style={s.camScoreOverlay}>
              <Text style={s.camScoreTeam}>WCC</Text>
              <Text style={s.camScoreRuns}>{score.runs}/{score.wickets}</Text>
              <Text style={s.camScoreOvers}>{score.overs} Ov</Text>
            </View>
            <View style={s.liveBadgeAbs}>
              <Text style={s.liveTxt}>● LIVE</Text>
            </View>
          </>
        ) : (
          <View style={s.cameraOffline}>
            <Text style={{ fontSize: 40 }}>📡</Text>
            <Text style={s.cameraOfflineMsg}>
              {isConnected ? 'Waiting for admin to go live...' : 'Connecting to match...'}
            </Text>
          </View>
        )}
      </View>

      {/* Teams strip */}
      <View style={[s.card, { marginHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>🏏</Text>
          <Text style={[s.teamShort, { color: T.gold }]}>{TEAMS.home.short}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.matchType}>T20 · MATCH 7</Text>
          <View style={s.battingBadge}><Text style={s.battingBadgeTxt}>BATTING</Text></View>
          <Text style={s.targetTxt}>Target: {score.target}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text style={[s.teamShort, { color: '#4FC3F7' }]}>{TEAMS.away.short}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { marginHorizontal: 12 }]}>
        {['Live', 'Scorecard', 'Commentary'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t.toLowerCase() && s.tabBtnActive]} onPress={() => setTab(t.toLowerCase())}>
            <Text style={[s.tabTxt, tab === t.toLowerCase() && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.flex} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}>

        {tab === 'live' && (
          <>
            <View style={s.card}>
              <Text style={s.cardLbl}>THIS OVER</Text>
              <View style={s.ballRow}>
                {thisOver.length === 0
                  ? <Text style={{ color: T.muted }}>Waiting...</Text>
                  : thisOver.map((b, i) => (
                    <View key={i} style={[s.ballChip, { borderColor: b.color, marginRight: 8 }]}>
                      <Text style={[s.ballChipTxt, { color: b.color }]}>{b.label}</Text>
                    </View>
                  ))}
              </View>
            </View>
            <View style={[s.card, { backgroundColor: '#0a1a30', borderColor: '#1a3060' }]}>
              <View style={s.scoreRow}>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: '#A78BFA' }]}>{Math.max(0, score.target - score.runs)}</Text><Text style={s.scoreLbl}>NEED</Text></View>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: '#60A5FA' }]}>{(20 - score.overs).toFixed(1)}</Text><Text style={s.scoreLbl}>OV LEFT</Text></View>
                <View style={s.scoreBox}><Text style={[s.scoreVal, { color: '#22C55E' }]}>{rrr}</Text><Text style={s.scoreLbl}>REQ RATE</Text></View>
              </View>
            </View>
          </>
        )}

        {tab === 'scorecard' && (
          <View style={s.card}>
            <Text style={s.cardLbl}>SCORE</Text>
            <Text style={{ color: T.gold, fontSize: 28, fontWeight: '900' }}>{score.runs}/{score.wickets}</Text>
            <Text style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>{score.overs} Overs · Target {score.target}</Text>
            <Text style={{ color: T.muted, fontSize: 13, marginTop: 8 }}>
              {score.target > score.runs ? `Need ${score.target - score.runs} more runs` : '🏆 Target achieved!'}
            </Text>
          </View>
        )}

        {tab === 'commentary' && (
          <View>
            {commentary.length === 0
              ? <View style={s.card}><Text style={{ color: T.muted, textAlign: 'center' }}>Waiting for match to start...</Text></View>
              : commentary.map((c, i) => (
                <View key={i} style={[s.card, i === 0 && { backgroundColor: '#1a0e00', borderColor: T.goldDark }]}>
                  <Text style={{ color: i === 0 ? T.text : T.muted, fontSize: 13, lineHeight: 20 }}>{c}</Text>
                </View>
              ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState('login');
  const [score,      setScore]      = useState({ runs: 0, wickets: 0, overs: 0.0, ballsThisOver: 0, target: 186 });
  const [thisOver,   setThisOver]   = useState([]);
  const [commentary, setCommentary] = useState([]);

  function addCommentary(text) { setCommentary(prev => [text, ...prev].slice(0, 20)); }

  return (
    <>
      {screen === 'login'  && <LoginScreen onLogin={r => setScreen(r)} />}
      {screen === 'admin'  && <AdminScreen onLogout={() => setScreen('login')} score={score} setScore={setScore} thisOver={thisOver} setThisOver={setThisOver} addCommentary={addCommentary} />}
      {screen === 'viewer' && <ViewerScreen onLogout={() => setScreen('login')} score={score} thisOver={thisOver} commentary={commentary} />}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex:             { flex: 1 },
  loginScroll:      { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoWrap:         { alignItems: 'center', marginBottom: 40 },
  logoBadge:        { width: 90, height: 90, borderRadius: 24, backgroundColor: T.green, borderWidth: 3, borderColor: T.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoEmoji:        { fontSize: 44 },
  logoTitle:        { fontSize: 38, fontWeight: '900', color: T.gold, letterSpacing: 4 },
  logoSub:          { fontSize: 12, color: T.muted, letterSpacing: 3, marginTop: 4 },
  authWrap:         { width: '100%', maxWidth: 320 },
  sectionLbl:       { fontSize: 12, color: T.muted, textAlign: 'center', letterSpacing: 2, marginBottom: 16 },
  roleBtn:          { flexDirection: 'row', borderWidth: 1.5, borderColor: T.border, borderRadius: 16, padding: 18, marginBottom: 14, alignItems: 'center', backgroundColor: T.card },
  roleIcon:         { fontSize: 32, marginRight: 16 },
  roleLbl:          { fontSize: 15, fontWeight: '700', color: T.text },
  roleSub:          { fontSize: 12, color: T.muted, marginTop: 2 },
  input:            { borderWidth: 1.5, borderColor: T.border, borderRadius: 12, padding: 14, fontSize: 18, textAlign: 'center', backgroundColor: T.card2, color: T.text, marginBottom: 8 },
  errorTxt:         { color: T.red, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  goldBtn:          { backgroundColor: T.gold, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  goldBtnTxt:       { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  greenBtn:         { backgroundColor: T.green, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: T.gold },
  greenBtnTxt:      { color: T.gold, fontWeight: '800', fontSize: 15 },
  ghostBtn:         { borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 10 },
  ghostBtnTxt:      { color: T.muted, fontSize: 13 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.card },
  headerL:          { flexDirection: 'row', alignItems: 'center' },
  headerR:          { flexDirection: 'row', alignItems: 'center' },
  headerEmoji:      { fontSize: 22, marginRight: 10 },
  headerLogo:       { width: 32, height: 32, borderRadius: 8, backgroundColor: T.green, borderWidth: 1.5, borderColor: T.gold, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitle:      { fontSize: 14, fontWeight: '900', color: T.gold, letterSpacing: 2 },
  headerSub:        { fontSize: 10, color: T.muted },
  liveBadge:        { backgroundColor: T.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 8 },
  liveBadgeAbs:     { position: 'absolute', top: 10, right: 10, backgroundColor: T.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveTxt:          { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
  offlineBadge:     { backgroundColor: T.card2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: T.border, marginRight: 8 },
  offlineTxt:       { color: T.muted, fontSize: 11 },
  logoutBtn:        { borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 8 },
  logoutTxt:        { fontSize: 14 },
  cameraBox:        { margin: 12, height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: T.border },
  cameraOffline:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a100a' },
  cameraOfflineMsg: { color: T.muted, fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  cameraOfflineSub: { color: T.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  goLiveBtn:        { backgroundColor: T.red, borderRadius: 40, paddingHorizontal: 32, paddingVertical: 12, marginTop: 16 },
  goLiveTxt:        { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  stopBtn:          { backgroundColor: '#333', borderRadius: 40, paddingHorizontal: 24, paddingVertical: 10 },
  stopTxt:          { color: '#fff', fontWeight: '700', fontSize: 13 },
  camControls:      { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
  camScoreOverlay:  { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.78)', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: T.goldDark },
  camScoreTeam:     { fontSize: 9, color: T.gold, letterSpacing: 2 },
  camScoreRuns:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  camScoreOvers:    { fontSize: 11, color: '#aaa' },
  card:             { backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardLbl:          { fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 12 },
  scoreRow:         { flexDirection: 'row', justifyContent: 'space-around' },
  scoreBox:         { alignItems: 'center' },
  scoreVal:         { fontSize: 22, fontWeight: '900' },
  scoreLbl:         { fontSize: 9, color: T.muted, letterSpacing: 2, marginTop: 2 },
  ballRow:          { flexDirection: 'row', flexWrap: 'wrap' },
  ballChip:         { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  ballChipTxt:      { fontWeight: '800', fontSize: 13 },
  ballGrid:         { flexDirection: 'row', flexWrap: 'wrap' },
  ballBtn:          { borderWidth: 2, borderRadius: 10, padding: 10, minWidth: 60, alignItems: 'center' },
  ballBtnTxt:       { fontWeight: '800', fontSize: 15 },
  targetInput:      { borderWidth: 1.5, borderColor: T.border, borderRadius: 10, padding: 8, fontSize: 18, fontWeight: '700', textAlign: 'center', width: 80, backgroundColor: T.card2, color: T.gold },
  tabBar:           { flexDirection: 'row', marginBottom: 12, backgroundColor: T.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: T.border },
  tabBtn:           { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabBtnActive:     { backgroundColor: T.gold },
  tabTxt:           { fontWeight: '700', fontSize: 12, color: T.muted },
  tabTxtActive:     { color: '#000' },
  teamShort:        { fontSize: 13, fontWeight: '700', marginTop: 4 },
  matchType:        { fontSize: 9, color: T.muted, letterSpacing: 2 },
  battingBadge:     { backgroundColor: T.gold, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginVertical: 6 },
  battingBadgeTxt:  { color: '#000', fontWeight: '800', fontSize: 11 },
  targetTxt:        { fontSize: 10, color: T.muted },
});
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView, Alert,
} from 'react-native';
import {
  createAgoraRtcEngine,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';

// --- THEME ---
const T = { 
  gold: '#D4A017', green: '#1B5E20', dark: '#080C08', 
  card: '#0E140E', border: '#1E2E1E', text: '#F0EAD6', 
  muted: '#7A8C6A', red: '#C62828' 
};

const AGORA_APP_ID = '0a8aa809dae045879483cf52c67b5268';
const AGORA_CHANNEL = 'wcc-match-live';

// --- ROOT APP ---
export default function App() {
  const [screen, setScreen] = useState('login');
  const [savedTeams, setSavedTeams] = useState([]);
  const [score, setScore] = useState({ runs: 0, wickets: 0 });

  if (screen === 'login') return <LoginScreen onLogin={setScreen} />;
  if (screen === 'team_mgmt') return <TeamMgmt onBack={() => setScreen('admin')} onSave={(t) => setSavedTeams([...savedTeams, t])} />;
  if (screen === 'admin') return <AdminScreen onLogout={() => setScreen('login')} onManage={() => setScreen('team_mgmt')} score={score} setScore={setScore} />;
  return <ViewerScreen onLogout={() => setScreen('login')} score={score} />;
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  return (
    <SafeAreaView style={s.fullDark}>
      <View style={s.center}>
        <Text style={s.logoTitle}>WCC ADMIN</Text>
        <TextInput 
          style={s.input} 
          placeholder="Enter PIN (1234)" 
          placeholderTextColor={T.muted}
          secureTextEntry 
          onChangeText={setPin} 
          keyboardType="number-pad" 
        />
        <TouchableOpacity 
          style={s.goldBtn} 
          onPress={() => pin === '1234' ? onLogin('admin') : Alert.alert('Error','Wrong PIN')}
        >
          <Text style={s.btnTxt}>LOGIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop: 20}} onPress={() => onLogin('viewer')}>
          <Text style={s.mutedTxt}>View Live Stream</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- TEAM MANAGEMENT ---
function TeamMgmt({ onBack, onSave }) {
  const [tName, setTName] = useState('');
  const [pName, setPName] = useState('');
  const [jersey, setJersey] = useState('');
  const [players, setPlayers] = useState([]);

  const saveTeam = () => {
    if(!tName || players.length === 0) return Alert.alert('Error', 'Add team name and players');
    onSave({ name: tName, players });
    Alert.alert('Success', 'Team saved locally!');
    onBack();
  };

  return (
    <SafeAreaView style={s.fullDark}>
      <ScrollView style={{padding: 20}}>
        <Text style={s.cardLbl}>TEAM NAME</Text>
        <TextInput style={s.input} onChangeText={setTName} placeholder="Team Name" placeholderTextColor={T.muted} />
        <Text style={s.cardLbl}>ADD PLAYER</Text>
        <View style={{flexDirection:'row', gap:10}}>
          <TextInput style={[s.input, {flex:2}]} placeholder="Name" onChangeText={setPName} value={pName} placeholderTextColor={T.muted} />
          <TextInput style={[s.input, {flex:1}]} placeholder="#" onChangeText={setJersey} value={jersey} keyboardType="number-pad" placeholderTextColor={T.muted} />
        </View>
        <TouchableOpacity style={s.greenBtn} onPress={() => {if(pName) {setPlayers([...players, {pName, jersey}]); setPName(''); setJersey('');}}}>
          <Text style={s.btnTxt}>+ ADD PLAYER</Text>
        </TouchableOpacity>
        {players.map((p, i) => <Text key={i} style={s.mutedTxt}>{p.jersey} - {p.pName}</Text>)}
        <TouchableOpacity style={[s.goldBtn, {marginTop: 20}]} onPress={saveTeam}><Text style={s.btnTxt}>SAVE TEAM</Text></TouchableOpacity>
        <TouchableOpacity onPress={onBack}><Text style={s.centerMuted}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ADMIN SCREEN ---
function AdminScreen({ onLogout, onManage, score, setScore }) {
  const [isLive, setIsLive] = useState(false);
  const engine = useRef(null);

  const toggleLive = async () => {
    if (isLive) { 
        await engine.current?.leaveChannel();
        setIsLive(false);
    } else {
        try {
          const _eng = createAgoraRtcEngine();
          _eng.initialize({ appId: AGORA_APP_ID });
          _eng.enableVideo();
          _eng.startPreview();
          await _eng.joinChannel(null, AGORA_CHANNEL, 0, { clientRoleType: ClientRoleType.ClientRoleBroadcaster });
          engine.current = _eng;
          setIsLive(true);
        } catch (e) { Alert.alert('Error', 'Stream Failed'); }
    }
  };

  return (
    <SafeAreaView style={s.fullDark}>
      <View style={s.header}><Text style={s.headerTitle}>MATCH CONTROL</Text><TouchableOpacity onPress={onLogout}><Text style={{color:T.gold}}>Logout</Text></TouchableOpacity></View>
      <View style={s.cameraBox}>
        {isLive ? <RtcSurfaceView style={{flex:1}} canvas={{uid: 0}} /> : <Text style={s.mutedTxt}>Camera Offline</Text>}
      </View>
      <TouchableOpacity style={isLive ? s.redBtn : s.goLiveBtn} onPress={toggleLive}><Text style={s.btnTxt}>{isLive ? 'STOP STREAM' : 'GO LIVE'}</Text></TouchableOpacity>
      <TouchableOpacity style={s.card} onPress={onManage}><Text style={s.btnTxt}>Manage Teams</Text></TouchableOpacity>
      <View style={s.scoreRow}>
        <TouchableOpacity style={s.ballBtn} onPress={() => setScore({...score, runs: score.runs + 1})}><Text style={s.btnTxt}>+1</Text></TouchableOpacity>
        <TouchableOpacity style={s.ballBtn} onPress={() => setScore({...score, runs: score.runs + 4})}><Text style={s.btnTxt}>+4</Text></TouchableOpacity>
        <TouchableOpacity style={s.ballBtn} onPress={() => setScore({...score, runs: score.runs + 6})}><Text style={s.btnTxt}>+6</Text></TouchableOpacity>
        <TouchableOpacity style={[s.ballBtn, {backgroundColor: T.red}]} onPress={() => setScore({...score, wickets: score.wickets + 1})}><Text style={s.btnTxt}>W</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- VIEWER SCREEN ---
function ViewerScreen({ onLogout, score }) {
    return (
        <SafeAreaView style={s.fullDark}>
            <Text style={s.logoTitle}>WATCHING LIVE</Text>
            <View style={s.cameraBox}><Text style={s.mutedTxt}>Waiting for Stream...</Text></View>
            <View style={s.card}><Text style={s.scoreText}>{score.runs} / {score.wickets}</Text></View>
            <TouchableOpacity onPress={onLogout}><Text style={s.centerMuted}>Exit</Text></TouchableOpacity>
        </SafeAreaView>
    );
}

// --- STYLES ---
const s = StyleSheet.create({
  fullDark: { flex:1, backgroundColor: T.dark },
  center: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  input: { backgroundColor: T.card, color: '#fff', padding:15, borderRadius:10, width:'100%', marginBottom:10, borderWidth:1, borderColor:T.border },
  goldBtn: { backgroundColor: T.gold, padding:15, borderRadius:10, width:'100%', alignItems:'center' },
  greenBtn: { backgroundColor: T.green, padding:15, borderRadius:10, width:'100%', alignItems:'center', marginBottom:10 },
  redBtn: { backgroundColor: T.red, padding:15, borderRadius:10, margin:10, alignItems:'center' },
  goLiveBtn: { backgroundColor: T.green, padding:15, borderRadius:10, margin:10, alignItems:'center' },
  btnTxt: { fontWeight:'bold', color:'#000' },
  logoTitle: { color: T.gold, fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center', marginTop:40 },
  headerTitle: { color: T.gold, fontSize:18, fontWeight:'bold' },
  mutedTxt: { color: T.muted, textAlign:'center', margin:10 },
  cardLbl: { color: T.muted, fontSize:12, marginBottom:5 },
  cameraBox: { height:250, backgroundColor:'#000', margin:10, borderRadius:15, justifyContent:'center', overflow:'hidden', borderWidth:1, borderColor:T.border },
  scoreRow: { flexDirection:'row', justifyContent:'space-around', padding:10 },
  ballBtn: { backgroundColor: T.card, padding:20, borderRadius:50, borderWidth:1, borderColor: T.border },
  card: { backgroundColor: T.card, padding:15, margin:10, borderRadius:10, alignItems:'center' },
  header: { flexDirection:'row', justifyContent:'space-between', padding:20, alignItems:'center' },
  centerMuted: { color: T.muted, textAlign:'center', marginTop:20 },
  scoreText: { color: '#fff', fontSize: 40, fontWeight: 'bold' }
});

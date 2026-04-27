import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView, Alert, Flat de,
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

// ─── ADMIN: TEAM & PLAYER MANAGEMENT ──────────────────────────────────────────
function TeamManagement({ onBack, onTeamsUpdated }) {
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [jerseyNum, setJerseyNum] = useState('');
  const [currentPlayers, setCurrentPlayers] = useState([]);
  const [savedTeams, setSavedTeams] = useState([]);

  // Simulate Online Fetch (Firebase/Cloud)
  useEffect(() => {
    // In a real app, fetch from Firestore here
  }, []);

  const addPlayer = () => {
    if (!playerName || !jerseyNum) return Alert.alert('Error', 'Need Name & Jersey #');
    setCurrentPlayers([...currentPlayers, { name: playerName, jersey: jerseyNum }]);
    setPlayerName('');
    setJerseyNum('');
  };

  const saveTeamOnline = () => {
    if (!teamName || currentPlayers.length === 0) return Alert.alert('Error', 'Need Team Name & Players');
    const newTeam = { id: Date.now(), name: teamName, players: currentPlayers };
    
    // Simulate Cloud Save
    setSavedTeams([...savedTeams, newTeam]);
    onTeamsUpdated([...savedTeams, newTeam]);
    
    Alert.alert('Success', `${teamName} saved to cloud database!`);
    setTeamName('');
    setCurrentPlayers([]);
  };

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: T.dark }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Text style={s.tabTxt}>← Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>TEAM CREATOR</Text>
        <View width={40} />
      </View>

      <ScrollView style={{ padding: 16 }}>
        <View style={s.card}>
          <Text style={s.cardLbl}>TEAM INFORMATION</Text>
          <TextInput 
            style={s.input} 
            placeholder="Enter Team Name" 
            placeholderTextColor={T.muted}
            value={teamName}
            onChangeText={setTeamName}
          />
        </View>

        <View style={s.card}>
          <Text style={s.cardLbl}>ADD PLAYER TO SQUAD</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput 
              style={[s.input, { flex: 2 }]} 
              placeholder="Player Name" 
              placeholderTextColor={T.muted}
              value={playerName}
              onChangeText={setPlayerName}
            />
            <TextInput 
              style={[s.input, { flex: 1 }]} 
              placeholder="#" 
              placeholderTextColor={T.muted}
              keyboardType="number-pad"
              value={jerseyNum}
              onChangeText={setJerseyNum}
            />
          </View>
          <TouchableOpacity style={s.greenBtn} onPress={addPlayer}>
            <Text style={s.greenBtnTxt}>+ ADD PLAYER</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.cardLbl}>CURRENT SQUAD ({currentPlayers.length})</Text>
          {currentPlayers.map((p, i) => (
            <View key={i} style={s.playerRow}>
              <Text style={s.roleLbl}>{p.jersey}</Text>
              <Text style={[s.roleLbl, { flex: 1, marginLeft: 10 }]}>{p.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.goldBtn} onPress={saveTeamOnline}>
            <Text style={s.goldBtnTxt}>☁ SAVE TEAM TO CLOUD</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── LOGIN SCREEN (UNCHANGED BUT ADDED TEAM TRIGGER) ──────────────────────────
function LoginScreen({ onLogin }) {
  const [role,  setRole]  = useState(null);
  const [pin,   setPin]   = useState('');
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
          <View style={s.logoBadge}><Text style={s.logoEmoji}>🏏</Text></View>
          <Text style={s.logoTitle}>WCC</Text>
          <Text style={s.logoSub}>ADMIN CONTROL PANEL</Text>
        </View>

        <View style={s.authWrap}>
          {!role ? (
            <>
              <TouchableOpacity style={s.roleBtn} onPress={() => setRole('admin')}>
                <Text style={s.roleIcon}>🎬</Text>
                <View><Text style={s.roleLbl}>Admin / Streamer</Text><Text style={s.roleSub}>Manage Teams & Score</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={s.roleBtn} onPress={() => onLogin('viewer')}>
                <Text style={s.roleIcon}>👁</Text>
                <View><Text style={s.roleLbl}>Viewer</Text><Text style={s.roleSub}>Watch Matches</Text></View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={[s.input, error && { borderColor: T.red }]}
                placeholder="Enter Admin PIN" placeholderTextColor={T.muted}
                secureTextEntry value={pin} onChangeText={setPin}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={s.goldBtn} onPress={handleAdmin}><Text style={s.goldBtnTxt}>LOGIN</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setRole(null)}><Text style={[s.ghostBtnTxt, { marginTop: 20, textAlign: 'center' }]}>← Back</Text></TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('login');
  const [savedTeams, setSavedTeams] = useState([]);
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0.0, target: 100 });

  // Main navigation
  if (screen === 'team_mgmt') return <TeamManagement onBack={() => setScreen('admin')} onTeamsUpdated={setSavedTeams} />;

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={setScreen} />}
      {screen === 'admin' && (
        <AdminScreen 
          onLogout={() => setScreen('login')} 
          onManageTeams={() => setScreen('team_mgmt')}
          savedTeams={savedTeams}
        />
      )}
      {screen === 'viewer' && <ViewerScreen onLogout={() => setScreen('login')} score={score} />}
    </>
  );
}

// Note: Ensure your AdminScreen has a button to trigger 'onManageTeams' 
// Add this button in the 'Players' tab of your AdminScreen:
// <TouchableOpacity style={s.goldBtn} onPress={onManageTeams}>
//   <Text style={s.goldBtnTxt}>+ CONFIGURE TEAMS & PLAYERS</Text>
// </TouchableOpacity>

// Styles added for the new Player rows:
const s = StyleSheet.create({
  // ... (keep previous styles)
  playerRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.card2,
    borderRadius: 8,
    marginBottom: 5,
  },
});

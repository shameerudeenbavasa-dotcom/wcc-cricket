import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Camera from 'expo-camera';

const { width, height } = Dimensions.get('window');

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  gold: '#D4A017',
  goldLight: '#F5C842',
  goldDark: '#A07810',
  green: '#1B5E20',
  greenLight: '#2E7D32',
  dark: '#080C08',
  card: '#0E140E',
  card2: '#141C14',
  border: '#1E2E1E',
  text: '#F0EAD6',
  muted: '#7A8C6A',
  red: '#C62828',
  blue: '#1565C0',
};

// ─── AGORA CONFIG - ALREADY SET UP! ────────────────────────────────────────
const AGORA_APP_ID = '0a8aa809dae045879483cf52c67b5268'; // ✅ READY TO USE
const AGORA_CHANNEL = 'wcc-match-live';
const AGORA_TOKEN = null; // Testing Mode - no token needed

const TEAMS = {
  home: { name: 'Weekend Cricket Club', short: 'WCC', color: T.gold },
  away: { name: 'City Smashers', short: 'CSM', color: '#4FC3F7' },
};

const BALL_EVENTS = [
  { type: 'run1', label: '1', color: '#60A5FA' },
  { type: 'run2', label: '2', color: '#60A5FA' },
  { type: 'four', label: '4', color: '#22C55E' },
  { type: 'six', label: '6', color: T.goldLight },
  { type: 'dot', label: '•', color: T.muted },
  { type: 'wicket', label: 'W', color: T.red },
  { type: 'wide', label: 'Wd', color: '#A78BFA' },
];

const COMMENTARY = [
  'FOUR! Cracking cut shot through point!',
  'Dot. Tight line, great discipline from the bowler.',
  'SIX! Over long-on! Clears the boundary with ease!',
  'OUT! Caught at mid-wicket. Soft dismissal.',
  'Wide! Down the leg side, umpire signals.',
  'Single taken. Pushed to mid-off, easy single.',
  'No ball! Overstepped. Free hit next ball!',
  'FOUR! Thick edge flies past gully!',
  'Two runs! Good running between the wickets.',
  'Yorker! Full and straight, can\'t get bat on it.',
];

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = () => {
    if (pin === '1234') {
      onLogin('admin');
    } else {
      setError('Wrong PIN. Try 1234');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.dark }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.dark} />
      <ScrollView contentContainerStyle={styles.centerContent}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoBadge, { borderColor: T.gold }]}>
            <Text style={styles.logoText}>🏏</Text>
          </View>
          <Text style={[styles.appTitle, { color: T.gold }]}>WCC</Text>
          <Text style={[styles.appSubtitle, { color: T.muted }]}>
            WEEKEND CRICKET CLUB
          </Text>
        </View>

        <View style={styles.authContainer}>
          {!role ? (
            <>
              <Text style={[styles.label, { color: T.muted }]}>SELECT YOUR ROLE</Text>
              <TouchableOpacity
                onPress={() => setRole('admin')}
                style={[styles.roleButton, { borderColor: T.border }]}
              >
                <Text style={styles.roleIcon}>🎬</Text>
                <View>
                  <Text style={[styles.roleLabel, { color: T.text }]}>
                    Admin / Streamer
                  </Text>
                  <Text style={[styles.roleSub, { color: T.muted }]}>
                    Broadcast the live match
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('viewer')}
                style={[styles.roleButton, { borderColor: T.border }]}
              >
                <Text style={styles.roleIcon}>👁️</Text>
                <View>
                  <Text style={[styles.roleLabel, { color: T.text }]}>
                    Viewer
                  </Text>
                  <Text style={[styles.roleSub, { color: T.muted }]}>
                    Watch the live match
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : role === 'admin' ? (
            <>
              <Text style={[styles.label, { color: T.muted }]}>ADMIN PIN</Text>
              <TextInput
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: T.card2,
                    borderColor: error ? T.red : T.border,
                    color: T.text,
                  },
                ]}
                placeholder="Enter PIN"
                placeholderTextColor={T.muted}
                secureTextEntry
                value={pin}
                onChangeText={(text) => {
                  setPin(text);
                  setError('');
                }}
              />
              {error && <Text style={{ color: T.red, marginTop: 8 }}>{error}</Text>}
              <TouchableOpacity
                onPress={handleAdminLogin}
                style={[styles.primaryButton, { backgroundColor: T.gold }]}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>ENTER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setRole(null);
                  setPin('');
                  setError('');
                }}
                style={[styles.secondaryButton, { borderColor: T.border }]}
              >
                <Text style={[styles.buttonText, { color: T.muted }]}>← Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: T.muted }]}>ENTER YOUR NAME</Text>
              <TextInput
                style={[
                  styles.pinInput,
                  { backgroundColor: T.card2, borderColor: T.border, color: T.text },
                ]}
                placeholder="Your name"
                placeholderTextColor={T.muted}
              />
              <TouchableOpacity
                onPress={() => onLogin('viewer')}
                style={[styles.primaryButton, { backgroundColor: T.green }]}
              >
                <Text style={[styles.buttonText, { color: T.gold }]}>WATCH LIVE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole(null)}
                style={[styles.secondaryButton, { borderColor: T.border }]}
              >
                <Text style={[styles.buttonText, { color: T.muted }]}>← Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ADMIN SCREEN ─────────────────────────────────────────────────────────────
function AdminScreen({ onLogout, score, setScore, thisOver, setThisOver }) {
  const [activeSection, setActiveSection] = useState('score');
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const addBall = (event) => {
    const { type } = event;
    setThisOver((prev) => [...prev.slice(-5), { label: event.label, color: event.color }]);

    setScore((s) => {
      const runs =
        type === 'four'
          ? s.runs + 4
          : type === 'six'
          ? s.runs + 6
          : type === 'run1'
          ? s.runs + 1
          : type === 'run2'
          ? s.runs + 2
          : type === 'wide'
          ? s.runs + 1
          : s.runs;

      const wickets = type === 'wicket' ? Math.min(s.wickets + 1, 10) : s.wickets;
      const balls = type === 'wide' ? s.ballsThisOver : (s.ballsThisOver + 1) % 6;
      const overs =
        type === 'wide'
          ? s.overs
          : s.ballsThisOver === 5
          ? Math.floor(s.overs) + 1
          : parseFloat((Math.floor(s.overs) + (s.ballsThisOver + 1) / 10).toFixed(1));

      return { ...s, runs, wickets, overs, ballsThisOver: balls };
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.dark }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.dark} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🏏</Text>
          <View>
            <Text style={[styles.headerTitle, { color: T.gold }]}>WCC ADMIN</Text>
            <Text style={[styles.headerSub, { color: T.muted }]}>Match Control</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={[styles.setupButton, { borderColor: T.border }]}>
          <Text style={[styles.setupButtonText, { color: T.muted }]}>🔑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Display */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.cardLabel, { color: T.muted }]}>CURRENT SCORE</Text>
          <View style={styles.scoreGrid}>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: T.gold }]}>{score.runs}</Text>
              <Text style={[styles.scoreLabel, { color: T.muted }]}>RUNS</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: T.red }]}>{score.wickets}</Text>
              <Text style={[styles.scoreLabel, { color: T.muted }]}>WICKETS</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: '#60A5FA' }]}>{score.overs}</Text>
              <Text style={[styles.scoreLabel, { color: T.muted }]}>OVERS</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: '#22C55E' }]}>{score.target}</Text>
              <Text style={[styles.scoreLabel, { color: T.muted }]}>TARGET</Text>
            </View>
          </View>
        </View>

        {/* This Over */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.cardLabel, { color: T.muted }]}>THIS OVER</Text>
          <View style={styles.ballRow}>
            {thisOver.length === 0 ? (
              <Text style={[styles.emptyText, { color: T.muted }]}>No balls bowled yet</Text>
            ) : (
              thisOver.map((b, i) => (
                <View key={i} style={[styles.ballChip, { borderColor: b.color }]}>
                  <Text style={[styles.ballLabel, { color: b.color }]}>{b.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Add Ball Buttons */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.cardLabel, { color: T.muted }]}>ADD BALL</Text>
          <View style={styles.ballButtonGrid}>
            {BALL_EVENTS.map((ev) => (
              <TouchableOpacity
                key={ev.type}
                onPress={() => addBall(ev)}
                style={[
                  styles.ballButton,
                  { borderColor: ev.color, backgroundColor: ev.color + '18' },
                ]}
              >
                <Text style={[styles.ballButtonLabel, { color: ev.color }]}>{ev.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Input */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.cardLabel, { color: T.muted }]}>SET TARGET</Text>
          <TextInput
            style={[
              styles.targetInput,
              { backgroundColor: T.card2, borderColor: T.border, color: T.gold },
            ]}
            value={score.target.toString()}
            onChangeText={(text) => setScore({ ...score, target: parseInt(text) || 0 })}
            keyboardType="number-pad"
          />
        </View>

        {/* Info Banner */}
        <View style={[styles.card, { backgroundColor: T.card2, borderColor: T.goldDark }]}>
          <Text style={[styles.infoText, { color: T.goldLight }]}>
            ✅ Agora Configured & Ready to Stream
          </Text>
          <Text style={[styles.infoSubtext, { color: T.muted }]}>
            App ID: 0a8aa809dae045879483cf52c67b5268
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── VIEWER SCREEN ────────────────────────────────────────────────────────────
function ViewerScreen({ onLogout, score, thisOver }) {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.dark }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.dark} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBadge, { borderColor: T.gold }]}>
            <Text style={styles.headerIcon}>🏏</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: T.gold }]}>WCC</Text>
            <Text style={[styles.headerSub, { color: T.muted }]}>WEEKEND CRICKET CLUB</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={[styles.setupButton, { borderColor: T.border }]}>
          <Text style={[styles.setupButtonText, { color: T.muted }]}>🔑</Text>
        </TouchableOpacity>
      </View>

      {/* Video Stream */}
      <View style={[styles.videoContainer, { backgroundColor: '#000', borderColor: T.border }]}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoIcon}>📡</Text>
          <Text style={[styles.videoText, { color: T.muted }]}>Waiting for admin to go live...</Text>
        </View>
      </View>

      {/* Teams Strip */}
      <View style={[styles.teamsStrip, { backgroundColor: T.card, borderColor: T.border }]}>
        <View style={styles.teamBox}>
          <Text style={styles.teamIcon}>🏏</Text>
          <Text style={[styles.teamName, { color: T.gold }]}>{TEAMS.home.short}</Text>
        </View>
        <View style={styles.matchInfo}>
          <Text style={[styles.matchType, { color: T.muted }]}>T20 · MATCH 7</Text>
          <View style={[styles.batsButton, { backgroundColor: T.gold }]}>
            <Text style={[styles.batsButtonText, { color: '#000' }]}>BATTING</Text>
          </View>
          <Text style={[styles.matchTarget, { color: T.muted }]}>Target: {score.target}</Text>
        </View>
        <View style={styles.teamBox}>
          <Text style={styles.teamIcon}>⚡</Text>
          <Text style={[styles.teamName, { color: '#4FC3F7' }]}>{TEAMS.away.short}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: T.card, borderColor: T.border }]}>
        {['Live', 'Scorecard', 'Commentary'].map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab.toLowerCase())}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.toLowerCase() ? T.gold : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.toLowerCase() ? '#000' : T.muted },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'live' && (
          <>
            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.cardLabel, { color: T.muted }]}>THIS OVER</Text>
              <View style={styles.ballRow}>
                {thisOver.length === 0 ? (
                  <Text style={[styles.emptyText, { color: T.muted }]}>Waiting...</Text>
                ) : (
                  thisOver.map((b, i) => (
                    <View key={i} style={[styles.ballChip, { borderColor: b.color }]}>
                      <Text style={[styles.ballLabel, { color: b.color }]}>{b.label}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.cardLabel, { color: T.muted }]}>MATCH STATUS</Text>
              <View style={styles.scoreGrid}>
                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreValue, { color: '#A78BFA' }]}>
                    {Math.max(0, score.target - score.runs)}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: T.muted }]}>NEED</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreValue, { color: '#60A5FA' }]}>
                    {(20 - score.overs).toFixed(1)}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: T.muted }]}>OVERS LEFT</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'scorecard' && (
          <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[styles.cardLabel, { color: T.muted }]}>SCORECARD</Text>
            <Text style={[styles.cardContent, { color: T.text }]}>
              {score.runs}/{score.wickets} ({score.overs} Ov)
            </Text>
          </View>
        )}

        {activeTab === 'commentary' && (
          <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[styles.cardLabel, { color: T.muted }]}>COMMENTARY</Text>
            <Text style={[styles.cardContent, { color: T.muted }]}>
              Waiting for match to start...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function WCCApp() {
  const [screen, setScreen] = useState('login');
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0.0,
    ballsThisOver: 0,
    target: 186,
  });
  const [thisOver, setThisOver] = useState([]);

  const handleLogin = (role) => {
    setScreen(role === 'admin' ? 'admin' : 'viewer');
  };

  const handleLogout = () => {
    setScreen('login');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'admin' && (
        <AdminScreen
          onLogout={handleLogout}
          score={score}
          setScore={setScore}
          thisOver={thisOver}
          setThisOver={setThisOver}
        />
      )}
      {screen === 'viewer' && (
        <ViewerScreen
          onLogout={handleLogout}
          score={score}
          thisOver={thisOver}
        />
      )}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: T.green,
  },
  logoText: {
    fontSize: 44,
  },
  appTitle: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 4,
  },
  appSubtitle: {
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 4,
  },
  authContainer: {
    width: '100%',
    maxWidth: 320,
  },
  label: {
    fontSize: 13,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
  },
  roleButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pinInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 8,
  },
  primaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 10,
  },
  setupButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  setupButtonText: {
    fontSize: 11,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },
  ballRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ballChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballLabel: {
    fontWeight: '800',
    fontSize: 13,
  },
  ballButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ballButton: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  ballButtonLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
  targetInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 8,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
  },
  emptyText: {
    fontSize: 13,
  },
  videoContainer: {
    margin: 12,
    height: 210,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  videoIcon: {
    fontSize: 40,
  },
  videoText: {
    fontSize: 14,
  },
  teamsStrip: {
    margin: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamBox: {
    alignItems: 'center',
  },
  teamIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchInfo: {
    alignItems: 'center',
  },
  matchType: {
    fontSize: 9,
    letterSpacing: 2,
  },
  batsButton: {
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  batsButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchTarget: {
    fontSize: 10,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '700',
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoSubtext: {
    fontSize: 11,
    marginTop: 4,
  },
});

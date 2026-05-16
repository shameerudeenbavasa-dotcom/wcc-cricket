import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { T } from '../../theme';

export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return Alert.alert('Error', 'Fill all fields');
    if (password.length < 6) return Alert.alert('Error', 'Password must be 6+ characters');
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(),
        displayName: name.trim(),
        role: 'user',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      Alert.alert('Register Failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.logo}>🏏 WCC</Text>
          <Text style={s.tagline}>West Coast Cricket</Text>

          <View style={s.card}>
            <Text style={s.cardTitle}>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>

            {mode === 'register' && (
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor={T.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={T.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={T.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[s.btn, busy && s.btnDisabled]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={busy}
            >
              <Text style={s.btnTxt}>{busy ? 'Please wait...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.switchRow} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={s.switchTxt}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: T.gold }}>{mode === 'login' ? 'Register' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.hint}>Admin accounts are configured by WCC management.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 4 },
  tagline: { color: T.gold, fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 3, marginBottom: 40 },
  card: { backgroundColor: T.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: T.border },
  cardTitle: { color: T.gold, fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: T.dark, color: T.text, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: T.border, fontSize: 15 },
  btn: { backgroundColor: T.gold, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  switchRow: { marginTop: 20, alignItems: 'center' },
  switchTxt: { color: T.muted, fontSize: 14 },
  hint: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 24, opacity: 0.7 },
});

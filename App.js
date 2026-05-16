import 'react-native-gesture-handler';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/firebase';
import { T } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AdminLiveScreen from './src/screens/admin/AdminLiveScreen';
import AdminScoringScreen from './src/screens/admin/AdminScoringScreen';
import TeamListScreen from './src/screens/admin/TeamListScreen';
import TeamFormScreen from './src/screens/admin/TeamFormScreen';
import TeamDetailScreen from './src/screens/admin/TeamDetailScreen';
import WatchScreen from './src/screens/user/WatchScreen';
import ScoreboardScreen from './src/screens/user/ScoreboardScreen';
import UserTeamsScreen from './src/screens/user/UserTeamsScreen';

export const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AdminTeamsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamList" component={TeamListScreen} />
      <Stack.Screen name="TeamForm" component={TeamFormScreen} />
      <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: T.card, borderTopColor: T.border },
        tabBarActiveTintColor: T.gold,
        tabBarInactiveTintColor: T.muted,
      }}
    >
      <Tab.Screen name="Live" component={AdminLiveScreen} options={{ tabBarLabel: 'Go Live' }} />
      <Tab.Screen name="Scoring" component={AdminScoringScreen} options={{ tabBarLabel: 'Scoring' }} />
      <Tab.Screen name="Teams" component={AdminTeamsStack} options={{ tabBarLabel: 'Teams' }} />
    </Tab.Navigator>
  );
}

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: T.card, borderTopColor: T.border },
        tabBarActiveTintColor: T.gold,
        tabBarInactiveTintColor: T.muted,
      }}
    >
      <Tab.Screen name="Watch" component={WatchScreen} options={{ tabBarLabel: 'Watch Live' }} />
      <Tab.Screen name="Score" component={ScoreboardScreen} options={{ tabBarLabel: 'Scoreboard' }} />
      <Tab.Screen name="UserTeams" component={UserTeamsScreen} options={{ tabBarLabel: 'Teams' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [state, setState] = useState({ loading: true, user: null, role: null });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const role = snap.data()?.role || 'user';
          setState({ loading: false, user: u, role });
        } catch {
          setState({ loading: false, user: u, role: 'user' });
        }
      } else {
        setState({ loading: false, user: null, role: null });
      }
    });
  }, []);

  if (state.loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={T.gold} size="large" />
      </View>
    );
  }

  return (
    <UserCtx.Provider value={state}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!state.user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : state.role === 'admin' ? (
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
          ) : (
            <Stack.Screen name="UserTabs" component={UserTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserCtx.Provider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: T.dark, justifyContent: 'center', alignItems: 'center' },
});

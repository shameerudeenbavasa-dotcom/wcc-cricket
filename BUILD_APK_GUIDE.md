# 📱 Build Your APK in 3 Steps (Cloud - No Local Setup!)

## ✅ Status
- **Agora App ID**: Already configured ✓
- **Code**: Ready to build ✓
- **No installation needed**: Uses cloud build ✓

---

## 🚀 Step 1: Sign Up for Expo (2 minutes)

1. Go to: https://expo.dev
2. Click "Sign up"
3. Create account with email (or GitHub/Google)
4. **Write down your username** - you'll need it

---

## 🔧 Step 2: Install Expo CLI (5 minutes)

Open terminal/command prompt and run:

```bash
npm install -g eas-cli
npm install -g expo-cli
```

Verify installation:
```bash
expo --version
eas --version
```

---

## 🏗️ Step 3: Build Your APK in the Cloud (10 minutes)

Navigate to your project folder:

```bash
cd WCCCricketExpo
```

Login to your Expo account:
```bash
eas login
```

Build the APK:
```bash
eas build --platform android --type apk
```

**That's it!** 🎉

The build will:
1. Upload your code to Expo's servers
2. Compile it into an APK automatically
3. Email you a download link when done (~5-10 minutes)
4. APK ready to install on any Android device

---

## 📲 Install APK on Your Android Phone

Once you get the APK:

### Option A: Direct Install
1. Download APK to your phone
2. Open file manager
3. Tap the APK file
4. Tap "Install"
5. Done!

### Option B: Via Computer
1. Download APK to computer
2. Connect Android phone via USB
3. Run:
   ```bash
   adb install path/to/app-release.apk
   ```

### Option C: Share Link
1. Share the download link to anyone
2. They download and install on their Android phone
3. No local setup needed!

---

## 🎯 What Happens in Your APK

✅ **Admin Panel (PIN: 1234)**
- Add balls (1, 2, 4, 6, wide, dot, wicket)
- Real-time score updates
- Track overs and runs
- Set target

✅ **Viewer Panel**
- Watch live match
- See balls being bowled
- Match status
- Runs needed
- Overs left

---

## 🔗 What's Pre-Configured

| Setting | Value |
|---------|-------|
| Agora App ID | 0a8aa809dae045879483cf52c67b5268 ✅ |
| Agora Channel | wcc-match-live ✅ |
| App Name | WCC Cricket ✅ |
| Package Name | com.wcccricket ✅ |
| Admin PIN | 1234 ✅ |

Everything is **already set up** - you just need to build!

---

## ❓ Troubleshooting

**Problem**: "eas login failed"
- Solution: Make sure you created account at expo.dev

**Problem**: "Command not found: eas"
- Solution: Restart terminal after installing eas-cli

**Problem**: "Build failed"
- Solution: Check your internet connection, try again

**Problem**: "APK won't install"
- Solution: Enable "Unknown sources" in Android settings

---

## 📊 Build Status

Check your builds anytime:
```bash
eas build:list
```

Or visit: https://expo.dev/projects (sign in with your account)

---

## 🎉 You're Done!

After ~10 minutes, you'll have:
- ✅ Working APK file
- ✅ Download link via email
- ✅ Ready to install on any Android phone
- ✅ Share with anyone

---

## 📚 Next Steps

1. ✅ Complete steps 1-3 above
2. ✅ Download your APK
3. ✅ Install on your Android phone
4. ✅ Test both Admin and Viewer screens
5. ✅ Share APK with friends/team

---

## 🔐 Security Notes

- Your Agora App ID is in the app (viewable by anyone who downloads)
- For production, use Agora token authentication
- Change admin PIN before sharing widely
- Consider backend authentication for real usage

---

## 📞 Need Help?

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build
- Expo Community: https://forums.expo.dev

---

**That's it! Your APK is ready to build in the cloud.** ☁️📱

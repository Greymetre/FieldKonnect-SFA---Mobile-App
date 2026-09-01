const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const nodeBinary = [
  process.env.NODE_BINARY,
  process.execPath,
  '/opt/homebrew/opt/node@22/bin/node',
  '/opt/homebrew/bin/node',
  '/usr/local/bin/node',
  '/usr/bin/node',
].find(candidate => candidate && fs.existsSync(candidate));

if (!nodeBinary) {
  console.warn('[postinstall] Node binary not found for Android Gradle patches.');
  process.exit(0);
}

const gradleNode = nodeBinary.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const files = [
  'node_modules/@react-native-community/netinfo/android/build.gradle',
  'node_modules/react-native-keyboard-controller/android/react-native-helpers.gradle',
  'node_modules/react-native-gesture-handler/android/build.gradle',
  'node_modules/react-native-svg/android/build.gradle',
  'node_modules/react-native-screens/android/build.gradle',
  'node_modules/react-native-worklets/android/build.gradle',
  'node_modules/react-native-reanimated/android/build.gradle',
];

for (const relativePath of files) {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  let contents = fs.readFileSync(fullPath, 'utf8');
  const original = contents;

  contents = contents
    .replace(/commandLine\("node"/g, `commandLine("${gradleNode}"`)
    .replace(/\["node", "--print", "require\.resolve\('react-native\/package\.json'\)"\]/g, `["${gradleNode}", "--print", "require.resolve('react-native/package.json')"]`)
    .replace(/\["node", "--print", "require\.resolve\('react-native-worklets\/package\.json'\)"\]/g, `["${gradleNode}", "--print", "require.resolve('react-native-worklets/package.json')"]`);

  if (contents !== original) {
    fs.writeFileSync(fullPath, contents);
    console.log(`[postinstall] Patched Android Gradle Node path in ${relativePath}`);
  }
}

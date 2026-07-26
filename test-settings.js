import fs from 'fs';
const content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
if (content.includes('onUpdateSettings(localSettings)')) {
  console.log('onUpdateSettings is called');
}

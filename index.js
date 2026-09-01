/**
 * @format
 */

import { AppRegistry } from 'react-native';
import './src/api/ApiLogger';
import App from './App';
import { name as appName } from './app.json';
import "react-native-gesture-handler";

AppRegistry.registerComponent(appName, () => App);

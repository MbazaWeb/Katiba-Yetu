import { registerRootComponent } from 'expo';
import App from './src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It ensures environment setup (Expo managed workflow) happens before
// React Native renders the root component.
registerRootComponent(App);

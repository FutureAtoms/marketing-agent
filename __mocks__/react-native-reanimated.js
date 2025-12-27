const Reanimated = require('react-native-reanimated/mock');

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

Reanimated.default.call = () => {};

module.exports = Reanimated;

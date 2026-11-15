jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' }),
    Feather: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' }),
    MaterialCommunityIcons: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' })
  };
});

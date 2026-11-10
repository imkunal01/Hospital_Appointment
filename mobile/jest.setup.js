jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' }),
    Feather: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' }),
    MaterialCommunityIcons: (props) => React.createElement(View, { ...props, accessibilityRole: 'image' })
  };
});

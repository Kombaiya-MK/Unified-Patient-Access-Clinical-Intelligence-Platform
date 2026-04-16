/**
 * Custom Style Dictionary Transform: iOS PascalCase naming
 *
 * Capitalizes the first letter of camelCase token names for iOS conventions.
 * Example: colorPrimaryMain → ColorPrimaryMain
 */

export default {
  name: 'name/ios-capitalize',
  type: 'name',
  transform: (token) => {
    const camel = token.path
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return camel;
  },
};

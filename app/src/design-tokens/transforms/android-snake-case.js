/**
 * Custom Style Dictionary Transform: Android snake_case naming
 *
 * Converts PascalCase/camelCase token names to snake_case for Android resources.
 * Example: colorPrimaryMain → color_primary_main
 */

export default {
  name: 'name/android-snake-case',
  type: 'name',
  transform: (token) => {
    return token.path
      .join('_')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
  },
};

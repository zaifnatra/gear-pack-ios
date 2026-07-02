// Side-effect CSS imports (e.g. NativeWind's global.css) have no exports.
declare module '*.css';

// CSS modules used on web export a class-name map.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

module.exports = function(api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }], // nativewind 연동 필요시
      'nativewind/babel' // 만약 별도 플러그인 형태로 필요하면
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          "moduleName": "@env",
          "path": ".env",
          "blocklist": null,
          "allowlist": null,
          "safe": false,
          "allowUndefined": true,
          "verbose": false
        }
      ]
    ]
  };
};

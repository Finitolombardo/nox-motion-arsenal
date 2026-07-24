declare module 'virtual:effect-updates' {
  const effectUpdates: Record<string, string>;
  export default effectUpdates;
}

declare module 'virtual:effect-sources' {
  const effectSources: Record<string, string>;
  export default effectSources;
}

declare module 'virtual:effect-packages' {
  const effectPackages: Record<string, string>;
  export default effectPackages;
}

declare module 'virtual:effect-owned-files' {
  const effectOwnedFiles: Record<string, string[]>;
  export default effectOwnedFiles;
}

declare module 'virtual:community-flags' {
  const communityFlags: Record<string, boolean>;
  export default communityFlags;
}

const unitScripts = [
  ['sdk', './sdk-unit.mjs'],
  ['db', './db-unit.mjs'],
  ['cli', './cli-unit.mjs'],
  ['mcp', './mcp-unit.mjs'],
];

for (const [name, scriptPath] of unitScripts) {
  const scriptUrl = new URL(scriptPath, import.meta.url);
  scriptUrl.searchParams.set('coverage', name);

  console.log(`\nRunning ${name} unit tests for coverage...`);
  await import(scriptUrl.href);
}

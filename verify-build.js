#!/usr/bin/env node

/**
 * Script de Verificación Pre-Build
 * Verifica que todo esté listo para crear el .exe
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para build del .exe...\n');

let errors = 0;
let warnings = 0;

// Verificar archivos críticos
const criticalFiles = [
  { path: 'package.json', desc: 'Configuración del proyecto' },
  { path: 'next.config.js', desc: 'Configuración Next.js' },
  { path: 'electron/main.js', desc: 'Proceso principal Electron' },
  { path: 'electron/preload.js', desc: 'Preload script Electron' },
  { path: 'app/page.tsx', desc: 'Página principal' },
  { path: 'lib/supabase.ts', desc: 'Cliente Supabase' },
];

console.log('📄 Verificando archivos críticos...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`  ✅ ${file.path} - ${file.desc}`);
  } else {
    console.log(`  ❌ ${file.path} - FALTA!`);
    errors++;
  }
});

// Verificar iconos
console.log('\n🎨 Verificando iconos...');
if (fs.existsSync('electron/icon.ico')) {
  const stats = fs.statSync('electron/icon.ico');
  if (stats.size > 10000) {
    console.log(`  ✅ icon.ico existe (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ⚠️  icon.ico muy pequeño - puede estar corrupto`);
    warnings++;
  }
} else {
  console.log('  ❌ icon.ico NO existe - el .exe tendrá icono genérico');
  console.log('     Ver: electron/ICONOS.md');
  errors++;
}

// Verificar variables de entorno
console.log('\n🔐 Verificando variables de entorno...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  const requiredVars = [
    'SUNO_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=tu_`)) {
      console.log(`  ✅ ${varName} configurado`);
    } else {
      console.log(`  ❌ ${varName} NO configurado o placeholder`);
      errors++;
    }
  });
} else {
  console.log('  ⚠️  .env.local NO existe');
  console.log('     Nota: Las variables NO se incluyen en el .exe');
  console.log('     Considera hardcodear keys para uso interno');
  warnings++;
}

// Verificar node_modules
console.log('\n📦 Verificando dependencias...');
if (fs.existsSync('node_modules')) {
  // Verificar dependencias críticas
  const criticalDeps = [
    'next',
    'react',
    'electron',
    'electron-builder',
    '@supabase/supabase-js',
    'wavesurfer.js'
  ];

  criticalDeps.forEach(dep => {
    if (fs.existsSync(`node_modules/${dep}`)) {
      console.log(`  ✅ ${dep} instalado`);
    } else {
      console.log(`  ❌ ${dep} NO instalado`);
      errors++;
    }
  });
} else {
  console.log('  ❌ node_modules NO existe');
  console.log('     Ejecuta: npm install');
  errors++;
}

// Verificar package.json scripts
console.log('\n⚙️  Verificando scripts de build...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'electron:build:win',
  'build:export'
];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`  ✅ Script "${script}" configurado`);
  } else {
    console.log(`  ❌ Script "${script}" NO encontrado`);
    errors++;
  }
});

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN:');
console.log('='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ TODO LISTO para crear el .exe!');
  console.log('\n🚀 Ejecuta: npm run electron:build:win');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(es) crítico(s) encontrado(s)`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} advertencia(s) encontrada(s)`);
  }
  
  console.log('\n📝 Soluciona los errores antes de hacer el build.');
  console.log('💡 Consulta BUILD-EXE.md para más información.');
}

console.log('='.repeat(60));

process.exit(errors > 0 ? 1 : 0);

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithEsbuild } from 'vite';
import brandRefresh from '../build/petgrow-brand-refresh-20260822.mjs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const built = brandRefresh().transform.call({ error: message => { throw new Error(message); } }, app, '/src/App.jsx').code;
const labelsSource = built.match(/const PETGROW_MENU_LABELS = ([\s\S]*?);\n\nfunction useT/)[1];
const labels = vm.runInNewContext(`(${labelsSource})`);
const desktopSource = readFileSync(new URL('../src/DesktopNavigation.jsx', import.meta.url), 'utf8');
const compiled = await transformWithEsbuild(desktopSource.replace(/^import .*;\n/, '').replace('export default function', 'function'), 'DesktopNavigation.jsx');
const Navigation = vm.runInNewContext(`${compiled.code}; DesktopNavigation`, { React, useEffect: React.useEffect, useRef: React.useRef, useState: React.useState });

test('built translation overrides and desktop navigation agree on feature names', () => {
  for (const lang of ['ko', 'en']) {
    const markup = renderToStaticMarkup(React.createElement(Navigation, { view: 'home', lang, onNavigate() {} }));
    for (const key of ['myPetsNav', 'communityNav', 'sajuNav', 'petBtiNav', 'tipsTitle', 'nearbyNav', 'hamNavMy']) {
      assert.ok(markup.includes(labels[lang][key]), `${lang} ${key}: ${labels[lang][key]}`);
    }
    assert.equal(labels[lang].nearbyNav, labels[lang].nearbyTitle);
    assert.equal(labels[lang].hamNavMy, labels[lang].myPageTitle);
  }
  assert.doesNotMatch(labelsSource, /펫성향|펫플레이스|Pet Personality|Pet Places/);
});

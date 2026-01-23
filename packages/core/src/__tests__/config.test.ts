import { describe, expect, it } from 'vitest';
import { defaultConfig, defineConfig, mergeWithDefaults } from '../config/index.js';
import type { ReversoConfig } from '../types/config.js';

describe('defineConfig', () => {
  it('returns config with defaults merged', () => {
    const config = defineConfig({
      database: {
        provider: 'postgresql',
        url: 'postgres://localhost/test',
      },
    });

    expect(config.database.provider).toBe('postgresql');
    expect(config.database.url).toBe('postgres://localhost/test');
    expect(config.srcDir).toBe('src');
    expect(config.outputDir).toBe('.reverso');
  });

  it('preserves user-provided values', () => {
    const config = defineConfig({
      name: 'My CMS',
      srcDir: 'app',
      database: {
        provider: 'sqlite',
        url: 'test.db',
      },
    });

    expect(config.name).toBe('My CMS');
    expect(config.srcDir).toBe('app');
  });
});

describe('mergeWithDefaults', () => {
  it('merges scanner config correctly', () => {
    const userConfig: ReversoConfig = {
      database: { provider: 'sqlite', url: 'test.db' },
      scanner: {
        srcDir: 'app',
        watch: {
          enabled: false,
        },
      },
    };

    const merged = mergeWithDefaults(userConfig);

    expect(merged.scanner?.srcDir).toBe('app');
    expect(merged.scanner?.watch?.enabled).toBe(false);
    expect(merged.scanner?.watch?.debounce).toBe(300);
  });

  it('merges admin config correctly', () => {
    const userConfig: ReversoConfig = {
      database: { provider: 'sqlite', url: 'test.db' },
      admin: {
        title: 'My Admin',
        darkMode: false,
      },
    };

    const merged = mergeWithDefaults(userConfig);

    expect(merged.admin?.title).toBe('My Admin');
    expect(merged.admin?.darkMode).toBe(false);
    expect(merged.admin?.path).toBe('/admin');
  });

  it('merges api config correctly', () => {
    const userConfig: ReversoConfig = {
      database: { provider: 'sqlite', url: 'test.db' },
      api: {
        graphql: false,
      },
    };

    const merged = mergeWithDefaults(userConfig);

    expect(merged.api?.graphql).toBe(false);
    expect(merged.api?.rest).toBe(true);
  });
});

describe('defaultConfig', () => {
  it('has correct default values', () => {
    expect(defaultConfig.srcDir).toBe('src');
    expect(defaultConfig.outputDir).toBe('.reverso');
    expect(defaultConfig.database.provider).toBe('sqlite');
    expect(defaultConfig.admin?.path).toBe('/admin');
    expect(defaultConfig.api?.path).toBe('/api/reverso');
  });
});

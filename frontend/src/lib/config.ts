/**
 * Configuration management for Qwen Lens Studio
 * Stores API keys, model settings, and backend preferences in localStorage
 */

const CONFIG_KEY = 'qls.config.v1';

export interface AppConfig {
  apiKey?: string;
  backend?: 'openrouter' | 'ollama' | 'llamacpp';
  model?: string;
  cacheEnabled?: boolean;
}

const DEFAULT_CONFIG: AppConfig = {};

export function getConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch (e) {
    console.error('Failed to clear config:', e);
  }
}

export function hasConfig(): boolean {
  const config = getConfig();
  return !!(config.apiKey || config.backend || config.model);
}

export function getHeaders(): Record<string, string> {
  const config = getConfig();
  const headers: Record<string, string> = {};
  
  if (config.apiKey) {
    headers['X-OpenRouter-Key'] = config.apiKey;
  }
  if (config.model) {
    headers['X-Model-Id'] = config.model;
  }
  if (config.backend) {
    headers['X-Backend'] = config.backend;
  }
  
  return headers;
}

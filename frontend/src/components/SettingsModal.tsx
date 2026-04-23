/**
 * Settings Modal for API key and model configuration
 */

import { useState, useEffect } from 'react';
import { getConfig, saveConfig, clearConfig, AppConfig } from '../lib/config';
import { getHealth as checkHealth } from '../lib/api';
import { clearCache, getCacheStats } from '../lib/cache';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<AppConfig>({});
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [cacheStats, setCacheStats] = useState({ count: 0, bytes: 0 });

  useEffect(() => {
    if (isOpen) {
      setConfig(getConfig());
      setTestStatus('idle');
      setTestMessage('');
      setCacheStats(getCacheStats());
    }
  }, [isOpen]);

  const handleClearCache = () => {
    clearCache();
    setCacheStats({ count: 0, bytes: 0 });
  };

  const cacheEnabled = config.cacheEnabled !== false; // default on

  const handleSave = () => {
    saveConfig(config);
    onClose();
  };

  const handleClear = () => {
    clearConfig();
    setConfig({});
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    
    try {
      // Temporarily save config for the test
      saveConfig(config);
      
      const health = await checkHealth();
      
      // Restore original config if test fails
      if (config.apiKey && !health.has_env_key) {
        // Key was sent via header, check if backend accepted it
        setTestStatus('success');
        setTestMessage('Connection successful! API key is working.');
      } else if (!config.apiKey && !health.has_env_key) {
        setTestStatus('error');
        setTestMessage('No API key configured. Set an API key or configure one in the environment.');
      } else {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-background-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-or-..."
                className="w-full px-3 py-2 bg-background-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              ⚠️ Stored in browser localStorage. Any script on this origin can read it.
            </p>
          </div>

          {/* Backend */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Backend
            </label>
            <select
              value={config.backend || 'openrouter'}
              onChange={(e) => setConfig({ ...config, backend: e.target.value as AppConfig['backend'] })}
              className="w-full px-3 py-2 bg-background-input border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama</option>
              <option value="llamacpp">llama.cpp</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Model ID
            </label>
            <input
              type="text"
              value={config.model || ''}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="leave blank to use server default"
              className="w-full px-3 py-2 bg-background-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cache */}
          <div className="pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  cacheEnabled ? 'bg-fuchsia-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    cacheEnabled ? 'translate-x-4' : ''
                  }`}
                />
              </span>
              <input
                type="checkbox"
                className="hidden"
                checked={cacheEnabled}
                onChange={(e) => setConfig({ ...config, cacheEnabled: e.target.checked })}
              />
              <span className="text-sm">
                <span className="text-text-primary font-medium">Response cache</span>
                <span className="text-text-secondary"> · replay identical runs instantly, skip the API</span>
              </span>
            </label>
            <div className="flex items-center justify-between mt-3 pl-[52px]">
              <div className="text-xs text-text-secondary">
                {cacheStats.count} cached · {(cacheStats.bytes / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={handleClearCache}
                disabled={cacheStats.count === 0}
                className="text-xs text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40 disabled:hover:text-text-secondary"
              >
                Clear cache
              </button>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            {testStatus === 'success' && (
              <span className="text-sm text-green-400">✓ {testMessage}</span>
            )}
            {testStatus === 'error' && (
              <span className="text-sm text-red-400">✗ {testMessage}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-text-secondary hover:text-red-400 transition-colors"
          >
            Clear Settings
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;

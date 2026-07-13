# LLM Provider Separation - Implementation Summary

## Overview

Successfully separated LLM providers into independent modules with complete isolation. The system now supports two providers:

1. **LiteLLM** - OpenAI-compatible API (default, no dependencies)
2. **Gemini** - Google Gemini API (requires @google/genai package)

## Changes Made

### 1. New LLM Abstraction Layer

**Created:** `src/server/llm/`

```
src/server/llm/
├── config.ts          # Unified configuration for both providers
├── types.ts           # LLMProvider interface
├── provider.ts        # Factory + dependency checking
├── gemini/
│   ├── client.ts      # Gemini API wrapper
│   ├── generate.ts    # Story generation via Gemini
│   ├── critique.ts    # Story critique via Gemini
│   └── index.ts       # GeminiProvider class
└── litellm/
    ├── client.ts      # LiteLLM API wrapper
    ├── generate.ts    # Story generation via LiteLLM
    ├── critique.ts    # Story critique via LiteLLM
    └── index.ts       # LiteLLMProvider class
```

### 2. Updated npc-game Module

**Modified:** `src/server/npc-game/`

- `config.ts` - Now uses unified `llmConfig` from `../llm/config.js`
- `llm/client.ts` - Now uses `getLLMProvider()` instead of direct API calls
- `llm/generate.ts`, `dialogue.ts`, `options.ts` - Import `ChatMessage` from `../../llm/types.js`
- `prompts/*.ts` - Import `ChatMessage` from `../../llm/types.js`

### 3. Updated Main Server

**Modified:** `server.ts`

- Removed direct `@google/genai` import
- Removed `getAiClient()` and `generateContentWithFallback()`
- Added `getLLMProvider()` for Writer API endpoints
- Added dependency checking at startup via `checkDependencies()`
- Health endpoint now shows active provider

### 4. Configuration Files

**Modified:** `.env`

```bash
LLM_PROVIDER=litellm  # or 'gemini'

# LiteLLM settings
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://..."
OPENAI_MODEL="GLM-5.2 (res)"
OPENAI_FALLBACK_MODEL="mimo-v2.5"

# Gemini settings (optional)
# GEMINI_API_KEY="your-key"
# GEMINI_MODEL="gemini-3.5-flash"
# GEMINI_FALLBACK_MODEL="gemini-2.5-flash"
```

**Updated:** `.env.example` with comprehensive documentation

### 5. Package Dependencies

**Modified:** `package.json`

- Moved `@google/genai` from `dependencies` to `optionalDependencies`
- This means it's not installed by default
- Users can install it manually if they want Gemini support

### 6. Documentation

**Created:** `docs/LLM_PROVIDERS.md` - Comprehensive guide for LLM provider configuration

## Key Features

### 1. Complete Isolation

- Each provider is in its own module
- No shared code between providers (except types)
- Switching providers doesn't affect other code

### 2. Dependency Checking

**Runtime check:**
```typescript
export async function checkDependencies(provider: LLMProviderType): Promise<void> {
  if (provider === 'gemini') {
    try {
      await import('@google/genai');
      console.log('[LLM] ✓ @google/genai is available');
    } catch (e) {
      throw new Error('[LLM] ✗ @google/genai is not installed...');
    }
  }
}
```

**Optional dependencies:**
```json
{
  "optionalDependencies": {
    "@google/genai": "^2.4.0"
  }
}
```

### 3. Unified Interface

Both providers implement the same interface:

```typescript
export interface LLMProvider {
  chatJSON(messages: ChatMessage[]): Promise<unknown>;
  generateStory(idea: string, type: 'single' | 'campaign'): Promise<any>;
  critiqueStory(...): Promise<any>;
}
```

### 4. Single Entry Point

All LLM requests go through `getLLMProvider()`:

```typescript
const provider = await getLLMProvider();
const result = await provider.generateStory(idea, type);
```

### 5. Fallback Logic

Each provider has its own fallback generators:

- **LiteLLM**: Local fallback for story generation and critique
- **Gemini**: Local fallback for story generation and critique

## Usage

### Switching Providers

1. Edit `.env`:
   ```bash
   LLM_PROVIDER=gemini  # or 'litellm'
   ```

2. Restart server

3. Server checks dependencies and shows error if missing

### Testing

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "mode": "development",
  "llmProvider": "litellm"
}
```

## Benefits

1. **No Breaking Changes**: Existing code continues to work
2. **Easy to Extend**: Can add new providers (OpenAI, Anthropic, etc.)
3. **Dependency Isolation**: Each provider manages its own dependencies
4. **Type Safety**: Unified interface ensures consistency
5. **Runtime Flexibility**: Switch providers via environment variable
6. **Clear Error Messages**: Helpful messages when dependencies are missing

## Migration Path

For users currently using the old setup:

1. Update `.env` with new variables (see `.env.example`)
2. Run `npm install` (will not install @google/genai by default)
3. If using Gemini: `npm install @google/genai`
4. Restart server

## Future Enhancements

Can easily add new providers:

```typescript
// src/server/llm/openai/
export class OpenAIProvider implements LLMProvider {
  async chatJSON(messages: ChatMessage[]): Promise<unknown> { ... }
  async generateStory(...): Promise<any> { ... }
  async critiqueStory(...): Promise<any> { ... }
}
```

Then update `provider.ts`:

```typescript
} else if (provider === 'openai') {
  const { OpenAIProvider } = await import('./openai/index.js');
  return new OpenAIProvider();
}
```

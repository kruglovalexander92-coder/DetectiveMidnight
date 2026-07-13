# LLM Provider Configuration

This project supports two LLM providers for AI-powered features:

## 1. LiteLLM Provider (Recommended)

Uses an OpenAI-compatible API via LiteLLM proxy. No additional dependencies required.

### Configuration

In your `.env` file:

```bash
LLM_PROVIDER=litellm

# LiteLLM settings
OPENAI_API_KEY="sk-your-api-key"
OPENAI_BASE_URL="https://hcbifrost.herocraft.com/litellm/v1"
OPENAI_MODEL="GLM-5.2 (res)"
OPENAI_FALLBACK_MODEL="mimo-v2.5"
```

### Features

- ✅ No additional dependencies
- ✅ Works with any OpenAI-compatible API
- ✅ Supports multiple models with fallback
- ✅ Used for:
  - NeuroInterrogation (NPC dialogue generation)
  - Writer API (story generation and critique)

## 2. Gemini Provider

Uses Google Gemini API. Requires `@google/genai` package.

### Installation

```bash
npm install @google/genai
```

### Configuration

In your `.env` file:

```bash
LLM_PROVIDER=gemini

# Gemini settings
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_FALLBACK_MODEL="gemini-2.5-flash"
```

### Features

- ✅ Google Gemini API
- ✅ Structured output with JSON schemas
- ✅ High-quality content generation
- ⚠️ Requires `@google/genai` package (optional dependency)
- ⚠️ Requires Google API key

## Switching Providers

1. Update `LLM_PROVIDER` in your `.env` file
2. Restart the server
3. The server will check dependencies at startup and show an error if the required package is missing

## Architecture

```
src/server/llm/
├── config.ts          # Unified LLM configuration
├── types.ts           # LLMProvider interface
├── provider.ts        # Provider factory + dependency checking
├── gemini/
│   ├── client.ts      # Gemini client wrapper
│   ├── generate.ts    # Story generation
│   ├── critique.ts    # Story critique
│   └── index.ts       # GeminiProvider class
└── litellm/
    ├── client.ts      # LiteLLM client wrapper
    ├── generate.ts    # Story generation
    ├── critique.ts    # Story critique
    └── index.ts       # LiteLLMProvider class
```

## Dependency Checking

The server checks dependencies at startup:

- **LiteLLM**: No additional dependencies required
- **Gemini**: Requires `@google/genai` (checked via dynamic import)

If a required dependency is missing, the server will exit with a clear error message.

## Package.json

`@google/genai` is listed in `optionalDependencies`, which means:

- It's not installed by default with `npm install`
- Users can install it manually if they want to use Gemini
- The server will work fine without it if using LiteLLM

## Error Messages

### Missing Gemini dependency

```
[LLM] ✗ @google/genai is not installed. Run: npm install @google/genai
```

**Solution**: Install the package or switch to LiteLLM provider

### Missing API keys

```
GEMINI_API_KEY is not defined in environment variables
```

**Solution**: Add the required API key to your `.env` file

## Testing

You can test which provider is active by checking the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Response will include `llmProvider` field:

```json
{
  "status": "ok",
  "mode": "development",
  "llmProvider": "litellm"
}
```

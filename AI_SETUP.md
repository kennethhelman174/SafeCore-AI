# SafeCore Enterprise: AI & Ollama Configuration

## AI Mesh Overview
SafeCore uses **Ollama** as its local AI Inference Engine. This ensures no safety sensitive data ever leaves your local network.

## Setup Requirements
1. **Hardware**: 8GB+ RAM recommended (16GB for best performance).
2. **Service**: Ollama must be running and accessible via API (default port 11434).
3. **Model**: The platform is optimized for `llama3.1:8b`.

## Pulling the Model
On the host or within the AI container:
```bash
ollama pull llama3.1:8b
```
If you are running Ollama in Docker, you can pull the model by executing:
```bash
docker exec -it <ollama-container-name> ollama pull llama3.1:8b
```

## System Prompts
SafeCore provides industrial-grade templates for:
- Hazard Identification
- Step-by-step SOP drafting
- Safety Note Generation
- JSA Risk Assessment

## Troubleshooting
- **Connection Error**: Verify the `AI_OLLAMA_ENDPOINT` in your `.env` file.
- **Slow Response**: Ensure GPU acceleration is enabled if available, or check if other processes are consuming CPU/RAM on the host.

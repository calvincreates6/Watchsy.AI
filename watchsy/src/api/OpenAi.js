import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function toText(resp) {
  return resp?.output_text || resp?.choices?.[0]?.message?.content || "";
}

async function tryResponses(model, userText, systemText, temperature) {
  const resp = await client.responses.create({
    model,
    input: userText,
    instructions: systemText,
    temperature,
  });
  const text = toText(resp);
  if (!text) throw new Error("Empty response text");
  return text;
}

async function tryChat(model, userText, systemText, temperature) {
  const messages = [
    ...(systemText ? [{ role: "system", content: systemText }] : []),
    { role: "user", content: userText },
  ];
  const chat = await client.chat.completions.create({
    model,
    messages,
    temperature,
  });
  const text = toText(chat);
  if (!text) throw new Error("Empty chat completion text");
  return text;
}

function withTimeout(promise, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("openai-timeout")), ms)),
  ]);
}

export async function askOpenAI(input, opts = {}) {
  const { model = "gpt-4o-mini", temperature = 0.3, system } = opts;
  const userText = String(input || "");
  const systemText = system ? String(system) : undefined;

  const modelsToTry = [model, "gpt-4o-mini"].filter((v, i, a) => !!v && a.indexOf(v) === i);
  const errors = [];

  for (const m of modelsToTry) {
    try {
      try {
        const text = await withTimeout(tryResponses(m, userText, systemText, temperature));
        return text;
      } catch (e1) {
        errors.push(`[${m}] responses: ${e1?.message || e1}`);
        const text = await withTimeout(tryChat(m, userText, systemText, temperature));
        return text;
      }
    } catch (e2) {
      errors.push(`[${m}] chat: ${e2?.message || e2}`);
      // If 429/quota, continue to next model; otherwise keep going
      continue;
    }
  }

  throw new Error(errors.join(" | "));
}

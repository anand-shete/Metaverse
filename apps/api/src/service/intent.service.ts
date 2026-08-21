import { IUserIntent } from "@metaverse/shared/interface";
import { env, groq } from "@config/index.config";

export const checkUserIntent = async (message: string): Promise<IUserIntent> => {
  const prompt = `
    SYSTEM: You are Metabot's intent classifier. 
    Classify the user's message into "retrieve" or "info".

    INTENT RULES:
    1. "retrieve": ANY request for data, files, "stuff", papers, or content. 
       - Keywords: "get", "give me", "find", "show", "stuff", "notes", "papers".
       - Example: "get me AAI stuff", "show RL notes".
    
    2. "info": ONLY when the user asks "Who are you?", "How do you work?", or "What can you do?". 
       - If the user mentions a SUBJECT (like AAI, RL, OS), it is ALWAYS "retrieve".

    OUTPUT:
    Return ONLY JSON:
    {
      "intent": "retrieve" | "info",
      "confidence": number
    }`;

  const response = await groq.chat.completions.create({
    model: env.GROQ_QUICK_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    top_p: 1,
    stream: false,
  });

  const content = response?.choices[0]?.message?.content;
  if (!content) return { success: false };

  const object = JSON.parse(content) as Omit<IUserIntent, "success">;

  return { success: true, ...object };
};

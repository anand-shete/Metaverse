import { env } from "@config/env.config";
import { groq } from "@config/groq.config";
import { IFilter, IFilterResponse, IMetabotServiceResponse } from "@metaverse/shared/interface";

export class Retrieve {
  static async getFiltersFromUserQuery(message: string): Promise<IFilterResponse> {
    const triggerRetrievalPrompt = `
    You are a search query parser for a student bot.
    Convert the user's message into a JSON filter for a MongoDB query.

    ### SCHEMA:
    {
      "subject": "PM" | "RL" | "AAI" | "SMA" | "OS" | "DBMS",
      "noteType": "notes" | "question_paper" | "syllabus",
      "chapter": number
    }

    ### MAPPING RULES:
    1. **subject**: Map keywords to abbreviations:
       - Project Management -> "PM"
       - Reinforcement Learning -> "RL"
       - Applied AI / Artificial Intelligence -> "AAI"
       - Social Media -> "SMA"
       - Operating Systems -> "OS"
       - Database / SQL -> "DBMS"
    2. **noteType**: 
       - "notes": Mention of notes, ppts, slides, material.
       - "question_paper": Mention of QB, bank, exam, papers, pyq.
       - "syllabus": Mention of curriculum, index, topics.
    3. **chapter**: Extract as an Integer only. 

    ### OUTPUT RULES:
    - Return a JSON object with ONLY the fields identified in the user message.
    - If a field is not mentioned, **OMIT** it.
    - If no fields are found, return {}.
    - Do NOT include markdown code blocks or preamble.

    ### EXAMPLES:
    User: "show me SMA chapter 3 notes"
    Response: {"subject": "SMA", "chapter": 3, "noteType": "notes"}

    User: "database question papers"
    Response: {"subject": "DBMS", "noteType": "question_paper"}

    USER MESSAGE: "${message}"
    RESPONSE:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: triggerRetrievalPrompt }],
      model: env.GROQ_QUICK_MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      top_p: 1,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, filter: {} };
    }

    const rawFilter: IFilter = JSON.parse(content);
    const filterNullValues = Object.entries(rawFilter).filter(([, value]) => value !== null);

    return {
      success: true,
      filter: Object.fromEntries(filterNullValues),
    };
  }

  static async generateFinalResponse(
    message: string,
    summary: {
      count: number;
      subject: string;
      noteType: string;
      chapter: string | number;
    },
  ): Promise<IMetabotServiceResponse> {
    const finalResponsePrompt = `
    You are Metabot, a concise study assistant. Use the User's Message to inform tone, but rely strictly on the DATA for facts.

    ### DATA:
    - Total Found: ${summary.count}
    - Subject: ${summary.subject}
    - Type: ${summary.noteType}
    - Chapter: ${summary.chapter}

    ### USER'S MESSAGE:
    "${message}"

    ### TASK:
    Write a friendly response consisting of 2 to 3 short sentences.
    Sentence 1: Acknowledge the user's specific request.
    Sentence 2: State exactly what was found based on the DATA.
    Sentence 3: (Optional) A short helpful closing.

    ### RULES:
    - If Total Found is 0, explain that you searched the archives but couldn't find a match.
    - Match the user's energy (e.g., if they are casual, be casual).
    - Use "various" if the Subject or Chapter is mixed.
    - Avoid repeating the same sentence structures across responses.
    - No markdown, no filenames, and no list.
    - Output ONLY plain text sentences.

    ### EXAMPLE:
    User: "yo get me some RL ppts"
    Response: "Yo! I've scanned the Metaverse archives for those Reinforcement Learning materials. I found 4 notes that match your request. I've listed them down below for you!"

    RESPONSE:`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful study assistant." },
        { role: "user", content: finalResponsePrompt },
      ],
      model: env.GROQ_QUICK_MODEL,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return { success: false, message: "Could not generate a final response" };

    return { success: true, message: content };
  }
}

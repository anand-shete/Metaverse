export enum Avatar {
  BOY1 = "boy1",
  BOY2 = "boy2",
  GIRL1 = "girl1",
  GIRL2 = "girl2",
}

export enum ChatUserType {
  USER = "user",
  METABOT = "metabot",
}

export const DocType = ["pdf", "docx", "pptx", "txt"] as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

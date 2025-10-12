import { KEYWORDS, Token, TokenType } from "./tokens.ts";

export class Tokenizer {
  private source: string;
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    // TODO: Implement tokenization
    return [];
  }
}

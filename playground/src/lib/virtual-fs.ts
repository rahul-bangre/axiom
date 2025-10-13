export class VirtualFS {
  private files: Map<string, string> = new Map();

  constructor(initial_files?: Record<string, string>) {
    if (initial_files) {
      for (const [path, content] of Object.entries(initial_files)) {
        this.files.set(path, content);
      }
    }
  }

  readFile(path: string): string | null {
    return this.files.get(path) || null;
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  deleteFile(path: string): boolean {
    return this.files.delete(path);
  }

  renameFile(old_path: string, new_path: string): boolean {
    const content = this.files.get(old_path);
    if (!content) return false;
    this.files.set(new_path, content);
    this.files.delete(old_path);
    return true;
  }

  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  listFiles(): string[] {
    return Array.from(this.files.keys()).sort();
  }

  clear(): void {
    this.files.clear();
  }

  getAllFiles(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [path, content] of this.files.entries()) {
      result[path] = content;
    }
    return result;
  }
}

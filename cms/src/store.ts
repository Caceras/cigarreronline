/**
 * Working copy of the content: loaded from GitHub, edited in memory, published as one commit.
 * Edits survive a restart because the staging file is written to disk.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  validateContent, productSchema, guideSchema, collectionSchema, brandSchema,
  type Product, type Guide, type Collection, type Brand,
} from '../../content/schema.js';
import { readFile, commitFiles, type RepoConfig } from './github.js';

export type Kind = 'products' | 'brands' | 'guides' | 'collections';
const FILES: Record<Kind, string> = {
  products: 'content/products.json',
  brands: 'content/brands.json',
  guides: 'content/guides.json',
  collections: 'content/collections.json',
};

export interface Snapshot {
  products: Product[];
  brands: Brand[];
  guides: Guide[];
  collections: Collection[];
}

export class Store {
  private data: Snapshot | null = null;
  private dirty = new Set<Kind>();
  private log: string[] = [];
  private loadedAt = 0;

  constructor(private cfg: RepoConfig, private stagingFile = '/data/staging.json') {}

  /** Reads from GitHub, unless there are unpublished edits, which always win. */
  async load(force = false): Promise<Snapshot> {
    this.restore();
    if (this.data && !force && (this.dirty.size > 0 || Date.now() - this.loadedAt < 60_000)) return this.data;
    if (this.dirty.size > 0 && !force) return this.data!;

    const [products, brands, guides, collections] = await Promise.all(
      (['products', 'brands', 'guides', 'collections'] as Kind[]).map(async (k) => JSON.parse(await readFile(this.cfg, FILES[k]))),
    );
    this.data = validateContent({ products, brands, guides, collections }) as Snapshot;
    this.loadedAt = Date.now();
    return this.data;
  }

  private restore() {
    if (this.data || !fs.existsSync(this.stagingFile)) return;
    try {
      const saved = JSON.parse(fs.readFileSync(this.stagingFile, 'utf8'));
      this.data = saved.data;
      this.dirty = new Set(saved.dirty);
      this.log = saved.log ?? [];
    } catch {
      /* corrupt staging file: ignore and reload from GitHub */
    }
  }

  private persist() {
    try {
      fs.mkdirSync(path.dirname(this.stagingFile), { recursive: true });
      fs.writeFileSync(this.stagingFile, JSON.stringify({ data: this.data, dirty: [...this.dirty], log: this.log }));
    } catch {
      /* staging is a convenience; a failed write must not fail the edit */
    }
  }

  /** Applies a change, re-validates everything, and records it for the publish message. */
  private async change(kind: Kind, note: string, apply: (s: Snapshot) => void) {
    const s = await this.load();
    const before = JSON.stringify(s);
    apply(s);
    try {
      validateContent(s);
    } catch (e) {
      this.data = JSON.parse(before); // roll back, keep the working copy valid
      throw e;
    }
    this.dirty.add(kind);
    this.log.push(note);
    this.persist();
  }

  async upsertProduct(input: unknown) {
    const p = productSchema.parse(input);
    let created = false;
    await this.change('products', '', (s) => {
      const i = s.products.findIndex((x) => x.id === p.id);
      if (i === -1) { s.products.push(p); created = true; } else s.products[i] = p;
    });
    this.log[this.log.length - 1] = `${created ? 'lägg till' : 'uppdatera'} produkt ${p.id}`;
    this.persist();
    return { created, product: p };
  }

  async patchProduct(id: string, patch: Record<string, unknown>) {
    const s = await this.load();
    const current = s.products.find((x) => x.id === id);
    if (!current) throw new Error(`No product "${id}"`);
    const next = productSchema.parse({ ...current, ...patch });
    await this.change('products', `uppdatera ${id} (${Object.keys(patch).join(', ')})`, (st) => {
      st.products[st.products.findIndex((x) => x.id === id)] = next;
    });
    return next;
  }

  async deleteProduct(id: string) {
    await this.change('products', `ta bort produkt ${id}`, (s) => {
      const i = s.products.findIndex((x) => x.id === id);
      if (i === -1) throw new Error(`No product "${id}"`);
      s.products.splice(i, 1);
    });
  }

  async upsertGuide(input: unknown) {
    const g = guideSchema.parse(input);
    await this.change('guides', `guide ${g.slug}`, (s) => {
      const i = s.guides.findIndex((x) => x.slug === g.slug);
      if (i === -1) s.guides.unshift(g); else s.guides[i] = g;
    });
    return g;
  }

  async updateCollection(path: string, patch: Record<string, unknown>) {
    const s = await this.load();
    const current = s.collections.find((c) => c.path === path);
    if (!current) throw new Error(`No collection "${path}"`);
    const next = collectionSchema.parse({ ...current, ...patch });
    await this.change('collections', `sida ${path} (${Object.keys(patch).join(', ')})`, (st) => {
      st.collections[st.collections.findIndex((c) => c.path === path)] = next;
    });
    return next;
  }

  async updateBrand(id: string, patch: Record<string, unknown>) {
    const s = await this.load();
    const current = s.brands.find((b) => b.id === id);
    if (!current) throw new Error(`No brand "${id}"`);
    const next = brandSchema.parse({ ...current, ...patch });
    await this.change('brands', `märke ${id}`, (st) => {
      st.brands[st.brands.findIndex((b) => b.id === id)] = next;
    });
    return next;
  }

  pending() {
    this.restore();
    return { files: [...this.dirty], changes: [...this.log] };
  }

  async discard() {
    this.data = null;
    this.dirty.clear();
    this.log = [];
    try { fs.rmSync(this.stagingFile, { force: true }); } catch {}
    await this.load(true);
  }

  async publish(message?: string) {
    this.restore();
    if (!this.data || this.dirty.size === 0) return { published: false as const, reason: 'Inga ändringar att publicera.' };
    validateContent(this.data);
    const files = [...this.dirty].map((k) => ({
      path: FILES[k],
      content: JSON.stringify(this.data![k], null, 2) + '\n',
    }));
    const summary = message ?? (this.log.length <= 3 ? this.log.join(', ') : `${this.log.length} innehållsändringar`);
    const commit = await commitFiles(this.cfg, files, `content: ${summary}`);
    this.dirty.clear();
    this.log = [];
    this.persist();
    return { published: true as const, ...commit, files: files.map((f) => f.path) };
  }
}

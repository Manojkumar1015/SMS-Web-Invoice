import { ClassificationRepository, ClassificationQueryOptions } from '@/repositories/classification.repository';
import { ItemClassification } from '@/types/classification';

export class ClassificationService {
  private repo = new ClassificationRepository();

  private mapRowToClassification(row: any): ItemClassification {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      classificationType: row.classification_type,
      relevance: row.relevance || undefined,
      isActive: !!row.is_active,
      createdAt: row.created_at,
    };
  }

  async listClassifications(options?: ClassificationQueryOptions): Promise<ItemClassification[]> {
    const rows = await this.repo.list(options);
    return rows.map((r: any) => this.mapRowToClassification(r));
  }

  async getClassificationById(id: string): Promise<ItemClassification | null> {
    const row = await this.repo.getById(id);
    return row ? this.mapRowToClassification(row) : null;
  }
}

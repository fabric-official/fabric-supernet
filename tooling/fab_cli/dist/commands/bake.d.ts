/**
 * Bake immutable fields into model.yaml (serial_id, sign_date, manifest_sig).
 */
export declare function bakeModel(yamlPath: string): Promise<void>;

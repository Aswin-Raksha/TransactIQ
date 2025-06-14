from src import preprocess, enrich

def main():
    input_path = "data/spend_raw.csv"
    output_path = "data/spend_enriched.csv"

    print("[INFO] Loading and preprocessing data...")
    df = preprocess.load_data(input_path)

    print("[INFO] Enriching data using OpenAI GPT...")
    enriched_df = enrich.enrich_data(df)

    print("[INFO] Saving enriched data...")
    enriched_df.to_csv(output_path, index=False)
    print(f"[DONE] Enriched data saved to: {output_path}")

if __name__ == "__main__":
    main()

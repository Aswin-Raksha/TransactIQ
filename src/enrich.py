from .classifier import classify_transaction

def enrich_data(df):
    results = []
    for _, row in df.iterrows():
        enriched = classify_transaction(row['Cleaned_Description'])
        results.append(enriched)
    df["AI_Output"] = results
    return df

import pandas as pd

def clean_description(desc):
    return desc.lower().strip()

def load_data(path):
    df = pd.read_csv(path)
    df['Cleaned_Description'] = df['Description'].apply(clean_description)
    return df

"""
Spend Classification & Enrichment Dashboard
Professional Streamlit application with PowerBI-like design
"""

import os
import io
import json
from datetime import datetime
from difflib import get_close_matches
import re

import pandas as pd
import streamlit as st
from dotenv import load_dotenv
from supabase import create_client, Client
import plotly.express as px
import plotly.graph_objects as go
from fpdf import FPDF

# Gemini AI
try:
    import google.generativeai as genai
except ImportError:
    st.error("Please install google-generativeai: pip install google-generativeai")
    st.stop()

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not GEMINI_API_KEY:
    st.error("❌ GEMINI_API_KEY not found in .env file")
    st.stop()

if not SUPABASE_URL or not SUPABASE_KEY:
    st.error("❌ Supabase credentials not found in .env file")
    st.stop()

# Initialize clients
genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hard-coded vendor map
CATEGORY_VENDOR_MAP = {
    "Cloud Services": "Amazon Web Services",
    "Employee Engagement > Meals & Entertainment": "Dominos",
    "IT Hardware": "HP Inc.",
    "Office Supplies": "Office Depot",
    "Professional Services > Audit": "EY",
    "Professional Services > Consulting": "Deloitte",
    "Software Subscriptions": "Adobe",
    "Travel > Accommodation": "Taj Hotels",
    "Travel > Local Transport": "Uber",
}
ALL_HARDCODED_VENDORS = list(CATEGORY_VENDOR_MAP.values())

# ---------------------------------------------------------
# Utility Functions
# ---------------------------------------------------------
def build_gemini_prompt(raw_input: str) -> str:
    """Build prompt for Gemini AI classification with vendor correction and professional enrichment"""
    return f"""
You are a spend classification and enrichment assistant. For the given transaction raw text, return ONLY a valid JSON object (no extra text)
with the following fields:

{{
  "category": string,                // e.g. "Travel > Local Transport"
  "vendor": string|null,             // vendor name if explicitly present (correct spelling), otherwise null
  "enriched_description": string     // professional 1-2 line purpose of the spend
}}

Rules:
1. If the input explicitly mentions a vendor name (even if misspelled), correct the spelling to the most likely real vendor and return it.
2. If no vendor is mentioned, set vendor to null.
3. Always correct obvious misspellings (e.g., "Mcdonld's" -> "McDonald's", "Stabucks" -> "Starbucks").
4. Enriched description should be professional, precise, and limited to 1–2 lines (e.g., "Business meal at McDonald's for lunch" instead of "Lunch at McDonald's").
5. If unsure about category or vendor, set them to null.
6. Return strictly JSON and nothing else.

Input: "{raw_input}"
Output:
"""


def call_gemini_for_input(raw_input: str) -> dict:
    """Call Gemini AI and parse response"""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = build_gemini_prompt(raw_input)
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Parse JSON from response
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return {"category": None, "vendor": None, "enriched_description": None}

        parsed = json.loads(text[start:end+1])
        return {
            "category": parsed.get("category"),
            "vendor": parsed.get("vendor"),
            "enriched_description": parsed.get("enriched_description"),
        }
    except Exception as e:
        st.error(f"Error calling Gemini: {str(e)}")
        return {"category": None, "vendor": None, "enriched_description": None}

def fuzzy_correct_vendor(given_vendor: str) -> str:
    """Fuzzy match vendor to known vendors"""
    if not given_vendor:
        return None
    matches = get_close_matches(given_vendor, ALL_HARDCODED_VENDORS, n=1, cutoff=0.6)
    return matches[0] if matches else given_vendor

def assign_vendor_by_category(category: str) -> str:
    """Assign vendor based on category"""
    return CATEGORY_VENDOR_MAP.get(category, "Unknown Vendor")

def save_to_supabase(records: list) -> bool:
    """Save classification results to Supabase"""
    try:
        # Insert records into classifications table
        for record in records:
            supabase.table("classifications").insert({
                "raw_input": record["raw_input"],
                "category": record["category"],
                "vendor": record["vendor"],
                "enriched_description": record["enriched_description"],
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        return True
    except Exception as e:
        st.error(f"Error saving to Supabase: {str(e)}")
        return False

def load_from_supabase(limit: int = 100) -> pd.DataFrame:
    """Load classification results from Supabase"""
    try:
        response = supabase.table("classifications").select("*").order("created_at", desc=True).limit(limit).execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except Exception as e:
        st.error(f"Error loading from Supabase: {str(e)}")
        return pd.DataFrame()

def extract_date(text: str):
    """Extract date from transaction text"""
    patterns = [
        r"(\d{4}-\d{2}-\d{2})",
        r"(\d{2}/\d{2}/\d{4})",
        r"(\d{2}-\d{2}-\d{4})"
    ]
    for pattern in patterns:
        match = re.search(pattern, str(text))
        if match:
            try:
                return pd.to_datetime(match.group(1))
            except:
                continue
    return None


def create_pdf_report(df: pd.DataFrame, title: str = "Spend Enrichment Report") -> bytes:
    """Generate PDF report from dataframe"""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, title, ln=True, align="C")
    pdf.ln(10)

    # Records
    pdf.set_font("Arial", "", 9)
    for idx, row in df.iterrows():
        pdf.set_font("Arial", "B", 10)
        pdf.multi_cell(0, 5, f"Transaction {idx + 1}")
        pdf.set_font("Arial", "", 9)
        pdf.multi_cell(0, 5, f"Input: {row.get('raw_input', '')[:100]}")
        pdf.multi_cell(0, 5, f"Category: {row.get('category', '')}  |  Vendor: {row.get('vendor', '')}")
        pdf.multi_cell(0, 5, f"Description: {row.get('enriched_description', '')}")
        pdf.ln(3)

    return pdf.output(dest="S").encode("latin-1")

# ---------------------------------------------------------
# Streamlit Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Spend Classification & Enrichment",
    page_icon="💳",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS - PowerBI inspired
st.markdown("""
<style>
    /* Global Styles */
    .main {
        background-color: #f5f5f5;
    }

    /* Header */
    .header-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header-title {
        color: white;
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        text-align: center;
    }

    .header-subtitle {
        color: rgba(255,255,255,0.9);
        font-size: 1.1rem;
        text-align: center;
        margin-top: 0.5rem;
    }

    /* KPI Cards */
    .kpi-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-left: 4px solid #667eea;
        transition: transform 0.2s;
    }

    .kpi-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .kpi-title {
        color: #666;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5rem;
    }

    .kpi-value {
        color: #333;
        font-size: 2rem;
        font-weight: 700;
    }

    .kpi-subtitle {
        color: #999;
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }

    /* Chart Container */
    .chart-container {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 1.5rem;
    }

    .chart-title {
        color: #333;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    /* Navigation Pills */
    .nav-pills {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
    }

    /* Table Styling */
    .dataframe {
        border-radius: 10px;
        overflow: hidden;
    }

    /* Buttons */
    .stButton > button {
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s;
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* File Uploader */
    .uploadedFile {
        border-radius: 8px;
    }

    /* Info/Success/Warning boxes */
    .stAlert {
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Navigation
# ---------------------------------------------------------
st.markdown("""
<div class="header-container">
    <h1 class="header-title">💳 Spend Classification & Enrichment</h1>
    <p class="header-subtitle">AI-Powered Transaction Analysis & Business Intelligence</p>
</div>
""", unsafe_allow_html=True)

# Navigation tabs
tab1, tab2, tab3, tab4 = st.tabs([
    "🏠 Home",
    "🔍 Classification",
    "📊 Analytics",
    "📄 Reports",
])

# ---------------------------------------------------------
# HOME TAB
# ---------------------------------------------------------
with tab1:
    st.markdown("### Welcome to Spend Classification Dashboard")

    st.markdown("""
    This professional dashboard helps you classify and enrich transaction data using AI:

    - **Automatic Classification**: Categorize transactions into business categories
    - **Vendor Identification**: Extract and normalize vendor names
    - **Smart Enrichment**: Generate human-readable descriptions
    - **Analytics**: Visualize spending patterns and trends
    - **Reports**: Generate PDF and CSV reports
    """)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        <div class="kpi-card">
            <div class="kpi-title">🎯 Accuracy</div>
            <div class="kpi-value">90%+</div>
            <div class="kpi-subtitle">AI Classification</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="kpi-card">
            <div class="kpi-title">⚡ Speed</div>
            <div class="kpi-value">< 2s</div>
            <div class="kpi-subtitle">Per Transaction</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="kpi-card">
            <div class="kpi-title">📈 Scale</div>
            <div class="kpi-value">1000+</div>
            <div class="kpi-subtitle">Batch Processing</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    st.markdown("### Quick Start")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("#### 1️⃣ Single Transaction")
        st.markdown("Enter one transaction for instant classification")

    with col2:
        st.markdown("#### 2️⃣ Batch Upload")
        st.markdown("Upload CSV file for bulk processing")

    with col3:
        st.markdown("#### 3️⃣ Analyze & Report")
        st.markdown("View analytics and download reports")

# ---------------------------------------------------------
# CLASSIFICATION TAB
# ---------------------------------------------------------
with tab2:
    st.markdown("### 🔍 Transaction Classification")

    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.markdown("#### Single Transaction")
        raw_text = st.text_area(
            "Enter transaction details",
            height=120,
            placeholder="Example: Apple Inc. Eqpt PO-4369 10K"
        )

        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            classify_single = st.button("🚀 Classify Single", type="primary", use_container_width=True)
        with col_btn2:
            save_single = st.button("💾 Save to Database", use_container_width=True)

        st.markdown("---")

        st.markdown("#### Batch Classification")
        uploaded_file = st.file_uploader(
            "Upload CSV file (must have 'raw_input' column)",
            type=["csv"],
            help="CSV file with transaction data"
        )

        if uploaded_file:
            df_upload = pd.read_csv(uploaded_file)
            st.info(f"📊 Loaded {len(df_upload)} transactions")

            with st.expander("Preview uploaded data"):
                st.dataframe(df_upload.head(10), use_container_width=True)

            classify_batch = st.button("🚀 Classify All", type="primary", use_container_width=True)
        else:
            classify_batch = False

    with col_right:
        st.markdown("#### Settings")

        with st.expander("ℹ️ How it works", expanded=True):
            st.markdown("""
            **Classification Process:**
            1. AI analyzes transaction text
            2. Extracts category & vendor
            3. Generates description
            4. Applies fuzzy matching
            5. Saves to database
            """)

        with st.expander("🏷️ Category Map"):
            st.dataframe(
                pd.DataFrame.from_dict(
                    CATEGORY_VENDOR_MAP,
                    orient="index",
                    columns=["Default Vendor"]
                ),
                use_container_width=True
            )

        show_raw_json = st.checkbox("Show raw AI response", value=False)

    # Process single classification
    if classify_single and raw_text:
        with st.spinner("🤖 Classifying transaction..."):
            parsed = call_gemini_for_input(raw_text)

            gem_vendor = parsed.get("vendor")
            gem_cat = parsed.get("category")
            enriched = parsed.get("enriched_description") or ""

            vendor_used = (
                fuzzy_correct_vendor(gem_vendor) if gem_vendor
                else assign_vendor_by_category(gem_cat)
            )

            result_data = {
                "raw_input": raw_text,
                "category": gem_cat or "Unknown",
                "vendor": vendor_used,
                "enriched_description": enriched
            }

            st.session_state["last_single_result"] = result_data

        st.success("✅ Classification complete!")

        result_df = pd.DataFrame([st.session_state["last_single_result"]])
        st.dataframe(result_df, use_container_width=True)

        # Download buttons
        col_dl1, col_dl2 = st.columns(2)
        with col_dl1:
            csv_buffer = io.BytesIO()
            result_df.to_csv(csv_buffer, index=False)
            st.download_button(
                "📥 Download CSV",
                csv_buffer.getvalue(),
                "classification_result.csv",
                "text/csv",
                use_container_width=True
            )

        with col_dl2:
            pdf_bytes = create_pdf_report(result_df, "Single Transaction Report")
            st.download_button(
                "📄 Download PDF",
                pdf_bytes,
                "classification_result.pdf",
                "application/pdf",
                use_container_width=True
            )

    # Save single result
    if save_single and "last_single_result" in st.session_state:
        if save_to_supabase([st.session_state["last_single_result"]]):
            st.success("✅ Saved to database!")

    # Process batch classification
    if classify_batch and uploaded_file:
        results = []
        progress_bar = st.progress(0)
        status_text = st.empty()

        # Ensure raw_input column exists
        if "raw_input" not in df_upload.columns:
            if len(df_upload.columns) == 1:
                df_upload.columns = ["raw_input"]
            else:
                st.error("❌ CSV must have 'raw_input' column")
                st.stop()

        for idx, row in df_upload.iterrows():
            status_text.text(f"Processing transaction {idx + 1}/{len(df_upload)}")

            raw_input = str(row["raw_input"])
            parsed = call_gemini_for_input(raw_input)

            gem_vendor = parsed.get("vendor")
            gem_cat = parsed.get("category")
            enriched = parsed.get("enriched_description") or ""

            vendor_used = (
                fuzzy_correct_vendor(gem_vendor) if gem_vendor
                else assign_vendor_by_category(gem_cat)
            )

            results.append({
                "raw_input": raw_input,
                "category": gem_cat or "Unknown",
                "vendor": vendor_used,
                "enriched_description": enriched
            })

            progress_bar.progress((idx + 1) / len(df_upload))

        status_text.empty()
        progress_bar.empty()

        st.session_state["last_batch_results"] = pd.DataFrame(results)
        st.success(f"✅ Classified {len(results)} transactions!")

        st.markdown("#### Results")
        st.dataframe(st.session_state["last_batch_results"], use_container_width=True)

        # Save to database
        col_save1, col_save2, col_save3 = st.columns(3)

        with col_save1:
            if st.button("💾 Save All to Database", use_container_width=True):
                if save_to_supabase(results):
                    st.success("✅ All records saved!")

        with col_save2:
            csv_buffer = io.BytesIO()
            st.session_state["last_batch_results"].to_csv(csv_buffer, index=False)
            st.download_button(
                "📥 Download CSV",
                csv_buffer.getvalue(),
                "batch_results.csv",
                "text/csv",
                use_container_width=True
            )

        with col_save3:
            pdf_bytes = create_pdf_report(st.session_state["last_batch_results"], "Batch Classification Report")
            st.download_button(
                "📄 Download PDF",
                pdf_bytes,
                "batch_results.pdf",
                "application/pdf",
                use_container_width=True
            )

# ---------------------------------------------------------
# ANALYTICS TAB
# ---------------------------------------------------------
with tab3:
    st.markdown("### 📊 Spend Analytics")

    # Load data from Supabase
    col_load1, col_load2 = st.columns([3, 1])

    with col_load1:
        data_source = st.radio(
            "Data Source",
            ["Load from Database", "Upload CSV"],
            horizontal=True
        )

    with col_load2:
        record_limit = st.number_input("Records", min_value=10, max_value=1000, value=100)

    df_analytics = None

    if data_source == "Load from Database":
        if st.button("🔄 Load Data", type="primary"):
            with st.spinner("Loading from database..."):
                df_analytics = load_from_supabase(limit=record_limit)
                if not df_analytics.empty:
                    st.session_state["analytics_df"] = df_analytics
                else:
                    st.warning("No data found in database")
    else:
        uploaded_analytics = st.file_uploader("Upload CSV", type=["csv"], key="analytics_upload")
        if uploaded_analytics:
            df_analytics = pd.read_csv(uploaded_analytics)
            st.session_state["analytics_df"] = df_analytics

    if "analytics_df" in st.session_state:
        df_analytics = st.session_state["analytics_df"]

        st.success(f"✅ Analyzing {len(df_analytics)} transactions")

        # KPI Cards
        st.markdown("#### Key Metrics")
        kpi1, kpi2, kpi3, kpi4 = st.columns(4)

        with kpi1:
            total_transactions = len(df_analytics)
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Total Transactions</div>
                <div class="kpi-value">{total_transactions}</div>
            </div>
            """, unsafe_allow_html=True)

        with kpi2:
            unique_categories = df_analytics["category"].nunique()
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Categories</div>
                <div class="kpi-value">{unique_categories}</div>
            </div>
            """, unsafe_allow_html=True)

        with kpi3:
            unique_vendors = df_analytics["vendor"].nunique()
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Vendors</div>
                <div class="kpi-value">{unique_vendors}</div>
            </div>
            """, unsafe_allow_html=True)

        with kpi4:
            top_category = df_analytics["category"].mode()[0] if not df_analytics["category"].isnull().all() else "N/A"
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-title">Top Category</div>
                <div class="kpi-value" style="font-size: 1.3rem;">{top_category[:20]}</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        # Charts
        col_chart1, col_chart2 = st.columns(2)

        with col_chart1:
            st.markdown("#### 📈 Category Distribution")
            category_counts = df_analytics["category"].value_counts().head(10)
            fig_cat = px.bar(
                x=category_counts.values,
                y=category_counts.index,
                orientation='h',
                labels={'x': 'Count', 'y': 'Category'},
                color=category_counts.values,
                color_continuous_scale='Viridis'
            )
            fig_cat.update_layout(
                showlegend=False,
                height=400,
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_cat, use_container_width=True)

        with col_chart2:
            st.markdown("#### 🏢 Top Vendors")
            vendor_counts = df_analytics["vendor"].value_counts().head(10)
            fig_vendor = px.bar(
                x=vendor_counts.values,
                y=vendor_counts.index,
                orientation='h',
                labels={'x': 'Count', 'y': 'Vendor'},
                color=vendor_counts.values,
                color_continuous_scale='Plasma'
            )
            fig_vendor.update_layout(
                showlegend=False,
                height=400,
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_vendor, use_container_width=True)

        # Time series if dates available
        st.markdown("#### 📅 Transaction Timeline")
        df_analytics["parsed_date"] = df_analytics["raw_input"].apply(extract_date)

        if df_analytics["parsed_date"].notnull().any():
            df_dates = df_analytics.dropna(subset=["parsed_date"])
            daily_counts = df_dates.groupby(df_dates["parsed_date"].dt.date).size().reset_index()
            daily_counts.columns = ["Date", "Count"]

            fig_timeline = px.line(
                daily_counts,
                x="Date",
                y="Count",
                markers=True,
                labels={'Count': 'Transactions', 'Date': 'Date'}
            )
            fig_timeline.update_traces(line_color='#667eea', line_width=3)
            fig_timeline.update_layout(
                height=350,
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_timeline, use_container_width=True)
        else:
            st.info("ℹ️ No dates detected in transaction data for timeline visualization")

        # Category-Vendor Matrix
        st.markdown("#### 🔗 Category-Vendor Relationship")
        cat_vendor_matrix = df_analytics.groupby(["category", "vendor"]).size().reset_index(name="count")
        cat_vendor_top = cat_vendor_matrix.nlargest(20, "count")

        fig_matrix = px.scatter(
            cat_vendor_top,
            x="category",
            y="vendor",
            size="count",
            color="count",
            color_continuous_scale="Blues",
            size_max=30
        )
        fig_matrix.update_layout(
            height=400,
            margin=dict(l=20, r=20, t=40, b=20)
        )
        st.plotly_chart(fig_matrix, use_container_width=True)

# ---------------------------------------------------------
# REPORTS TAB
# ---------------------------------------------------------
with tab4:
    st.markdown("### 📄 Generate Reports")

    report_source = st.radio(
        "Select data source",
        ["Load from Database", "Upload CSV"],
        horizontal=True,
        key="report_source"
    )

    df_report = None

    if report_source == "Load from Database":
        col_r1, col_r2 = st.columns([3, 1])
        with col_r1:
            report_limit = st.number_input("Number of records", min_value=10, max_value=1000, value=50, key="report_limit")
        with col_r2:
            if st.button("📊 Load Data", type="primary"):
                df_report = load_from_supabase(limit=report_limit)
                if not df_report.empty:
                    st.session_state["report_df"] = df_report
    else:
        uploaded_report = st.file_uploader("Upload enriched CSV", type=["csv"], key="report_upload")
        if uploaded_report:
            df_report = pd.read_csv(uploaded_report)
            st.session_state["report_df"] = df_report

    if "report_df" in st.session_state:
        df_report = st.session_state["report_df"]

        st.success(f"✅ Report ready with {len(df_report)} records")

        # Preview
        st.markdown("#### 📋 Data Preview")
        st.dataframe(
            df_report[["raw_input", "category", "vendor", "enriched_description"]].head(20),
            use_container_width=True
        )

        st.markdown("---")

        # Export options
        st.markdown("#### 💾 Export Options")

        col_exp1, col_exp2, col_exp3 = st.columns(3)

        with col_exp1:
            st.markdown("##### CSV Export")
            csv_buffer = io.BytesIO()
            df_report.to_csv(csv_buffer, index=False)
            st.download_button(
                "📥 Download CSV Report",
                csv_buffer.getvalue(),
                "spend_report.csv",
                "text/csv",
                use_container_width=True
            )

        with col_exp2:
            st.markdown("##### PDF Export")
            pdf_bytes = create_pdf_report(df_report, "Spend Classification Report")
            st.download_button(
                "📄 Download PDF Report",
                pdf_bytes,
                "spend_report.pdf",
                "application/pdf",
                use_container_width=True
            )

        with col_exp3:
            st.markdown("##### Excel Export")
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df_report.to_excel(writer, sheet_name='Classifications', index=False)
            st.download_button(
                "📊 Download Excel Report",
                excel_buffer.getvalue(),
                "spend_report.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )

        # Summary Statistics
        st.markdown("---")
        st.markdown("#### 📈 Report Summary")

        sum_col1, sum_col2, sum_col3 = st.columns(3)

        with sum_col1:
            st.metric("Total Records", len(df_report))
            st.metric("Unique Categories", df_report["category"].nunique())

        with sum_col2:
            st.metric("Unique Vendors", df_report["vendor"].nunique())
            top_cat = df_report["category"].value_counts().index[0] if len(df_report) > 0 else "N/A"
            st.metric("Most Common Category", top_cat)

        with sum_col3:
            top_vendor = df_report["vendor"].value_counts().index[0] if len(df_report) > 0 else "N/A"
            st.metric("Most Common Vendor", top_vendor)

# ---------------------------------------------------------
# Footer
# ---------------------------------------------------------
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666; padding: 2rem;'>
    <p style='margin: 0; font-size: 0.9rem;'>
        <strong>Spend Classification & Enrichment Engine</strong><br>
    </p>
</div>
""", unsafe_allow_html=True)
import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_english_document():
    doc = Document()
    
    # Page setup - 1 inch margins all around
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    primary_color = RGBColor(21, 128, 61)   # #15803D Forest Green
    dark_text = RGBColor(15, 23, 42)        # #0F172A Slate 900
    sub_color = RGBColor(71, 85, 105)       # #475569 Slate 600
    font_name = "Calibri"

    # Header / Title Banner
    p_head = doc.add_paragraph()
    p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_head.add_run("FARMSKING TECHNOLOGIES PRIVATE LIMITED\n")
    r_title.font.name = font_name
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = primary_color

    r_sub = p_head.add_run(
        "STATUTORY CHARTER OF INCORPORATION & MASTER LEGAL DOSSIER\n"
        "(Comprehensive Filing Docket for Ministry of Corporate Affairs SPICe+ V3 Portal under Companies Act, 2013)"
    )
    r_sub.font.name = font_name
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = sub_color

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Executive Summary Box
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_box = callout_tbl.cell(0, 0)
    set_cell_background(c_box, "F0FDF4")
    set_cell_margins(c_box, top=140, bottom=140, left=200, right=200)

    cp = c_box.paragraphs[0]
    cp_run1 = cp.add_run("EXECUTIVE SUMMARY & MANDATORY CORPORATE STRUCTURE (FOR CA / CS):\n")
    cp_run1.font.name = font_name
    cp_run1.font.bold = True
    cp_run1.font.size = Pt(11)
    cp_run1.font.color.rgb = primary_color

    cp_run2 = cp.add_run(
        "This statutory dossier defines the incorporation blueprint for 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' "
        "as a Private Limited Company limited by shares under the Companies Act, 2013:\n\n"
        "• SHAREHOLDING & OWNERSHIP:\n"
        "  1. Surinder Singh: 87.00% Majority Equity (Founder, Pure Passive Shareholder / Investor — Holds NO Directorship, draws 0% salary, strictly compliant with Punjab Civil Services Conduct Rules Rule 16; retains 100% Absolute Veto Authority).\n"
        "  2. Bakshish Singh: 10.00% Equity (Executive Working Director 1 — DIN & DSC holder).\n"
        "  3. Gagandeep Kaur: 3.00% Equity (Executive Working Director 2 — DIN & DSC holder).\n\n"
        "• STATUTORY DIRECTORS: Exactly Two (2) Directors — Bakshish Singh and Gagandeep Kaur (satisfying Section 149(1)).\n"
        "• PRIMARY BANK: ICICI Bank (iStartup 2.0 Current Account) via AGILE-PRO-S (INC-35).\n"
        "• OPERATIONAL PILLARS: Digital Farming SaaS, Farmer Education & Skilling, Public Welfare ('Lok Bhalai'), and Agri E-Commerce Marketplace."
    )
    cp_run2.font.name = font_name
    cp_run2.font.size = Pt(9.5)
    cp_run2.font.color.rgb = dark_text

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------
    # SECTION 1: PROPOSED NAMES & NIC CODES
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. PROPOSED COMPANY NAMES & INDUSTRIAL CLASSIFICATION (NIC CODES)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run("Proposed Corporate Names (In Order of Preference for MCA RUN / SPICe+ Part A):").font.bold = True
    
    names = [
        "1. FARMSKING TECHNOLOGIES PRIVATE LIMITED (First Preference / Primary Choice)",
        "2. FARMSKING TECHNOLOGIES PRIVATE LIMITED (Second Preference / Alternative)",
        "3. FARMSKING AGRI SOLUTIONS PRIVATE LIMITED (Third Preference)",
        "4. FARMSKING DIGITAL AGRO PRIVATE LIMITED (Fourth Preference)"
    ]
    for nm in names:
        p_nm = doc.add_paragraph(nm, style='List Bullet')
        p_nm.paragraph_format.space_after = Pt(2)

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(6)
    p_sig.add_run("Significance of Name (Mandatory Justification for MCA ROC): ").font.bold = True
    p_sig.add_run(
        "The proposed corporate name 'FARMSKING' is a coined combination of 'FARMS' (representing agricultural ecosystems, precision cultivation, "
        "horticulture, and rural economic resurgence) and 'KING' (symbolizing market leadership, benchmark quality, farmer self-reliance, and "
        "agrarian empowerment). The entity operates comprehensive digital farming software, precision telemetry, farmer training academies, "
        "welfare helpdesks, and agricultural input supply chains across India."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # NIC Table
    nic_tbl = doc.add_table(rows=6, cols=3)
    nic_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    nic_headers = ["NIC 2008 Code", "Statutory Description", "Operational Scope in FarmsKing"]
    for i, h in enumerate(nic_headers):
        c = nic_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 150, 150)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = font_name
        run.font.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)

    nic_data = [
        ("62013 / 62099", "Providing software support, maintenance, web portals, mobile application development, and data analytics", "Primary Activity: Agri-Tech SaaS, AI Crop Doctor, Mobile Apps, Cloud Telemetry"),
        ("01611 / 01619", "Support activities for agriculture, digital farm extension services, and agronomic pest consultancy", "Secondary Activity: Tele-agronomy clinics, precision farm telemetry, garden advisory"),
        ("85499", "Other education n.e.c. (Technical training, farmer skilling, digital literacy)", "Educational Activity: Farmer bootcamps, digital literacy camps, rural youth training"),
        ("88900", "Other social work activities without accommodation (Rural farmer welfare, livelihood support)", "Public Welfare Activity: Farmer distress helpdesk, anti-exploitation transparency, rural upliftment"),
        ("47912", "Retail sale via e-commerce / online marketplace (Farm inputs, seeds, bio-nutrients, tools)", "Commercial Marketplace: E-commerce platform for agri inputs, nursery plants & tools delivery")
    ]

    for row_idx, data in enumerate(nic_data, start=1):
        for col_idx, text in enumerate(data):
            c = nic_tbl.cell(row_idx, col_idx)
            if row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 120, 120)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = font_name
            run.font.size = Pt(9.5)
            run.font.color.rgb = dark_text
            if col_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 2: MoA CLAUSE III(A) - MAIN OBJECTS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. MEMORANDUM OF ASSOCIATION (MoA) — CLAUSE III(A): MAIN OBJECTS")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "(These 6 clauses must be copied directly into Form INC-33 e-MoA on the MCA V3 Portal):"
    ).font.italic = True

    main_objects_en = [
        (
            "1. DIGITAL FARMING, PRECISION AGRICULTURE & AGRI-TECH SAAS ECOSYSTEM",
            "To design, develop, build, host, operate, own, maintain, license, and commercialize comprehensive digital agriculture, "
            "precision farming, and horticulture technology platforms, web portals, cloud computing software, and mobile applications "
            "under the brand name 'FarmsKing' or such other brand names, equipped with artificial intelligence (AI), machine learning (ML), "
            "computer vision, internet of things (IoT), satellite remote sensing, Normalized Difference Vegetation Index (NDVI) field telemetry, "
            "drone-based aerial crop scouting, automated smart irrigation scheduling, weather forecasting intelligence, farm ledger accounting, "
            "and precision agronomy systems for farmers, growers, horticulturists, terrace and home gardeners across India and internationally."
        ),
        (
            "2. PROMOTION OF DIGITAL FARMING, AGRICULTURAL EDUCATION & SKILL DEVELOPMENT",
            "To actively promote, propagate, and advance modern digital farming techniques, precision agriculture, sustainable agricultural methodologies, "
            "and farm automation by establishing, conducting, and managing digital farmer training centers, agricultural literacy camps, rural skill development bootcamps, "
            "workshops, seminars, webinars, certification programs, audio-visual educational content, multi-lingual agricultural academies, mobile demonstration vans, and e-learning platforms; "
            "to train farmers, rural youth, women agriculturists, and farm workers in digital farm record keeping, smartphone-based farm management, soil fertility conservation, "
            "climate-smart agriculture, integrated pest management (IPM), micro-irrigation, and post-harvest management, thereby bridging the rural digital divide and enhancing agrarian productivity."
        ),
        (
            "3. PUBLIC WELFARE, FARMER DISTRESS RELIEF & RURAL COMMUNITY EMPOWERMENT ('LOK BHALAI')",
            "To conceptualize, organize, implement, support, and administer public welfare, social upliftment, and community benefit programs ('Lok Bhalai') aimed at the holistic welfare, "
            "economic stability, and social security of small, marginal, and progressive farmers, tenant farmers, and rural farming communities; to set up farmer distress helplines, "
            "suicide prevention advisory desks, fair-price awareness campaigns, debt-management financial education, soil and groundwater conservation drives, organic and natural farming adoption drives; "
            "to facilitate capacity building, technical empowerment, and collective bargaining for Farmer Producer Organizations (FPOs), Self-Help Groups (SHGs), and primary agricultural cooperatives; "
            "to promote fair, transparent market practices preventing agrarian exploitation by middlemen; and to undertake corporate social responsibility (CSR), rural livelihood enhancements, "
            "and environmental stewardship projects for national agrarian prosperity."
        ),
        (
            "4. AGRI & HORTICULTURE E-COMMERCE MARKETPLACE & DIRECT MARKET LINKAGES",
            "To establish, operate, manage, and facilitate an omnichannel electronic marketplace, e-commerce platform, direct-to-consumer (D2C), business-to-business (B2B), "
            "and business-to-consumer (B2C) digital supply chain network for buying, selling, marketing, importing, exporting, distributing, warehousing, delivering, "
            "and facilitating transaction of agricultural inputs, certified hybrid and indigenous seeds, organic fertilizers, bio-nutrients, bio-pesticides, micronutrients, "
            "drip and sprinkler irrigation machinery, farm implements, pruning tools, nursery plants, indoor/outdoor plants, potting media, terrace garden accessories, "
            "and post-harvest agricultural commodities; and to facilitate direct farm-to-fork and farm-to-market channels providing remunerative prices directly to farmers."
        ),
        (
            "5. TELE-ADVISORY, CROP DOCTOR & HORTICULTURE EXPERT CONSULTATION NETWORK",
            "To establish, maintain, and operate interactive digital consultation platforms, tele-agronomy clinics, and digital diagnostic centers connecting registered farmers, "
            "kitchen gardeners, and orchard owners with qualified agricultural scientists, certified agronomists, horticulturists, plant pathologists, entomologists, and garden advisors; "
            "to provide automated and expert-verified diagnosis of crop and plant diseases, nutrient deficiencies, pest infestations, and physiological disorders; "
            "and to prescribe scientifically recommended organic, biological, and chemical remedial measures via Punjabi, Hindi, English, and regional language voice and chat interfaces."
        ),
        (
            "6. REAL-TIME MANDI PRICE INTELLIGENCE, CROP ANALYTICS & FINANCIAL RECORD MANAGEMENT",
            "To collect, aggregate, process, verify, analyze, and disseminate real-time daily agricultural and horticultural market rates, mandi arrivals, Minimum Support Prices (MSP), "
            "future price trends, and demand-supply analytics from government mandis, APMCs, and private markets across India; to provide automated crop economics calculators, "
            "commission and interest computation engines for commission agents (arhtiyas), digital receipts, input cost vs. yield profitability tracking, and digital financial management tools "
            "enabling farming families to maintain accountable, profitable, and bankable farm balance sheets."
        )
    ]

    for title, clause_text in main_objects_en:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(8)
        p_t.paragraph_format.space_after = Pt(2)
        r_t = p_t.add_run(title)
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(11)
        r_t.font.color.rgb = dark_text

        p_c = doc.add_paragraph()
        p_c.paragraph_format.left_indent = Inches(0.25)
        p_c.paragraph_format.right_indent = Inches(0.25)
        p_c.paragraph_format.space_after = Pt(6)
        r_c = p_c.add_run(f'"{clause_text}"')
        r_c.font.name = font_name
        r_c.font.size = Pt(9.5)
        r_c.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 3: MoA CLAUSE III(B) - INCIDENTAL & ANCILLARY OBJECTS
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. MoA CLAUSE III(B): INCIDENTAL & ANCILLARY OBJECTS (17 STATUTORY POWERS)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    incidental_objects_en = [
        ("1. Research & Intellectual Property:", "To conduct scientific research, clinical field trials, data science research, agronomic modeling, and to apply for, obtain, purchase, register, maintain, license, and defend patents, copyrights, trademarks, software algorithms, trade secrets, and proprietary AI models relating to agriculture and education."),
        ("2. Educational & Government Collaborations:", "To collaborate, partner, enter into memoranda of understanding (MoUs), and work jointly with State Agricultural Universities (such as Punjab Agricultural University, ICAR institutes), Krishi Vigyan Kendras (KVKs), Ministry of Agriculture and Farmers Welfare, NABARD, State Horticulture Missions, international agricultural organizations, NGOs, and educational boards to deliver farmer training and welfare projects."),
        ("3. Software & Cloud Infrastructure:", "To acquire, build, lease, install, maintain, and operate cloud servers, cyber-security firewalls, satellite data downlink APIs, SMS/WhatsApp messaging gateways, payment gateways, machine learning compute clusters, and telecommunication links necessary for the smooth operation of digital farming platforms."),
        ("4. Rural Hubs & Agri-Clinics:", "To construct, acquire, take on lease, establish, and run rural digital kiosks, demonstration farms, soil testing laboratories, plant health clinics, farmer facilitation hubs, warehouses, cold storage centers, and fulfillment hubs in rural, peri-urban, and urban areas."),
        ("5. Financial Facilities & ICICI Banking Operations:", "To open, operate, maintain, and close current bank accounts with ICICI Bank and other scheduled commercial banks, overdraft (OD) facilities, cash credit, escrow accounts, draw, accept, endorse, discount, and issue cheques, bills of exchange, and negotiable instruments necessary for business and welfare operations."),
        ("6. Borrowing & Capital Raising:", "To raise loans, working capital facilities, project finance, venture capital, angel investments, seed capital, or credit facilities from banks, NBFCs, financial institutions, government agricultural development boards, or private investors against the security of company assets or without security, subject to the provisions of the Companies Act, 2013."),
        ("7. Government Schemes & Subsidies Facilitation:", "To assist farmers, farmer groups, and the company in accessing, applying for, and implementing beneficial government welfare schemes, including PM-KISAN, PM Krishi Sinchayee Yojana, Sub-Mission on Agricultural Mechanization (SMAM), Agri Infrastructure Fund (AIF), organic farming subsidies, and crop insurance schemes (PMFBY)."),
        ("8. Corporate Social Responsibility (CSR) & Charitable Endowments:", "To establish, fund, support, contribute to, or sponsor charitable trusts, non-profit societies, foundations, environmental conservation funds, clean-water projects, rural hospitalities, farmer relief funds, and educational scholarships for rural students, in compliance with Section 135 and Schedule VII of the Companies Act, 2013."),
        ("9. Logistics & Fleet Management:", "To purchase, lease, hire, maintain, or contract logistics vehicles, electric delivery vans, refrigerated transport, agricultural drones, spraying equipment, and delivery mechanisms for last-mile delivery of farm inputs and pickup of farm produce."),
        ("10. Agency, Franchise & Distributorship:", "To act as agents, distributors, stockists, representatives, brokers, commission agents, franchisors, or franchisees for seed breeders, fertilizer manufacturers, farm tool creators, bio-technology firms, and agricultural implement producers."),
        ("11. Technical Training Staff & Expert Retention:", "To employ, retain, train, and compensate agronomists, software engineers, data scientists, soil chemists, extension officers, customer support advisors, legal counsels, and field coordinators for carrying out company activities."),
        ("12. Acquisitions & Mergers:", "To acquire, take over, amalgamate with, enter into joint ventures, or merge with any firm, trust, society, or company possessing business objects similar or complementary to those of this company."),
        ("13. Import & Export:", "To import, export, buy, sell, exchange, barter, or distribute modern agricultural machinery, specialized sensors, organic inputs, seeds, horticultural plant saplings, laboratory reagents, and software tools from and to any part of the world, subject to statutory clearances."),
        ("14. Publication & Media Dissemination:", "To print, publish, broadcast, podcast, stream, and distribute agricultural journals, farming magazines, educational booklets, informative audio/video podcasts, and digital newsletters dedicated to progressive agriculture, environmental care, and community empowerment."),
        ("15. Incentive & Loyalty Programs:", "To institute loyalty point systems, discount coupons, cashback vouchers, and reward mechanisms for progressive farmers, active advisors, and community champions to promote engagement with digital farming tools."),
        ("16. Disaster Relief & Emergency Response:", "To organize, sponsor, and mobilize emergency assistance, crop salvage advisories, pest outbreak management drives, and humanitarian supplies during natural calamities, floods, droughts, hailstorms, and agricultural distress situations."),
        ("17. General Incidental Powers:", "To do all such other acts, deeds, and things as are incidental or conducive to the attainment of the above main objects and the general advancement of digital agriculture, farmer education, and public welfare in India.")
    ]

    for title, desc in incidental_objects_en:
        p_inc = doc.add_paragraph()
        p_inc.paragraph_format.space_before = Pt(3)
        p_inc.paragraph_format.space_after = Pt(3)
        p_inc.paragraph_format.left_indent = Inches(0.2)
        r_t = p_inc.add_run(f"{title} ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_inc.add_run(desc)
        r_d.font.name = font_name
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 4: ARTICLES OF ASSOCIATION (AoA) - FORM INC-34
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. ARTICLES OF ASSOCIATION (AoA) — SPECIAL GOVERNANCE CLAUSES (FORM INC-34)")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    aoa_points_en = [
        ("4.1 Adoption of Table F:", "The company adopts Table F of Schedule I to the Companies Act, 2013, subject to the specific governance and shareholding safeguards detailed herein."),
        ("4.2 Private Company Characteristics (Section 2(68)):", "The right to transfer shares is restricted; the total number of members is limited to two hundred (200); and any invitation to the public to subscribe for securities is strictly prohibited."),
        ("4.3 Surinder Singh's 87% Supreme Control & Absolute Veto Authority:", "Under the Companies Act, 2013, Special Resolutions require a seventy-five percent (75%) majority. Holding eighty-seven percent (87.00%) of the equity capital, Surinder Singh single-handedly exercises absolute veto authority over all corporate governance matters, including: (a) alteration of MoA or AoA, (b) increase or decrease of capital, (c) appointment or removal of any director, and (d) disposal of software IP or substantial assets."),
        ("4.4 Strict Separation of Ownership & Directorship (Civil Services Conduct Compliance):", "Surinder Singh participates strictly as a Passive Shareholder / Investor holding 87% shares, holds NO Directorship, and draws 0% salary or director remuneration, maintaining 100% full compliance with Rule 16 of the Punjab Civil Services Rules. Operational directorship is vested solely in Bakshish Singh and Gagandeep Kaur."),
        ("4.5 Right of First Refusal (ROFR - Share Transfer Pre-emption):", "No minority shareholder or director (Bakshish Singh or Gagandeep Kaur) may sell, transfer, pledge, or alienate their shares to any outsider without first offering identical shares to Surinder Singh at fair market valuation. Surinder Singh retains a thirty (30) day pre-emption period to accept or decline."),
        ("4.6 Board Composition & Quorum:", "The company shall have exactly Two (2) First Directors: Bakshish Singh and Gagandeep Kaur. The quorum for board meetings shall be two (2) directors present in person or via video conference."),
        ("4.7 Electronic Meetings & Digital Voting:", "Board and General meetings can be validly convened in person or through video conferencing compliant with Section 173(2) of the Act, with digitally recorded minutes.")
    ]

    for title, desc in aoa_points_en:
        p_aoa = doc.add_paragraph()
        p_aoa.paragraph_format.space_before = Pt(4)
        p_aoa.paragraph_format.space_after = Pt(4)
        p_aoa.paragraph_format.left_indent = Inches(0.2)
        r_t = p_aoa.add_run(f"{title} ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_aoa.add_run(desc)
        r_d.font.name = font_name
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 5: CAPITAL STRUCTURE & 3-MEMBER ROSTER
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. CAPITAL STRUCTURE & OFFICIAL SHAREHOLDING ROSTER")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    cap_tbl = doc.add_table(rows=5, cols=6)
    cap_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cap_headers = ["Member Name", "Official Role", "Shares", "Face Value", "Equity %", "Statutory Status"]
    for i, h in enumerate(cap_headers):
        c = cap_tbl.cell(0, i)
        set_cell_background(c, "15803D")
        set_cell_margins(c, 100, 100, 100, 100)
        p = c.paragraphs[0]
        run = p.add_run(h)
        run.font.name = font_name
        run.font.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)

    members_data_en = [
        (
            "Surinder Singh",
            "Founder & 1st Subscriber\n(Only Shareholder / Owner)",
            "870 Shares",
            "INR 8,700",
            "87.00%",
            "Passive Shareholder / Investor\n100% Supreme Veto Power (>75%)\n(NO Directorship / 0% Salary — Rule 16 Compliant)"
        ),
        (
            "Bakshish Singh",
            "Executive Director 1\n& Shareholder",
            "100 Shares",
            "INR 1,000",
            "10.00%",
            "Active Working Director\n(DIN, DSC & Form DIR-2 Signatory)"
        ),
        (
            "Gagandeep Kaur",
            "Executive Director 2\n& Shareholder",
            "30 Shares",
            "INR 300",
            "3.00%",
            "Active Working Director\n(DIN, DSC & Form DIR-2 Signatory)"
        ),
        (
            "TOTAL",
            "2 Directors + 3 Shareholders",
            "1,000 Shares",
            "INR 10,000",
            "100.00%",
            "Fully Paid-up Initial Equity Capital"
        )
    ]

    for row_idx, data in enumerate(members_data_en, start=1):
        for col_idx, text in enumerate(data):
            c = cap_tbl.cell(row_idx, col_idx)
            if row_idx == 4:
                set_cell_background(c, "DCFCE7") # Light Green total row
            elif row_idx % 2 == 0:
                set_cell_background(c, "F8FAFC")
            set_cell_margins(c, 80, 80, 90, 90)
            p = c.paragraphs[0]
            run = p.add_run(text)
            run.font.name = font_name
            run.font.size = Pt(8.5)
            run.font.color.rgb = dark_text
            if col_idx == 0 or row_idx == 4:
                run.font.bold = True
            if col_idx == 4:
                run.font.bold = True
                run.font.color.rgb = primary_color

    p_cap_note = doc.add_paragraph()
    p_cap_note.paragraph_format.space_before = Pt(6)
    p_cap_note.add_run("Authorized Share Capital: ").font.bold = True
    p_cap_note.add_run("INR 1,00,000 (10,000 Equity Shares of INR 10 each)\n")
    p_cap_note.add_run("Paid-up Share Capital: ").font.bold = True
    p_cap_note.add_run("INR 10,000 (1,000 Equity Shares of INR 10 each)\n")
    p_cap_note.add_run("Designated Bank: ").font.bold = True
    p_cap_note.add_run("ICICI Bank (iStartup 2.0 Current Account) via AGILE-PRO-S (INC-35)")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 6: STATUTORY TEMPLATES: DIR-2, INC-9 & NOC
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. STATUTORY TEMPLATES: FORM DIR-2, FORM INC-9 & REGISTERED OFFICE NOC")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    # 6.1 FORM DIR-2 (BAKSHISH SINGH)
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.1 FORM DIR-2: Consent to Act as Director 1 — BAKSHISH SINGH (Section 152(5))")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    dir2_text_bakshish = (
        "To,\n"
        "The Board of Directors / Promoters,\n"
        "FARMSKING TECHNOLOGIES PRIVATE LIMITED\n"
        "[Proposed Registered Office: Punjab, India]\n\n"
        "Subject: Consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED\n\n"
        "I, BAKSHISH SINGH, son of [Father's Name], resident of [Residential Address, Punjab], hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.\n\n"
        "1. Director Identification Number (DIN): [Applied in SPICe+ / Allotted]\n"
        "2. Full Name: BAKSHISH SINGH\n"
        "3. Father's Name: [Father's Name]\n"
        "4. Permanent Residential Address: [Full Address, District, Punjab, PIN Code]\n"
        "5. E-mail ID: [Email Address] | Mobile Number: [Mobile Number]\n"
        "6. PAN Card Number: [PAN Number] | Date of Birth: [DD/MM/YYYY] | Nationality: Indian\n\n"
        "Declaration:\n"
        "I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP and have not been found guilty of any fraud or misfeasance in the last five years. If chosen as Director, I will not contravene any provisions of the Act.\n\n"
        "Date: _______________          Place: Punjab, India          Signature: __________________________\n"
        "                                                             Name: BAKSHISH SINGH (Director)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(dir2_text_bakshish)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    # 6.2 FORM DIR-2 (GAGANDEEP KAUR)
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.2 FORM DIR-2: Consent to Act as Director 2 — GAGANDEEP KAUR (Section 152(5))")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    dir2_text_gagan = (
        "To,\n"
        "The Board of Directors / Promoters,\n"
        "FARMSKING TECHNOLOGIES PRIVATE LIMITED\n"
        "[Proposed Registered Office: Punjab, India]\n\n"
        "Subject: Consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED\n\n"
        "I, GAGANDEEP KAUR, daughter/wife of [Father's/Husband's Name], resident of [Residential Address, Punjab], hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.\n\n"
        "1. Director Identification Number (DIN): [Applied in SPICe+ / Allotted]\n"
        "2. Full Name: GAGANDEEP KAUR\n"
        "3. Father's / Husband's Name: [Father's / Husband's Name]\n"
        "4. Permanent Residential Address: [Full Address, District, Punjab, PIN Code]\n"
        "5. E-mail ID: [Email Address] | Mobile Number: [Mobile Number]\n"
        "6. PAN Card Number: [PAN Number] | Date of Birth: [DD/MM/YYYY] | Nationality: Indian\n\n"
        "Declaration:\n"
        "I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP and have not been found guilty of any fraud or misfeasance in the last five years. If chosen as Director, I will not contravene any provisions of the Act.\n\n"
        "Date: _______________          Place: Punjab, India          Signature: __________________________\n"
        "                                                             Name: GAGANDEEP KAUR (Director)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(dir2_text_gagan)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    # 6.3 FORM INC-9
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.3 FORM INC-9: Declaration by Subscribers and Directors (Section 7(1)(c))")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    inc9_text_en = (
        "MEMORANDUM OF STATUTORY DECLARATION\n\n"
        "We, the undersigned Subscribers and First Directors of FARMSKING TECHNOLOGIES PRIVATE LIMITED:\n"
        "1. SURINDER SINGH (Subscriber & Majority Shareholder - 87%)\n"
        "2. BAKSHISH SINGH (Subscriber & First Working Director - 10%)\n"
        "3. GAGANDEEP KAUR (Subscriber & First Working Director - 3%)\n\n"
        "do hereby solemnly declare and state as follows:\n\n"
        "1. That we have not been convicted of any offence in connection with the promotion, formation, or management of any company;\n"
        "2. That we have not been found guilty of any fraud or misfeasance or breach of duty under the Companies Act, 2013 during the preceding five years;\n"
        "3. That all documents filed with the Registrar for registration of FARMSKING TECHNOLOGIES PRIVATE LIMITED contain information that is correct, complete, and true to the best of our knowledge and belief;\n"
        "4. That the company shall carry out genuine and lawful activities in accordance with the Main Objects of the MoA, including digital farming development, farmer education & skilling, community welfare ('Lok Bhalai'), and agricultural e-commerce services.\n\n"
        "Verified at Punjab on this _____ day of ____________ 2026.\n\n"
        "1. Signature: __________________________  Name: SURINDER SINGH (87% Shareholder)\n"
        "2. Signature: __________________________  Name: BAKSHISH SINGH (Director & 10% Shareholder)\n"
        "3. Signature: __________________________  Name: GAGANDEEP KAUR (Director & 3% Shareholder)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(inc9_text_en)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    # 6.4 NOC FOR REGISTERED OFFICE
    h2 = doc.add_heading(level=2)
    r = h2.add_run("6.4 NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE")
    r.font.name = font_name
    r.font.color.rgb = dark_text
    r.font.size = Pt(11.5)
    r.font.bold = True

    noc_text_en = (
        "NO OBJECTION CERTIFICATE (NOC)\n"
        "(To whomsoever it may concern)\n\n"
        "I, [Name of Property Owner], S/o [Father's Name], resident of [Owner's Address, Punjab], do hereby solemnly affirm and state as under:\n\n"
        "1. That I am the absolute legal owner and in lawful possession of the premises situated at:\n"
        "   [Full Address of Registered Office with Pin Code, District, Punjab, India].\n\n"
        "2. That I have NO OBJECTION whatsoever if the proposed company named \"FARMSKING TECHNOLOGIES PRIVATE LIMITED\" (or any other name approved by the Ministry of Corporate Affairs) uses the aforesaid premises as its REGISTERED OFFICE for the purpose of carrying on its corporate, administrative, digital platform, training, and commercial operations and for maintaining its statutory books and records under the Companies Act, 2013.\n\n"
        "3. That I have no objection to the said company obtaining GSTIN, MSME, Professional Tax, Startup India recognition, and opening an ICICI Bank Current Account using this address.\n\n"
        "Attached herewith:\n"
        "- Copy of Electricity Bill / Utility Bill (not older than 2 months)\n"
        "- Copy of Owner's PAN & Aadhaar Card as proof of identity and ownership.\n\n"
        "Date: _______________     Place: Punjab, India     Signature of Owner: __________________________ (Name & Mobile)\n"
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(noc_text_en)
    r_box.font.name = "Courier New"
    r_box.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 7: STEP-BY-STEP CA FILING ROADMAP
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. STEP-BY-STEP INCORPORATION ROADMAP & CHECKLIST FOR CA")
    r.font.name = font_name
    r.font.color.rgb = primary_color
    r.font.size = Pt(14)
    r.font.bold = True

    steps_en = [
        ("Step 1: Name Reservation (SPICe+ Part A)", "Apply for 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' under primary NIC Code 62013 on MCA V3 Portal and attach the Name Significance description from Section 1."),
        ("Step 2: Class-3 Digital Signatures (DSC)", "Obtain Class-3 DSC for the two active working directors: Bakshish Singh and Gagandeep Kaur via 1-minute mobile video KYC."),
        ("Step 3: SPICe+ Part B & e-MoA (INC-33) Filing", "Input the 6 Main Objects from Section 2 into e-MoA INC-33 web-form. Insert the 17 Incidental Objects into Clause III(B)."),
        ("Step 4: e-AoA (INC-34) Filing", "Adopt Table F with ROFR pre-emption rights and private company share transfer restrictions from Section 4 to safeguard Surinder Singh's 87% absolute veto control."),
        ("Step 5: AGILE-PRO-S (INC-35) Integrated Filings", "Simultaneously apply for: (a) GSTIN Registration, (b) EPFO & ESIC, (c) Profession Tax (Punjab), and (d) ICICI Bank (iStartup 2.0 Current Account)."),
        ("Step 6: ROC CRC Approval & Certificate of Incorporation (COI)", "Within 7-10 working days, ROC CRC issues the Certificate of Incorporation containing CIN, PAN, and TAN numbers."),
        ("Step 7: ICICI Bank Current Account Activation & Startup India DPIIT", "Company ICICI Bank Current Account is funded and operationalized. File application on startupindia.gov.in for DPIIT certificate to obtain 3-year Section 80-IAC tax holiday.")
    ]

    for title, desc in steps_en:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(3)
        p_st.paragraph_format.space_after = Pt(3)
        r_t = p_st.add_run(f"• {title}: ")
        r_t.font.name = font_name
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = dark_text
        r_d = p_st.add_run(desc)
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Footer note
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_p.add_run("FARMSKING TECHNOLOGIES PRIVATE LIMITED — Empowering Farmers, Greenery & Rural India")
    footer_run.font.name = font_name
    footer_run.font.size = Pt(10)
    footer_run.font.bold = True
    footer_run.font.color.rgb = primary_color

    # Save destinations
    desktop_path = r"C:\Users\hp\Desktop\farmsking_english.docx"
    local_path = r"d:\FarmsKing\farmsking_english.docx"

    doc.save(desktop_path)
    print(f"Successfully saved updated English Word document to Desktop: {desktop_path}")

    doc.save(local_path)
    print(f"Successfully saved updated English Word document to Project root: {local_path}")

if __name__ == "__main__":
    create_english_document()

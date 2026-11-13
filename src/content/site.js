// ─────────────────────────────────────────────────────────────
//  SITE CONTENT — everything about you lives in this one file.
//  Edit text here; the pages pick it up automatically.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  url: "https://sakthiswarup.netlify.app",
  name: "Sakthi Swarup",
  fullName: "Sakthi Swarup V K",
  role: "Data Analyst",
  tagline: "Data Analyst · Healthcare BI",
  email: "sakthiswarupvk@gmail.com",
  linkedin: "https://www.linkedin.com/in/sakthi-swarup",
  github: "https://github.com/sakthiswarup18",
  resume: "/pdf/Sakthi-Swarup-Resume.pdf",
  description:
    "Sakthi Swarup is a data analyst working in healthcare business intelligence: Tableau and Power BI dashboards, and the SQL and Python underneath them. M.S. Data Science, UMass Dartmouth.",
};

// *word* = highlighted in the animated text
export const HERO = {
  label: SITE.tagline,
  greeting: "Hey, I'm",
  name: "Sakthi.",
  lines: [
    "I build the *dashboards* clinical and ops teams check *every morning*, and the *SQL* and *Python* underneath them.",
    "Right now that's the *Tableau* and *Power BI* reporting layer at *Ascension Health*.",
  ],
};

export const STATS = [
  { value: "5+", label: "Years in data & BI" },
  { value: "2", label: "BI platforms SME" },
  { value: "4", label: "Impact Awards" },
  { value: "M.S.", label: "Data Science, UMassD" },
];

export const ABOUT = {
  label: "About Me",
  heading: ["Quality", "before", "the chart."], // last line is the outlined one
  bio: [
    "Healthcare data taught me to care about *quality* before anyone sees a chart: three years at *Carelon* automating insurance-enrolment pipelines for *Elevance Health*, then an *M.S. in Data Science* at UMass Dartmouth to get the theory behind what I was already doing.",
    "Now I sit between the numbers and the team: writing the *SQL* and *Python* that gets things right, keeping heavy calculation *out of the reporting layer*, and building the *Tableau* and *Power BI* views people open every morning.",
  ],
};

export const SKILLS = [
  { group: "Reporting", items: ["Tableau", "Power BI", "DAX", "Excel"] },
  { group: "Languages", items: ["SQL", "Python", "R", "JavaScript", "Java", "C++"] },
  { group: "Data", items: ["SQL Server", "ETL", "Tableau Prep", "Alteryx", "Informatica", "NoSQL"] },
  { group: "Cloud", items: ["AWS", "Azure", "Databricks", "SageMaker", "Docker"] },
  { group: "ML / Python", items: ["scikit-learn", "PyTorch", "pandas", "NumPy"] },
  { group: "Practice", items: ["Agile", "SAFe", "Waterfall", "HIPAA"] },
];

export const EXPERIENCE = [
  {
    num: "01",
    company: "Ascension Health",
    place: "Wisconsin",
    period: "Mar 2025 – Present",
    role: "Data Analyst",
    summary:
      "I own the Tableau and Power BI reporting layer used across the system, and the SQL and Python that feeds it. In practice that means designing dashboards, keeping expensive calculation out of the reporting tools, and being the person both platforms get escalated to.",
    points: [
      "Built consecutive and non-consecutive gap analysis, rolling twelve-month tracking and related metrics in SQL and Python, deliberately outside the reporting layer, so dashboards stay fast.",
      "Implemented row-level security and security mapping tables across Power BI.",
      "Wrote optimised DAX for interactive dashboards and tuned SQL queries and Azure resources to bring load times down.",
      "Act as subject-matter expert for both Tableau and Power BI, training and supporting teams across the organisation.",
    ],
    more: [
      "Pulled in data from SQL, Azure and flat files and got it all talking to Tableau and Power BI without killing load times.",
      "Automated pipelines from AWS S3, EMR, Lambda, Athena and Excel using Tableau Prep, Alteryx and Informatica.",
      "Looked after the data models and ETL: if a dashboard number changed for the wrong reason, I was the one tracing it back.",
      "Built dashboards that hospital leadership actually opens: not just technically correct, but readable in 30 seconds.",
    ],
  },
  {
    num: "02",
    company: "UMass Dartmouth",
    place: "Massachusetts",
    period: "Aug 2024 – Dec 2024",
    role: "Data Analyst",
    summary:
      "Reporting and analysis work for faculty and staff during my master's. Most of the value was in the first conversation: working out what someone was really asking before building anything.",
    points: [
      "Ran requirements sessions with stakeholders and turned what they described into reporting they could read without a walkthrough.",
      "Analysed historical CPU, memory and network usage in Python to find capacity patterns.",
      "Cut transaction data into customer segments for a marketing team that kept asking why their campaigns weren't landing.",
      "Built interactive Tableau dashboards on top of datasets cleaned in SQL and Python.",
    ],
    more: [
      "Dug into datasets that had never really been looked at and found patterns nobody had a dashboard for yet.",
      "Ran lightweight forecasting to give staff a forward view instead of just a backward one.",
      "Spent a lot of time in first conversations figuring out what people actually needed, not what they asked for.",
    ],
  },
  {
    num: "03",
    company: "Carelon Global Solution",
    place: "Bangalore, India",
    period: "Sep 2020 – Aug 2023",
    role: "Data Analyst",
    summary:
      "Three years on healthcare data for Elevance Health. Started on automation and validation for insurance enrolment, moved into analysis and reporting on engagement and campaign performance, and led a team of five.",
    points: [
      "Built an automation tool for health insurance enrolment verification that cut processing time by 40%.",
      "Hardened data integrity checks to 99.9% accuracy on enrolment data.",
      "Wrote Python batch processing for high-volume files, saving 200+ work hours a month.",
      "Analysed user engagement data and worked with product teams on changes that lifted daily active users 20% in three months.",
    ],
    more: [
      "Managed five engineers: task allocation, code review and delivery.",
      "Integrated Power BI with SQL databases and warehouses for real-time and historical reporting.",
      "Used AWS S3, Glue and Athena for storage, processing and analytics.",
      "Led regression testing across releases, reducing production crashes by 35%.",
      "Implemented HIPAA-compliant processing and encryption for member data.",
    ],
    awards: [
      {
        title: "Inspire a High Performance Culture",
        note: "Nominated by Pritha Venkatesan for IE3 performance testing: 20k–40k files validated end to end.",
        href: "/pdf/award-high-performance-culture-1.pdf",
      },
      {
        title: "Lead with Purpose and Heart",
        note: "Nominated by Robin Martis for OE performance testing, handling 40k–80k files.",
        href: "/pdf/award-lead-with-purpose.pdf",
      },
      {
        title: "Inspire a High Performance Culture",
        note: "Recognised a second time for thorough testing and issue resolution.",
        href: "/pdf/award-high-performance-culture-2.pdf",
      },
      {
        title: "Impact Award",
        note: "For overall contribution to project quality and continuous improvement.",
        href: "/photo/impact-award.png",
      },
    ],
  },
  {
    num: "04",
    company: "Knolskape Solutions",
    place: "Bangalore, India",
    period: "Jul 2019",
    role: "Intern",
    summary:
      "First real job: helped build an internal web portal and saw how software actually ships: standups, reviews, someone else's code, all of it.",
    points: [],
    more: [
      "Wrote code on both the front and back end. Nothing solo, but I got to see the full shape of a project.",
      "Sat in on UX reviews and started forming opinions about what makes an interface actually work.",
      "Followed Agile ceremonies for the first time. It took a few sprints to stop treating standups as status updates.",
      "Paired with senior engineers on database integration, APIs and server-side code.",
    ],
  },
];

export const DASHBOARDS = {
  label: "Live Dashboards",
  heading: ["Built by hand,", "no chart library."],
  intro:
    "Three interactive panels drawn in plain SVG and JavaScript. The data is synthetic: three years of real healthcare data isn't mine to publish, so this is the honest substitute.",
};

// Project categories shown on the home page and used as filters on /projects
export const CATEGORIES = [
  {
    key: "ml",
    num: "01",
    label: "Machine Learning",
    title: "Models & Forecasting",
    description:
      "Price forecasting with LSTM and ARIMA, and fraud classification on 284,807 transactions where only 0.17% were fraud.",
  },
  {
    key: "viz",
    num: "02",
    label: "Visualisation & Pipelines",
    title: "Dashboards & Cloud Data",
    description:
      "An explorable D3 view of data-science salaries, and an end-to-end Azure pipeline from wearable data to Power BI.",
  },
  {
    key: "apps",
    num: "03",
    label: "Applications",
    title: "Agents & Streaming",
    description:
      "An autonomous email agent built on Auto-GPT, and peer-to-peer media streaming over a local network.",
  },
];

export const PROJECTS = [
  {
    id: "crypto",
    cat: "ml",
    title: "Real-time crypto price prediction",
    meta: "UMass Dartmouth · 2023–2025",
    description:
      "A forecasting system that pulls live market data and predicts short-term price movement, with a dashboard for reading the output. LSTM handled volatile stretches better than the statistical baselines.",
    tech: ["LSTM", "ARIMA", "CoinGecko API", "React", "Chart.js", "AWS"],
    link: { label: "Live demo", href: "https://cryptocap-lovat.vercel.app/" },
    details: [
      "Live market data ingested through the CoinGecko API.",
      "LSTM, ARIMA and decision trees compared on the same forecasting task.",
      "Engineered features: moving averages, volatility indicators and sentiment signals.",
      "Interactive dashboard in React and Chart.js; deployed on AWS.",
    ],
  },
  {
    id: "salaries",
    cat: "viz",
    title: "Global trends in data employment",
    meta: "UMass Dartmouth · 2024",
    description:
      "An explorable view of data-science salaries by role, seniority, company size and work setting. Larger companies and remote roles paid more; entry-to-senior gap was the widest signal.",
    tech: ["D3.js", "Pandas", "Matplotlib", "Seaborn"],
    link: { label: "Live dashboard", href: "https://sakthiswarup18.github.io/Data-Visualization/Dashboard.html" },
    details: [
      "Choropleth maps covering the job market from 2021 to 2023.",
      "Bar charts comparing salary by company size, experience and work setting.",
      "Heatmaps, line charts and parallel coordinate plots for workforce distribution.",
      "Preprocessing and analysis in Python before anything reached the browser.",
    ],
  },
  {
    id: "fraud",
    cat: "ml",
    title: "Credit card fraud detection",
    meta: "UMass Dartmouth · 2024",
    description:
      "Fraud classification on 284,807 transactions where only 0.17% were fraudulent. The interesting part was the class imbalance, not the models. LightGBM reached 0.93 test AUC.",
    tech: ["LightGBM", "XGBoost", "CatBoost", "Random Forest"],
    link: {
      label: "Source on GitHub",
      href: "https://github.com/sakthiswarup18/sakthiswarup18-Detecting-Credit-Card-Fraud-Using-Machine-Learning",
    },
    details: [
      "LightGBM: 0.93 test AUC, ahead of the other classifiers.",
      "XGBoost: 0.984 validation AUC.",
      "Feature importance put V14, V10, V12, V17 and transaction amount at the top.",
    ],
  },
  {
    id: "shootings",
    cat: "ml",
    title: "Fatal police shootings in the US",
    meta: "UMass Dartmouth · 2023–2024",
    description:
      "Clustering and regression on the Washington Post dataset to find where and to whom fatal police shootings happen. Clear spatial hotspots; the model handled gun-related incidents well.",
    tech: ["K-Means", "Logistic regression", "Folium", "Scikit-learn"],
    link: { label: "Source on GitHub", href: "https://github.com/sakthiswarup18/Fatal-Police-shootings" },
    details: [
      "Incidents concentrated in urban areas: Los Angeles, Houston, New York.",
      "K-Means surfaced spatial hotspots; logistic regression predicted gun-related cases accurately.",
    ],
  },
  {
    id: "fitness",
    cat: "viz",
    title: "Fitness tracker analysis on Azure",
    meta: "UMass Dartmouth · 2024",
    description:
      "An end-to-end Azure pipeline over wearable device data, ingest to Power BI, to find out whether step count and sleep quality actually track together when you have enough data to say so.",
    tech: ["Azure Data Factory", "Databricks", "Blob Storage", "Azure ML", "Power BI"],
    link: { label: "Source on GitHub", href: "https://github.com/sakthiswarup18/Scalable-Fitness-Data-Exploration" },
    details: [
      "Ingestion and storage in Azure Blob Storage.",
      "ETL in Azure Data Factory and Databricks.",
      "Power BI dashboards for steps, calories and sleep patterns.",
    ],
  },
  {
    id: "email-agent",
    cat: "apps",
    title: "Autonomous agent for email management",
    meta: "UMass Dartmouth · 2024",
    description:
      "An Auto-GPT setup that drafts, sends, receives and replies to email on its own. Mostly an experiment in how much of a routine inbox can be handed over safely.",
    tech: ["Auto-GPT", "Python", "Email plugin"],
    link: {
      label: "Source on GitHub",
      href: "https://github.com/sakthiswarup18/Creating-an-Autonomous-Agent-for-Email-Management",
    },
    details: [
      "Auto-GPT configured for autonomous email handling with email plugin integrated.",
      "Tested on generated outbound mail and automatic replies to incoming threads.",
    ],
  },
  {
    id: "streaming",
    cat: "apps",
    title: "Multimedia streaming over local network",
    meta: "Jain University · 2020–2021",
    description:
      "Peer-to-peer file sharing and media streaming between devices on the same Wi-Fi, tuned for playback that does not stall on a weak connection. My undergraduate capstone.",
    tech: ["Python", "Flask", "Sockets", "JavaScript"],
    link: {
      label: "Source on GitHub",
      href: "https://github.com/sakthiswarup18/Multimedia-Streaming-and-Data-Transferring",
    },
    details: [
      "Flask backend handling media requests and streaming with socket programming.",
      "Peer-to-peer sharing for fast local-network transfers.",
      "Bandwidth tuned for minimal buffering; responsive front end for phone and desktop.",
    ],
  },
];

export const PUBLICATION = {
  venue: "UMass Dartmouth · Published",
  title: "Personalised AI-driven cybersecurity response for IoT devices",
  summary:
    "Rule-based security on IoT devices produces too many false positives and cannot keep up with threats that change faster than the rule set. The paper proposes a behaviour-based alternative: learn how a particular device is normally used, detect deviation, and respond without shipping usage data off the device.",
  points: [
    "Combines behavioural modelling, anomaly detection and federated learning so models improve without centralising personal data.",
    "Cuts false alarms and catches more real threats, and is designed to run on the device itself.",
    "Relevant anywhere IoT devices collect sensitive data without a reliable connection back to the cloud.",
  ],
  href: "/pdf/iot-cybersecurity-paper.pdf",
};

export const EDUCATION = [
  {
    degree: "M.S. Data Science",
    school: "UMass Dartmouth",
    period: "Sep 2023 – May 2025",
    note:
      "ML, stats, cloud, and a lot of time convincing R to cooperate. Mentored in the Big Data Club and ran hands-on workshops, mostly explaining model selection to people who just wanted to know if their results were real.",
    coursework: [
      "Advanced machine learning",
      "Big data and cloud computing",
      "Advanced mathematical statistics",
      "Database design",
      "High performance computing",
      "Data visualisation",
      "Applied business analytics",
      "Statistical analysis",
      "Artificial intelligence",
    ],
  },
  {
    degree: "B.Tech Information Science and Engineering",
    school: "Jain University, Bangalore",
    period: "Graduated Aug 2021",
    note:
      "Four years learning how software is built: data structures, databases, web tech. The multimedia streaming capstone was the final project; the code isn't pretty but it works.",
    coursework: [],
  },
];

export const CERTIFICATES = [
  { title: "Performance Engineering, Skill Development Program", by: "Jain University, Jun 2020", href: "/pdf/cert-performance-engineering.pdf" },
  { title: "AI For Everyone", by: "deeplearning.ai, Jan 2020", href: "/pdf/cert-ai-for-everyone.pdf" },
  { title: "Introduction to IoT and Embedded Systems", by: "UC Irvine, Mar 2020", href: "/pdf/cert-iot-embedded-systems.pdf" },
  { title: "Java for Android", by: "Vanderbilt University, Dec 2019", href: "/pdf/cert-java-for-android.pdf" },
  { title: "Programming with Google Go", by: "UC Irvine, Jan 2020", href: "/pdf/cert-programming-google-go.pdf" },
  { title: "CCNAv7: Introduction to Networks", by: "Cisco Networking Academy, Jun 2020", href: "/pdf/cert-ccna-intro-networks.pdf" },
  { title: "CCNA: Routing and Switching Essentials", by: "Cisco, Jun 2020", href: "/pdf/cert-ccna-routing-switching.pdf" },
  { title: "CCNA: Scaling Networks", by: "Cisco, Jun 2020", href: "/pdf/cert-ccna-scaling-networks.pdf" },
  { title: "CCNA: Connecting Networks", by: "Cisco, Jun 2020", href: "/pdf/cert-ccna-connecting-networks.pdf" },
];

export const CONTACT = {
  label: "Get In Touch",
  heading: ["Let's talk", "about your", "data."], // last line is the orange outline
  note: "Open to data analyst and BI roles. Email is the surest way to reach me. I reply within a day.",
};
